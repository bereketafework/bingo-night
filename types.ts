export type BingoNumber = number | 'FREE';

export type BingoCard = BingoNumber[][];

export enum GameStatus {
  Waiting = 'WAITING', // Lobby phase
  Running = 'RUNNING',
  Paused = 'PAUSED',
  Over = 'OVER',
}

export enum WinningPattern {
  ANY_LINE = 'Any Line',
  TWO_LINES = 'Two Lines',
  X_PATTERN = 'X Pattern',
  RECTANGLE = 'Rectangle',
  FOUR_CORNERS = 'Four Corners',
  FULL_HOUSE_75 = 'Full House',
}

// Represents a card holder, which could be a local card (for the manager) or a remote player.
export interface Player {
    id: string; // For remote players, this is their PeerJS ID.
    name: string;
    isHuman: boolean; // Differentiates manager's cards from actual remote players.
    card: BingoCard;
    markedCells: boolean[][];
    isWinner: boolean;
    winningCells: [number, number][];
    isVisible: boolean; // Used by manager to hide/show cards in their UI.
    disconnected?: boolean;
}

export interface SelectedCard {
  card: BingoCard;
  id: string;
}

export type Language = 'en' | 'am';

export interface GameSettings {
  pattern: WinningPattern;
  speed: number;
  stake: number; // Stake per card
  prize: number; // Total prize
  selectedCards: SelectedCard[]; // Manager's own cards
  language: Language;
  callingMode: 'AUTOMATIC' | 'MANUAL';
  markingMode: 'AUTOMATIC' | 'MANUAL';
  totalPlayers?: number;
}

export interface AuditedPlayer {
  name: string;
  card: BingoCard;
  finalMarkedCells: boolean[][];
}

export interface GameAuditLog {
  gameId: string;
  startTime: string;
  managerId: string;
  managerName: string;
  settings: {
    pattern: string;
    stake: number;
    prize: number;
    numberOfPlayers: number;
    playerCardIds?: string[];
    language: Language;
  };
  players: AuditedPlayer[];
  calledNumbersSequence: number[];
  winner: {
    name: string;
    winningCard: BingoCard;
    winningCells: [number, number][];
    winningNumber: number;
  } | null;
}

export type UserRole = 'admin' | 'manager' | 'super_admin';

export interface User {
  id: string;
  name: string;
  password?: string; // Only used for creation, not stored in state
  role: UserRole;
}

export type FilterPeriod = '7d' | '30d' | 'all';

// --- Multiplayer Types ---

export interface ChatMessage {
    id: string;
    sender: string;
    text: string;
}

export type NetworkMessageType =
  | 'PLAYER_JOIN_REQUEST' // Player -> Host: Asks to join the lobby
  | 'WELCOME_PLAYER'      // Host -> Player: Confirms join, sends lobby state
  | 'PLAYER_LEFT'         // Host -> All: Notifies that a player has disconnected
  | 'LOBBY_UPDATE'        // Host -> All: Sends updated list of players
  | 'CONFIG_UPDATE'       // Host -> All: Sends updated game settings to lobby
  | 'CARD_SELECTION'      // Player -> Host: Player sends their chosen card
  | 'CARD_ACCEPTED'       // Host -> Player: Confirms card is unique
  | 'CARD_REJECTED_DUPLICATE' // Host -> Player: Notifies player their card is taken
  | 'GAME_START'          // Host -> All: Starts the game for everyone
  | 'NUMBER_CALL'         // Host -> All: Announces the next number
  | 'BINGO'               // Player -> Host: Player claims they have a bingo
  | 'WINNER_ANNOUNCED'    // Host -> All: Declares the winner and ends the game
  | 'ERROR';              // Host -> Player: e.g., game full, invalid ID

export interface NetworkMessage {
    type: NetworkMessageType;
    payload: any;
}