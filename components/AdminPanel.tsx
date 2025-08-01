
import React, { useState, useEffect, useMemo } from 'react';
import { GameAuditLog, User, FilterPeriod } from '../types';
import { LogoutIcon, GamepadIcon, StakeIcon, PrizeIcon, UserPlusIcon, Cog6ToothIcon, ChartBarIcon } from './icons';
import { getGameLogs, getUsers, createUser, getSetting, setSetting } from '../services/db';


interface AdminPanelProps {
  onLogout: () => void;
}

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

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [logs, setLogs] = useState<GameAuditLog[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('30d');
  const [filterManager, setFilterManager] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  const [newManagerName, setNewManagerName] = useState('');
  const [newManagerPassword, setNewManagerPassword] = useState('');
  const [creationStatus, setCreationStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [prizePercentage, setPrizePercentage] = useState<number>(70);
  const [settingsStatus, setSettingsStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const fetchAdminData = () => {
    const allUsers = getUsers();
    setManagers(allUsers.filter(u => u.role === 'manager'));
    const storedPercentage = getSetting('winner_prize_percentage');
    if (storedPercentage) {
        setPrizePercentage(parseFloat(storedPercentage) * 100);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Fetch filtered logs when filters change
  useEffect(() => {
    setIsLoading(true);
    // Use a small timeout to allow the UI to show the loading state
    const timer = setTimeout(() => {
      const filteredLogs = getGameLogs({
          period: filterPeriod,
          managerId: filterManager
      });
      setLogs(filteredLogs);
      setIsLoading(false);
    }, 100); // short delay
    return () => clearTimeout(timer);
  }, [filterPeriod, filterManager]);

  // Calculate stats based on the already filtered logs
  const stats = useMemo(() => {
    const totalGames = logs.length;
    const totalStake = logs.reduce((acc, log) => acc + (log.settings.stake * log.settings.numberOfPlayers), 0);
    const totalPrize = logs.reduce((acc, log) => acc + log.settings.prize, 0);
    const totalProfit = totalStake - totalPrize;
    return { totalGames, totalStake, totalPrize, totalProfit };
  }, [logs]);

  const handleCreateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreationStatus(null);
    if (!newManagerName.trim() || !newManagerPassword.trim()) {
        setCreationStatus({ type: 'error', message: 'Username and password cannot be empty.' });
        return;
    }

    const result = await createUser(newManagerName, newManagerPassword, 'manager');
    setCreationStatus({ type: result.success ? 'success' : 'error', message: result.message });
    if (result.success) {
        setNewManagerName('');
        setNewManagerPassword('');
        // Refresh manager list
        const allUsers = getUsers();
        setManagers(allUsers.filter(u => u.role === 'manager'));
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
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8 bg-gray-900/70 border border-gray-700/50 backdrop-blur-xl rounded-2xl shadow-2xl animate-fade-in-down">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
                 <h1 className="text-3xl lg:text-4xl font-bold text-white font-inter">Admin Dashboard</h1>
                 <p className="mt-1 text-base text-gray-400">Analytics and reports for game activity.</p>
            </div>
            <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-300 bg-gray-700 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
            >
              <LogoutIcon className="w-5 h-5" />
              Logout
            </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-start items-center gap-x-6 gap-y-3 p-3 bg-gray-800/50 border border-gray-700/50 rounded-xl">
            <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-400">Period:</span>
                <div className="flex items-center gap-1 bg-gray-700/80 p-1 rounded-lg">
                    {(['7d', '30d', 'all'] as FilterPeriod[]).map(p => (
                        <button
                            key={p}
                            onClick={() => setFilterPeriod(p)}
                            className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${filterPeriod === p ? 'bg-amber-500 text-gray-900 shadow' : 'text-gray-300 hover:bg-gray-600/50'}`}>
                            {p === '7d' && '7 Days'}
                            {p === '30d' && '30 Days'}
                            {p === 'all' && 'All Time'}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex items-center gap-2">
                 <span className="text-sm font-semibold text-gray-400">Manager:</span>
                 <select
                    value={filterManager}
                    onChange={e => setFilterManager(e.target.value)}
                    className="px-3 py-1.5 text-sm font-semibold rounded-md bg-gray-700/80 text-gray-300 border-0 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                    <option value="all">All Managers</option>
                    {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                 </select>
            </div>
        </div>

        {/* Stats */}
        <div className="my-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<GamepadIcon className="w-7 h-7 text-amber-400"/>} title="Games Played" value={stats.totalGames.toLocaleString()} />
            <StatCard icon={<StakeIcon className="w-7 h-7 text-green-400"/>} title="Total Stakes" value={`$${stats.totalStake.toFixed(2)}`} />
            <StatCard icon={<PrizeIcon className="w-7 h-7 text-yellow-400"/>} title="Prizes Paid" value={`$${stats.totalPrize.toFixed(2)}`} />
            <StatCard
              icon={<ChartBarIcon className="w-7 h-7 text-sky-400"/>}
              title="Net Profit"
              value={`$${stats.totalProfit.toFixed(2)}`}
              className={stats.totalProfit >= 0 ? 'bg-green-500/5' : 'bg-red-500/5'}
            />
        </div>

        {/* Management Section */}
        <div className="my-10">
          <h2 className="text-2xl font-bold text-white font-inter border-b-2 border-gray-700 pb-2 mb-6">Site Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Create Manager Section */}
            <div className="bg-gray-800/70 border border-gray-700/50 rounded-xl p-6">
                <h3 className="font-bold text-white font-inter text-lg flex items-center gap-2 mb-4">
                    <UserPlusIcon className="w-6 h-6 text-amber-400" />
                    Create New Manager
                </h3>
                <form onSubmit={handleCreateManager} className="space-y-4">
                    <div>
                        <label htmlFor="manager-name" className="block text-sm font-medium text-gray-300 mb-1">Username</label>
                        <input
                            id="manager-name" type="text" value={newManagerName}
                            onChange={(e) => { setNewManagerName(e.target.value); setCreationStatus(null); }}
                            placeholder="e.g., manager3"
                            className="w-full px-3 py-2 text-white bg-gray-700/80 border border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label htmlFor="manager-password" className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                        <input
                            id="manager-password" type="password" value={newManagerPassword}
                            onChange={(e) => { setNewManagerPassword(e.target.value); setCreationStatus(null); }}
                            placeholder="Enter temporary password"
                            className="w-full px-3 py-2 text-white bg-gray-700/80 border border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                        />
                    </div>
                    {creationStatus && (
                        <p className={`text-sm ${creationStatus.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{creationStatus.message}</p>
                    )}
                    <button type="submit" className="w-full py-2 font-semibold text-gray-900 bg-amber-500 rounded-lg hover:bg-amber-600 focus:outline-none focus:ring-4 focus:ring-amber-500/50 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
                        Create Manager
                    </button>
                </form>
            </div>

            {/* Game Settings Section */}
            <div className="bg-gray-800/70 border border-gray-700/50 rounded-xl p-6">
                <h3 className="font-bold text-white font-inter text-lg flex items-center gap-2 mb-4">
                    <Cog6ToothIcon className="w-6 h-6 text-amber-400" />
                    Game Settings
                </h3>
                <form onSubmit={handleSaveSettings} className="space-y-4">
                    <div>
                        <label htmlFor="prize-percentage" className="block text-sm font-medium text-gray-300 mb-1">Winner Prize Percentage</label>
                        <div className="relative">
                            <input
                                id="prize-percentage" type="number" min="0" max="100"
                                value={prizePercentage}
                                onChange={(e) => setPrizePercentage(Number(e.target.value))}
                                className="w-full pl-3 pr-8 py-2 text-white bg-gray-700/80 border border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                            />
                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">%</span>
                        </div>
                         <p className="text-xs text-gray-500 mt-1">This is the percentage of the total stake that goes to the winner.</p>
                    </div>
                    {settingsStatus && (
                        <p className={`text-sm ${settingsStatus.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{settingsStatus.message}</p>
                    )}
                    <button type="submit" className="w-full py-2 font-semibold text-gray-900 bg-amber-500 rounded-lg hover:bg-amber-600 focus:outline-none focus:ring-4 focus:ring-amber-500/50 transition-colors">
                        Save Settings
                    </button>
                </form>
            </div>
          </div>
        </div>

        {/* Game Reports Table */}
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
                                        <td className="px-4 lg:px-6 py-3 font-mono text-xs text-gray-500 truncate max-w-xs xl:max-w-sm 2xl:max-w-md" title={log.gameId}>{log.gameId}</td>
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

export default AdminPanel;