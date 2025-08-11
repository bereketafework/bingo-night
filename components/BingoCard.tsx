
import React from 'react';
import { Player } from '../types';
import { BINGO_LETTERS } from '../constants';
import { StarIcon, EyeSlashIcon, UserCircleIcon } from './icons';
import { useLanguage } from '../contexts/LanguageContext';

interface BingoCardProps {
  player: Player;
  onToggleMark: (playerId: string, row: number, col: number) => void;
  onToggleVisibility?: (playerId: string) => void;
  isInteractive?: boolean;
}

const BingoCard: React.FC<BingoCardProps> = ({ player, onToggleMark, onToggleVisibility, isInteractive = true }) => {
  const { id, card, markedCells, winningCells, name, isHuman } = player;
  const { t } = useLanguage();
  
  if (card.length === 0) {
    return <div className="aspect-square w-full bg-gray-800/50 rounded-lg flex items-center justify-center"><p>{t('loading_card')}</p></div>;
  }
  
  const isWinningCell = (row: number, col: number) => {
    return winningCells.some(([r, c]) => r === row && c === col);
  };

  return (
    <div className={`relative bg-gray-900/70 p-2 sm:p-3 rounded-2xl shadow-lg border-2 transition-all duration-300 ${isHuman ? 'border-amber-500/50 shadow-amber-500/10' : 'border-blue-500/30 shadow-blue-500/10'}`}>
      <div className="flex justify-between items-center mb-2 px-1">
        <div className="flex items-center gap-2 truncate">
            {!isHuman && <UserCircleIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />}
            <h3 className="font-bold truncate text-sm text-gray-300">{name}</h3>
        </div>
        {onToggleVisibility && isHuman && (
          <button
            onClick={() => onToggleVisibility(id)}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
            aria-label={`Hide ${name}`}
          >
            <EyeSlashIcon className="w-5 h-5" />
          </button>
        )}
      </div>
      <div className="grid grid-cols-5 gap-1">
        {BINGO_LETTERS.map(letter => (
          <div key={letter} className="text-center text-lg sm:text-xl md:text-2xl font-bold text-amber-400 tracking-widest font-inter">
            {letter}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-1 sm:gap-2 mt-1">
        {card.map((row, rIdx) => 
          row.map((cell, cIdx) => {
            const isMarked = markedCells[rIdx][cIdx];
            const isWinner = isWinningCell(rIdx, cIdx);
            const isFreeSpace = cell === 'FREE';

            const cellClasses = `
              aspect-square w-full rounded-md flex items-center justify-center
              transition-all duration-300 transform
              ${isInteractive && !isFreeSpace && !player.disconnected ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
            `;
            
            const contentClasses = `
              relative w-full h-full flex items-center justify-center rounded-md transition-all duration-300 text-white font-bold
              ${ isWinner ? 'bg-green-500 shadow-lg shadow-green-400/50 ring-2 ring-white/50' : 
                 isMarked ? 'bg-blue-600/70 shadow-lg shadow-blue-500/30' : 
                 'bg-gray-700/50'}
              ${isInteractive && !isMarked && !isWinner ? 'hover:bg-gray-600/50' : ''}
            `;

            const numberClasses = `
                font-roboto-mono text-base sm:text-lg md:text-xl
                ${isMarked ? 'opacity-50' : 'opacity-100'}
            `;
            
            return (
              <div key={`${rIdx}-${cIdx}`} className={cellClasses} onClick={() => isInteractive && !isFreeSpace && onToggleMark(id, rIdx, cIdx)}>
                  <div className={contentClasses}>
                    {/* Overlays for marked/winner states */}
                    {isMarked && !isFreeSpace && !isWinner && (
                      <div className="absolute inset-0 rounded-md bg-gradient-to-tr from-blue-500/50 to-transparent"></div>
                    )}
                    {isWinner && (
                      <div className="absolute inset-0 rounded-md bg-gradient-to-tr from-green-400/50 to-transparent animate-pulse"></div>
                    )}
                    
                    {/* Content (Icon or Number) - positioned relatively to appear above absolute overlays */}
                    {isFreeSpace ? 
                      <StarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 relative"/> : 
                      <span className={`relative ${numberClasses}`}>{cell}</span>
                    }
                  </div>
              </div>
            )
          })
        )}
      </div>

       {player.disconnected && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-10 animate-fade-in p-2">
            <UserCircleIcon className="w-10 h-10 lg:w-12 lg:h-12 text-gray-500" />
            <p className="mt-2 font-bold text-base lg:text-lg text-gray-400 text-center">{t('disconnected')}</p>
        </div>
      )}
    </div>
  );
};

export default BingoCard;
