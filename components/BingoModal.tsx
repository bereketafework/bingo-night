
import React, { useState, useEffect } from 'react';
import { Player, GameAuditLog, Language } from '../types';
import BingoCard from './BingoCard';
import AuditTrailView from './AuditTrailView';
import { AuditLogIcon, RefreshIcon } from './icons';
import { speakText, cancelSpeech } from '../services/gameLogic';
import { useLanguage } from '../contexts/LanguageContext';

interface BingoModalProps {
  winner: Player;
  auditLog: GameAuditLog;
  onPlayAgain: () => void;
  language: Language;
  isSelfWinner: boolean;
}

const ViewOnlyWinnerCard: React.FC<{ winner: Player }> = ({ winner }) => {
  const displayPlayer: Player = {
    ...winner,
    id: 'winner-card-display',
    isHuman: false,
  };
  return <BingoCard player={displayPlayer} onToggleMark={() => {}} />;
};

const BingoModal: React.FC<BingoModalProps> = ({ winner, auditLog, onPlayAgain, language, isSelfWinner }) => {
  const [showAudit, setShowAudit] = useState(false);
  const prizeAmount = auditLog.settings.prize.toFixed(2);
  const { t, t_str } = useLanguage();

  useEffect(() => {
    let messageToSpeak: string;
    if (isSelfWinner) {
        messageToSpeak = t_str('congratulations_you_won_speech');
        if (auditLog.settings.prize > 0) {
            messageToSpeak += ` ${t_str('you_won_prize_speech', { prize: prizeAmount })}`;
        }
    } else {
        messageToSpeak = t_str('player_got_bingo_speech', { name: winner.name });
    }
    
    speakText(messageToSpeak, language);
    
    return () => {
        cancelSpeech();
    };
  }, [winner, auditLog, language, prizeAmount, isSelfWinner, t_str]);


  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-amber-500/20 rounded-2xl shadow-2xl p-6 md:p-8 text-center max-w-4xl w-full transform transition-all scale-100 animate-jump-in">
        <div className="text-6xl sm:text-7xl md:text-8xl xl:text-9xl 3xl:text-[10rem] font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 font-inter">
          BINGO!
        </div>
        <p className="mt-4 text-xl sm:text-2xl text-white">
          {isSelfWinner ? t('congratulations_you_won') : t('player_got_bingo', { name: winner.name })}
        </p>
        
        {isSelfWinner && parseFloat(prizeAmount) > 0 &&
            <p className="mt-2 text-3xl sm:text-4xl xl:text-5xl 3xl:text-6xl font-bold text-green-400">{t('you_won_prize', { prize: prizeAmount })}</p>
        }
        
        <div className="my-6 flex justify-center">
            <div className="w-full max-w-xs">
                <ViewOnlyWinnerCard winner={winner} />
            </div>
        </div>

        { showAudit ? (
            <div className="mt-6 text-left">
                <AuditTrailView auditLog={auditLog} />
            </div>
        ) : null}

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
            onClick={() => setShowAudit(prev => !prev)}
            className="w-full sm:w-auto flex-1 py-3 xl:py-4 text-base sm:text-lg xl:text-xl font-semibold text-white bg-gray-700 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-4 focus:ring-gray-500/50 transition-all duration-300 flex items-center justify-center gap-2"
            >
                <AuditLogIcon className="w-5 h-5" />
                {showAudit ? t('hide') : t('show')} {t('audit_trail')}
            </button>
            <button
            onClick={onPlayAgain}
            className="w-full sm:w-auto flex-1 py-3 xl:py-4 text-base sm:text-lg xl:text-xl font-semibold text-gray-900 bg-amber-500 rounded-lg hover:bg-amber-600 focus:outline-none focus:ring-4 focus:ring-amber-500/50 transition-all duration-300 flex items-center justify-center gap-2"
            >
            <RefreshIcon className="w-5 h-5"/>
            {t('play_again')}
            </button>
        </div>
      </div>
      <style>{`
        @keyframes jump-in {
            0% { transform: scale(0.5); opacity: 0; }
            80% { transform: scale(1.05); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
        }
        .animate-jump-in {
            animation: jump-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default BingoModal;
