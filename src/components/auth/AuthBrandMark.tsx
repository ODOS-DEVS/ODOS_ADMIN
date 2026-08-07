import { Link } from "react-router-dom";

type AuthBrandMarkProps = {
  to?: string;
};

export function AuthBrandMark({ to = "/login" }: AuthBrandMarkProps) {
  const content = (
    <>
      <div className="flex size-11 items-center justify-center rounded-xl bg-accent text-sm font-bold text-accentForeground shadow-sm ring-4 ring-accent/10">
        O
      </div>
      <div className="min-w-0">
        <p className="truncate text-[15px] font-bold tracking-tight text-textStrong">ODOS Admin</p>
        <p className="truncate text-xs text-textMuted">Marketplace operations</p>
      </div>
    </>
  );

  if (to) {
    return (
      <Link to={to} className="inline-flex items-center gap-3.5 transition opacity-100 hover:opacity-90">
        {content}
      </Link>
    );
  }

  return <div className="inline-flex items-center gap-3.5">{content}</div>;
}
