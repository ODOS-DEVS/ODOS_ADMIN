import { Search } from "lucide-react";
import type { InputHTMLAttributes } from "react";

type SearchInputProps = InputHTMLAttributes<HTMLInputElement>;

export function SearchInput({ className = "", ...rest }: SearchInputProps) {
  return (
    <label
      className={`flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3 py-2 text-textMuted shadow-sm transition focus-within:border-accent/40 focus-within:ring-2 focus-within:ring-accent/10 ${className}`}
    >
      <Search className="size-4 shrink-0 text-textSubtle" />
      <input
        type="search"
        className="w-full bg-transparent text-sm text-textStrong outline-none placeholder:text-textSubtle"
        {...rest}
      />
    </label>
  );
}
