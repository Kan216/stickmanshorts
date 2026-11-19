import { continueRender, delayRender, staticFile } from "remotion";

// Local OFL fonts (public/fonts) so renders never need the network.
let loaded = false;

export const ensureChalkFonts = () => {
  if (loaded || typeof document === "undefined") return;
  loaded = true;
  const handle = delayRender("ChalkTalk fonts");
  const faces = [
    new FontFace("Gochi Hand", `url(${staticFile("fonts/GochiHand.woff2")}) format('woff2')`),
    new FontFace("Patrick Hand", `url(${staticFile("fonts/PatrickHand.woff2")}) format('woff2')`),
    new FontFace("Roboto", `url(${staticFile("fonts/Roboto-Black.woff2")}) format('woff2')`, { weight: "900" }),
  ];
  Promise.all(faces.map((ff) => ff.load().then((x) => (document.fonts as unknown as Set<FontFace>).add(x))))
    .catch((e) => console.error("ChalkTalk font load failed", e))
    .finally(() => continueRender(handle));
};
