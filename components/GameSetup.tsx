
import React, { useState, useMemo, useEffect } from 'react';
import { WinningPattern, GameSettings, BingoCard, Language, User, Player as RemotePlayer } from '../types';
import { WINNING_PATTERNS_CONFIG, WINNING_PATTERNS } from '../constants';
import { GamepadIcon, SpeedIcon, LogoutIcon, UsersIcon, StakeIcon, PrizeIcon, StarIcon, CheckCircleIcon, AuditLogIcon, ChevronDownIcon, ChevronUpIcon, EyeIcon, EyeSlashIcon, PlayIcon } from './icons';
import { generateBingoCard } from '../services/gameLogic';
import { BINGO_LETTERS } from '../constants';
import { getSetting, getEnabledWinningPatterns } from '../services/db';
import WinningPatternVisualizer from './WinningPatternVisualizer';
import { useLanguage } from '../contexts/LanguageContext';

interface GameSetupProps {
  manager: User;
  onStartGame: (settings: GameSettings, remotePlayers: RemotePlayer[]) => void;
  onLogout: () => void;
  onViewAudit: () => void;
  isHosting: boolean;
  onHostGame: () => void;
  gameId: string | null;
  remotePlayers: RemotePlayer[];
  lobbyConfig: {
    pattern: WinningPattern;
    speed: number;
    stake: number;
    language: Language;
    prize: number;
    totalPlayers: number;
    callingMode: 'AUTOMATIC' | 'MANUAL';
    markingMode: 'AUTOMATIC' | 'MANUAL';
  };
  onConfigChange: React.Dispatch<React.SetStateAction<any>>;
}

const SetupCard: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <div className={`bg-gray-800/70 border border-gray-700/50 p-4 sm:p-6 rounded-xl space-y-4 backdrop-blur-sm ${className}`}>
        {children}
    </div>
);


const SelectableBingoCard: React.FC<{ card: BingoCard, isSelected: boolean, onClick: () => void, cardId: number }> = ({ card, isSelected, onClick, cardId }) => {
  return (
    <div 
      onClick={onClick}
      className={`relative bg-gray-800 p-2 rounded-lg shadow-md border-2 transition-all duration-200 cursor-pointer hover:border-amber-400/70 hover:scale-105 ${isSelected ? 'border-amber-500 ring-2 ring-amber-500/50' : 'border-gray-700/80'}`}
    >
      <h4 className="text-center font-bold text-xs mb-1 text-gray-400">Card #{cardId + 1}</h4>
      <div className="grid grid-cols-5 gap-0.5">
        {BINGO_LETTERS.map(letter => (
          <div key={letter} className="text-center text-[10px] sm:text-xs font-bold text-amber-500/80">{letter}</div>
        ))}
        {card.flat().map((cell, index) => (
          <div key={index} className="aspect-square flex items-center justify-center rounded-sm bg-gray-700/50">
            {cell === 'FREE' ?
              <StarIcon className="w-3 h-3 text-yellow-400" /> :
              <span className="text-[10px] sm:text-xs lg:text-sm font-roboto-mono text-white/90">{cell}</span>
            }
          </div>
        ))}
      </div>
      {isSelected && (
        <div className="absolute inset-0 bg-amber-500/20 rounded-md flex items-center justify-center">
            <div className="p-1 bg-amber-500 rounded-full">
                <CheckCircleIcon className="w-6 h-6 text-white"/>
            </div>
        </div>
      )}
    </div>
  );
};


const GameSetup: React.FC<GameSetupProps> = ({ manager, onStartGame, onLogout, onViewAudit, isHosting, onHostGame, gameId, remotePlayers, lobbyConfig, onConfigChange }) => {
  const { pattern, speed, stake, language, prize, totalPlayers, callingMode, markingMode } = lobbyConfig;
  const { t, t_str } = useLanguage();

  const [generatedCards, setGeneratedCards] = useState<BingoCard[]>([]);
  const [selectedCardIndices, setSelectedCardIndices] = useState<number[]>([]);
  const [showCardSelection, setShowCardSelection] = useState<boolean>(true);
  const [prizePercentage, setPrizePercentage] = useState<number>(0.7); // Default fallback
  const [enabledPatterns, setEnabledPatterns] = useState<WinningPattern[]>([]);
  const [isGameIdVisible, setIsGameIdVisible] = useState<boolean>(true);

  useEffect(() => {
    const setup = async () => {
        const cards = Array.from({ length: 15 }, () => generateBingoCard());
        setGeneratedCards(cards);
        
        const storedPercentage = await getSetting('winner_prize_percentage');
        if (storedPercentage) {
            setPrizePercentage(parseFloat(storedPercentage));
        }
        
        const patterns = await getEnabledWinningPatterns();
        setEnabledPatterns(patterns);
        // If the currently selected pattern is not in the enabled list, default to the first enabled one.
        if (!patterns.includes(lobbyConfig.pattern)) {
            onConfigChange((c: any) => ({ ...c, pattern: patterns[0] || WINNING_PATTERNS[0] }));
        }
    };
    setup();
  }, []);
  
  const managerCardsCount = selectedCardIndices.length;
  const currentTotalPlayers = managerCardsCount + remotePlayers.length;
  const totalStake = useMemo(() => stake * currentTotalPlayers, [stake, currentTotalPlayers]);
  const possiblePrize = useMemo(() => totalStake * prizePercentage, [totalStake, prizePercentage]);

  useEffect(() => {
    if (possiblePrize !== prize || currentTotalPlayers !== totalPlayers) {
        onConfigChange((c: any) => ({
            ...c,
            prize: possiblePrize,
            totalPlayers: currentTotalPlayers,
        }));
    }
  }, [possiblePrize, prize, currentTotalPlayers, totalPlayers, onConfigChange]);

  const handleCardSelect = (index: number) => {
    setSelectedCardIndices(prev => {
        const isSelected = prev.includes(index);
        if (isSelected) {
            return prev.filter(i => i !== index);
        } else {
            return [...prev, index];
        }
    });
  };

  const speedOptions = [
    { label: t_str('slow'), value: 4000 },
    { label: t_str('normal'), value: 3000 },
    { label: t_str('fast'), value: 2000 },
  ];

  const handleStart = () => {
    if (stake < 1 || enabledPatterns.length === 0 || totalPlayers < 2) return;

    const selectedCards = selectedCardIndices.map(index => ({
        card: generatedCards[index],
        id: `manager-card-${index + 1}`
    }));
    
    onStartGame({
        pattern,
        speed,
        stake,
        prize: possiblePrize,
        selectedCards,
        language,
        callingMode,
        markingMode,
        totalPlayers: 0, // This will be recalculated in ManagerView
    }, remotePlayers);
  }
  
  const handleStakeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = value === '' ? 0 : parseInt(value, 10);
    
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(0, Math.min(numValue, 10000));
      onConfigChange((c: any) => ({ ...c, stake: clampedValue }));
    }
  };

  const handleStakeBlur = () => {
    if (stake < 1) {
      onConfigChange((c: any) => ({ ...c, stake: 1 }));
    }
  };


  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8 bg-gray-900/50 border border-gray-700/50 backdrop-blur-md rounded-2xl shadow-2xl">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl 2xl:text-5xl font-bold text-white font-inter">{t('game_setup_title')}</h1>
          <p className="mt-1 text-base sm:text-lg text-gray-400">{t('welcome_manager', { name: manager.name })}</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
            <button onClick={onViewAudit} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-300 bg-gray-700 rounded-lg hover:bg-blue-600 hover:text-white transition-colors">
              <AuditLogIcon className="w-4 h-4" /> {t('game_history')}
            </button>
            <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-300 bg-gray-700 rounded-lg hover:bg-red-600 hover:text-white transition-colors">
              <LogoutIcon className="w-4 h-4" /> {t('logout')}
            </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Game Settings */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <SetupCard>
                <label className="flex items-center gap-3 text-lg sm:text-xl font-semibold text-white mb-2 font-inter"><GamepadIcon className="w-6 h-6 text-amber-400" /> {t('win_condition')}</label>
                <div className="space-y-3">
                    {enabledPatterns.length > 0 ? enabledPatterns.map((p) => (
                      <button key={p} onClick={() => onConfigChange((c:any) => ({...c, pattern: p}))} disabled={isHosting} className={`w-full p-3 text-left rounded-lg transition-all duration-200 border-2 flex gap-4 items-center ${pattern === p ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/50' : 'bg-gray-700/50 border-gray-600/50 hover:border-amber-500/50'} ${isHosting ? 'cursor-not-allowed opacity-70' : ''}`}>
                        <WinningPatternVisualizer pattern={p} size="small" />
                        <div>
                            <h3 className="font-bold text-white">{WINNING_PATTERNS_CONFIG[p].name}</h3>
                            <p className="text-sm text-gray-400">{WINNING_PATTERNS_CONFIG[p].description}</p>
                        </div>
                      </button>
                    )) : <p className="text-gray-400 text-sm">{t('no_winning_patterns_enabled')}</p>}
                </div>
            </SetupCard>
            
            <SetupCard>
                 <label className="flex items-center gap-3 text-lg sm:text-xl font-semibold text-white mb-2 font-inter"><PlayIcon className="w-6 h-6 text-amber-400" /> {t('game_modes')}</label>
                <div>
                    <p className="text-gray-400 text-sm mb-1 font-semibold">{t('calling_mode')}</p>
                    <div className="flex items-center justify-center gap-2 bg-gray-700/50 rounded-lg p-1">
                        <button onClick={() => onConfigChange((c:any) => ({...c, callingMode: 'AUTOMATIC'}))} disabled={isHosting} className={`w-full py-2 text-center rounded-md font-semibold transition-colors text-sm ${callingMode === 'AUTOMATIC' ? 'bg-amber-500 text-gray-900' : 'bg-transparent text-gray-300 hover:bg-gray-600/50'} ${isHosting ? 'cursor-not-allowed opacity-70' : ''}`}>
                            {t('automatic')}
                        </button>
                        <button onClick={() => onConfigChange((c:any) => ({...c, callingMode: 'MANUAL'}))} disabled={isHosting} className={`w-full py-2 text-center rounded-md font-semibold transition-colors text-sm ${callingMode === 'MANUAL' ? 'bg-amber-500 text-gray-900' : 'bg-transparent text-gray-300 hover:bg-gray-600/50'} ${isHosting ? 'cursor-not-allowed opacity-70' : ''}`}>
                            {t('manual')}
                        </button>
                    </div>
                </div>
                
                <div className="pt-2">
                    <p className="text-gray-400 text-sm mb-1 font-semibold">{t('marking_mode')}</p>
                    <div className="flex items-center justify-center gap-2 bg-gray-700/50 rounded-lg p-1">
                        <button onClick={() => onConfigChange((c:any) => ({...c, markingMode: 'AUTOMATIC'}))} disabled={isHosting} className={`w-full py-2 text-center rounded-md font-semibold transition-colors text-sm ${markingMode === 'AUTOMATIC' ? 'bg-amber-500 text-gray-900' : 'bg-transparent text-gray-300 hover:bg-gray-600/50'} ${isHosting ? 'cursor-not-allowed opacity-70' : ''}`}>
                            {t('automatic')}
                        </button>
                        <button onClick={() => onConfigChange((c:any) => ({...c, markingMode: 'MANUAL'}))} disabled={isHosting} className={`w-full py-2 text-center rounded-md font-semibold transition-colors text-sm ${markingMode === 'MANUAL' ? 'bg-amber-500 text-gray-900' : 'bg-transparent text-gray-300 hover:bg-gray-600/50'} ${isHosting ? 'cursor-not-allowed opacity-70' : ''}`}>
                            {t('manual')}
                        </button>
                    </div>
                </div>
                
                {callingMode === 'AUTOMATIC' && (
                    <div className="pt-2">
                        <p className="text-gray-400 text-sm mb-1 font-semibold">{t('calling_speed')}</p>
                        <div className="flex items-center justify-center gap-2 bg-gray-700/50 rounded-lg p-1">
                        {speedOptions.map(({label, value}) => (
                            <button key={value} onClick={() => onConfigChange((c:any) => ({...c, speed: value}))} disabled={isHosting} className={`w-full py-2 text-center rounded-md font-semibold transition-colors text-sm ${speed === value ? 'bg-amber-500 text-gray-900' : 'bg-transparent text-gray-300 hover:bg-gray-600/50'} ${isHosting ? 'cursor-not-allowed opacity-70' : ''}`}>
                            {label}
                            </button>
                        ))}
                        </div>
                    </div>
                )}

                <div className="pt-2">
                    <label htmlFor="stake-input" className="text-gray-400 text-sm mb-1 font-semibold">{t('stake_per_card')}</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 text-lg">$</span>
                      <input id="stake-input" type="number" value={stake === 0 ? '' : stake} onChange={handleStakeChange} onBlur={handleStakeBlur} min="1" disabled={isHosting} className={`w-full pl-8 pr-4 py-3 text-lg text-white bg-gray-700/50 border-2 border-gray-600/50 rounded-lg focus:ring-4 focus:ring-amber-500/50 focus:border-amber-500 transition-all duration-300 placeholder-gray-500 ${isHosting ? 'cursor-not-allowed opacity-70' : ''}`} placeholder={t_str('enter_amount')} />
                    </div>
                </div>
                
                <div className="pt-2">
                    <p className="text-gray-400 text-sm mb-1 font-semibold">{t('voice_language')}</p>
                     <div className="flex items-center justify-center gap-2 bg-gray-700/50 rounded-lg p-1">
                        <button onClick={() => onConfigChange((c:any) => ({...c, language: 'en'}))} disabled={isHosting} className={`w-full py-2 text-center rounded-md font-semibold transition-colors text-sm ${language === 'en' ? 'bg-amber-500 text-gray-900' : 'bg-transparent text-gray-300 hover:bg-gray-600/50'} ${isHosting ? 'cursor-not-allowed opacity-70' : ''}`}>{t('english')}</button>
                        <button onClick={() => onConfigChange((c:any) => ({...c, language: 'am'}))} disabled={isHosting} className={`w-full py-2 text-center rounded-md font-semibold transition-colors text-sm ${language === 'am' ? 'bg-amber-500 text-gray-900' : 'bg-transparent text-gray-300 hover:bg-gray-600/50'} ${isHosting ? 'cursor-not-allowed opacity-70' : ''}`}>{t('amharic')}</button>
                    </div>
                </div>
            </SetupCard>
        </div>
        
        {/* Lobby and Summary */}
        <SetupCard className="md:col-span-1 lg:col-span-1">
            <div className="space-y-4">
                 <div>
                    <label className="flex items-center gap-3 text-lg sm:text-xl font-semibold text-white mb-2 font-inter"><UsersIcon className="w-6 h-6 text-amber-400" /> {t('lobby')}</label>
                    <div className="bg-gray-700/50 p-4 rounded-lg space-y-3">
                        {isHosting && gameId ? (
                            <>
                                <div className='text-center'>
                                    <p className="text-sm text-gray-400">{t('game_id_share')}</p>
                                    <div className="inline-flex items-center justify-center gap-2 bg-gray-800 px-4 py-2 rounded-md">
                                        <p className="text-2xl font-bold text-amber-300 font-roboto-mono tracking-widest">
                                            {isGameIdVisible ? gameId : '****'}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setIsGameIdVisible(!isGameIdVisible)}
                                            className="p-1 text-gray-400 hover:text-white rounded-full transition-colors"
                                            title={isGameIdVisible ? t_str('hide_game_id') : t_str('show_game_id')}
                                        >
                                            {isGameIdVisible ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                                <div className='space-y-2'>
                                    <h4 className='font-semibold text-white'>{t('players')} ({remotePlayers.length})</h4>
                                    <div className='max-h-48 overflow-y-auto pr-2 space-y-1'>
                                        {remotePlayers.length > 0 ? remotePlayers.map(p => (
                                            <div key={p.id} className="flex items-center gap-2 bg-gray-600/50 p-1.5 rounded-md">
                                                <UsersIcon className="w-5 h-5 text-gray-400" />
                                                <span className="text-sm font-medium text-white">{p.name}</span>
                                            </div>
                                        )) : <p className='text-sm text-gray-400 italic'>{t('waiting_for_players')}</p>}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center text-gray-400 p-4">{t('host_game_prompt')}</div>
                        )}
                    </div>
                 </div>
                <div>
                    <label className="flex items-center gap-3 text-lg sm:text-xl font-semibold text-white mb-2 font-inter"><PrizeIcon className="w-6 h-6 text-amber-400" /> {t('game_summary')}</label>
                    <div className="bg-green-600/10 border-2 border-green-500/20 p-4 rounded-lg text-center space-y-2">
                        <div>
                            <p className="text-sm text-gray-400">{t('total_cards')}</p>
                            <p className="text-2xl font-bold text-white font-roboto-mono">{totalPlayers}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">{t('possible_prize')}</p>
                            <p className="text-3xl font-bold text-green-400 font-roboto-mono">${prize.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </SetupCard>
      </div>
      
      {/* Card Selection */}
      <div className="mt-8">
        <div className="flex justify-between items-center">
          <label className="text-xl font-semibold text-white font-inter">{t('cards')} ({selectedCardIndices.length} {t('selected')})</label>
          <button onClick={() => setShowCardSelection(!showCardSelection)} className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-gray-300 bg-gray-700/80 rounded-lg hover:bg-gray-700 transition-colors" aria-expanded={showCardSelection} aria-controls="card-selection-grid">
              {showCardSelection ? t('hide') : t('show')}
              {showCardSelection ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
          </button>
        </div>
        {showCardSelection && (
            <div id="card-selection-grid" className="mt-4 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 xl:grid-cols-10 3xl:grid-cols-12 gap-2 md:gap-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 animate-fade-in-down">
                {generatedCards.length > 0 ? generatedCards.map((card, index) => (
                    <SelectableBingoCard 
                        key={index} card={card} cardId={index}
                        isSelected={selectedCardIndices.includes(index)}
                        onClick={() => handleCardSelect(index)}
                    />
                )) : <p className="col-span-full text-center text-gray-400">{t('generating_cards')}</p>}
            </div>
        )}
      </div>

      <div className="mt-10">
        {isHosting ? (
             <button onClick={handleStart} disabled={stake < 1 || enabledPatterns.length === 0 || totalPlayers < 2} className="w-full py-3 text-lg sm:text-xl font-bold text-gray-900 bg-green-500 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-500/50 transition-all duration-300 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed">
                {totalPlayers < 2 ? t('at_least_2_cards_required') : t('start_game_for_all', { count: totalPlayers })}
            </button>
        ) : (
            <button onClick={onHostGame} disabled={stake < 1} className="w-full py-3 text-lg sm:text-xl font-bold text-gray-900 bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition-all duration-300 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed">
                {t('host_game_and_create_lobby')}
            </button>
        )}
      </div>
    </div>
  );
};

export default GameSetup;