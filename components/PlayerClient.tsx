
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { GameSettings, BingoCard, NetworkMessage, Player, GameAuditLog, WinningPattern } from '../types';
import { generateBingoCard, checkWin, speak } from '../services/gameLogic';
import { BINGO_LETTERS } from '../constants';
import { StarIcon, CheckCircleIcon, UsersIcon, GamepadIcon, PrizeIcon } from './icons';
import BingoCardComponent from './BingoCard';
import CalledNumbers from './CalledNumbers';
import BingoModal from './BingoModal';
import CardCreator from './CardCreator';
import WinningPatternVisualizer from './WinningPatternVisualizer';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';


// A selectable card for the player lobby
const SelectableBingoCard: React.FC<{ card: BingoCard, isSelected: boolean, onClick: () => void, cardId: number, isLastUsed?: boolean }> = ({ card, isSelected, onClick, cardId, isLastUsed }) => {
  const { t } = useLanguage();
  return (
    <div onClick={onClick} className={`relative bg-gray-800 p-2 rounded-lg shadow-md border-2 transition-all duration-200 cursor-pointer hover:border-amber-400/70 hover:scale-105 ${isSelected ? 'border-amber-500 ring-2 ring-amber-500/50' : 'border-gray-700/80'}`}>
       {isLastUsed && <div className="absolute top-0 right-0 bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-bl-lg rounded-tr-lg z-10 shadow-md">{t('previous_card')}</div>}
      <div className="grid grid-cols-5 gap-0.5">
        {BINGO_LETTERS.map(letter => <div key={letter} className="text-center text-xs font-bold text-amber-500/80">{letter}</div>)}
        {card.flat().map((cell, index) => (
          <div key={index} className="aspect-square flex items-center justify-center rounded-sm bg-gray-700/50">
            {cell === 'FREE' ? <StarIcon className="w-4 h-4 text-yellow-400" /> : <span className="text-sm font-roboto-mono text-white/90">{cell}</span>}
          </div>
        ))}
      </div>
      {isSelected && (
        <div className="absolute inset-0 bg-amber-500/20 rounded-md flex items-center justify-center">
            <div className="p-1 bg-amber-500 rounded-full"><CheckCircleIcon className="w-8 h-8 text-white"/></div>
        </div>
      )}
    </div>
  );
};


const PlayerClient: React.FC<{onSwitchToManager: () => void}> = ({onSwitchToManager}) => {
    const [step, setStep] = useState<'JOIN' | 'LOBBY' | 'GAME' | 'POSTGAME'>('JOIN');
    const [playerName, setPlayerName] = useState('');
    const [hostId, setHostId] = useState('');
    const [error, setError] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    
    const peerRef = useRef<Peer | null>(null);
    const connRef = useRef<DataConnection | null>(null);
    const stepRef = useRef(step);
    const { t, t_str } = useLanguage();

    useEffect(() => {
        setStatusMessage(t_str('status_enter_game_id'));
    }, [t_str]);

    useEffect(() => {
        stepRef.current = step;
    }, [step]);

    // Lobby state
    const [lobbyPlayers, setLobbyPlayers] = useState<{id: string, name: string}[]>([]);
    const [lobbySettings, setLobbySettings] = useState<Partial<GameSettings & {totalPlayers: number}>>({});
    const [generatedCards, setGeneratedCards] = useState<BingoCard[]>([]);
    const [selectedCard, setSelectedCard] = useState<BingoCard | null>(null);
    const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
    const [indexOfLastUsed, setIndexOfLastUsed] = useState<number | null>(null);
    const [lobbyMode, setLobbyMode] = useState<'SELECT' | 'CREATE'>('SELECT');

    // Game state
    const [allPlayers, setAllPlayers] = useState<Player[]>([]);
    const [player, setPlayer] = useState<Player | null>(null);
    const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
    const [currentNumber, setCurrentNumber] = useState<number | null>(null);
    const [canCallBingo, setCanCallBingo] = useState(false);
    const [winner, setWinner] = useState<Player | null>(null);
    const [prize, setPrize] = useState(0);
    const [auditLog, setAuditLog] = useState<GameAuditLog | null>(null);
    
    const calledNumbersRef = useRef(calledNumbers);
    useEffect(() => { calledNumbersRef.current = calledNumbers }, [calledNumbers]);


    const handleMessageRef = useRef<((message: NetworkMessage) => void) | null>(null);

    const generateAndSetCards = () => {
        const lastUsedCardStr = localStorage.getItem('bingo_last_used_card');
        let lastUsedCard: BingoCard | null = null;
        try {
            if (lastUsedCardStr) lastUsedCard = JSON.parse(lastUsedCardStr);
        } catch (e) {
            console.error("Could not parse last used card", e);
            localStorage.removeItem('bingo_last_used_card');
        }
        
        const newCards = Array.from({ length: lastUsedCard ? 5 : 6 }, () => generateBingoCard());
        
        if (lastUsedCard) {
            setGeneratedCards([lastUsedCard, ...newCards]);
            setIndexOfLastUsed(0);
        } else {
            setGeneratedCards(newCards);
            setIndexOfLastUsed(null);
        }
    };


    useEffect(() => {
        generateAndSetCards();
        return () => {
            peerRef.current?.destroy();
        }
    }, []);

    useEffect(() => {
        // This keeps the handler function in the ref up-to-date with the latest component state.
        handleMessageRef.current = (message: NetworkMessage) => {
            switch (message.type) {
                case 'WELCOME_PLAYER':
                    setLobbyPlayers(message.payload.players);
                    setLobbySettings(message.payload.settings);
                    setStep('LOBBY');
                    break;
                case 'LOBBY_UPDATE':
                    if (stepRef.current === 'GAME') {
                        setAllPlayers(message.payload.players);
                    } else {
                        setLobbyPlayers(message.payload.players);
                    }
                    break;
                case 'CONFIG_UPDATE':
                    if (stepRef.current === 'LOBBY') {
                        setLobbySettings(message.payload.settings);
                    }
                    break;
                case 'CARD_ACCEPTED':
                    setStatusMessage(t_str('status_card_accepted'));
                    setTimeout(() => setStatusMessage(t_str('status_waiting_for_host')), 2500);
                    break;
                case 'CARD_REJECTED_DUPLICATE':
                    setError(t_str('error_card_duplicate'));
                    setSelectedCard(null);
                    setSelectedCardIndex(null);
                    setPlayer(null);
                    break;
                case 'GAME_START':
                    if (player) {
                        setLobbySettings(message.payload.settings);
                        setAllPlayers(message.payload.players);
                        setStatusMessage(t_str('status_game_starting'));
                        setStep('GAME');
                    } else {
                        setError(t_str('error_game_started_without_you'));
                        // Force a disconnect and return to JOIN screen.
                        connRef.current?.close();
                    }
                    break;
                case 'NUMBER_CALL': {
                    const newCurrentNumber = message.payload.number;
                    const newCalledNumbers = message.payload.calledNumbers as number[];
    
                    setCurrentNumber(newCurrentNumber);
                    setCalledNumbers(newCalledNumbers);

                    if (lobbySettings.language) {
                      speak(newCurrentNumber, lobbySettings.language);
                    }
    
                    if (lobbySettings.markingMode === 'AUTOMATIC') {
                        setAllPlayers(prevPlayers =>
                            prevPlayers.map(p => {
                                if (!p.card || p.card.length === 0 || p.disconnected) return p;
        
                                const newMarkedCells = p.markedCells.map(r => [...r]);
                                let changed = false;
                                p.card.forEach((row, rIdx) => {
                                    row.forEach((cell, cIdx) => {
                                        if (cell === newCurrentNumber) {
                                            if (!newMarkedCells[rIdx][cIdx]) {
                                                newMarkedCells[rIdx][cIdx] = true;
                                                changed = true;
                                            }
                                        }
                                    });
                                });
                                return changed ? { ...p, markedCells: newMarkedCells } : p;
                            })
                        );
                    }
                    break;
                }
                case 'WINNER_ANNOUNCED':
                    setWinner(message.payload.winner);
                    setPrize(message.payload.prize);
                    setAuditLog(message.payload.auditLog);
                    setStep('POSTGAME');
                    break;
                case 'ERROR':
                    setError(message.payload.message);
                    connRef.current?.close();
                    setStep('JOIN');
                    break;
            }
        };
    }, [player, lobbySettings.markingMode, lobbySettings.language, t_str]);

    useEffect(() => {
        if (step === 'GAME' && !winner && lobbySettings.pattern) {
            const myPlayer = allPlayers.find(p => p.id === peerRef.current?.id);
            if (myPlayer && myPlayer.markedCells.length > 0) {
                const { win } = checkWin(myPlayer.markedCells, lobbySettings.pattern as WinningPattern);
                if (canCallBingo !== win) {
                    setCanCallBingo(win);
                }
            }
        }
    }, [allPlayers, step, lobbySettings.pattern, winner, canCallBingo]);

    const connectToHost = (e: React.FormEvent) => {
        e.preventDefault();
        if (!playerName.trim() || !hostId.trim()) {
            setError(t_str('error_name_id_required'));
            return;
        }
        setError('');
        setStatusMessage(t_str('status_initializing_connection'));

        let connectionTimeoutId: number;

        const cleanupAndReset = () => {
            clearTimeout(connectionTimeoutId);
            if (peerRef.current) {
                peerRef.current.destroy();
                peerRef.current = null;
            }
            connRef.current = null;
        };

        try {
            if (peerRef.current) {
                peerRef.current.destroy();
            }

            const peer = new Peer({
                debug: 2,
                config: {
                    'iceServers': [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                        { 
                            urls: "turn:openrelay.metered.ca:80", 
                            username: "openrelayproject", 
                            credential: "openrelayproject" 
                        },
                        { 
                            urls: "turn:openrelay.metered.ca:443", 
                            username: "openrelayproject", 
                            credential: "openrelayproject" 
                        },
                    ]
                }
            });
            peerRef.current = peer;

            connectionTimeoutId = window.setTimeout(() => {
                setError(t_str('error_connection_timed_out'));
                setStatusMessage(t_str('status_enter_game_id'));
                setStep('JOIN');
                cleanupAndReset();
            }, 15000); // 15-second timeout

            peer.on('open', (id) => {
                setStatusMessage(t_str('status_connecting_to_host', { hostId }));
                
                if (!/^\d{4}$/.test(hostId.trim())) {
                    setError(t_str('error_invalid_game_id'));
                    setStatusMessage(t_str('status_enter_game_id'));
                    setStep('JOIN');
                    cleanupAndReset();
                    return;
                }

                const conn = peer.connect(hostId.trim(), { reliable: true });
                connRef.current = conn;

                conn.on('open', () => {
                    clearTimeout(connectionTimeoutId); // Success! Clear the watchdog.
                    setStatusMessage(t_str('status_connection_successful'));
                    conn.send({ type: 'PLAYER_JOIN_REQUEST', payload: { name: playerName } });
                });

                conn.on('data', (data: any) => handleMessageRef.current?.(data as NetworkMessage));

                conn.on('close', () => {
                    if (stepRef.current === 'LOBBY' || stepRef.current === 'GAME') {
                        setError(t_str('error_connection_lost'));
                        setStatusMessage(t_str('status_enter_game_id'));
                        setStep('JOIN');
                    }
                    cleanupAndReset();
                });

                conn.on('error', (err) => {
                     setError(t_str('error_connection_error', { message: err.message }));
                     setStatusMessage(t_str('status_enter_game_id'));
                     setStep('JOIN');
                     cleanupAndReset();
                });
            });

            peer.on('error', (err: any) => {
                let userMessage = t_str('error_unexpected', { message: err.message });
                 switch (err.type) {
                    case 'browser-incompatible':
                        userMessage = t_str('error_browser_incompatible');
                        break;
                    case 'disconnected':
                        userMessage = t_str('error_disconnected_from_server');
                        break;
                    case 'network':
                        userMessage = t_str('error_network');
                        break;
                    case 'peer-unavailable':
                        userMessage = t_str('error_peer_unavailable');
                        break;
                    case 'server-error':
                        userMessage = t_str('error_server_error');
                        break;
                    case 'webrtc':
                        userMessage = t_str('error_webrtc_unsupported');
                        break;
                    default:
                        userMessage = t_str('error_connection_failed', { message: err.message });
                }
                setError(userMessage);
                setStatusMessage(t_str('status_enter_game_id'));
                setStep('JOIN');
                cleanupAndReset();
            });

        } catch (err: any) {
            setError(t_str('error_unexpected_setup', { message: err.message }));
            setStatusMessage(t_str('status_enter_game_id'));
            setStep('JOIN');
            cleanupAndReset();
        }
    };
    
    const handleCardSelection = (card: BingoCard, index: number) => {
        setError('');
        setStatusMessage(t_str('status_confirming_card'));
        setSelectedCard(card);
        setSelectedCardIndex(index);
        const markedCells = Array.from({ length: 5 }, () => Array(5).fill(false));
        markedCells[2][2] = true; // Free space
        
        const newPlayer: Player = {
            id: peerRef.current!.id,
            name: playerName,
            card: card,
            markedCells,
            isHuman: false, isWinner: false, winningCells: [], isVisible: true,
        };
        setPlayer(newPlayer);
        connRef.current?.send({ type: 'CARD_SELECTION', payload: { card, markedCells } });
    };

    const handleBingoCall = () => {
        connRef.current?.send({type: 'BINGO', payload: {}});
        setCanCallBingo(false); // Prevent spamming
        setStatusMessage(t_str('status_bingo_sent'));
    }
    
    const handlePlayAgain = () => {
        if (selectedCard) {
            localStorage.setItem('bingo_last_used_card', JSON.stringify(selectedCard));
        }

        if (peerRef.current) {
            peerRef.current.destroy();
        }
        peerRef.current = null;
        connRef.current = null;

        setStep('JOIN');
        setHostId('');
        setError('');
        setStatusMessage(t_str('status_enter_game_id'));
        
        setLobbyPlayers([]);
        setLobbySettings({});
        
        generateAndSetCards();

        setSelectedCard(null);
        setSelectedCardIndex(null);
        setPlayer(null);
        setAllPlayers([]);
        setCalledNumbers([]);
        setCurrentNumber(null);
        setCanCallBingo(false);
        setWinner(null);
        setPrize(0);
        setAuditLog(null);
    };

    const handleCustomCardSubmit = (card: BingoCard) => {
        handleCardSelection(card, -1);
    };

    const handleManualMark = useCallback((playerId: string, row: number, col: number) => {
        if (lobbySettings.markingMode !== 'MANUAL' || winner) return;
    
        const calledSet = new Set(calledNumbersRef.current);
    
        setAllPlayers(prevPlayers =>
            prevPlayers.map(p => {
                if (p.id === playerId) {
                    const cellValue = p.card[row][col];
                    if (typeof cellValue === 'number' && calledSet.has(cellValue)) {
                        const newMarkedCells = p.markedCells.map(r => [...r]);
                        // Toggle the mark
                        newMarkedCells[row][col] = !newMarkedCells[row][col];
                        return { ...p, markedCells: newMarkedCells };
                    }
                }
                return p;
            })
        );
    }, [winner, lobbySettings.markingMode]);


    // --- RENDER LOGIC ---
    if (step === 'JOIN') return (
        <div className="relative w-full max-w-md mx-auto p-6 sm:p-8 bg-gray-900/80 border border-gray-700/50 rounded-2xl shadow-2xl animate-fade-in-down">
            <div className="absolute top-4 right-4"><LanguageSwitcher /></div>
            <h1 className="text-2xl sm:text-3xl font-bold text-center text-white mb-2 font-inter">{t('join_bingo_night')}</h1>
            <p className="text-center text-gray-400 mb-6">{statusMessage}</p>
            <form onSubmit={connectToHost} className="space-y-4">
                 <input type="text" value={playerName} onChange={e => { setPlayerName(e.target.value); setError('')}} placeholder={t_str('your_name')} required className="w-full px-4 py-3 text-lg text-white bg-gray-800 border border-gray-600 rounded-lg focus:ring-4 focus:ring-amber-500/50 focus:border-amber-500"/>
                 <input type="text" pattern="\\d*" maxLength={4} value={hostId} onChange={e => { setHostId(e.target.value); setError('')}} placeholder={t_str('game_id_placeholder')} required className="w-full px-4 py-3 text-lg text-white bg-gray-800 border border-gray-600 rounded-lg focus:ring-4 focus:ring-amber-500/50 focus:border-amber-500"/>
                {error && <p className="text-red-400 text-sm p-2 bg-red-500/10 rounded-md">{error}</p>}
                <button type="submit" className="w-full py-3 text-lg font-semibold text-gray-900 bg-green-500 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-500/50">{t('join_a_game')}</button>
            </form>
             <button onClick={onSwitchToManager} className="w-full mt-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">{t('switch_to_manager_login')}</button>
        </div>
    );
    
    if (step === 'LOBBY') {
        return (
            <div className="w-full max-w-4xl mx-auto p-4 sm:p-8 bg-gray-900/70 border border-gray-700/50 rounded-2xl shadow-2xl animate-fade-in">
                <h1 className="text-3xl sm:text-4xl font-bold text-center text-white font-inter">{t('game_lobby')}</h1>
                <p className="text-center text-amber-400 mt-1 mb-6">{t('welcome_player', { name: playerName })}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <div className="flex items-center justify-center gap-2 bg-gray-800/80 p-1 rounded-lg mb-4">
                            <button onClick={() => setLobbyMode('SELECT')} className={`w-full py-2 text-center rounded-md font-semibold transition-colors text-sm ${lobbyMode === 'SELECT' ? 'bg-amber-500 text-gray-900' : 'bg-transparent text-gray-300 hover:bg-gray-600/50'}`}>
                                {t('select_a_card')}
                            </button>
                            <button onClick={() => setLobbyMode('CREATE')} className={`w-full py-2 text-center rounded-md font-semibold transition-colors text-sm ${lobbyMode === 'CREATE' ? 'bg-amber-500 text-gray-900' : 'bg-transparent text-gray-300 hover:bg-gray-600/50'}`}>
                                {t('create_your_own')}
                            </button>
                        </div>
                        
                        {lobbyMode === 'SELECT' ? (
                            <>
                                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 text-center">{selectedCard ? t('card_selected') : t('choose_your_card')}</h2>
                                <p className="text-gray-400 text-center mb-4 text-sm sm:text-base">{selectedCard ? t('can_change_card') : t('pick_one_card')}</p>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                                    {generatedCards.length > 0 ? generatedCards.map((card, i) => (
                                        <SelectableBingoCard 
                                            key={i} 
                                            card={card} 
                                            cardId={i} 
                                            isSelected={selectedCardIndex === i} 
                                            onClick={() => handleCardSelection(card, i)}
                                            isLastUsed={i === indexOfLastUsed}
                                        />
                                    )) : (
                                        <div className="col-span-full text-center text-gray-400 p-8">
                                            <p>{t('generating_cards')}</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                           <CardCreator onSubmit={handleCustomCardSubmit} />
                        )}

                        <div className="mt-4 text-center min-h-[40px] flex items-center justify-center">
                            {error ? (
                                <p className="text-red-400 text-sm p-2 bg-red-500/10 rounded-md animate-fade-in w-full">{error}</p>
                            ) : selectedCard ? (
                                <p className="text-green-400 font-semibold animate-fade-in">{statusMessage}</p>
                            ) : (
                                <p className="text-gray-400">{t('must_select_card')}</p>
                            )}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="bg-gray-800/50 p-4 rounded-lg space-y-4">
                            <div className="text-center">
                                <p className="text-sm text-gray-400 font-semibold uppercase tracking-wider">{t('winning_pattern')}</p>
                                <div className="mt-2 flex justify-center">
                                    {lobbySettings.pattern ? <WinningPatternVisualizer pattern={lobbySettings.pattern as WinningPattern} size="normal" /> : <div className="w-20 h-20 bg-gray-700/50 rounded-md"></div>}
                                </div>
                            </div>
                            <div className="flex justify-around text-center pt-2 border-t border-gray-700/50">
                                <div>
                                    <p className="text-sm text-gray-400 font-semibold uppercase tracking-wider">{t('total_players')}</p>
                                    <p className="text-2xl font-bold font-roboto-mono text-white">{lobbySettings.totalPlayers ?? '?'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400 font-semibold uppercase tracking-wider">{t('prize_pool')}</p>
                                    <p className="text-2xl font-bold font-roboto-mono text-green-400">{lobbySettings.prize ? `$${lobbySettings.prize.toFixed(2)}` : '$?'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-800/50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-2"><UsersIcon className="w-6 h-6 text-amber-400" /> {t('players')} ({lobbyPlayers.length})</h3>
                            <ul className="space-y-1 max-h-40 overflow-y-auto pr-2">{lobbyPlayers.map(p => <li key={p.id} className={`p-2 rounded text-sm sm:text-base ${p.name === playerName ? 'bg-amber-500/20 text-amber-300' : 'bg-gray-700/50 text-white'}`}>{p.name}</li>)}</ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    if (step === 'GAME' && player) {
        const selfPlayerState = allPlayers.find(p => p.id === player.id);

        return (
            <div className="w-full h-full animate-fade-in">
                 <header className="mb-4 p-4 bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-2xl sm:text-3xl font-bold text-white font-inter">{t('lets_play_bingo')}</h1>
                        <p className="text-base text-gray-400 mt-1">{t('good_luck_player', { name: playerName, mode: lobbySettings.markingMode === 'MANUAL' ? t('manual') : t('automatic') })}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        {canCallBingo && <button onClick={handleBingoCall} className="px-6 py-3 sm:px-8 sm:py-4 font-bold text-xl sm:text-2xl text-gray-900 bg-green-500 rounded-lg animate-pulse hover:animate-none">BINGO!</button>}
                    </div>
                    {!canCallBingo && winner == null && <p className="text-lg text-gray-300 hidden md:block">{statusMessage}</p>}
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
                    <div className="lg:col-span-3 flex flex-col items-center justify-start">
                        {selfPlayerState ? (
                            <div className="w-full max-w-sm sm:max-w-md 2xl:max-w-lg 3xl:max-w-xl">
                                 <BingoCardComponent 
                                    player={selfPlayerState} 
                                    onToggleMark={handleManualMark}
                                    isInteractive={lobbySettings.markingMode === 'MANUAL' && !winner}
                                 />
                                 {lobbySettings.markingMode === 'MANUAL' && !winner &&
                                    <p className="text-center text-amber-300/80 text-sm mt-3 animate-fade-in">
                                        <b>{t('manual_mode')}:</b> {t('manual_mode_description')}
                                    </p>
                                 }
                            </div>
                        ) : (
                            <div className="aspect-square w-full max-w-md bg-gray-800 rounded-lg flex items-center justify-center text-white"><p>{t('waiting_for_card')}</p></div>
                        )}
                    </div>
                    
                    <div className="lg:col-span-1 flex flex-col gap-6">
                        <CalledNumbers calledNumbers={calledNumbers} currentNumber={currentNumber} />
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'POSTGAME' && winner && auditLog) return (
       <BingoModal 
            winner={winner} 
            auditLog={auditLog}
            onPlayAgain={handlePlayAgain}
            language={lobbySettings.language || 'en'}
            isSelfWinner={winner.id === player?.id}
       />
    );

    return <div className="text-lg text-gray-400">{statusMessage}</div>;
};

export default PlayerClient;
