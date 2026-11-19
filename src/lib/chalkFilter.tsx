import React from "react";

/**
 * SVG filter that turns clean strokes/text into chalk: a slight wobble
 * (low-frequency displacement) + grainy breaks (high-frequency alpha mask)
 * + a faint dusty halo. Deterministic: `seed` is the only variation —
 * change it every few frames for a hand-drawn "boil".
 *
 * Usable on SVG elements (filter="url(#id)") and HTML (style.filter = "url(#id)").
 */
export const ChalkFilter: React.FC<{ id: string; seed?: number; rough?: number; grain?: number }> = ({
  id,
  seed = 1,
  rough = 1,
  grain = 1,
}) => (
  <filter id={id} x="-5%" y="-10%" width="110%" height="120%" colorInterpolationFilters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={seed} result="warp" />
    <feDisplacementMap in="SourceGraphic" in2="warp" scale={3.2 * rough} xChannelSelector="R" yChannelSelector="G" result="wobbly" />
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed + 7} result="noise" />
    {/* alpha = clamp(a - b*R): darker noise pixels punch holes in the stroke */}
    <feColorMatrix
      in="noise"
      type="matrix"
      values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${-1.9 * grain} 0 0 0 ${1.62}`}
      result="mask"
    />
    <feComposite in="wobbly" in2="mask" operator="in" result="grainy" />
    <feGaussianBlur in="grainy" stdDeviation="2.2" result="halo" />
    <feComponentTransfer in="halo" result="haloDim">
      <feFuncA type="linear" slope="0.28" />
    </feComponentTransfer>
    <feMerge>
      <feMergeNode in="haloDim" />
      <feMergeNode in="grainy" />
    </feMerge>
  </filter>
);
