#!/usr/bin/env python3
"""
Upload a ChalkTalk episode to YouTube (Data API v3).

One-time sign-in (works from a cloud container — no local browser needed here):
  python3 scripts/youtube-upload.py auth
      → prints a Google sign-in URL. Open it, approve, and your browser lands on
        http://localhost/?...&code=...  (the page itself fails to load — that's expected).
        Copy that whole address-bar URL.
  python3 scripts/youtube-upload.py auth --code '<the copied URL or just the code>'
      → saves .secrets/youtube_token.json (refresh token; git-ignored)

Check which channel you're signed in to:
  python3 scripts/youtube-upload.py whoami

Upload:
  python3 scripts/youtube-upload.py upload top10-air-forces                       # Short, private
  python3 scripts/youtube-upload.py upload top10-air-forces --privacy unlisted
  python3 scripts/youtube-upload.py upload top10-air-forces --privacy public      # refuses unless episode "verified": true
  python3 scripts/youtube-upload.py upload top10-air-forces --dry-run             # print metadata only

Metadata comes from episode.json "youtube" {title, description, tags} or is generated
from the episode. Uploaded video ids are logged to out/youtube-uploads.jsonl.

Files: .secrets/youtube_client_secret.json (OAuth "Desktop app" client), .secrets/youtube_token.json.
Env overrides: YT_CLIENT_SECRET, YT_TOKEN (paths).
"""
import argparse
import json
import os
import sys
import time
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parent.parent
# Google may return previously granted scopes too (include_granted_scopes) — accept them
os.environ.setdefault("OAUTHLIB_RELAX_TOKEN_SCOPE", "1")
if not os.environ.get("SSL_CERT_FILE") and Path("/root/.ccr/ca-bundle.crt").exists():
    os.environ["SSL_CERT_FILE"] = "/root/.ccr/ca-bundle.crt"
    os.environ.setdefault("REQUESTS_CA_BUNDLE", "/root/.ccr/ca-bundle.crt")
    os.environ.setdefault("HTTPLIB2_CA_CERTS", "/root/.ccr/ca-bundle.crt")

SECRET = Path(os.environ.get("YT_CLIENT_SECRET", ROOT / ".secrets/youtube_client_secret.json"))
TOKEN = Path(os.environ.get("YT_TOKEN", ROOT / ".secrets/youtube_token.json"))
PENDING = ROOT / ".secrets/youtube_auth_pending.json"
SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
]
REDIRECT = "http://localhost"
LOG = ROOT / "out/youtube-uploads.jsonl"

try:
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import Flow
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError
    from googleapiclient.http import MediaFileUpload
except ImportError:
    sys.exit("missing libs: pip install google-api-python-client google-auth-oauthlib")


# ---------------- auth ----------------

def cmd_auth(code: str | None) -> None:
    if not SECRET.exists():
        sys.exit(f"client secret not found: {SECRET}")
    if code is None:
        flow = Flow.from_client_secrets_file(str(SECRET), scopes=SCOPES, redirect_uri=REDIRECT, autogenerate_code_verifier=True)
        url, state = flow.authorization_url(access_type="offline", prompt="consent", include_granted_scopes="true")
        PENDING.parent.mkdir(parents=True, exist_ok=True)
        PENDING.write_text(json.dumps({"state": state, "code_verifier": flow.code_verifier}))
        os.chmod(PENDING, 0o600)
        print("Open this URL, sign in with the account that owns the channel, and approve:\n")
        print(url)
        print("\nYour browser then goes to http://localhost/?...code=... (page won't load — fine).")
        print("Copy that full URL and run:\n  python3 scripts/youtube-upload.py auth --code '<URL>'")
        return
    if not PENDING.exists():
        sys.exit("run `auth` without --code first")
    pending = json.loads(PENDING.read_text())
    if code.startswith("http"):
        q = parse_qs(urlparse(code).query)
        if "error" in q:
            sys.exit(f"Google returned an error: {q['error'][0]}")
        code = q.get("code", [""])[0]
    flow = Flow.from_client_secrets_file(str(SECRET), scopes=SCOPES, redirect_uri=REDIRECT, state=pending["state"])
    flow.code_verifier = pending["code_verifier"]
    flow.fetch_token(code=code)
    TOKEN.write_text(flow.credentials.to_json())
    os.chmod(TOKEN, 0o600)
    PENDING.unlink(missing_ok=True)
    print(f"✅ signed in; token saved to {TOKEN.relative_to(ROOT)}")
    cmd_whoami()


def creds() -> Credentials:
    if not TOKEN.exists():
        sys.exit("not signed in — run: python3 scripts/youtube-upload.py auth")
    c = Credentials.from_authorized_user_file(str(TOKEN), SCOPES)
    if not c.valid:
        if c.expired and c.refresh_token:
            c.refresh(Request())
            TOKEN.write_text(c.to_json())
        else:
            sys.exit("token invalid — run auth again")
    return c


def yt():
    return build("youtube", "v3", credentials=creds(), cache_discovery=False)


def cmd_whoami() -> dict:
    r = yt().channels().list(part="snippet,statistics", mine=True).execute()
    items = r.get("items", [])
    if not items:
        sys.exit("this Google account has no YouTube channel")
    ch = items[0]
    print(f"channel: {ch['snippet']['title']}  (id {ch['id']}, {ch['statistics'].get('subscriberCount', '?')} subscribers)")
    return ch


# ---------------- metadata ----------------

def metadata(ep: dict, fmt: str) -> dict:
    y = ep.get("youtube", {})
    title = y.get("title") or ep["title"]
    if fmt == "short" and "#shorts" not in title.lower():
        title = f"{title} #Shorts"
    title = title[:100]
    ranks = sorted([s for s in ep["scenes"] if s["type"] == "rank"], key=lambda s: s["rank"])
    listing = "\n".join(f"#{s['rank']} {s['name']}: {s['stats'][0]['value']:,}" for s in ranks)
    desc = y.get("description") or (
        f"{ep['title']} — counted on the chalkboard.\n\n"
        f"{listing}\n\n"
        f"Metric: {ep['metric']}. Data as of {ep['asOf']}.\n"
        f"Sources: {', '.join(ep['sources'])}\n\n"
        "Narration is AI text-to-speech. Animation made in code.\n"
        "Follow ChalkTalk for more numbers on the board.\n\n"
        + ("#Shorts " if fmt == "short" else "")
        + "#ChalkTalk #Top10 #Data"
    )
    tags = y.get("tags") or ["ChalkTalk", "top 10", "comparison", "data", "statistics", ep["metric"].lower()] + [s["name"] for s in ranks[:5]]
    return {"title": title, "description": desc[:5000], "tags": tags[:30], "categoryId": y.get("categoryId", "27")}


# ---------------- upload ----------------

def cmd_upload(slug: str, fmt: str, privacy: str, dry: bool, force: bool, thumb: bool, publish_at: str | None) -> None:
    ep = json.loads((ROOT / "src/chalk/episodes" / slug / "episode.json").read_text())
    vid = ROOT / "out" / f"{ep['id']}{'Short' if fmt == 'short' else 'Long'}.mp4"
    th = ROOT / "out" / f"{ep['id']}-thumb-{fmt}.jpg"
    if not vid.exists():
        sys.exit(f"render first: {vid.relative_to(ROOT)} not found")
    if (privacy == "public" or publish_at) and not ep.get("verified") and not force:
        sys.exit("refusing to publish publicly: episode.json has \"verified\": false (numbers unchecked). "
                 "Verify the data, or upload --privacy private/unlisted.")
    meta = metadata(ep, fmt)
    status = {"privacyStatus": "private" if publish_at else privacy, "selfDeclaredMadeForKids": False, "embeddable": True}
    if publish_at:
        status["publishAt"] = publish_at
    print(json.dumps({"file": str(vid.relative_to(ROOT)), "snippet": meta, "status": status}, indent=2))
    if dry:
        return
    api = yt()
    req = api.videos().insert(
        part="snippet,status",
        body={"snippet": meta, "status": status},
        media_body=MediaFileUpload(str(vid), mimetype="video/mp4", chunksize=4 * 1024 * 1024, resumable=True),
    )
    resp = None
    tries = 0
    while resp is None:
        try:
            st, resp = req.next_chunk()
            if st:
                print(f"  uploading… {int(st.progress() * 100)}%")
        except HttpError as e:
            if e.resp.status in (500, 502, 503, 504) and tries < 5:
                tries += 1
                time.sleep(2 ** tries)
                continue
            raise
    vid_id = resp["id"]
    url = f"https://youtube.com/shorts/{vid_id}" if fmt == "short" else f"https://youtu.be/{vid_id}"
    print(f"✅ uploaded: {url}  (privacy: {resp['status']['privacyStatus']})")
    if thumb and th.exists():
        try:
            api.thumbnails().set(videoId=vid_id, media_body=MediaFileUpload(str(th), mimetype="image/jpeg")).execute()
            print(f"  thumbnail set: {th.name}")
        except HttpError as e:
            print(f"  ⚠️ thumbnail not set ({e.resp.status}): {e._get_reason()}")
    LOG.parent.mkdir(exist_ok=True)
    with LOG.open("a") as f:
        f.write(json.dumps({"slug": slug, "format": fmt, "id": vid_id, "url": url, "privacy": resp["status"]["privacyStatus"], "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}) + "\n")


def main() -> None:
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    a = sub.add_parser("auth")
    a.add_argument("--code")
    sub.add_parser("whoami")
    u = sub.add_parser("upload")
    u.add_argument("slug")
    u.add_argument("--format", choices=["short", "long"], default="short")
    u.add_argument("--privacy", choices=["private", "unlisted", "public"], default="private")
    u.add_argument("--publish-at", help="RFC3339 time to go public (uploads private + schedules)")
    u.add_argument("--dry-run", action="store_true")
    u.add_argument("--force", action="store_true", help="allow public even if verified=false")
    u.add_argument("--no-thumbnail", action="store_true")
    x = ap.parse_args()
    if x.cmd == "auth":
        cmd_auth(x.code)
    elif x.cmd == "whoami":
        cmd_whoami()
    else:
        cmd_upload(x.slug, x.format, x.privacy, x.dry_run, x.force, not x.no_thumbnail, x.publish_at)


if __name__ == "__main__":
    main()
