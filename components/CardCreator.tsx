import React, { useState, useCallback } from 'react';
import { BingoCard } from '../types';
import { BINGO_LETTERS, NUMBER_RANGES } from '../constants';

interface CardCreatorProps {
  onSubmit: (card: BingoCard) => void;
}

const initialGrid = () => Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => ''));
const colRanges = [NUMBER_RANGES.B, NUMBER_RANGES.I, NUMBER_RANGES.N, NUMBER_RANGES.G, NUMBER_RANGES.O];

const CardCreator: React.FC<CardCreatorProps> = ({ onSubmit }) => {
  const [inputs, setInputs] = useState<string[][]>(initialGrid());
  const [errors, setErrors] = useState<string[][]>(initialGrid());
  const [globalError, setGlobalError] = useState<string | null>(null);

  const validateCell = useCallback((value: string, col: number): string => {
    const num = parseInt(value, 10);
    if (isNaN(num)) return 'NaN';
    const [min, max] = colRanges[col];
    if (num < min || num > max) return `Out of range (${min}-${max})`;
    return '';
  }, []);

  const handleInputChange = (value: string, row: number, col: number) => {
    // Allow only numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    const newInputs = inputs.map(r => [...r]);
    newInputs[row][col] = numericValue;
    setInputs(newInputs);

    const newErrors = errors.map(r => [...r]);
    newErrors[row][col] = validateCell(numericValue, col);
    setErrors(newErrors);
    setGlobalError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    const newErrors = initialGrid();
    let hasError = false;

    const allNumbers = new Set<number>();
    const finalCard: (number | 'FREE')[][] = Array.from({ length: 5 }, () => Array(5));

    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (r === 2 && c === 2) {
            finalCard[r][c] = 'FREE';
            continue;
        }

        const value = inputs[r][c];
        if (!value) {
            newErrors[r][c] = 'Required';
            hasError = true;
            continue;
        }
        
        const cellError = validateCell(value, c);
        if (cellError) {
            newErrors[r][c] = cellError;
            hasError = true;
            continue;
        }

        const num = parseInt(value, 10);
        if (allNumbers.has(num)) {
            newErrors[r][c] = 'Duplicate';
            hasError = true;
        } else {
            allNumbers.add(num);
            finalCard[r][c] = num;
        }
      }
    }
    
    setErrors(newErrors);

    if (hasError) {
        setGlobalError('Please fix the errors on your card.');
        return;
    }

    onSubmit(finalCard as BingoCard);
  };

  return (
    <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50 animate-fade-in-down">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 text-center">Create Your Own Card</h2>
        <p className="text-gray-400 text-center mb-4 text-sm sm:text-base">Enter a valid number in each cell according to its column.</p>
        <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-5 gap-1 sm:gap-2">
                {BINGO_LETTERS.map((letter, colIndex) => (
                    <div key={letter} className="text-center font-bold text-amber-400">
                        <p className="text-lg sm:text-xl md:text-2xl font-inter">{letter}</p>
                        <p className="text-xs font-roboto-mono">({NUMBER_RANGES[letter][0]}-{NUMBER_RANGES[letter][1]})</p>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-5 gap-1 sm:gap-2 mt-2">
                {inputs.map((row, rIdx) => 
                    row.map((cellValue, cIdx) => {
                        if (rIdx === 2 && cIdx === 2) {
                            return (
                                <div key={`${rIdx}-${cIdx}`} className="aspect-square flex items-center justify-center bg-gray-700/50 rounded-md text-yellow-400 font-bold">
                                    FREE
                                </div>
                            );
                        }
                        const error = errors[rIdx][cIdx];
                        return (
                            <div key={`${rIdx}-${cIdx}`} className="relative">
                                <input
                                    type="text"
                                    maxLength={2}
                                    value={cellValue}
                                    onChange={(e) => handleInputChange(e.target.value, rIdx, cIdx)}
                                    className={`aspect-square w-full rounded-md text-center font-roboto-mono text-base sm:text-lg md:text-xl font-bold text-white bg-gray-700/50 border-2 transition-colors
                                        ${error ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-600 focus:border-amber-500 focus:ring-amber-500/50'}`}
                                    aria-label={`Card cell BINGO ${rIdx},${cIdx}`}
                                />
                                {error && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full" title={error}></div>}
                            </div>
                        )
                    })
                )}
            </div>
            {globalError && <p className="text-red-400 text-center mt-3 text-sm">{globalError}</p>}
            <button
                type="submit"
                className="w-full mt-4 py-3 text-lg font-semibold text-gray-900 bg-green-500 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-500/50 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
                Submit My Card
            </button>
        </form>
    </div>
  );
};

export default CardCreator;
