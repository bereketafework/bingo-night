
import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import AdminPanel from './components/AdminPanel';
import ManagerView from './components/ManagerView';
import PlayerClient from './components/PlayerClient';
import SuperAdminPanel from './components/SuperAdminPanel';
import { User } from './types';
import { initializeDb } from './services/db';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isDbReady, setIsDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [appMode, setAppMode] = useState<'manager' | 'player'>('player');

  useEffect(() => {
    // Initialize DB once on app load.
    initializeDb()
      .then(() => setIsDbReady(true))
      .catch((err) => {
        console.error("Database initialization failed:", err);
        // Check for the specific table missing error from our db service
        if (err.message?.startsWith("TABLE_MISSING")) {
          setDbError(err.message);
        } else {
          setDbError(`Failed to initialize application data: ${err.message}. Please refresh the page to try again.`);
        }
      });
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };
  
  const handleLogout = () => {
    setCurrentUser(null);
    setAppMode('player'); // Go back to the default player view on logout
  };

  const renderContent = () => {
    if (dbError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
            <h2 className="text-2xl font-bold text-red-500">Application Error</h2>
            <p className="mt-2 text-lg text-red-400 max-w-xl">{dbError}</p>
            <p className="mt-4 text-gray-500">This might be a one-time issue. Please try refreshing the page. If the problem persists, ensure your database is set up correctly.</p>
        </div>
      );
    }

    if (!isDbReady) {
      return <div className="flex items-center justify-center min-h-screen text-lg text-gray-400">Initializing & connecting to database...</div>;
    }
    
    // If a user is logged in, show their respective panel.
    if (currentUser) {
        if (currentUser.role === 'super_admin') {
          return <SuperAdminPanel onLogout={handleLogout} />;
        }
        if (currentUser.role === 'admin') {
          return <AdminPanel onLogout={handleLogout} />;
        }
        if (currentUser.role === 'manager') {
          return <ManagerView manager={currentUser} onLogout={handleLogout} />;
        }
    }

    // If no user is logged in, show either player or manager login view based on appMode.
    if (appMode === 'player') {
      // The onSwitchToManager will set appMode to 'manager', which will then show LoginScreen
      return <PlayerClient onSwitchToManager={() => setAppMode('manager')} />;
    }

    if (appMode === 'manager') {
      // LoginScreen's onJoinAsPlayer will set appMode back to 'player'
      return <LoginScreen onLogin={handleLogin} onJoinAsPlayer={() => setAppMode('player')} />;
    }
    
    // Fallback for any unexpected state
    return <PlayerClient onSwitchToManager={() => setAppMode('manager')} />;
  };

  return (
    <div 
      className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-2 sm:p-4"
      style={{
        backgroundImage: 'radial-gradient(#374151 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }}
    >
      <main className="w-full max-w-7xl 3xl:max-w-[1700px] 4xl:max-w-[2100px] mx-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
