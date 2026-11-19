import React, { createContext, useContext } from "react";
import { AbsoluteFill } from "remotion";
import { ChalkFilter } from "../lib/chalkFilter";
import { rand } from "../lib/anim";
import { CHALK, CHALK_CHANNEL, CHALK_FONTS, Format, LAYOUTS, Layout } from "./theme";
import { ensureChalkFonts } from "./fonts";

ensureChalkFonts();

const Ctx = createContext<{ format: Format; L: Layout }>({ format: "short", L: LAYOUTS.short });
export const useChalk = () => useContext(Ctx);

export const ChalkProvider: React.FC<{ format: Format; children: React.ReactNode }> = ({ format, children }) => (
  <Ctx.Provider value={{ format, L: LAYOUTS[format] }}>{children}</Ctx.Provider>
);

/** Filter ids shared by every chalk element in the frame. */
export const CK = { text: "ck-text", line: "ck-line", soft: "ck-soft" } as const;

/** Mount once per frame (ChalkBoard does it). */
export const ChalkDefs: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <defs>
      <ChalkFilter id={CK.text} seed={3} rough={0.7} grain={1} />
      <ChalkFilter id={CK.line} seed={5} rough={1.2} grain={1.1} />
      <ChalkFilter id={CK.soft} seed={9} rough={0.4} grain={0.55} />
    </defs>
  </svg>
);

/**
 * The board: slate-green gradient, old eraser smudges, grain, wooden frame,
 * chalk ledge, channel watermark. Static — identical on every frame.
 */
export const ChalkBoard: React.FC<{ watermark?: boolean }> = ({ watermark = true }) => {
  const { L, format } = useChalk();
  const { W, H } = L;
  const frameW = format === "short" ? 16 : 14;
  const ledgeY = format === "short" ? H - 92 : H - frameW;
  return (
    <AbsoluteFill style={{ background: CHALK.boardDark }}>
      <ChalkDefs />
      <svg width={W} height={H}>
        <defs>
          <radialGradient id="bd-base" cx="50%" cy="42%" r="75%">
            <stop offset="0%" stopColor="#2a3b33" />
            <stop offset="60%" stopColor={CHALK.board} />
            <stop offset="100%" stopColor={CHALK.boardDark} />
          </radialGradient>
          <filter id="bd-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={format === "short" ? 28 : 24} />
          </filter>
          <filter id="bd-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves={2} seed={11} />
            <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.9 0 0 0 -0.42" />
          </filter>
          <linearGradient id="bd-wood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7d5333" />
            <stop offset="100%" stopColor="#4a2e1a" />
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill="url(#bd-base)" />
        {/* old eraser smudges */}
        <g filter="url(#bd-blur)">
          {Array.from({ length: 14 }).map((_, i) => (
            <ellipse
              key={i}
              cx={rand(i * 3 + 1) * W}
              cy={rand(i * 3 + 2) * H * 0.9}
              rx={W * (0.12 + rand(i * 7) * 0.22)}
              ry={H * (0.025 + rand(i * 5) * 0.05)}
              transform={`rotate(${(rand(i * 11) - 0.5) * 30} ${rand(i * 3 + 1) * W} ${rand(i * 3 + 2) * H * 0.9})`}
              fill="#ffffff"
              opacity={0.025 + rand(i * 13) * 0.035}
            />
          ))}
        </g>
        {/* faint ghost arcs of previous lessons */}
        <g stroke="#ffffff" strokeOpacity={0.035} strokeWidth={3} fill="none" filter={`url(#${CK.soft})`}>
          <path d={`M${W * 0.08} ${H * 0.33} q${W * 0.2} ${-H * 0.05} ${W * 0.38} ${H * 0.01}`} />
          <path d={`M${W * 0.55} ${H * 0.62} q${W * 0.14} ${H * 0.04} ${W * 0.33} ${-H * 0.02}`} />
          <path d={`M${W * 0.18} ${H * 0.74} l${W * 0.12} ${-H * 0.012} l${W * 0.1} ${H * 0.008}`} />
        </g>
        <rect width={W} height={H} filter="url(#bd-grain)" opacity={0.35} />
        {/* wooden frame */}
        <rect x={frameW / 2} y={frameW / 2} width={W - frameW} height={H - frameW} fill="none" stroke="url(#bd-wood)" strokeWidth={frameW} />
        <rect x={frameW} y={frameW} width={W - frameW * 2} height={H - frameW * 2} fill="none" stroke="#000" strokeOpacity={0.35} strokeWidth={3} />
        {/* chalk ledge */}
        {format === "short" && (
          <g>
            <rect x={0} y={ledgeY} width={W} height={22} fill="url(#bd-wood)" />
            <rect x={0} y={ledgeY + 22} width={W} height={6} fill="#000" opacity={0.35} />
            <rect x={W * 0.18} y={ledgeY - 9} width={46} height={10} rx={5} fill={CHALK.white} opacity={0.9} />
            <rect x={W * 0.26} y={ledgeY - 8} width={26} height={9} rx={4.5} fill={CHALK.yellow} opacity={0.85} />
            <rect x={W * 0.72} y={ledgeY - 14} width={70} height={16} rx={3} fill="#3b2b20" />
            <rect x={W * 0.72} y={ledgeY - 6} width={70} height={8} rx={2} fill="#d8d4c8" opacity={0.5} />
          </g>
        )}
      </svg>
      {watermark && (
        <div
          style={{
            position: "absolute",
            fontFamily: CHALK_FONTS.title,
            color: CHALK.white,
            opacity: 0.5,
            filter: `url(#${CK.text})`,
            fontSize: format === "short" ? 30 : 24,
            letterSpacing: 1,
            ...(format === "short"
              ? { left: 0, right: 0, top: ledgeY - 66, textAlign: "center" as const }
              : { right: 34, top: 22 }),
          }}
        >
          {CHALK_CHANNEL}
        </div>
      )}
    </AbsoluteFill>
  );
};
