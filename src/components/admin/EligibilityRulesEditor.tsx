import React, { useState } from 'react';
import {
  EligibilityRules,
  ELIGIBILITY_PRESETS,
  EMPTY_ELIGIBILITY_RULES,
} from '../../types/eligibility';

interface EligibilityRulesEditorProps {
  value: EligibilityRules | null | undefined;
  onChange: (rules: EligibilityRules | null) => void;
}

/**
 * Component for editing who should see a promotion.
 *
 * You can either:
 * 1. Click quick presets (e.g., "First-time buyers")
 * 2. Manually enter specific numbers
 *
 * Leave fields blank to ignore them.
 */
export const EligibilityRulesEditor: React.FC<EligibilityRulesEditorProps> = ({
  value,
  onChange,
}) => {
  const [rules, setRules] = useState<EligibilityRules>(value || {});
  const hasAnyRules = Object.values(rules).some((v) => v !== undefined && v !== null);

  const updateRules = (newRules: EligibilityRules) => {
    setRules(newRules);
    const hasRules = Object.values(newRules).some((v) => v !== undefined && v !== null);
    onChange(hasRules ? newRules : null);
  };

  const applyPreset = (preset: Partial<EligibilityRules>) => {
    const newRules = { ...preset } as EligibilityRules;
    updateRules(newRules);
  };

  const clearRules = () => {
    updateRules({});
  };

  const updateField = (
    field: keyof EligibilityRules,
    value: string
  ) => {
    const numValue = value === '' ? undefined : parseInt(value, 10);
    updateRules({
      ...rules,
      [field]: numValue,
    });
  };

  return (
    <fieldset className="border rounded-lg p-4 mb-4">
      <legend className="text-sm font-semibold mb-3">
        Who should see this promotion? (Optional)
      </legend>

      {/* Quick Presets */}
      <div className="mb-4">
        <p className="text-xs text-gray-600 mb-2">Quick presets:</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {Object.entries(ELIGIBILITY_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              type="button"
              onClick={() => applyPreset(preset)}
              className="text-xs px-3 py-1 rounded border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700"
              title={preset.description}
            >
              {preset.label}
            </button>
          ))}
          {hasAnyRules && (
            <button
              type="button"
              onClick={clearRules}
              className="text-xs px-3 py-1 rounded border border-red-300 bg-red-50 hover:bg-red-100 text-red-700"
            >
              Clear rules
            </button>
          )}
        </div>
      </div>

      {/* Manual Entry */}
      <div className="space-y-3 text-sm">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Minimum lifetime orders (customers must have at least this many orders)
          </label>
          <input
            type="number"
            min="0"
            value={rules.minLifetimeOrderCount ?? ''}
            onChange={(e) => updateField('minLifetimeOrderCount', e.target.value)}
            placeholder="Leave blank to ignore"
            className="w-full px-2 py-1 border rounded text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Maximum lifetime orders (customers must have at most this many orders)
          </label>
          <input
            type="number"
            min="0"
            value={rules.maxLifetimeOrderCount ?? ''}
            onChange={(e) => updateField('maxLifetimeOrderCount', e.target.value)}
            placeholder="Leave blank to ignore"
            className="w-full px-2 py-1 border rounded text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Minimum lifetime spend in GH₵ (customers must have spent at least this much)
          </label>
          <input
            type="number"
            min="0"
            value={rules.minLifetimeSpend ?? ''}
            onChange={(e) => updateField('minLifetimeSpend', e.target.value)}
            placeholder="Leave blank to ignore"
            className="w-full px-2 py-1 border rounded text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Dormant days since last order (customers inactive for at least this many days)
          </label>
          <input
            type="number"
            min="0"
            value={rules.dormantDaysSinceLastOrder ?? ''}
            onChange={(e) => updateField('dormantDaysSinceLastOrder', e.target.value)}
            placeholder="Leave blank to ignore"
            className="w-full px-2 py-1 border rounded text-sm"
          />
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-3 italic">
        💡 If you don't set any rules, everyone will see this promotion.
      </p>
    </fieldset>
  );
};

export default EligibilityRulesEditor;
