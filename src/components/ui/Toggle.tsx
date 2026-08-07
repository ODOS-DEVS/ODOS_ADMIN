type ToggleProps = {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  label?: string;
};

/** Standalone switch control. Use ToggleRow when it needs a label + description block. */
export function Toggle({ checked, onChange, disabled = false, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border transition disabled:cursor-not-allowed disabled:opacity-60 ${
        checked ? "border-accent/40 bg-accent/20" : "border-line bg-surfaceMuted"
      }`}
    >
      <span
        className={`absolute top-1 size-5 rounded-full shadow-sm transition ${
          checked ? "left-6 bg-accent" : "left-1 bg-surface"
        }`}
      />
    </button>
  );
}

type ToggleRowProps = {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
};

export function ToggleRow({ label, description, checked, onChange, disabled = false }: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-line bg-surfaceMuted px-4 py-4">
      <div className="min-w-0">
        <p className="font-medium text-textStrong">{label}</p>
        <p className="mt-1 text-sm text-textMuted">{description}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} label={label} />
    </div>
  );
}
