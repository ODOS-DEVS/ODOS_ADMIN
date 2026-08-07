import {
  FolderKanban,
  Landmark,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Store,
  Users,
} from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";

import { LiveIndicator } from "@/components/ui/LiveIndicator";

type AuthShowcasePanelProps = {
  title: string;
  description: string;
  tagline?: string;
};

const pillars = [
  {
    icon: Store,
    title: "Vendors & catalog",
    copy: "Applications, stores, products, and reviews in one flow.",
  },
  {
    icon: ShoppingBag,
    title: "Orders & fulfillment",
    copy: "Queues, returns, logistics, and shopper support chats.",
  },
  {
    icon: Landmark,
    title: "Treasury & roles",
    copy: "Payouts, finance views, and permission bands per teammate.",
  },
];

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
    <div className="relative z-10 mt-5 flex items-center gap-2.5 rounded-full border border-line/70 bg-surface/80 px-4 py-2 shadow-sm backdrop-blur-sm">
      <span className="relative flex size-2 shrink-0">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-success" />
      </span>
      <span key={index} className="animate-fade-in truncate font-mono text-[11px] text-textMuted">
        {activityLines[index]}
      </span>
    </div>
  );
}

export function AuthShowcasePanel({ title, description, tagline }: AuthShowcasePanelProps) {
  return (
    <div className="relative flex h-full flex-col overflow-y-auto overflow-x-hidden bg-[#F7F6FA] px-10 py-7 xl:px-12">
      <div
        className="pointer-events-none absolute -right-20 -top-24 size-72 animate-drift rounded-full bg-accent/[0.09] blur-3xl motion-reduce:animate-none"
        aria-hidden
      />
      <div
        className="auth-showcase-grid pointer-events-none absolute inset-0 opacity-[0.45]"
        aria-hidden
      />

      <div className="relative z-10 animate-fade-up opacity-0">
        {tagline ? (
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-accent">{tagline}</p>
        ) : null}
        <h2 className="mt-3 max-w-md font-display text-[1.7rem] font-semibold leading-snug tracking-tight text-textStrong xl:text-[1.9rem]">
          {title}
        </h2>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-textMuted">{description}</p>
      </div>

      <ActivityTicker />

      <ul className="relative z-10 mt-5 space-y-2.5">
        {pillars.map((item, index) => (
          <li
            key={item.title}
            className="flex animate-fade-up gap-3 rounded-2xl border border-line/80 bg-surface/90 px-4 py-3.5 opacity-0 shadow-card backdrop-blur-sm"
            style={{ animationDelay: `${120 + index * 90}ms` }}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accentSoft text-accent">
              <item.icon className="size-[18px]" strokeWidth={2} />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-sm font-semibold text-textStrong">{item.title}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-textMuted">{item.copy}</p>
            </div>
          </li>
        ))}
      </ul>

      <div
        className="relative z-10 mt-auto animate-fade-up pt-6 opacity-0"
        style={{ animationDelay: "420ms" }}
      >
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
          <div className="flex gap-3">
            <div className="hidden w-[108px] shrink-0 space-y-1.5 rounded-xl border border-line bg-surfaceMuted p-2.5 sm:block">
              <div className="flex items-center gap-2 px-1 py-1">
                <div className="flex size-6 items-center justify-center rounded-md bg-accent text-[10px] font-bold text-accentForeground">
                  O
                </div>
                <span className="text-[10px] font-semibold text-textStrong">ODOS</span>
              </div>
              {[LayoutDashboard, Users, Package, FolderKanban].map((Icon, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] ${
                    index === 0
                      ? "border border-line bg-surface font-medium text-textStrong shadow-nav-active"
                      : "text-textMuted"
                  }`}
                >
                  <Icon className="size-3 shrink-0" />
                  <span className="truncate">
                    {index === 0 ? "Dashboard" : index === 1 ? "Users" : index === 2 ? "Products" : "Applications"}
                  </span>
                </div>
              ))}
            </div>

            <div className="min-w-0 flex-1 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-textStrong">Today on ODOS</p>
                <LiveIndicator label="Live" tone="success" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-line bg-surfaceMuted px-3 py-2.5">
                  <p className="text-[10px] text-textMuted">Ops queues</p>
                  <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-textStrong">Live</p>
                  <p className="text-[10px] text-textSubtle">Badges sync ~60s</p>
                </div>
                <div className="rounded-xl border border-line bg-surfaceMuted px-3 py-2.5">
                  <p className="text-[10px] text-textMuted">Audit trail</p>
                  <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-textStrong">On</p>
                  <p className="text-[10px] text-textSubtle">Sensitive actions logged</p>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full animate-fill-bar rounded-full bg-accent motion-reduce:animate-none motion-reduce:w-[68%]"
                  style={{ "--fill-to": "68%" } as CSSProperties}
                />
              </div>
              <p className="text-[10px] text-textSubtle">Preview of your signed-in workspace — not sample sales data.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
