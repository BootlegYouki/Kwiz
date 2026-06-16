import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { QuizSet } from '../types';

interface QuizTypeToggleProps {
  value: QuizSet['questionType'];
  onChange: (value: QuizSet['questionType']) => void;
  disabled?: boolean;
}

export const QuizTypeToggle: React.FC<QuizTypeToggleProps> = ({ value, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const options: { label: string; value: QuizSet['questionType'] }[] = [
    { label: 'Multiple Choice', value: 'multiple_choice' },
    { label: 'Identification', value: 'identification' },
    { label: 'Hybrid', value: 'hybrid' },
  ];

  const currentOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const borderClass = disabled ? 'border-border/40' : 'border-primary';
  const textClass = disabled ? 'text-muted/50 font-normal' : 'text-foreground font-bold';
  const chevronColor = disabled ? 'text-muted/40' : 'text-primary';

  return (
    <div ref={containerRef} className="relative w-full z-50">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-12 border-[1.5px] flex items-center justify-between px-3 text-sm bg-transparent select-none transition-colors ${borderClass} ${textClass} ${
          disabled
            ? 'cursor-not-allowed'
            : 'hover:bg-primary/10 cursor-pointer'
        }`}
      >
        <span>{currentOption.label}</span>
        {isOpen ? <ChevronUp className={`w-5 h-5 ${chevronColor}`} /> : <ChevronDown className={`w-5 h-5 ${chevronColor}`} />}
      </button>

      {isOpen && (
        <div className="absolute top-12 left-0 right-0 border-[1.5px] border-t-0 border-primary bg-card z-50 flex flex-col">
          {options.map((opt) => {
            const isSelected = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full h-11 text-left px-3 text-sm cursor-pointer select-none border-b last:border-b-0 border-primary/20 transition-colors ${
                  isSelected ? 'bg-primary text-primary-foreground font-bold' : 'bg-transparent text-foreground hover:bg-primary/20'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
