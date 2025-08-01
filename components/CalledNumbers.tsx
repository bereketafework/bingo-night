
import React, {useRef, useEffect} from 'react';
import { getBingoLetter } from '../services/gameLogic';

interface CalledNumbersProps {
  calledNumbers: number[];
  currentNumber: number | null;
}

const CalledNumbers: React.FC<CalledNumbersProps> = ({ calledNumbers, currentNumber }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [calledNumbers]);


  return (
    <div className="bg-gray-900/50 border border-gray-700/50 backdrop-blur-sm rounded-2xl shadow-lg p-4 flex flex-col h-[26rem] lg:h-full">
      <div className="flex-shrink-0 text-center mb-4">
        <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Current Number</p>
        <div className="mt-1 w-28 h-28 sm:w-32 sm:h-32 xl:w-40 xl:h-40 3xl:w-48 3xl:h-48 mx-auto bg-gray-900/50 rounded-full flex items-center justify-center border-4 border-amber-500/50 shadow-2xl shadow-amber-500/10">
          {currentNumber ? (
            <div className="text-center leading-none">
              <span className="text-2xl sm:text-3xl xl:text-4xl 3xl:text-5xl font-bold text-amber-400">{getBingoLetter(currentNumber)}</span>
              <div className="font-roboto-mono font-bold text-white text-4xl sm:text-5xl xl:text-6xl 3xl:text-7xl">{currentNumber}</div>
            </div>
          ) : (
            <span className="text-4xl font-bold text-gray-600">-</span>
          )}
        </div>
      </div>
      
      <div className="flex-grow overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-b from-gray-900/50 to-transparent z-10"></div>
        <div ref={scrollContainerRef} className="absolute inset-0 overflow-y-auto pt-2 pb-2 pr-2">
          <div className="grid grid-cols-5 gap-2 lg:gap-3 text-center">
            {calledNumbers.map(num => (
              <div key={num} className={`aspect-square flex items-center justify-center rounded-full text-sm lg:text-base 3xl:text-lg font-roboto-mono font-bold transition-all duration-300 ${num === currentNumber ? 'bg-amber-400 text-black animate-pulse ring-2 ring-white' : 'bg-gray-700/80 text-gray-300'}`}>
                {num}
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-4 bg-gradient-to-t from-gray-900/50 to-transparent z-10"></div>
      </div>
    </div>
  );
};

export default CalledNumbers;