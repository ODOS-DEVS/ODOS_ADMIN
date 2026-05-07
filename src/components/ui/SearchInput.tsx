import { Search } from "lucide-react";
import type { InputHTMLAttributes } from "react";

type SearchInputProps = InputHTMLAttributes<HTMLInputElement>;

export function SearchInput({ className = "", ...rest }: SearchInputProps) {
  return (
    <label
      className={`flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-textMuted transition focus-within:border-accent/50 focus-within:bg-white/10 ${className}`}
    >
      <Search className="size-4" />
      <input
        type="search"
        className="w-full bg-transparent text-sm text-textStrong outline-none placeholder:text-textMuted"
        {...rest}
      />
    </label>
  );
}
