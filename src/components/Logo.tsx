interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Open book icon — reference-image style:
//   two covers fanning outward (warm magenta), inner pages arching above (lapis blue)
//   "ATN" large bold  +  "MEGA STORE" subtitle — both in professional forest green
//
// Wing tips now start at x=6 / x=74 (was x=2 / x=62) to prevent edge clipping.

const VW = 182;
const VH = 64;
const SCALE = { sm: 0.66, md: 0.94, lg: 1.30 };

export default function Logo({ size = 'md', className = '' }: LogoProps) {
  const sc = SCALE[size];
  const w  = Math.round(VW * sc);
  const h  = Math.round(VH * sc);

  return (
    <svg
      width={w} height={h}
      viewBox={`0 0 ${VW} ${VH}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ATN Megastore"
    >
      {/* ── Open book icon ─────────────────────────────────────
          Spine bottom centre: (40, 58)
          Book spans x=6–74, y=6–58

          Z-order: right cover (back) → left cover (front)
                   → inner pages (arch above) → spine tip
          ───────────────────────────────────────────────────── */}

      {/* Right cover — deeper plum, sits behind */}
      <path
        d="M 40,58 L 74,50 L 71,22 L 50,14 L 44,46 Z"
        fill="#6B2262"
      />

      {/* Left cover — main magenta, sits in front */}
      <path
        d="M 40,58 L 6,50 L 9,22 L 30,14 L 36,46 Z"
        fill="#893172"
      />

      {/* Inner pages — lapis blue, arch visibly above both covers */}
      <path
        d="M 36,46 L 30,14 Q 40,4 50,14 L 44,46 Z"
        fill="#213885"
      />

      {/* Spine tip — dark navy triangle */}
      <path
        d="M 36,46 L 40,58 L 44,46 Z"
        fill="#081849"
      />

      {/* ── Wordmark ─────────────────────────────────────────── */}

      {/* ATN — large, heavy, professional forest green */}
      <text
        x="84" y="36"
        fontFamily="'Arial Black', 'Franklin Gothic Heavy', 'Helvetica Neue', Arial, sans-serif"
        fontSize="33"
        fontWeight="900"
        fill="#1B5E20"
      >
        ATN
      </text>

      {/* MEGA STORE — subtitle line, same green */}
      <text
        x="86" y="52"
        fontFamily="'Arial Black', 'Franklin Gothic Heavy', 'Helvetica Neue', Arial, sans-serif"
        fontSize="13.5"
        fontWeight="700"
        fill="#1B5E20"
        letterSpacing="1.8"
      >
        MEGA STORE
      </text>
    </svg>
  );
}
