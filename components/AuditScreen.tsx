

import React, { useState, useEffect } from 'react';
import { GameAuditLog } from '../types';
import AuditTrailView from './AuditTrailView';
import { BackArrowIcon, CloseIcon, UserCircleIcon } from './icons';
import { getGameLogs } from '../services/db';

interface AuditScreenProps {
  onBack: () => void;
}

const AuditScreen: React.FC<AuditScreenProps> = ({ onBack }) => {
  const [logs, setLogs] = useState<GameAuditLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<GameAuditLog | null>(null);

  useEffect(() => {
    const loadLogs = async () => {
        const storedLogs = await getGameLogs();
        // The service now sorts by date, but we can re-sort just in case.
        storedLogs.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
        setLogs(storedLogs);
    };
    loadLogs();
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8 bg-gray-900/50 border border-gray-700/50 backdrop-blur-md rounded-2xl shadow-2xl animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-white font-inter">Game History</h1>
        <button 
            onClick={onBack} 
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 hover:text-white transition-colors"
        >
          <BackArrowIcon className="w-5 h-5" />
          Back to Setup
        </button>
      </div>

      <div className="max-h-[65vh] overflow-y-auto pr-2">
        {logs.length === 0 ? (
            <div className="text-center text-gray-400 py-16">
                <p className="text-lg">No game history found.</p>
                <p className="text-sm">Play a game to see its audit log here.</p>
            </div>
        ) : (
            <div className="space-y-3">
            {logs.map(log => (
                <div 
                    key={log.gameId} 
                    onClick={() => setSelectedLog(log)} 
                    className="bg-gray-800/70 border border-gray-700/60 rounded-lg p-4 grid grid-cols-2 md:grid-cols-6 gap-4 items-center cursor-pointer hover:bg-gray-800 hover:border-amber-500/50 transition-all"
                >
                <div className="md:col-span-2">
                    <p className="text-xs lg:text-sm text-gray-400">Game ID</p>
                    <p className="font-mono text-sm lg:text-base text-white truncate" title={log.gameId}>{log.gameId}</p>
                </div>
                <div>
                    <p className="text-xs lg:text-sm text-gray-400">Date</p>
                    <p className="text-sm lg:text-base text-white">{new Date(log.startTime).toLocaleString()}</p>
                </div>
                <div>
                    <p className="text-xs lg:text-sm text-gray-400">Manager</p>
                     <p className="text-sm lg:text-base text-white flex items-center gap-1.5"><UserCircleIcon className="w-4 h-4 text-gray-400"/> {log.managerName}</p>
                </div>
                <div>
                    <p className="text-xs lg:text-sm text-gray-400">Winner</p>
                    <p className="text-sm lg:text-base font-bold text-amber-400 flex items-center gap-1.5">{log.winner?.name || 'N/A'}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs lg:text-sm text-gray-400">Prize Won</p>
                    <p className="text-lg lg:text-xl font-bold text-green-400">${log.settings.prize.toFixed(2)}</p>
                </div>
                </div>
            ))}
            </div>
        )}
       </div>

      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setSelectedLog(null)}>
          <div className="w-full max-w-6xl relative" onClick={e => e.stopPropagation()}>
             <button
                onClick={() => setSelectedLog(null)}
                className="absolute -top-4 -right-2 z-10 p-2 bg-gray-800 rounded-full text-white hover:bg-gray-700 transition-colors"
                aria-label="Close audit trail"
             >
                <CloseIcon className="w-6 h-6" />
             </button>
             <AuditTrailView auditLog={selectedLog} />
          </div>
        </div>
      )}
       <style>{`
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-fade-in {
            animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default AuditScreen;