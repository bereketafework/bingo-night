import React, { useState } from 'react';
import { GamepadIcon } from './icons';
import { User } from '../types';
import { authenticateUser } from '../services/db';

interface LoginScreenProps {
  onLogin: (user: User) => void;
  onJoinAsPlayer: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onJoinAsPlayer }) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && password.trim()) {
      const user = await authenticateUser(name.trim(), password.trim());
      if (user) {
        onLogin(user);
      } else {
        setError('Invalid username or password.');
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
       <div 
        className="absolute inset-0 -z-10 h-full w-full bg-slate-950 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"
      ></div>
      <div className="w-full max-w-md p-6 sm:p-8 space-y-4 bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-2xl text-center">
        <div className="flex flex-col items-center">
          <div className="p-3 bg-amber-500/10 rounded-full border-2 border-amber-500/20">
            <GamepadIcon className="w-8 h-8 text-amber-400"/>
          </div>
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-white font-inter">Welcome to Bingo Night</h1>
          <p className="mt-2 text-base text-gray-400">Log in as a Manager or join a game.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="sr-only">Username</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="Manager Username"
              className="w-full px-4 py-3 text-lg text-white bg-gray-800 border border-gray-600 rounded-lg focus:ring-4 focus:ring-amber-500/50 focus:border-amber-500 transition-all duration-300 placeholder-gray-500"
              required
            />
          </div>
           <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="Password"
              className="w-full px-4 py-3 text-lg text-white bg-gray-800 border border-gray-600 rounded-lg focus:ring-4 focus:ring-amber-500/50 focus:border-amber-500 transition-all duration-300 placeholder-gray-500"
              required
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={!name.trim() || !password.trim()}
            className="w-full py-3 text-lg font-semibold text-gray-900 bg-amber-500 rounded-lg hover:bg-amber-600 focus:outline-none focus:ring-4 focus:ring-amber-500/50 transition-all duration-300 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Login as Manager
          </button>
        </form>
        
        <div className="relative my-4">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-600" />
            </div>
            <div className="relative flex justify-center">
                <span className="bg-gray-900/80 px-2 text-sm text-gray-400 backdrop-blur-sm">Or</span>
            </div>
        </div>
        
        <button
            type="button"
            onClick={onJoinAsPlayer}
            className="w-full py-3 text-lg font-semibold text-gray-900 bg-green-500 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-500/50 transition-all duration-300"
        >
            Join a Game
        </button>
      </div>
       <footer className="absolute bottom-4 text-center text-gray-500 text-sm">
            <p>Developed by Bereket A.</p>
       </footer>
    </div>
  );
};

export default LoginScreen;