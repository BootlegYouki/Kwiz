import React, { useRef, useEffect } from 'react';

interface LetterBoxInputProps {
  value: string;
  onChange: (value: string) => void;
  charCount: number;
  correctAnswer?: string;
}

function formatValueWithSpaces(rawVal: string, correctAnswer: string): string {
  const chars = rawVal.replace(/\s/g, '').split('');
  let formatted = '';
  let charIdx = 0;
  
  for (let i = 0; i < correctAnswer.length; i++) {
    if (correctAnswer[i] === ' ') {
      formatted += ' ';
    } else {
      if (charIdx < chars.length) {
        formatted += chars[charIdx];
        charIdx++;
      } else {
        break;
      }
    }
  }
  return formatted;
}

export const LetterBoxInput: React.FC<LetterBoxInputProps> = ({ value, onChange, charCount, correctAnswer }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePress = () => {
    inputRef.current?.focus();
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Split correctAnswer by spaces to define word groups
  const words = correctAnswer ? correctAnswer.split(' ') : [];
  const wordSpecs = words.length > 0 ? words : [ { length: charCount } ];

  let currentCharIndex = 0;
  const wordGroups = wordSpecs.map((word, wordIdx) => {
    const wordLen = typeof word === 'string' ? word.length : (word as any).length;
    const boxes = [];
    for (let i = 0; i < wordLen; i++) {
      boxes.push({
        char: value[currentCharIndex] || '',
        globalIndex: currentCharIndex
      });
      currentCharIndex++;
    }
    // Skip space character in value mapping
    currentCharIndex++;
    
    return {
      wordIdx,
      boxes
    };
  });

  return (
    <div onClick={handlePress} className="w-full my-6 flex flex-col items-center cursor-text">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          let cleanedText = e.target.value.replace(/[^a-zA-Z0-9 ]/g, '');
          if (correctAnswer) {
            cleanedText = formatValueWithSpaces(cleanedText, correctAnswer);
          }
          cleanedText = cleanedText.substring(0, charCount);
          onChange(cleanedText);
        }}
        maxLength={charCount}
        className="absolute w-0 h-0 opacity-0 pointer-events-none"
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
        autoFocus
      />

      <div className="flex flex-wrap justify-center gap-x-6 gap-y-4">
        {wordGroups.map((group) => (
          <div key={group.wordIdx} className="flex gap-2">
            {group.boxes.map((box) => {
              const isFocused = box.globalIndex === Math.min(value.length, charCount - 1);
              return (
                <div
                  key={box.globalIndex}
                  className={`border-[1.5px] w-12 h-14 flex items-center justify-center font-bold text-2xl select-none transition-colors ${
                    isFocused ? 'border-primary' : 'border-primary/40'
                  } ${box.char ? 'bg-primary/10 text-foreground' : 'text-primary/40'}`}
                >
                  {box.char || '_'}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
