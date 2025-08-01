
import React from 'react';
import { GameAuditLog, Player } from '../types';
import BingoCard from './BingoCard';

interface AuditTrailViewProps {
  auditLog: GameAuditLog;
}

const AuditTrailView: React.FC<AuditTrailViewProps> = ({ auditLog }) => {
  return (
    <div className="bg-gray-950/70 p-4 rounded-lg border border-gray-700 max-h-[70vh] overflow-y-auto space-y-6">
      
      {/* Header */}
      <div>
        <h4 className="text-xl lg:text-2xl font-bold text-amber-400 mb-2 font-inter">Game Audit Trail</h4>
        <div className="text-xs lg:text-sm text-gray-400 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2">
            <p><span className="font-bold text-gray-300">Game ID:</span> {auditLog.gameId}</p>
            <p><span className="font-bold text-gray-300">Start Time:</span> {new Date(auditLog.startTime).toLocaleString()}</p>
            <p><span className="font-bold text-gray-300">Pattern:</span> {auditLog.settings.pattern}</p>
            <p><span className="font-bold text-gray-300">Cards Played:</span> {auditLog.settings.numberOfPlayers}</p>
            {auditLog.settings.playerCardIds && auditLog.settings.playerCardIds.length > 0 && (
              <p className="col-span-full"><span className="font-bold text-gray-300">Player Card IDs:</span> {auditLog.settings.playerCardIds.join(', ')}</p>
            )}
        </div>
      </div>

      {/* Called Numbers */}
      <div>
        <h5 className="text-lg lg:text-xl font-semibold text-amber-400 mb-2 font-inter">Called Numbers Sequence ({auditLog.calledNumbersSequence.length} total)</h5>
        <div className="flex flex-wrap gap-2 p-2 bg-gray-900 rounded-md">
            {auditLog.calledNumbersSequence.map((num, index) => (
                <div 
                    key={`${num}-${index}`} 
                    className={`w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-full text-xs lg:text-sm font-roboto-mono font-bold transition-all duration-300 ${
                        auditLog.winner?.winningNumber === num ? 'bg-green-500 text-white ring-2 ring-white' : 'bg-gray-700/80 text-gray-300'
                    }`}
                    title={`Call #${index + 1}`}
                >
                    {num}
                </div>
            ))}
        </div>
      </div>

      {/* Player Cards */}
      <div>
        <h5 className="text-lg lg:text-xl font-semibold text-amber-400 mb-2 font-inter">Player Cards</h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {auditLog.players.map(auditedPlayer => {
                const isWinner = auditLog.winner?.name === auditedPlayer.name;
                const dummyPlayer: Player = {
                    id: `audit-${auditedPlayer.name}`,
                    name: auditedPlayer.name,
                    card: auditedPlayer.card,
                    markedCells: auditedPlayer.finalMarkedCells,
                    winningCells: isWinner ? auditLog.winner!.winningCells : [],
                    isHuman: false,
                    isWinner: isWinner,
                    isVisible: true,
                };
                return (
                    <div key={dummyPlayer.id} className={`${isWinner ? 'ring-2 ring-amber-400 rounded-2xl' : ''}`}>
                       <BingoCard player={dummyPlayer} onToggleMark={() => {}} />
                    </div>
                )
            })}
        </div>
      </div>
    </div>
  );
};

export default AuditTrailView;