import type { SelectHTMLAttributes } from "react";

type FilterSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  options: Array<{ label: string; value: string }>;
};

export function FilterSelect({ options, className = "", ...rest }: FilterSelectProps) {
  return (
    <select
      className={`rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-textStrong outline-none transition focus:border-accent/50 ${className}`}
      {...rest}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value} className="bg-panel text-textStrong">
          {option.label}
        </option>
      ))}
    </select>
  );
}
