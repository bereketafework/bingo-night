
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import GameSetup from './GameSetup';
import GameScreen from './GameScreen';
import AuditScreen from './AuditScreen';
import { GameSettings, User, Player, NetworkMessage, Language, WinningPattern, GameStatus, GameAuditLog } from '../types';
import Peer, { DataConnection } from 'peerjs';
import { WINNING_PATTERNS } from '../constants';
import { checkWin, speak, cancelSpeech, areCardsIdentical } from '../services/gameLogic';
import { saveGameLog } from '../services/db';
import { useLanguage } from '../contexts/LanguageContext';

type ManagerScreen = 'setup' | 'game' | 'audit';

interface ManagerViewProps {
    manager: User;
    onLogout: () => void;
}

const ManagerView: React.FC<ManagerViewProps> = ({ manager, onLogout }) => {
  const [screen, setScreen] = useState<ManagerScreen>('setup');
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
  const [gameResetKey, setGameResetKey] = useState(0);

  // Multiplayer State
  const [peer, setPeer] = useState<Peer | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [isHosting, setIsHosting] = useState(false);
  const connections = useRef<DataConnection[]>([]);
  const bingoHandler = useRef<((playerId: string) => void) | null>(null);

  // Game State (lifted from GameScreen)
  const [status, setStatus] = useState<GameStatus>(GameStatus.Waiting);
  const [players, setPlayers] = useState<Player[]>([]);
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [winner, setWinner] = useState<Player | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [auditLog, setAuditLog] = useState<GameAuditLog | null>(null);

  const statusRef = useRef(status);
  const { t } = useLanguage();
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const [lobbyConfig, setLobbyConfig] = useState<{
    pattern: WinningPattern;
    speed: number;
    stake: number;
    language: Language;
    prize: number;
    totalPlayers: number;
    callingMode: 'AUTOMATIC' | 'MANUAL';
    markingMode: 'AUTOMATIC' | 'MANUAL';
  }>({
    pattern: WINNING_PATTERNS[0],
    speed: 3000,
    stake: 5,
    language: 'en',
    prize: 0,
    totalPlayers: 0,
    callingMode: 'AUTOMATIC',
    markingMode: 'AUTOMATIC',
  });

  const availableNumbers = useMemo(() => {
    const all = Array.from({ length: 75 }, (_, i) => i + 1);
    const calledSet = new Set(calledNumbers);
    return all.filter(n => !calledSet.has(n));
  }, [calledNumbers]);

  const broadcast = useCallback((message: NetworkMessage) => {
    connections.current.forEach(conn => conn.send(message));
  }, []);

  // Broadcast player list changes during a game
  useEffect(() => {
    if (screen === 'game') {
        broadcast({ type: 'LOBBY_UPDATE', payload: { players } });
    }
  }, [players, screen, broadcast]);

  // Broadcast lobby config changes to players in the lobby
  useEffect(() => {
    if (isHosting && status === GameStatus.Waiting) {
        broadcast({ type: 'CONFIG_UPDATE', payload: { settings: lobbyConfig } });
    }
  }, [lobbyConfig, isHosting, status, broadcast]);


  useEffect(() => {
    return () => { // Cleanup on component unmount
      peer?.destroy();
    };
  }, [peer]);

  const handleNewConnection = useCallback((conn: DataConnection) => {
    const isLobbyOpen = status === GameStatus.Waiting;
    if (!isLobbyOpen) {
      console.log(`Rejecting connection from ${conn.peer} because game is not in WAITING state. Current state: ${status}`);
      conn.on('open', () => { // Wait for connection to be open before sending a message and closing
          conn.send({ type: 'ERROR', payload: { message: 'Game has already started or is over. Cannot join.' } });
          setTimeout(() => conn.close(), 500); // Give time for message to be sent
      });
      return;
    }

    connections.current.push(conn);
    console.log(`New connection from ${conn.peer}`);

    conn.on('data', (data: any) => {
      const message = data as NetworkMessage;
      switch (message.type) {
        case 'PLAYER_JOIN_REQUEST': {
          const newPlayer: Player = {
            id: conn.peer,
            name: message.payload.name,
            card: [], isHuman: false, isVisible: true, isWinner: false,
            markedCells: Array(5).fill(0).map(() => Array(5).fill(false)),
            winningCells: [],
          };
          setPlayers(prev => [...prev, newPlayer]);
          
          const lobbyState = {
            players: [...players, newPlayer].map(p => ({id: p.id, name: p.name})),
            settings: lobbyConfig
          };

          conn.send({ type: 'WELCOME_PLAYER', payload: lobbyState });
          broadcast({ type: 'LOBBY_UPDATE', payload: { players: lobbyState.players } });
          break;
        }
        case 'CARD_SELECTION': {
            const newCard = message.payload.card;
            const isDuplicate = players.some(p => 
                p.id !== conn.peer && 
                p.card && p.card.length > 0 &&
                areCardsIdentical(p.card, newCard)
            );

            if (isDuplicate) {
                conn.send({
                    type: 'CARD_REJECTED_DUPLICATE',
                    payload: { message: 'This card is already in use. Please select or create a different one.' }
                });
            } else {
                setPlayers(prev => prev.map(p => 
                    p.id === conn.peer 
                    ? { ...p, card: newCard, markedCells: message.payload.markedCells } 
                    : p
                ));
                conn.send({ type: 'CARD_ACCEPTED', payload: {} });
            }
            break;
        }
        case 'BINGO': {
          if (bingoHandler.current) {
            bingoHandler.current(conn.peer);
          }
          break;
        }
      }
    });

    conn.on('close', () => {
      console.log(`Connection closed from ${conn.peer}`);
      connections.current = connections.current.filter(c => c.peer !== conn.peer);
      
      const latestStatus = statusRef.current;
      if (latestStatus === GameStatus.Running || latestStatus === GameStatus.Paused) {
        // In-game: Mark player as disconnected
        setPlayers(prev => prev.map(p => p.id === conn.peer ? { ...p, disconnected: true } : p));
      } else {
        // In lobby: Remove player
        const remainingPlayers = players.filter(p => p.id !== conn.peer);
        setPlayers(remainingPlayers);
        broadcast({ type: 'LOBBY_UPDATE', payload: { players: remainingPlayers.map(p => ({id: p.id, name: p.name})) } });
      }
    });
  }, [players, lobbyConfig, broadcast, status]);

  const handleHostGame = () => {
    const newGameId = Math.floor(1000 + Math.random() * 9000).toString();
    const newPeer = new Peer(newGameId, {
        debug: 2,
        config: {
            'iceServers': [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                // Adding a TURN server as a fallback for difficult NATs
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
    setPeer(newPeer);
    
    newPeer.on('open', (id) => {
      console.log('PeerJS host is open. ID:', id);
      setGameId(id);
      setIsHosting(true);
    });

    newPeer.on('connection', handleNewConnection);

    newPeer.on('error', (err: any) => {
      console.error("PeerJS error:", err);
      if (err.type === 'unavailable-id') {
         alert(`Game ID ${newGameId} is already in use. Please try hosting again.`);
      } else {
         alert(`An error occurred with the connection: ${err.message}. Please refresh and try again.`);
      }
      setIsHosting(false);
    });
  };

  // --- Game Logic functions (lifted from GameScreen) ---

  const setWinnerAndEndGame = useCallback(async (winningPlayer: Player, winningCells: [number, number][]) => {
      if (winner) return; // Prevent multiple winners
      
      setStatus(GameStatus.Over);
      
      const calledNumbersSet = new Set(calledNumbers);
  
      // Create the authoritative final state for all players based on all called numbers.
      // This ensures the audit log and UI are correct, regardless of mode.
      const finalPlayersState = players.map(p => {
          if (p.disconnected) return p;
  
          const finalMarkedCells = Array.from({ length: 5 }, () => Array(5).fill(false));
          p.card.forEach((row, rIdx) => {
              row.forEach((cell, cIdx) => {
                  if (cell === 'FREE' || (typeof cell === 'number' && calledNumbersSet.has(cell))) {
                      finalMarkedCells[rIdx][cIdx] = true;
                  }
              });
          });
  
          if (p.id === winningPlayer.id) {
              return { ...p, markedCells: finalMarkedCells, isWinner: true, winningCells };
          }
          return { ...p, markedCells: finalMarkedCells };
      });
  
      const finalWinner = finalPlayersState.find(p => p.id === winningPlayer.id)!;
      
      setPlayers(finalPlayersState);
      setWinner(finalWinner);
      
      const currentAuditLog = auditLog;
      if (currentAuditLog && gameSettings) {
        const finalLog: GameAuditLog = {
          ...currentAuditLog,
          players: finalPlayersState.map(p => ({
            name: p.name,
            card: p.card,
            finalMarkedCells: p.markedCells,
          })),
          winner: {
              name: finalWinner.name,
              winningCard: finalWinner.card,
              winningCells: finalWinner.winningCells,
              winningNumber: currentNumber!
          }
        };
        setAuditLog(finalLog); // Update UI state
        await saveGameLog(finalLog); // Save to backend
        broadcast({ type: 'WINNER_ANNOUNCED', payload: { winner: finalWinner, prize: gameSettings.prize, auditLog: finalLog } });
      }
  }, [winner, players, gameSettings, currentNumber, broadcast, auditLog, calledNumbers]);


  const callNextNumber = useCallback(async () => {
      if(availableNumbers.length === 0 || winner) {
          setStatus(GameStatus.Over);
          return;
      }
      const randomIndex = Math.floor(Math.random() * availableNumbers.length);
      const nextNumber = availableNumbers[randomIndex];
      
      setCurrentNumber(nextNumber);
      const newCalledNumbers = [...calledNumbers, nextNumber];
      setCalledNumbers(newCalledNumbers);
      setAuditLog(prev => prev ? {...prev, calledNumbersSequence: [...prev.calledNumbersSequence, nextNumber]} : null);

      broadcast({ type: 'NUMBER_CALL', payload: { number: nextNumber, calledNumbers: newCalledNumbers }});

      if (!isMuted && gameSettings) {
        await speak(nextNumber, gameSettings.language);
      }
      
      if (gameSettings?.markingMode === 'AUTOMATIC') {
          const updatedPlayers = players.map(player => {
              if (player.disconnected) return player;
  
              const newMarked = player.markedCells.map(r => [...r]);
              let changed = false;
              player.card.forEach((row, rIdx) => {
                  row.forEach((cell, cIdx) => {
                      if (cell === nextNumber && !newMarked[rIdx][cIdx]) {
                          newMarked[rIdx][cIdx] = true;
                          changed = true;
                      }
                  });
              });
              return changed ? { ...player, markedCells: newMarked } : player;
          });
          setPlayers(updatedPlayers);
  
          // Host-side win checking after number call in AUTOMATIC marking mode only.
          for (const player of updatedPlayers) {
              if (player.disconnected) continue;
              const { win, winningCells } = checkWin(player.markedCells, gameSettings!.pattern);
              if (win) {
                  setWinnerAndEndGame(player, winningCells);
                  break; 
              }
          }
      }
  }, [availableNumbers, isMuted, gameSettings, broadcast, calledNumbers, players, winner, setWinnerAndEndGame]);
  
  const callNextNumberRef = useRef(callNextNumber);
  callNextNumberRef.current = callNextNumber;

  // Game Loop
  useEffect(() => {
    if (status !== GameStatus.Running) {
        cancelSpeech();
        return;
    };
    if (!gameSettings || gameSettings.callingMode !== 'AUTOMATIC') return;
    const gameInterval = setInterval(() => callNextNumberRef.current(), gameSettings.speed);
    return () => clearInterval(gameInterval);
  }, [status, gameSettings]);
  
  // Setup Bingo call listener
  useEffect(() => {
    bingoHandler.current = (playerId: string) => {
        if (winner) return; // Game already won
        const bingoingPlayer = players.find(p => p.id === playerId);
        if (bingoingPlayer && gameSettings) {
            
            let winResult: { win: boolean; winningCells: [number, number][] };
            
            if (gameSettings.markingMode === 'MANUAL') {
                // On-demand validation for manual mode: check card against all called numbers.
                const calledNumbersSet = new Set(calledNumbers);
                const tempMarkedCells = Array.from({ length: 5 }, () => Array(5).fill(false));
                
                bingoingPlayer.card.forEach((row, rIdx) => {
                    row.forEach((cell, cIdx) => {
                        if (cell === 'FREE' || (typeof cell === 'number' && calledNumbersSet.has(cell))) {
                            tempMarkedCells[rIdx][cIdx] = true;
                        }
                    });
                });
                winResult = checkWin(tempMarkedCells, gameSettings.pattern);
  
            } else { // Automatic mode
                // Use host-maintained marks for automatic mode.
                winResult = checkWin(bingoingPlayer.markedCells, gameSettings.pattern);
            }
  
            if (winResult.win) {
                setWinnerAndEndGame(bingoingPlayer, winResult.winningCells);
            }
        }
    };
  }, [winner, players, gameSettings, setWinnerAndEndGame, calledNumbers]);


  const handleGameStart = (settings: GameSettings, finalRemotePlayers: Player[]) => {
    const managerCards: Player[] = settings.selectedCards.map((sc, i) => ({
      id: sc.id, name: `${manager.name}'s ${t('card')} #${i + 1}`, isHuman: true, card: sc.card,
      isVisible: true, isWinner: false, markedCells: Array(5).fill(0).map(() => Array(5).fill(false)),
      winningCells: []
    }));
    
    const allInitialPlayers = [...managerCards, ...finalRemotePlayers];
    allInitialPlayers.forEach(p => p.markedCells[2][2] = true); // Mark free spaces

    const finalSettings = { ...settings, totalPlayers: allInitialPlayers.length };
    setGameSettings(finalSettings);
    setPlayers(allInitialPlayers);
    setStatus(GameStatus.Waiting);
    setCalledNumbers([]);
    setCurrentNumber(null);
    setWinner(null);

    setAuditLog({
        gameId: `BINGO-${Date.now()}`, startTime: new Date().toISOString(),
        managerId: manager.id, managerName: manager.name,
        settings: {
            pattern: finalSettings.pattern, stake: finalSettings.stake, prize: finalSettings.prize,
            numberOfPlayers: allInitialPlayers.length, language: finalSettings.language,
        },
        players: allInitialPlayers.map(p => ({ name: p.name, card: p.card, finalMarkedCells: p.markedCells })),
        calledNumbersSequence: [], winner: null
    });
    
    broadcast({ type: 'GAME_START', payload: { settings: finalSettings, players: allInitialPlayers } });
    setScreen('game');
  };

  const handlePlayAgain = () => {
    peer?.destroy();
    setPeer(null);
    setGameId(null);
    setIsHosting(false);
    connections.current = [];
    setPlayers([]);
    setGameSettings(null);
    setGameResetKey(prevKey => prevKey + 1);
    setStatus(GameStatus.Waiting);
    setScreen('setup');
    setCalledNumbers([]);
  };

  const handleGameAction = () => {
    if (status === GameStatus.Over) {
        handlePlayAgain();
        return;
    }

    if (gameSettings?.callingMode === 'MANUAL') {
        if (status === GameStatus.Waiting || status === GameStatus.Paused) {
            setStatus(GameStatus.Running);
            if (calledNumbers.length === 0) {
                return;
            }
        }
        callNextNumber();
    } else { // Automatic mode
        if (status === GameStatus.Running) {
            setStatus(GameStatus.Paused);
        } else if (status === GameStatus.Waiting || status === GameStatus.Paused) {
            setStatus(GameStatus.Running);
        }
    }
  };

  const handleToggleMark = (playerId: string, row: number, col: number) => {
    const player = players.find(p => p.id === playerId);
    if (!player || !player.isHuman || status !== GameStatus.Running || winner) return;
    if (gameSettings?.markingMode !== 'MANUAL') return;

    const cellValue = player.card[row][col];
    const calledSet = new Set(calledNumbers);
    if (typeof cellValue === 'number' && calledSet.has(cellValue)) {
      setPlayers(prevPlayers => prevPlayers.map(p => {
        if (p.id === playerId) {
            const newMarked = p.markedCells.map(r => [...r]);
            newMarked[row][col] = !newMarked[row][col];
            return { ...p, markedCells: newMarked };
        }
        return p;
      }));
    }
  };

  const handleManagerBingoCheck = useCallback(() => {
    if (winner || !gameSettings || gameSettings.markingMode !== 'MANUAL') return;

    const managerPlayers = players.filter(p => p.isHuman && !p.disconnected);
    const calledNumbersSet = new Set(calledNumbers);

    for (const player of managerPlayers) {
        const tempMarkedCells = Array.from({ length: 5 }, () => Array(5).fill(false));
        player.card.forEach((row, rIdx) => {
            row.forEach((cell, cIdx) => {
                if (cell === 'FREE' || (typeof cell === 'number' && calledNumbersSet.has(cell))) {
                    tempMarkedCells[rIdx][cIdx] = true;
                }
            });
        });
        
        const winResult = checkWin(tempMarkedCells, gameSettings.pattern);

        if (winResult.win) {
            setWinnerAndEndGame(player, winResult.winningCells);
            break; 
        }
    }
  }, [players, calledNumbers, gameSettings, winner, setWinnerAndEndGame]);


  const handleToggleCardVisibility = (playerId: string) => {
    setPlayers(prevPlayers =>
        prevPlayers.map(p =>
            p.id === playerId ? { ...p, isVisible: !p.isVisible } : p
        )
    );
  };

  const handleViewAudit = () => setScreen('audit');
  const handleBackToSetup = () => setScreen('setup');

  switch (screen) {
    case 'setup':
      return <GameSetup 
                key={gameResetKey} 
                onStartGame={handleGameStart} 
                manager={manager} 
                onLogout={onLogout} 
                onViewAudit={handleViewAudit} 
                isHosting={isHosting}
                onHostGame={handleHostGame}
                gameId={gameId}
                remotePlayers={players}
                lobbyConfig={lobbyConfig}
                onConfigChange={setLobbyConfig}
              />;
    case 'game':
      if (gameSettings) {
        return <GameScreen 
                  settings={gameSettings}
                  players={players}
                  manager={manager} 
                  onPlayAgain={handlePlayAgain}
                  status={status}
                  winner={winner}
                  auditLog={auditLog}
                  calledNumbers={calledNumbers}
                  currentNumber={currentNumber}
                  isMuted={isMuted}
                  onGameAction={handleGameAction}
                  onToggleMute={() => setIsMuted(p => !p)}
                  onToggleCardVisibility={handleToggleCardVisibility}
                  onToggleMark={handleToggleMark}
                  onManagerBingoCheck={handleManagerBingoCheck}
                  isManualMarking={gameSettings.markingMode === 'MANUAL'}
                />;
      }
      setScreen('setup'); // Fallback
      return null; 
    case 'audit':
      return <AuditScreen onBack={handleBackToSetup} />;
    default:
      return <GameSetup key={gameResetKey} onStartGame={handleGameStart} manager={manager} onLogout={onLogout} onViewAudit={handleViewAudit} isHosting={isHosting} onHostGame={handleHostGame} gameId={gameId} remotePlayers={players} lobbyConfig={lobbyConfig} onConfigChange={setLobbyConfig} />;
  }
};

export default ManagerView;
