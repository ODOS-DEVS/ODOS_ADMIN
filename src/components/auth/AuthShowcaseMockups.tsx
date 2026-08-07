import { TrendingUp, Wallet } from "lucide-react";
import type { CSSProperties } from "react";

import { LiveIndicator } from "@/components/ui/LiveIndicator";

const CHART_PATH = "M0,44 C18,44 18,28 36,28 C54,28 54,38 72,38 C90,38 90,14 108,14 C126,14 126,26 144,20 C162,14 162,4 180,4";
const MINI_CHART_PATH = "M0,18 C8,18 8,10 16,10 C24,10 24,15 32,12 C40,9 40,2 48,2";

export function AuthShowcaseMockups() {
  return (
    <div className="relative px-2 pb-10 pt-2">
      <div className="rounded-3xl bg-white p-5 shadow-2xl shadow-black/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-accent text-xs font-bold text-accentForeground">
              O
            </div>
            <span className="text-sm font-semibold text-textStrong">Admin workspace</span>
          </div>
          <LiveIndicator label="Live" tone="success" />
        </div>

        <div className="mt-5 flex items-end justify-between">
          <div>
            <p className="text-xs text-textMuted">Today&apos;s revenue</p>
            <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-textStrong">GH₵48,210</p>
          </div>
          <span className="rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
            +12.4%
          </span>
        </div>

        <div className="mt-4">
          <svg viewBox="0 0 180 48" className="h-14 w-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="showcaseChartFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7C5CFC" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#7C5CFC" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`${CHART_PATH} L180,48 L0,48 Z`} fill="url(#showcaseChartFill)" />
            <path d={CHART_PATH} fill="none" stroke="#7C5CFC" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <div className="rounded-xl bg-surfaceMuted px-3 py-2">
            <p className="text-[10px] text-textMuted">Orders today</p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-textStrong">128</p>
          </div>
          <div className="rounded-xl bg-surfaceMuted px-3 py-2">
            <p className="text-[10px] text-textMuted">Vendor payouts</p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-textStrong">12 queued</p>
          </div>
        </div>
      </div>

      <div
        className="absolute -bottom-2 left-1 w-[168px] rounded-2xl bg-white p-3.5 shadow-xl shadow-black/20"
        style={{ "--tw-rotate": "-4deg", transform: "rotate(var(--tw-rotate))" } as CSSProperties}
      >
        <div className="flex items-center gap-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accentSoft text-accent">
            <Wallet className="size-3.5" strokeWidth={2.25} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[10px] text-textMuted">Vendor wallet</p>
            <p className="text-sm font-semibold text-textStrong">GH₵1,284.50</p>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <svg viewBox="0 0 48 20" className="h-4 w-12">
            <path d={MINI_CHART_PATH} fill="none" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="flex items-center gap-0.5 text-[11px] font-semibold text-success">
            <TrendingUp className="size-3" strokeWidth={2.5} />
            18%
          </span>
        </div>
      </div>
    </div>
  );
}
