import type { SelectHTMLAttributes } from "react";

type FilterSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  options: Array<{ label: string; value: string }>;
};

export function FilterSelect({ options, className = "", ...rest }: FilterSelectProps) {
  return (
    <select
      className={`rounded-xl border border-line bg-surface px-3 py-2 text-sm text-textStrong shadow-sm outline-none transition focus:border-accent/40 focus:ring-2 focus:ring-accent/10 ${className}`}
      {...rest}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value} className="bg-surface text-textStrong">
          {option.label}
        </option>
      ))}
    </select>
  );
}
