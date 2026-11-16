#!/usr/bin/env bash
# Generate an original, royalty-free starter SFX + music-bed pack with ffmpeg.
# Output: public/sfx/*.wav and public/music/pad-*.wav
# Replace/extend with your own licensed sounds any time — same filenames keep working.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/sfx public/music
R=44100
# NOTE: no commas allowed inside aevalsrc expressions (they split filters) — use ceil()/abs() tricks.
gen() { ffmpeg -v error -y -f lavfi -i "aevalsrc=$2:s=$R:d=$3" -af "${4:-anull}" -ac 2 "public/sfx/$1.wav"; echo "sfx/$1.wav"; }

# pop: short pitched blip (text / counter appear)
gen pop    "0.6*sin(2*PI*(900-600*t/0.08)*t)*exp(-40*t)" 0.12
# tick: tiny click (counter increment, footstep on stair)
gen tick   "0.5*sin(2*PI*2200*t)*exp(-90*t)" 0.05
# step: soft low thump (footstep)
gen step   "0.7*sin(2*PI*(140-60*t/0.1)*t)*exp(-35*t)" 0.15
# thud: heavy impact (fall, weight drop, slam)
gen thud   "0.9*sin(2*PI*(90-50*t/0.4)*t)*exp(-9*t)+0.2*(random(0)-0.5)*exp(-30*t)" 0.5 "lowpass=f=900"
# whoosh: filtered noise swell (fast movement, transitions)
gen whoosh "(random(0)-0.5)*sin(PI*t/0.45)" 0.45 "bandpass=f=1200:width_type=o:w=2,volume=2.2"
# riser: rising tone + noise (build-up before the reveal)
gen riser  "0.35*sin(2*PI*(200+900*t*t/4)*t)*(t/2)+0.15*(random(0)-0.5)*(t/2)" 2.0 "highpass=f=150"
# ding: bright bell (success / reveal / punchline)
gen ding   "0.5*(sin(2*PI*1318*t)+0.5*sin(2*PI*2636*t)+0.25*sin(2*PI*3954*t))*exp(-3.5*t)" 1.6
# glitch: digital stutter (failure / ego breaking)
gen glitch "0.5*(2*ceil(sin(2*PI*180*t))-1)*ceil(sin(2*PI*22*t))*exp(-4*t)" 0.45 "lowpass=f=3000"
# heartbeat: two low thumps (tension)
gen heartbeat "0.9*sin(2*PI*55*t)*(exp(-25*t)+exp(-25*abs(t-0.22))*ceil(t-0.22))" 0.6 "lowpass=f=400"
# boom: deep cinematic hit for the title/punchline
gen boom   "0.9*sin(2*PI*(60-25*t)*t)*exp(-2.5*t)+0.3*(random(0)-0.5)*exp(-12*t)" 1.8 "lowpass=f=600"

# Ambient pads (A minor-ish / C major-ish), 30s, slow tremolo — loop or trim as needed.
pad() { ffmpeg -v error -y -f lavfi -i "aevalsrc=$2:s=$R:d=30" -af "lowpass=f=1800,afade=t=in:d=2,afade=t=out:st=27:d=3,volume=0.6" -ac 2 "public/music/$1.wav"; echo "music/$1.wav"; }
pad pad-dark  "0.18*(sin(2*PI*110*t)+0.7*sin(2*PI*130.81*t)+0.6*sin(2*PI*164.81*t)+0.3*sin(2*PI*220*t))*(0.75+0.25*sin(2*PI*0.15*t))"
pad pad-hope  "0.16*(sin(2*PI*130.81*t)+0.7*sin(2*PI*164.81*t)+0.6*sin(2*PI*196*t)+0.35*sin(2*PI*261.63*t))*(0.75+0.25*sin(2*PI*0.2*t))"
