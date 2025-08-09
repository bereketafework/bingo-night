
import React, { useState } from 'react';
import { GameStatus, Player, GameSettings, GameAuditLog, User } from '../types';
import { WINNING_PATTERNS_CONFIG } from '../constants';
import BingoCard from './BingoCard';
import CalledNumbers from './CalledNumbers';
import BingoModal from './BingoModal';
import { PlayIcon, PauseIcon, RefreshIcon, GamepadIcon, SpeedIcon, UsersIcon, StakeIcon, PrizeIcon, EyeIcon, VolumeUpIcon, VolumeOffIcon, BackArrowIcon } from './icons';

interface GameScreenProps {
  settings: GameSettings;
  players: Player[];
  manager: User;
  onPlayAgain: () => void;
  status: GameStatus;
  winner: Player | null;
  auditLog: GameAuditLog | null;
  calledNumbers: number[];
  currentNumber: number | null;
  isMuted: boolean;
  onGameAction: () => void;
  onToggleMute: () => void;
  onToggleCardVisibility: (playerId: string) => void;
  onToggleMark: (playerId: string, row: number, col: number) => void;
  onManagerBingoCheck: () => void;
  isManualMarking: boolean;
}

const HiddenCardPlaceholder: React.FC<{ player: Player, onShow: () => void }> = ({ player, onShow }) => (
    <div className="bg-gray-800/70 border-2 border-dashed border-gray-700 rounded-2xl flex flex-col items-center justify-center p-4 aspect-square animate-fade-in-down">
        <h3 className="text-lg font-bold text-white">{player.name}</h3>
        <p className="text-sm text-gray-400 mt-1">Card is hidden</p>
        <button
            onClick={onShow}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-amber-500 text-gray-900 rounded-lg font-semibold hover:bg-amber-600 transition-colors"
        >
            <EyeIcon className="w-5 h-5" />
            Show Card
        </button>
    </div>
);


const GameScreen: React.FC<GameScreenProps> = ({ 
    settings, players, manager, onPlayAgain, 
    status, winner, auditLog, calledNumbers, currentNumber, isMuted,
    onGameAction, onToggleMute, onToggleCardVisibility, onToggleMark,
    onManagerBingoCheck, isManualMarking
}) => {
  const totalStake = settings.stake * players.filter(p => !p.disconnected).length;

  const getButtonContent = () => {
    if (status === GameStatus.Over) {
        return { icon: <RefreshIcon />, text: 'Play Again', className: 'bg-amber-500 hover:bg-amber-600 text-gray-900' };
    }
    if (settings.callingMode === 'MANUAL') {
        if (status === GameStatus.Running) {
            return { icon: <PlayIcon />, text: 'Call Next', className: 'bg-yellow-500 hover:bg-yellow-600 text-gray-900' };
        }
        return { icon: <PlayIcon />, text: 'Start Game', className: 'bg-green-500 hover:bg-green-600 text-gray-900' };
    }
    // Automatic mode
    if (status === GameStatus.Running) {
        return { icon: <PauseIcon />, text: 'Pause', className: 'bg-yellow-500 hover:bg-yellow-600 text-gray-900' };
    }
    if (status === GameStatus.Paused) {
        return { icon: <PlayIcon />, text: 'Resume', className: 'bg-green-500 hover:bg-green-600 text-gray-900' };
    }
    return { icon: <PlayIcon />, text: 'Start', className: 'bg-green-500 hover:bg-green-600 text-gray-900' };
  };

  const {icon, text, className} = getButtonContent();

  return (
    <div className="w-full h-full">
      {winner && auditLog && <BingoModal winner={winner} auditLog={auditLog} onPlayAgain={onPlayAgain} language={settings.language} isSelfWinner={winner.isHuman} />}
      <header className="mb-4 p-4 bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-2xl sm:text-3xl xl:text-4xl font-bold text-white font-inter">Bingo Night</h1>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 sm:gap-x-6 gap-y-2 mt-2 text-gray-300 text-xs sm:text-sm">
             <div className="flex items-center gap-2" title="Winning Pattern"><GamepadIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400"/> <span className="font-semibold">{WINNING_PATTERNS_CONFIG[settings.pattern].name}</span></div>
             <div className="flex items-center gap-2" title="Stake per Card"><StakeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-400"/> <span className="font-semibold">${settings.stake} / Card</span></div>
             <div className="flex items-center gap-2" title="Total Stake"><StakeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-500"/> <span className="font-semibold">Total: ${totalStake.toFixed(2)}</span></div>
             <div className="flex items-center gap-2" title="Possible Prize"><PrizeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400"/> <span className="font-semibold">${settings.prize.toFixed(2)}</span></div>
             <div className="flex items-center gap-2" title="Number of Players/Cards"><UsersIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400"/> <span className="font-semibold">{players.length}</span></div>
             {settings.callingMode === 'AUTOMATIC' && (
                <div className="flex items-center gap-2" title="Calling Speed"><SpeedIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400"/> <span className="font-semibold">{settings.speed/1000}s</span></div>
             )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onGameAction} className={`px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-bold flex items-center gap-2 transition-all text-base ${className}`}>
            {icon}
            {text}
          </button>
          
           {status === GameStatus.Running && isManualMarking && (
                <button
                    onClick={onManagerBingoCheck}
                    className="px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-bold flex items-center gap-2 transition-all text-base bg-green-500 hover:bg-green-600 text-gray-900 animate-pulse"
                >
                    BINGO!
                </button>
            )}

          {(status === GameStatus.Running || status === GameStatus.Paused) && (
            <button
                onClick={onPlayAgain}
                title="End Game and Return to Setup"
                className="p-2 sm:p-3 rounded-lg font-bold flex items-center gap-2 transition-all bg-red-600 hover:bg-red-700 text-white"
            >
                <BackArrowIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="hidden sm:inline text-base">End</span>
            </button>
          )}

          <button onClick={onToggleMute} className={`p-2 sm:p-3 rounded-lg transition-colors ${!isMuted ? 'bg-amber-500 text-gray-900' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`} aria-label={isMuted ? 'Unmute' : 'Mute'}>{isMuted ? <VolumeOffIcon className="w-6 h-6"/> : <VolumeUpIcon className="w-6 h-6"/>}</button>
        </div>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
        <div className="lg:col-span-3">
            {players.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4 gap-4 sm:gap-6 max-h-[70vh] overflow-y-auto pr-2">
                    {players.map(player =>
                        player.isVisible ? (
                            <BingoCard key={player.id} player={player} onToggleMark={onToggleMark} onToggleVisibility={onToggleCardVisibility} isInteractive={player.isHuman && settings.markingMode === 'MANUAL'} />
                        ) : (
                            <HiddenCardPlaceholder key={player.id} player={player} onShow={() => onToggleCardVisibility(player.id)} />
                        )
                    )}
                </div>
            ) : (
                <div className="aspect-square w-full bg-gray-800 rounded-lg flex items-center justify-center"><p>No players in game.</p></div>
            )}
        </div>
        
        <div className="lg:col-span-1 flex flex-col gap-6">
          <CalledNumbers calledNumbers={calledNumbers} currentNumber={currentNumber} />
        </div>
      </div>
    </div>
  );
};

export default GameScreen;
