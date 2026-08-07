import { useEffect, useState } from "react";

import { AuthShowcaseMockups } from "@/components/auth/AuthShowcaseMockups";

type AuthShowcasePanelProps = {
  title: string;
  description: string;
  tagline?: string;
};

const activityLines = [
  "New vendor application submitted",
  "Order dispatched from Osu Market",
  "Payout queued for Kumasi Foods",
  "Flash sale went live in Accra Mall",
  "Support thread resolved in 4 minutes",
];

function ActivityTicker() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setIndex((current) => (current + 1) % activityLines.length);
    }, 3200);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="relative z-10 mt-7 flex items-center gap-2.5 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-sm">
      <span className="relative flex size-2 shrink-0">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-success" />
      </span>
      <span key={index} className="animate-fade-in truncate font-mono text-[11px] text-white/80">
        {activityLines[index]}
      </span>
    </div>
  );
}

function HexOutline({ cx, cy, r, opacity }: { cx: number; cy: number; r: number; opacity: number }) {
  const s = r * 0.866;
  const points = [
    [0, -r],
    [s, -r / 2],
    [s, r / 2],
    [0, r],
    [-s, r / 2],
    [-s, -r / 2],
  ]
    .map(([px, py]) => `${px},${py}`)
    .join(" ");
  return (
    <polygon
      points={points}
      fill="none"
      stroke="#FFFFFF"
      strokeWidth="1.5"
      opacity={opacity}
      transform={`translate(${cx},${cy})`}
    />
  );
}

export function AuthShowcasePanel({ title, description, tagline }: AuthShowcasePanelProps) {
  return (
    <div className="relative flex h-full flex-col overflow-y-auto overflow-x-hidden bg-gradient-to-br from-[#6947E0] via-[#7C5CFC] to-[#5B3FD9] px-10 py-9 text-white xl:px-12">
      <div
        className="pointer-events-none absolute -right-24 -top-24 size-80 animate-drift rounded-full bg-white/10 blur-3xl motion-reduce:animate-none"
        aria-hidden
      />
      <div className="pointer-events-none absolute -bottom-16 -left-10 size-72 rounded-full bg-white/5 blur-3xl" aria-hidden />
      <div className="auth-showcase-grid-dark pointer-events-none absolute inset-0 opacity-70" aria-hidden />

      <svg className="pointer-events-none absolute -right-8 -top-8 size-40 overflow-visible" aria-hidden>
        <HexOutline cx={80} cy={80} r={30} opacity={0.28} />
        <HexOutline cx={80} cy={80} r={50} opacity={0.16} />
        <HexOutline cx={80} cy={80} r={70} opacity={0.08} />
      </svg>
      <svg className="pointer-events-none absolute -bottom-8 -left-8 size-40 overflow-visible" aria-hidden>
        <HexOutline cx={80} cy={80} r={30} opacity={0.22} />
        <HexOutline cx={80} cy={80} r={50} opacity={0.13} />
      </svg>

      <div className="relative z-10 flex flex-1 flex-col justify-center">
        <div className="animate-fade-up opacity-0">
          {tagline ? (
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-white/70">{tagline}</p>
          ) : null}
          <h2 className="mt-3 max-w-md font-display text-[1.9rem] font-semibold leading-snug tracking-tight text-white xl:text-[2.1rem]">
            {title}
          </h2>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/75">{description}</p>
        </div>

        <div className="mt-8 max-w-[380px] animate-fade-up opacity-0" style={{ animationDelay: "90ms" }}>
          <AuthShowcaseMockups />
        </div>

        <div className="animate-fade-up opacity-0" style={{ animationDelay: "180ms" }}>
          <ActivityTicker />
        </div>
      </div>
    </div>
  );
}
