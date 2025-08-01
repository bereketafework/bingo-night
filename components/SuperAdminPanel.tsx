import React, { useState, useEffect, useMemo } from 'react';
import { GameAuditLog, User, FilterPeriod, WinningPattern } from '../types';
import { WINNING_PATTERNS, WINNING_PATTERNS_CONFIG } from '../constants';
import { LogoutIcon, GamepadIcon, StakeIcon, PrizeIcon, UserPlusIcon, Cog6ToothIcon, ChartBarIcon } from './icons';
import { getGameLogs, getUsers, createUser, getSetting, setSetting, clearGameLogs, getEnabledWinningPatterns } from '../services/db';

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string; className?: string }> = ({ icon, title, value, className }) => (
    <div className={`relative overflow-hidden bg-gray-900/50 border border-gray-700/50 p-5 rounded-2xl flex items-center gap-5 shadow-lg ${className}`}>
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/5 rounded-full opacity-50"></div>
        <div className="relative p-3 bg-gray-700/50 rounded-full border border-gray-600">
            {icon}
        </div>
        <div className="relative">
            <p className="text-sm text-gray-400 font-semibold">{title}</p>
            <p className="text-2xl lg:text-3xl 3xl:text-4xl font-bold text-white font-roboto-mono">{value}</p>
        </div>
    </div>
);

const SuperAdminPanel: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [logs, setLogs] = useState<GameAuditLog[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('30d');
  const [filterManager, setFilterManager] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'manager' | 'admin'>('manager');
  const [creationStatus, setCreationStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [prizePercentage, setPrizePercentage] = useState<number>(70);
  const [settingsStatus, setSettingsStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [enabledPatterns, setEnabledPatterns] = useState<Set<WinningPattern>>(new Set());
  const [patternsStatus, setPatternsStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  const managers = useMemo(() => allUsers.filter(u => u.role === 'manager'), [allUsers]);
  const admins = useMemo(() => allUsers.filter(u => u.role === 'admin'), [allUsers]);

  const fetchData = () => {
    setAllUsers(getUsers());
    const storedPercentage = getSetting('winner_prize_percentage');
    if (storedPercentage) {
        setPrizePercentage(parseFloat(storedPercentage) * 100);
    }
    setEnabledPatterns(new Set(getEnabledWinningPatterns()));
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      const filteredLogs = getGameLogs({ period: filterPeriod, managerId: filterManager });
      setLogs(filteredLogs);
      setIsLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, [filterPeriod, filterManager]);

  const stats = useMemo(() => {
    const totalGames = logs.length;
    const totalStake = logs.reduce((acc, log) => acc + (log.settings.stake * log.settings.numberOfPlayers), 0);
    const totalPrize = logs.reduce((acc, log) => acc + log.settings.prize, 0);
    const totalProfit = totalStake - totalPrize;
    return { totalGames, totalStake, totalPrize, totalProfit };
  }, [logs]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreationStatus(null);
    if (!newUserName.trim() || !newUserPassword.trim()) {
        setCreationStatus({ type: 'error', message: 'Username and password cannot be empty.' });
        return;
    }
    const result = await createUser(newUserName, newUserPassword, newUserRole);
    setCreationStatus({ type: result.success ? 'success' : 'error', message: result.message });
    if (result.success) {
        setNewUserName('');
        setNewUserPassword('');
        fetchData(); // Refresh user lists
        setTimeout(() => setCreationStatus(null), 4000);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsStatus(null);
    const value = prizePercentage / 100;
    if (value < 0 || value > 1) {
        setSettingsStatus({ type: 'error', message: 'Percentage must be between 0 and 100.' });
        return;
    }
    setSetting('winner_prize_percentage', value.toString());
    setSettingsStatus({ type: 'success', message: 'Settings saved successfully.' });
    setTimeout(() => setSettingsStatus(null), 3000);
  };
  
  const handleTogglePattern = (pattern: WinningPattern) => {
    setEnabledPatterns(prev => {
        const newSet = new Set(prev);
        if (newSet.has(pattern)) {
            newSet.delete(pattern);
        } else {
            newSet.add(pattern);
        }
        return newSet;
    });
  };
  
  const handleSavePatterns = () => {
    setSetting('enabled_winning_patterns', JSON.stringify(Array.from(enabledPatterns)));
    setPatternsStatus({ type: 'success', message: 'Winning patterns updated successfully.' });
    setTimeout(() => setPatternsStatus(null), 3000);
  };
  
  const handleClearLogs = (days?: number) => {
    const confirmationText = days 
        ? `Are you sure you want to delete all game logs older than ${days} days? This cannot be undone.`
        : "Are you sure you want to delete ALL game logs? This action is permanent and cannot be undone.";
    
    if (window.confirm(confirmationText)) {
        const result = clearGameLogs(days);
        alert(result.message);
        if (result.success) {
            // Refresh logs view by re-triggering the useEffect
            setLogs(getGameLogs({ period: filterPeriod, managerId: filterManager }));
        }
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8 bg-gray-900/70 border border-gray-700/50 backdrop-blur-xl rounded-2xl shadow-2xl animate-fade-in-down space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                 <h1 className="text-3xl lg:text-4xl font-bold text-white font-inter">Super Admin Dashboard</h1>
                 <p className="mt-1 text-base text-gray-400">Full control over site analytics, users, and settings.</p>
            </div>
            <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-300 bg-gray-700 rounded-lg hover:bg-red-600 hover:text-white transition-colors">
              <LogoutIcon className="w-5 h-5" /> Logout
            </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-start items-center gap-x-6 gap-y-3 p-3 bg-gray-800/50 border border-gray-700/50 rounded-xl">
            <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-400">Period:</span>
                <div className="flex items-center gap-1 bg-gray-700/80 p-1 rounded-lg">
                    {(['7d', '30d', 'all'] as FilterPeriod[]).map(p => (
                        <button key={p} onClick={() => setFilterPeriod(p)} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${filterPeriod === p ? 'bg-amber-500 text-gray-900 shadow' : 'text-gray-300 hover:bg-gray-600/50'}`}>
                            {p === '7d' && '7 Days'}
                            {p === '30d' && '30 Days'}
                            {p === 'all' && 'All Time'}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex items-center gap-2">
                 <span className="text-sm font-semibold text-gray-400">Manager:</span>
                 <select value={filterManager} onChange={e => setFilterManager(e.target.value)} className="px-3 py-1.5 text-sm font-semibold rounded-md bg-gray-700/80 text-gray-300 border-0 focus:ring-2 focus:ring-amber-500 focus:border-amber-500">
                    <option value="all">All Managers</option>
                    {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                 </select>
            </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<GamepadIcon className="w-7 h-7 text-amber-400"/>} title="Games Played" value={stats.totalGames.toLocaleString()} />
            <StatCard icon={<StakeIcon className="w-7 h-7 text-green-400"/>} title="Total Stakes" value={`$${stats.totalStake.toFixed(2)}`} />
            <StatCard icon={<PrizeIcon className="w-7 h-7 text-yellow-400"/>} title="Prizes Paid" value={`$${stats.totalPrize.toFixed(2)}`} />
            <StatCard icon={<ChartBarIcon className="w-7 h-7 text-sky-400"/>} title="Net Profit" value={`$${stats.totalProfit.toFixed(2)}`} className={stats.totalProfit >= 0 ? 'bg-green-500/5' : 'bg-red-500/5'}/>
        </div>

        {/* Management Section */}
        <div>
          <h2 className="text-2xl font-bold text-white font-inter border-b-2 border-gray-700 pb-2 mb-6">Site Management</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-800/70 border border-gray-700/50 rounded-xl p-6 space-y-6">
                <div>
                    <h3 className="font-bold text-white font-inter text-lg flex items-center gap-2 mb-4"><UserPlusIcon className="w-6 h-6 text-amber-400" /> Create New User</h3>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <input type="text" value={newUserName} onChange={(e) => { setNewUserName(e.target.value); setCreationStatus(null); }} placeholder="Username" className="w-full px-3 py-2 text-white bg-gray-700/80 border border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500" />
                            <input type="password" value={newUserPassword} onChange={(e) => { setNewUserPassword(e.target.value); setCreationStatus(null); }} placeholder="Password" className="w-full px-3 py-2 text-white bg-gray-700/80 border border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500" />
                        </div>
                        <div className="flex items-center gap-2 bg-gray-700/50 rounded-lg p-1">
                            <button type="button" onClick={() => setNewUserRole('manager')} className={`w-full py-2 text-center rounded-md font-semibold transition-colors text-sm ${newUserRole === 'manager' ? 'bg-amber-500 text-gray-900' : 'text-gray-300 hover:bg-gray-600/50'}`}>Manager</button>
                            <button type="button" onClick={() => setNewUserRole('admin')} className={`w-full py-2 text-center rounded-md font-semibold transition-colors text-sm ${newUserRole === 'admin' ? 'bg-amber-500 text-gray-900' : 'text-gray-300 hover:bg-gray-600/50'}`}>Admin</button>
                        </div>
                        {creationStatus && <p className={`text-sm ${creationStatus.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{creationStatus.message}</p>}
                        <button type="submit" className="w-full py-2 font-semibold text-gray-900 bg-amber-500 rounded-lg hover:bg-amber-600 focus:outline-none focus:ring-4 focus:ring-amber-500/50">Create User</button>
                    </form>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <h4 className="font-semibold text-white mb-2">Admins ({admins.length})</h4>
                        <ul className="space-y-1 max-h-24 overflow-y-auto pr-2">{admins.map(u => <li key={u.id} className="text-gray-300 bg-gray-900/50 p-1.5 rounded-md text-sm">{u.name}</li>)}</ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-white mb-2">Managers ({managers.length})</h4>
                        <ul className="space-y-1 max-h-24 overflow-y-auto pr-2">{managers.map(u => <li key={u.id} className="text-gray-300 bg-gray-900/50 p-1.5 rounded-md text-sm">{u.name}</li>)}</ul>
                    </div>
                </div>
            </div>
            <div className="bg-gray-800/70 border border-gray-700/50 rounded-xl p-6 space-y-6">
                <div>
                    <h3 className="font-bold text-white font-inter text-lg flex items-center gap-2 mb-4"><Cog6ToothIcon className="w-6 h-6 text-amber-400" /> Game Settings</h3>
                    <form onSubmit={handleSaveSettings} className="space-y-4">
                        <div>
                            <label htmlFor="prize-percentage" className="block text-sm font-medium text-gray-300 mb-1">Winner Prize Percentage</label>
                            <div className="relative"><input id="prize-percentage" type="number" min="0" max="100" value={prizePercentage} onChange={(e) => setPrizePercentage(Number(e.target.value))} className="w-full pl-3 pr-8 py-2 text-white bg-gray-700/80 border border-gray-600 rounded-lg" /><span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">%</span></div>
                        </div>
                        {settingsStatus && <p className={`text-sm ${settingsStatus.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{settingsStatus.message}</p>}
                        <button type="submit" className="w-full py-2 font-semibold text-gray-900 bg-amber-500 rounded-lg hover:bg-amber-600">Save Settings</button>
                    </form>
                </div>
                <div>
                    <h3 className="font-bold text-red-500 font-inter text-lg mb-4">Danger Zone</h3>
                    <div className="space-y-2">
                        <button onClick={() => handleClearLogs(90)} className="w-full text-sm py-2 px-4 bg-red-800/50 text-red-300 border border-red-600/50 rounded-lg hover:bg-red-800">Clear Logs Older Than 90 Days</button>
                        <button onClick={() => handleClearLogs()} className="w-full text-sm py-2 px-4 bg-red-900/50 text-red-300 border border-red-700/50 rounded-lg hover:bg-red-900">Clear ALL Game Logs</button>
                    </div>
                </div>
            </div>
          </div>
        </div>

        <div>
            <h3 className="font-bold text-white font-inter text-lg flex items-center gap-2 mb-4"><GamepadIcon className="w-6 h-6 text-amber-400" /> Enabled Winning Patterns</h3>
            <div className="bg-gray-800/70 border border-gray-700/50 rounded-xl p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {WINNING_PATTERNS.map(p => (
                        <label key={p} className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
                            <input type="checkbox" checked={enabledPatterns.has(p)} onChange={() => handleTogglePattern(p)} className="w-5 h-5 rounded text-amber-500 bg-gray-800 border-gray-600 focus:ring-amber-600" />
                            <span className="font-semibold text-white">{WINNING_PATTERNS_CONFIG[p].name}</span>
                        </label>
                    ))}
                </div>
                 {patternsStatus && <p className={`mt-4 text-sm ${patternsStatus.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{patternsStatus.message}</p>}
                <button onClick={handleSavePatterns} className="mt-6 w-full sm:w-auto px-6 py-2 font-semibold text-gray-900 bg-amber-500 rounded-lg hover:bg-amber-600">Save Pattern Settings</button>
            </div>
        </div>

        <div className="mt-6 bg-gray-800/70 border border-gray-700/50 rounded-xl overflow-hidden">
            <h3 className="font-bold text-white p-4 font-inter text-lg border-b border-gray-700/50">Game Reports</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm lg:text-base text-gray-300">
                    <thead className="bg-gray-900/50 text-xs lg:text-sm text-gray-400 uppercase tracking-wider">
                        <tr>
                            <th scope="col" className="px-4 lg:px-6 py-3">Date</th>
                            <th scope="col" className="px-4 lg:px-6 py-3">Manager</th>
                            <th scope="col" className="px-4 lg:px-6 py-3 text-right">Stake</th>
                            <th scope="col" className="px-4 lg:px-6 py-3 text-right">Prize</th>
                            <th scope="col" className="px-4 lg:px-6 py-3 text-right">Profit</th>
                            <th scope="col" className="px-4 lg:px-6 py-3">Winner</th>
                            <th scope="col" className="px-4 lg:px-6 py-3">Game ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={7} className="text-center p-8 text-gray-500">Loading reports...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan={7} className="text-center p-8 text-gray-500">No reports found for the selected filters.</td></tr>
                        ) : (
                            logs.map(log => {
                                const stake = log.settings.stake * log.settings.numberOfPlayers;
                                const prize = log.settings.prize;
                                const profit = stake - prize;
                                return (
                                    <tr key={log.gameId} className="border-b border-gray-700/50 hover:bg-gray-800/50 transition-colors">
                                        <td className="px-4 lg:px-6 py-3 whitespace-nowrap">{new Date(log.startTime).toLocaleString()}</td>
                                        <td className="px-4 lg:px-6 py-3 font-medium text-white">{log.managerName}</td>
                                        <td className="px-4 lg:px-6 py-3 font-roboto-mono text-right">${stake.toFixed(2)}</td>
                                        <td className="px-4 lg:px-6 py-3 font-roboto-mono text-right text-amber-400">${prize.toFixed(2)}</td>
                                        <td className={`px-4 lg:px-6 py-3 font-roboto-mono text-right font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>${profit.toFixed(2)}</td>
                                        <td className="px-4 lg:px-6 py-3 font-medium text-amber-500">{log.winner?.name ?? 'N/A'}</td>
                                        <td className="px-4 lg:px-6 py-3 font-mono text-xs text-gray-500 truncate max-w-[8ch] sm:max-w-xs" title={log.gameId}>{log.gameId}</td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default SuperAdminPanel;
