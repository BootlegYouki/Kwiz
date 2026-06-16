import React, { useRef, useEffect } from 'react';

interface LetterBoxInputProps {
  value: string;
  onChange: (value: string) => void;
  charCount: number;
}

export const LetterBoxInput: React.FC<LetterBoxInputProps> = ({ value, onChange, charCount }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePress = () => {
    inputRef.current?.focus();
  };

  useEffect(() => {
    // Focus automatically on mount
    inputRef.current?.focus();
  }, []);

  const boxes = [];
  for (let i = 0; i < charCount; i++) {
    boxes.push(value[i] || '');
  }

  return (
    <div onClick={handlePress} className="w-full my-6 flex flex-col items-center cursor-text">
      {/* Hidden input field */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          const cleanedText = e.target.value.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, charCount);
          onChange(cleanedText);
        }}
        maxLength={charCount}
        className="absolute w-0 h-0 opacity-0 pointer-events-none"
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
        autoFocus
      />

      {/* Render boxes */}
      <div className="flex flex-wrap justify-center gap-2">
        {boxes.map((char, index) => {
          const isFocused = index === Math.min(value.length, charCount - 1);
          return (
            <div
              key={index}
              className={`border-[1.5px] w-12 h-14 flex items-center justify-center font-bold text-2xl select-none transition-colors ${
                isFocused ? 'border-primary' : 'border-primary/40'
              } ${char ? 'bg-primary/10 text-foreground' : 'text-primary/40'}`}
            >
              {char || '_'}
            </div>
          );
        })}
      </div>
    </div>
  );
};
