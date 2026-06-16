import React from 'react';

interface ItemStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

export const ItemStepper: React.FC<ItemStepperProps> = ({
  value,
  onChange,
  min = 5,
  max = 100,
  step = 5,
  disabled = false,
}) => {
  const borderClass = disabled ? 'border-border' : 'border-primary';
  const textClass = disabled ? 'text-muted opacity-40' : 'text-foreground';
  const btnClass = disabled ? 'border-border text-muted opacity-40 cursor-not-allowed' : 'border-primary text-primary hover:bg-primary/20 cursor-pointer';

  return (
    <div className="flex items-center justify-between w-full my-2 font-mono select-none">
      <button
        type="button"
        disabled={disabled || value <= min}
        onClick={() => onChange(value - step)}
        className={`w-10 h-12 border-[1.5px] font-bold text-lg flex items-center justify-center bg-transparent transition-colors ${btnClass}`}
      >
        -
      </button>

      <div className={`flex-1 h-12 border-y-[1.5px] flex items-center justify-center font-bold text-lg bg-transparent ${borderClass} ${textClass}`}>
        {value}
      </div>

      <button
        type="button"
        disabled={disabled || value >= max}
        onClick={() => onChange(value + step)}
        className={`w-10 h-12 border-[1.5px] font-bold text-lg flex items-center justify-center bg-transparent transition-colors ${btnClass}`}
      >
        +
      </button>
    </div>
  );
};
