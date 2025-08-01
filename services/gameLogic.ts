
import { BingoCard, BingoNumber, WinningPattern, Language } from '../types';
import { NUMBER_RANGES, BINGO_LETTERS } from '../constants';

const shuffleArray = <T,>(array: T[]): T[] => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const generateColumnNumbers = (range: [number, number], count: number): number[] => {
  const fullRange = Array.from({ length: range[1] - range[0] + 1 }, (_, i) => range[0] + i);
  return shuffleArray(fullRange).slice(0, count);
};

export const generateBingoCard = (): BingoCard => {
  const card: BingoCard = Array(5).fill(0).map(() => Array(5).fill(0));
  const columns = ['B', 'I', 'N', 'G', 'O'];

  columns.forEach((col, colIndex) => {
    const range = NUMBER_RANGES[col];
    const isNColumn = colIndex === 2;
    const numbers = generateColumnNumbers(range, isNColumn ? 4 : 5);

    for (let rowIndex = 0; rowIndex < 5; rowIndex++) {
      if (isNColumn && rowIndex === 2) {
        card[rowIndex][colIndex] = 'FREE';
      } else {
        card[rowIndex][colIndex] = numbers.pop()!;
      }
    }
  });

  return card;
};

export const getBingoLetter = (num: number): string => {
  if (!num) return '';
  for (const letter of BINGO_LETTERS) {
    const [min, max] = NUMBER_RANGES[letter];
    if (num >= min && num <= max) {
      return letter;
    }
  }
  return '';
};

export const checkWin = (
  markedCells: boolean[][],
  pattern: WinningPattern
): { win: boolean; winningCells: [number, number][] } => {
  const isMarked = (row: number, col: number) => markedCells[row]?.[col] ?? false;
  const size = 5;

  switch (pattern) {
    case WinningPattern.ANY_LINE:
      // Horizontal
      for (let r = 0; r < size; r++) {
        if (Array.from({ length: size }, (_, c) => isMarked(r, c)).every(Boolean)) {
          return { win: true, winningCells: Array.from({ length: size }, (_, c) => [r, c]) };
        }
      }
      // Vertical
      for (let c = 0; c < size; c++) {
        if (Array.from({ length: size }, (_, r) => isMarked(r, c)).every(Boolean)) {
          return { win: true, winningCells: Array.from({ length: size }, (_, r) => [r, c]) };
        }
      }
      // Diagonal (top-left to bottom-right)
      if (Array.from({ length: size }, (_, i) => isMarked(i, i)).every(Boolean)) {
        return { win: true, winningCells: Array.from({ length: size }, (_, i) => [i, i]) };
      }
      // Diagonal (top-right to bottom-left)
      if (Array.from({ length: size }, (_, i) => isMarked(i, size - 1 - i)).every(Boolean)) {
        return { win: true, winningCells: Array.from({ length: size }, (_, i) => [i, size - 1 - i]) };
      }
      break;

    case WinningPattern.TWO_LINES: {
      let linesFound = 0;
      const allWinningCells: [number, number][] = [];
      // Horizontal
      for (let r = 0; r < size; r++) {
        if (Array.from({ length: size }, (_, c) => isMarked(r, c)).every(Boolean)) {
          linesFound++;
          allWinningCells.push(...Array.from({ length: size }, (_, c) => [r, c] as [number, number]));
        }
      }
      // Vertical
      for (let c = 0; c < size; c++) {
        if (Array.from({ length: size }, (_, r) => isMarked(r, c)).every(Boolean)) {
          linesFound++;
          allWinningCells.push(...Array.from({ length: size }, (_, r) => [r, c] as [number, number]));
        }
      }
      // Diagonal (top-left to bottom-right)
      if (Array.from({ length: size }, (_, i) => isMarked(i, i)).every(Boolean)) {
        linesFound++;
        allWinningCells.push(...Array.from({ length: size }, (_, i) => [i, i] as [number, number]));
      }
      // Diagonal (top-right to bottom-left)
      if (Array.from({ length: size }, (_, i) => isMarked(i, size - 1 - i)).every(Boolean)) {
        linesFound++;
        allWinningCells.push(...Array.from({ length: size }, (_, i) => [i, size - 1 - i] as [number, number]));
      }
      if (linesFound >= 2) {
        const uniqueCells = [...new Set(allWinningCells.map(cell => JSON.stringify(cell)))].map(s => JSON.parse(s));
        return { win: true, winningCells: uniqueCells };
      }
      break;
    }

    case WinningPattern.X_PATTERN: {
        const xCells: [number, number][] = [];
        let xComplete = true;
        for (let i = 0; i < size; i++) {
            if (!isMarked(i, i)) xComplete = false;
            xCells.push([i, i]);
            if (!isMarked(i, size - 1 - i)) xComplete = false;
            xCells.push([i, size - 1 - i]);
        }
        if (xComplete) {
            const uniqueXCells = [...new Set(xCells.map(cell => JSON.stringify(cell)))].map(s => JSON.parse(s));
            return { win: true, winningCells: uniqueXCells };
        }
        break;
    }
    
    case WinningPattern.RECTANGLE: {
        const frameCells: [number, number][] = [];
        let isFrameComplete = true;
        for (let i = 0; i < size; i++) {
            // Top and bottom rows
            if (!isMarked(0, i)) isFrameComplete = false;
            frameCells.push([0, i]);
            if (!isMarked(size - 1, i)) isFrameComplete = false;
            frameCells.push([size - 1, i]);

            // Left and right columns (excluding corners)
            if (i > 0 && i < size - 1) {
                if (!isMarked(i, 0)) isFrameComplete = false;
                frameCells.push([i, 0]);
                if (!isMarked(i, size - 1)) isFrameComplete = false;
                frameCells.push([i, size - 1]);
            }
        }
        if (isFrameComplete) {
            const uniqueFrameCells = [...new Set(frameCells.map(cell => JSON.stringify(cell)))].map(s => JSON.parse(s));
            return { win: true, winningCells: uniqueFrameCells };
        }
        break;
    }

    case WinningPattern.FOUR_CORNERS:
      const corners: [number, number][] = [[0, 0], [0, size - 1], [size - 1, 0], [size - 1, size - 1]];
      if (corners.every(([r, c]) => isMarked(r, c))) {
        return { win: true, winningCells: corners };
      }
      break;

    case WinningPattern.FULL_HOUSE_75:
      const allCells: [number, number][] = [];
      let allMarked = true;
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          allCells.push([r, c]);
          if (!isMarked(r, c)) {
            allMarked = false;
          }
        }
      }
      if (allMarked) {
        return { win: true, winningCells: allCells };
      }
      break;
  }

  return { win: false, winningCells: [] };
};

// --- AUDIO SERVICE ---

let voices: SpeechSynthesisVoice[] = [];
let resumeInterval: number | undefined;

/**
 * Starts a keep-alive interval to work around a Chrome bug where speech synthesis
 * can stop working after a period of inactivity.
 */
const startResumeInterval = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && !resumeInterval) {
        resumeInterval = window.setInterval(() => {
            if (window.speechSynthesis.paused) {
                window.speechSynthesis.resume();
            }
        }, 14000); // Ping every 14 seconds
    }
};

/**
 * Gets the list of available SpeechSynthesis voices.
 * Handles the asynchronous nature of voice loading in browsers.
 */
const getVoices = (): Promise<SpeechSynthesisVoice[]> => {
    return new Promise((resolve) => {
        const voiceList = window.speechSynthesis.getVoices();
        if (voiceList.length > 0) {
            voices = voiceList;
            resolve(voiceList);
            return;
        }
        window.speechSynthesis.onvoiceschanged = () => {
            voices = window.speechSynthesis.getVoices();
            resolve(voices);
            window.speechSynthesis.onvoiceschanged = null; // Clean up listener
        };
    });
};

// Pre-fetch voices and start keep-alive when the module loads.
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    getVoices();
    startResumeInterval();
}

/**
 * Finds the best matching voice for a given language.
 * @param lang The desired language ('en' or 'am').
 * @returns A matching SpeechSynthesisVoice or null.
 */
const findVoice = (lang: Language): SpeechSynthesisVoice | null => {
    if (voices.length === 0) return null;
    
    const langCode = lang === 'am' ? 'am-ET' : 'en-US';
    const langPrefix = lang === 'am' ? 'am' : 'en';

    if (lang === 'am') {
        const amharicVoices = voices.filter(v => v.lang.startsWith('am') || v.name.toLowerCase().includes('amharic'));
        const maleVoice = amharicVoices.find(v => v.name.toLowerCase().includes('male'));
        if (maleVoice) return maleVoice;
    }

    let voice = voices.find(v => v.lang === langCode);
    if (voice) return voice;
    
    voice = voices.find(v => v.lang.startsWith(langPrefix));
    if (voice) return voice;

    if (lang === 'am') {
        voice = voices.find(v => v.name.toLowerCase().includes('amharic'));
        if (voice) return voice;
    }
    
    if(lang === 'en'){
        voice = voices.find(v => v.lang.startsWith('en') && v.default);
        if(voice) return voice;
    }

    return null;
};

const amharicNumbers: { [key: number]: string } = {
    1: 'አንድ', 2: 'ሁለት', 3: 'ሶስት', 4: 'አራት', 5: 'አምስት', 6: 'ስድስት', 7: 'ሰባት', 8: 'ስምንት', 9: 'ዘጠኝ', 10: 'አስር',
    11: 'አስራ አንድ', 12: 'አስራ ሁለት', 13: 'አስራ ሶስት', 14: 'አስራ አራት', 15: 'አስራ አምስት', 16: 'አስራ ስድስት', 17: 'አስራ ሰባት', 18: 'አስራ ስምንት', 19: 'አስራ ዘጠኝ', 20: 'ሃያ',
    21: 'ሃያ አንድ', 22: 'ሃያ ሁለት', 23: 'ሃያ ሶስት', 24: 'ሃያ አራት', 25: 'ሃያ አምስት', 26: 'ሃያ ስድስት', 27: 'ሃያ ሰባት', 28: 'ሃያ ስምንት', 29: 'ሃያ ዘጠኝ', 30: 'ሰላሳ',
    31: 'ሰላሳ አንድ', 32: 'ሰላሳ ሁለት', 33: 'ሰላሳ ሶስት', 34: 'ሰላሳ አራት', 35: 'ሰላሳ አምስት', 36: 'ሰላሳ ስድስት', 37: 'ሰላሳ ሰባት', 38: 'ሰላሳ ስምንት', 39: 'ሰላሳ ዘጠኝ', 40: 'አርባ',
    41: 'አርባ አንድ', 42: 'አርባ ሁለት', 43: 'አርባ ሶስት', 44: 'አርባ አራት', 45: 'አርባ አምስት', 46: 'አርባ ስድስት', 47: 'አርባ ሰባት', 48: 'አርባ ስምንት', 49: 'አርባ ዘጠኝ', 50: 'ሃምሳ',
    51: 'ሃምሳ አንድ', 52: 'ሃምሳ ሁለት', 53: 'ሃምሳ ሶስት', 54: 'ሃምሳ አራት', 55: 'ሃምሳ አምስት', 56: 'ሃምሳ ስድስት', 57: 'ሃምሳ ሰባት', 58: 'ሃምሳ ስምንት', 59: 'ሃምሳ ዘጠኝ', 60: 'ስልሳ',
    61: 'ስልሳ አንድ', 62: 'ስልሳ ሁለት', 63: 'ስልሳ ሶስት', 64: 'ስልሳ አራት', 65: 'ስልሳ አምስት', 66: 'ስልሳ ስድስት', 67: 'ስልሳ ሰባት', 68: 'ስልሳ ስምንት', 69: 'ስልሳ ዘጠኝ', 70: 'ሰባ',
    71: 'ሰባ አንድ', 72: 'ሰባ ሁለት', 73: 'ሰባ ሶስት', 74: 'ሰባ አራት', 75: 'ሰባ አምስት'
};

const getAmharicNumberWithLetter = (num: number): string => {
    const letter = getBingoLetter(num);
    const numberName = amharicNumbers[num] || String(num);
    return `${letter}. ${numberName}`;
};

export const speakText = async (text: string, lang: Language) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    if (voices.length === 0) {
        await getVoices();
    }
    
    cancelSpeech();
    const utterance = new SpeechSynthesisUtterance(text);

    if (lang === 'am') {
        utterance.lang = 'am-ET';
    } else {
        utterance.lang = 'en-US';
    }

    const selectedVoice = findVoice(lang);
    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }

    utterance.volume = 1;
    utterance.rate = 0.9;
    
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    
    window.speechSynthesis.speak(utterance);
};

export const speak = async (num: number, lang: Language) => {
    const textToSpeak = lang === 'am' ? getAmharicNumberWithLetter(num) : `${getBingoLetter(num)}. ${num}`;
    await speakText(textToSpeak, lang);
};

export const cancelSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
};
