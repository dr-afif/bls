import { Button } from "../ui/button";

type FilterChipsProps<T extends string> = {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
};

export function FilterChips<T extends string>({
  label,
  onChange,
  options,
  value,
}: FilterChipsProps<T>) {
  return (
    <div aria-label={label} className="flex flex-wrap gap-2" role="group">
      {options.map((option) => (
        <Button
          aria-pressed={option === value}
          className="rounded-full"
          key={option}
          onClick={() => onChange(option)}
          size="sm"
          type="button"
          variant={option === value ? "secondary" : "outline"}
        >
          {option}
        </Button>
      ))}
    </div>
  );
}

