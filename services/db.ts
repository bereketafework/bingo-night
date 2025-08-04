

import { createClient } from '@supabase/supabase-js';
import { User, GameAuditLog, FilterPeriod, UserRole, WinningPattern, AuditedPlayer, Language } from '../types';

// IMPORTANT: In a real production app without a build step, credentials should not be hardcoded.
// This is for demonstration with the provided Supabase instance.
const supabaseUrl = 'https://hjfafixgotcrfnrcbejf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqZmFmaXhnb3RjcmZucmNiZWpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMjA5MTMsImV4cCI6MjA2OTg5NjkxM30.q7_hY7v-TkN0U6NqasA5tIL21vCtrqRT6y3MIOc1qMM';

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and Key are required.');
}


// --- Database Type Definition for Supabase Client ---
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          password: string;
          role: string;
        };
        Insert: {
          id?: string;
          name: string;
          password: string;
          role: UserRole;
        };
        Update: {
          name?: string;
          password?: string;
          role?: UserRole;
        };
      };
      game_logs: {
        Row: {
          id: number;
          created_at: string;
          game_id: string;
          start_time: string;
          manager_id: string;
          manager_name: string;
          settings: Json;
          players: Json;
          called_numbers_sequence: Json;
          winner: Json | null;
        };
        Insert: {
          id?: number;
          created_at?: string;
          game_id: string;
          start_time: string;
          manager_id: string;
          manager_name: string;
          settings: GameAuditLog['settings'];
          players: AuditedPlayer[];
          called_numbers_sequence: number[];
          winner: GameAuditLog['winner'];
        };
        Update: {
          id?: number;
          game_id?: string;
          start_time?: string;
          manager_id?: string;
          manager_name?: string;
          settings?: Json;
          players?: Json;
          called_numbers_sequence?: Json;
          winner?: Json | null;
        };
      };
      settings: {
        Row: {
          key: string;
          value: string;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: string;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
  };
}


// Assumes the following Supabase schema:
// - tables: `users`, `game_logs`, `settings`
// - `users` columns: `id` (uuid, pk), `name` (text), `password` (text), `role` (text)
// - `game_logs` columns: `id` (uuid, pk), `game_id` (text), `start_time` (timestamptz), `manager_id` (uuid), `manager_name` (text), `settings` (jsonb), `players` (jsonb), `called_numbers_sequence` (jsonb), `winner` (jsonb)
// - `settings` columns: `key` (text, pk), `value` (text), `updated_at` (timestamptz)

const supabase = createClient<Database>(supabaseUrl, supabaseKey);


// --- Hashing Utility (Simple, for demonstration only) ---
const simpleHash = async (text: string): Promise<string> => {
    // This simple hash is for demonstration with the existing app structure.
    // For a production app, use Supabase Auth which handles password security automatically.
    const buffer = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

let isDbInitialized = false;

/**
 * Connects to Supabase and seeds initial data if the database is empty.
 */
export const initializeDb = async () => {
    if (isDbInitialized) return;
    console.log("Connecting to Supabase and verifying initial data...");

    try {
        // Check for 'users' table
        const { data: existingUsers, error: usersError } = await supabase.from('users').select('name').limit(1);
        if (usersError?.code === '42P01') { // 42P01: undefined_table
            throw new Error("TABLE_MISSING: The 'users' table is missing. Please run the setup SQL in your Supabase project's SQL Editor.");
        } else if (usersError) {
            throw usersError;
        }

        // Check for 'game_logs' table
        const { error: logsError } = await supabase.from('game_logs').select('game_id').limit(1);
        if (logsError?.code === '42P01') {
            throw new Error("TABLE_MISSING: The 'game_logs' table is missing. Please run the setup SQL in your Supabase project's SQL Editor.");
        } else if (logsError) {
            throw logsError;
        }

        // Check for 'settings' table
        const { data: existingSettings, error: settingsError } = await supabase.from('settings').select('key').limit(1);
        if (settingsError?.code === '42P01') {
            throw new Error("TABLE_MISSING: The 'settings' table is missing. Please run the setup SQL in your Supabase project's SQL Editor.");
        } else if (settingsError) {
            throw settingsError;
        }

        if (existingUsers.length === 0) {
            console.log("Seeding initial users to Supabase...");
            const usersToSeed = [
                { name: 'superadmin', role: 'super_admin', pass: 'superadmin123' },
                { name: 'admin', role: 'admin', pass: 'admin123' },
                { name: 'manager1', role: 'manager', pass: 'pass123' },
                { name: 'manager2', role: 'manager', pass: 'pass123' },
            ];
            const newUsers = await Promise.all(usersToSeed.map(async (user) => ({
                name: user.name,
                password: await simpleHash(user.pass),
                role: user.role as UserRole,
            })));
            const { error: insertError } = await supabase.from('users').insert(newUsers);
            if (insertError) throw insertError;
        }
        
        if (existingSettings.length === 0) {
            console.log("Seeding initial settings to Supabase...");
            const settingsToSeed = [
                { key: 'winner_prize_percentage', value: '0.7', updated_at: new Date().toISOString() },
                { key: 'enabled_winning_patterns', value: JSON.stringify(Object.values(WinningPattern)), updated_at: new Date().toISOString() }
            ];
            const { error: insertError } = await supabase.from('settings').insert(settingsToSeed);
            if (insertError) throw insertError;
        }
        
        isDbInitialized = true;
        console.log("Supabase connection successful and data verified.");
    } catch (e: any) {
        console.error("Supabase initialization error:", e);
        // Re-throw the original error to be handled by the UI
        throw e;
    }
};

export const getUsers = async (role?: UserRole): Promise<User[]> => {
    let query = supabase.from('users').select('id, name, role');
    if (role) {
        query = query.eq('role', role);
    }
    const { data, error } = await query;
    if (error) {
        console.error('Error fetching users:', error);
        return [];
    }
    return data;
};

export const authenticateUser = async (name: string, passwordAttempt: string): Promise<User | null> => {
    const { data: userRecord, error } = await supabase
        .from('users')
        .select('id, name, role, password')
        .eq('name', name)
        .single();
    
    if (error || !userRecord) {
        if (error && error.code !== 'PGRST116') console.error('Authentication error:', error);
        return null;
    }
    
    if (userRecord.password) {
        const hashedAttempt = await simpleHash(passwordAttempt);
        if (hashedAttempt === userRecord.password) {
            const { password, ...userToReturn } = userRecord;
            return userToReturn;
        }
    }
    return null;
};

export const getGameLogs = async (filters: { period?: FilterPeriod; managerId?: string } = {}): Promise<GameAuditLog[]> => {
    let query = supabase.from('game_logs').select('*');

    if (filters.period && filters.period !== 'all') {
        const daysToFilter = filters.period === '7d' ? 7 : 30;
        const filterDate = new Date();
        filterDate.setDate(new Date().getDate() - daysToFilter);
        query = query.gte('start_time', filterDate.toISOString());
    }

    if (filters.managerId && filters.managerId !== 'all') {
        query = query.eq('manager_id', filters.managerId);
    }
    
    const { data, error } = await query.order('start_time', { ascending: false });

    if (error) {
        console.error('Error fetching game logs:', error);
        return [];
    }
    
    // Map snake_case from DB to camelCase for the app
    return data.map(log => ({
        gameId: log.game_id,
        startTime: log.start_time,
        managerId: log.manager_id,
        managerName: log.manager_name,
        settings: log.settings as GameAuditLog['settings'],
        players: log.players as AuditedPlayer[],
        calledNumbersSequence: log.called_numbers_sequence as number[],
        winner: log.winner as GameAuditLog['winner'],
    }));
};

export const saveGameLog = async (log: GameAuditLog): Promise<void> => {
    const logToSave = {
        game_id: log.gameId,
        start_time: log.startTime,
        manager_id: log.managerId,
        manager_name: log.managerName,
        settings: log.settings,
        players: log.players,
        called_numbers_sequence: log.calledNumbersSequence,
        winner: log.winner,
    };
    const { error } = await supabase.from('game_logs').insert(logToSave);
    if (error) console.error('Error saving game log:', error);
};

export const getSetting = async (key: string): Promise<string | null> => {
    const { data, error } = await supabase.from('settings').select('value').eq('key', key).single();
    if (error) {
        if (error.code !== 'PGRST116') console.error(`Error getting setting ${key}:`, error);
        return null;
    }
    return data.value;
};

export const setSetting = async (key: string, value: string): Promise<void> => {
    const { error } = await supabase
        .from('settings')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) console.error(`Error setting ${key}:`, error);
};

export const createUser = async (name: string, passwordAttempt: string, role: 'manager' | 'admin'): Promise<{ success: boolean; message: string }> => {
    const { data: existing, error: checkError } = await supabase.from('users').select('id').eq('name', name).single();
    if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking for existing user:', checkError);
        return { success: false, message: 'Database error while checking for user.' };
    }
    if (existing) return { success: false, message: 'Username already exists.' };

    const hashedPassword = await simpleHash(passwordAttempt);
    const { error } = await supabase.from('users').insert({ name, password: hashedPassword, role });
    if (error) {
        console.error('Error creating user:', error);
        return { success: false, message: `Failed to create user: ${error.message}` };
    }
    return { success: true, message: `User '${name}' created successfully as ${role}.` };
};

export const getEnabledWinningPatterns = async (): Promise<WinningPattern[]> => {
    const patternsJson = await getSetting('enabled_winning_patterns');
    if (patternsJson) {
        try {
            const patterns = JSON.parse(patternsJson);
            if (Array.isArray(patterns)) return patterns as WinningPattern[];
        } catch (e) {
            console.error("Failed to parse enabled_winning_patterns setting:", e);
        }
    }
    return Object.values(WinningPattern);
};

export const clearGameLogs = async (olderThanDays?: number): Promise<{ success: boolean; message: string }> => {
    let query = supabase.from('game_logs').delete();
    if (olderThanDays) {
        const date = new Date();
        date.setDate(date.getDate() - olderThanDays);
        query = query.lt('start_time', date.toISOString());
    } else {
        query = query.not('game_id', 'is', null); // Match all rows
    }
    
    const { data: deletedRows, error } = await query.select(); // .select() returns the deleted rows
    if (error) {
        console.error('Error clearing game logs:', error);
        return { success: false, message: `Failed to clear logs: ${error.message}` };
    }
    const removedCount = deletedRows?.length || 0;
    const message = olderThanDays 
        ? `Successfully cleared ${removedCount} game logs older than ${olderThanDays} days.`
        : `Successfully cleared all ${removedCount} game logs.`;
    return { success: true, message };
};