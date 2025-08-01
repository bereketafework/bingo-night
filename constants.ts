import { WinningPattern } from './types';

export const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O'];

export const NUMBER_RANGES: { [key: string]: [number, number] } = {
  B: [1, 15],
  I: [16, 30],
  N: [31, 45],
  G: [46, 60],
  O: [61, 75],
};

export const WINNING_PATTERNS = [
    WinningPattern.ANY_LINE,
    WinningPattern.TWO_LINES,
    WinningPattern.X_PATTERN,
    WinningPattern.RECTANGLE,
    WinningPattern.FOUR_CORNERS,
    WinningPattern.FULL_HOUSE_75
];


export const WINNING_PATTERNS_CONFIG = {
  [WinningPattern.ANY_LINE]: {
    name: 'Any Line',
    description: 'Complete any horizontal, vertical, or diagonal line.',
  },
  [WinningPattern.TWO_LINES]: {
    name: 'Two Lines',
    description: 'Complete any two lines on the card.',
  },
  [WinningPattern.X_PATTERN]: {
    name: 'X Pattern',
    description: 'Complete the two diagonal lines forming an X.',
  },
  [WinningPattern.RECTANGLE]: {
    name: 'Rectangle',
    description: 'Mark all numbers on the outer border of the card.',
  },
  [WinningPattern.FOUR_CORNERS]: {
    name: 'Four Corners',
    description: 'Mark all four corner numbers on your card.',
  },
  [WinningPattern.FULL_HOUSE_75]: {
    name: 'Full House',
    description: 'Mark all 24 numbers on your card.',
  },
};

export const FAKE_PLAYER_NAMES = [
    "LuckyLou", "BingoMaster", "CardShark", "AceHigh", "JackpotJoe", "DauberDeb", "LadyLuck", "Winner_Win", "FullHouseFrank", "HighRoller"
];