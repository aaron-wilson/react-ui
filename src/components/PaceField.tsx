import { paces, type PaceValue } from "../lib/format";

/**
 * A three-way pace choice. Controlled when `value` is given; otherwise it submits with its form
 * under `name` and starts at `defaultValue`.
 */
export function PaceField({
  name = "pace",
  value,
  defaultValue,
  onChange,
}: {
  name?: string;
  value?: PaceValue;
  defaultValue?: PaceValue;
  onChange?: (value: PaceValue) => void;
}) {
  return (
    <fieldset className="field">
      <legend className="mb-2">Pace</legend>
      <div className="segmented">
        {paces.map((pace) => (
          <label key={pace.value}>
            <input
              type="radio"
              name={name}
              value={pace.value}
              {...(value === undefined
                ? { defaultChecked: defaultValue === pace.value }
                : { checked: value === pace.value, onChange: () => onChange?.(pace.value) })}
            />
            <span>{pace.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
