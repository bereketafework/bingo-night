
import React, { useMemo } from 'react';
import { WinningPattern } from '../types';

interface WinningPatternVisualizerProps {
  pattern: WinningPattern;
  size?: 'small' | 'normal';
}

const getPatternCells = (pattern: WinningPattern): boolean[][] => {
  const grid = Array.from({ length: 5 }, () => Array(5).fill(false));
  const size = 5;

  switch (pattern) {
    case WinningPattern.ANY_LINE: // For "Any Line", we just show one example, e.g., center horizontal
      for (let c = 0; c < size; c++) grid[2][c] = true;
      break;
    case WinningPattern.TWO_LINES: // Show two example lines
      for (let c = 0; c < size; c++) grid[1][c] = true;
      for (let c = 0; c < size; c++) grid[3][c] = true;
      break;
    case WinningPattern.X_PATTERN:
      for (let i = 0; i < size; i++) {
        grid[i][i] = true;
        grid[i][size - 1 - i] = true;
      }
      break;
    case WinningPattern.RECTANGLE:
      for (let i = 0; i < size; i++) {
        grid[0][i] = true;
        grid[size - 1][i] = true;
        grid[i][0] = true;
        grid[i][size - 1] = true;
      }
      break;
    case WinningPattern.FOUR_CORNERS:
      grid[0][0] = true;
      grid[0][size - 1] = true;
      grid[size - 1][0] = true;
      grid[size - 1][size - 1] = true;
      break;
    case WinningPattern.FULL_HOUSE_75:
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          grid[r][c] = true;
        }
      }
      grid[2][2] = false; // Usually free space isn't counted
      break;
    default:
      break;
  }
  return grid;
};

const WinningPatternVisualizer: React.FC<WinningPatternVisualizerProps> = ({ pattern, size = 'normal' }) => {
  const cells = useMemo(() => getPatternCells(pattern), [pattern]);

  const containerClasses = size === 'small' ? 'w-12 h-12 p-1' : 'w-20 h-20 p-1.5';
  const gapClass = size === 'small' ? 'gap-0.5' : 'gap-1';
  const cellClasses = size === 'small' ? 'rounded-xs' : 'rounded-sm';

  return (
    <div className={`flex-shrink-0 bg-gray-900/50 rounded-md ${containerClasses}`}>
        <div className={`grid grid-cols-5 h-full ${gapClass}`}>
            {cells.flat().map((isWinning, index) => (
                <div 
                    key={index}
                    className={`aspect-square w-full h-full ${isWinning ? 'bg-amber-400' : 'bg-gray-600/70'} ${cellClasses}`}
                />
            ))}
        </div>
    </div>
  );
};

export default WinningPatternVisualizer;
