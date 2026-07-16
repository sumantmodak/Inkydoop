interface MascotProps {
  className?: string;
}

/** Inkydoop — a friendly ink-blob mascot, drawn inline (no image asset). */
export function Mascot({ className }: MascotProps) {
  return (
    <svg
      viewBox="0 0 120 132"
      className={className}
      role="img"
      aria-label="Inkydoop, a friendly ink-blob mascot"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="inky-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8b6bff" />
          <stop offset="1" stopColor="#5b3fd6" />
        </linearGradient>
      </defs>
      <path
        d="M60 12c0-6 9-7 6-13"
        fill="none"
        stroke="#5b3fd6"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M60 14C90 14 106 36 104 64C102 92 86 112 60 112C34 112 18 92 16 64C14 36 30 14 60 14Z"
        fill="url(#inky-body)"
      />
      <circle cx="60" cy="123" r="5" fill="#5b3fd6" />
      <circle cx="40" cy="76" r="6" fill="#ff8fd0" opacity="0.6" />
      <circle cx="80" cy="76" r="6" fill="#ff8fd0" opacity="0.6" />
      <g className="inky-eyes">
        <ellipse cx="47" cy="60" rx="11" ry="13" fill="#ffffff" />
        <ellipse cx="73" cy="60" rx="11" ry="13" fill="#ffffff" />
        <circle cx="49" cy="62" r="5.5" fill="#2b2d52" />
        <circle cx="71" cy="62" r="5.5" fill="#2b2d52" />
        <circle cx="51" cy="60" r="1.8" fill="#ffffff" />
        <circle cx="73" cy="60" r="1.8" fill="#ffffff" />
      </g>
      <path
        d="M50 82Q60 92 70 82"
        fill="none"
        stroke="#2b2d52"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
