/**
 * The Pearl, drawn. Its colour comes from its content (a hash of what it holds),
 * its growth rings from its history (one ring per hand that worked on it), its
 * glow from being kept. Two Pearls with different content never look alike;
 * the same Pearl looks the same everywhere.
 */
export interface Look { hue: number; tilt: number; sheen: number; layers: number; seed: string }

export function Orb({ look, size = 160, kept = false, label, className = "" }: { look: Look; size?: number; kept?: boolean; label?: string; className?: string }) {
  const { hue: h, tilt, sheen, layers, seed } = look;
  const id = `o${seed}${size}`;
  const hsl = (dh: number, s: number, l: number) => `hsl(${(h + dh + 360) % 360} ${s}% ${l}%)`;
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} className={`orb ${kept ? "kept" : ""} ${className}`} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <defs>
        <radialGradient id={`${id}b`} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#fffdf8" />
          <stop offset="0.3" stopColor={hsl(0, 28, 94)} />
          <stop offset="0.66" stopColor={hsl(25, 18, 84)} />
          <stop offset="0.9" stopColor={hsl(-40, 14, 64)} />
          <stop offset="1" stopColor={hsl(-40, 16, 46)} />
        </radialGradient>
        <linearGradient id={`${id}i`} gradientTransform={`rotate(${tilt} 0.5 0.5)`}>
          <stop offset="0" stopColor={hsl(70, 55, 78)} />
          <stop offset="0.33" stopColor={hsl(170, 45, 80)} />
          <stop offset="0.66" stopColor={hsl(260, 50, 84)} />
          <stop offset="1" stopColor={hsl(340, 55, 82)} />
        </linearGradient>
        <radialGradient id={`${id}h`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}r`} cx="50%" cy="50%" r="50%">
          <stop offset="0.7" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.18" />
        </radialGradient>
        <clipPath id={`${id}c`}><circle cx="100" cy="100" r="92" /></clipPath>
      </defs>
      <circle cx="100" cy="100" r="92" fill={`url(#${id}b)`} />
      <g clipPath={`url(#${id}c)`}>
        <g className="luster" style={{ mixBlendMode: "soft-light" }} opacity={sheen * 0.55}>
          <circle cx="100" cy="100" r="110" fill={`url(#${id}i)`} />
        </g>
        {Array.from({ length: layers }, (_, i) => (
          <circle key={i} cx={104 + i * 1.2} cy={106 + i * 1.4} r={88 - i * 9} fill="none" stroke="#fff" strokeOpacity={0.07 + i * 0.015} strokeWidth="1.1" />
        ))}
        <circle cx="100" cy="100" r="92" fill={`url(#${id}r)`} />
      </g>
      <ellipse cx="72" cy="62" rx="30" ry="20" fill={`url(#${id}h)`} transform="rotate(-28 72 62)" />
      <ellipse cx="132" cy="146" rx="22" ry="9" fill="#fff" opacity="0.12" transform="rotate(-30 132 146)" />
      <circle cx="100" cy="100" r="91.5" fill="none" stroke={hsl(20, 30, 88)} strokeOpacity="0.1" />
    </svg>
  );
}

/** A Pearl that hasn't formed yet: neutral nacre, for the moment of making. */
export const UNFORMED: Look = { hue: 36, tilt: 40, sheen: 0.45, layers: 1, seed: "unformed" };
