// --- A NOTE ON THIS DATABASE IMPLEMENTATION ---
// This file has been refactored to simulate a backend database connection.
// The original sql.js + localStorage implementation was client-side only,
// meaning it could not support multiple users on different devices.
//
// To build a truly deployable, multi-user application, you would need to
// replace the placeholder logic in this file with actual API calls to a
// backend server (e.g., using Node.js/Express) or a Backend-as-a-Service
// like Firebase Firestore.
//
// The functions are now `async` to mimic the asynchronous nature of
// network requests. The in-memory data (`mockDb`) is a temporary
// placeholder to keep the application functional for demonstration.

import { User, GameAuditLog, FilterPeriod, UserRole, WinningPattern } from '../types';

// --- Hashing Utility (Simple, for demonstration only) ---
const simpleHash = async (text: string): Promise<string> => {
    const buffer = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// --- Mock In-Memory Database (Placeholder for a real backend database) ---
let mockDb: {
  users: (User & { password?: string })[];
  gameLogs: GameAuditLog[];
  settings: { [key: string]: string };
} = {
  users: [],
  gameLogs: [],
  settings: {
    'winner_prize_percentage': '0.7',
    'enabled_winning_patterns': JSON.stringify(Object.values(WinningPattern)),
  },
};
let isDbInitialized = false;

// --- Public API ---

/**
 * In a real backend scenario, this would not be needed on the client.
 * Here, it simulates seeding the initial data into our mock database.
 */
export const initializeDb = async () => {
    if (isDbInitialized) return;

    console.log("Simulating connection to backend and seeding initial data...");

    const usersToSeed = [
        { name: 'superadmin', role: 'super_admin', pass: 'superadmin123' },
        { name: 'admin', role: 'admin', pass: 'admin123' },
        { name: 'manager1', role: 'manager', pass: 'pass123' },
        { name: 'manager2', role: 'manager', pass: 'pass123' },
    ];
    
    for (const [index, user] of usersToSeed.entries()) {
        const hashedPassword = await simpleHash(user.pass);
        mockDb.users.push({
            id: `user-${Date.now()}-${index}`,
            name: user.name,
            password: hashedPassword,
            role: user.role as UserRole,
        });
    }

    isDbInitialized = true;
    console.log("Mock database initialized and seeded.");
    return Promise.resolve();
};

/**
 * Fetches users from the database.
 * REAL-WORLD: This would be a GET request to an endpoint like /api/users.
 */
export const getUsers = async (role?: UserRole): Promise<User[]> => {
    console.log(`Simulating GET /api/users?role=${role || 'all'}`);
    await initializeDb(); // Ensure DB is ready
    let filteredUsers = mockDb.users;
    if (role) {
        filteredUsers = mockDb.users.filter(u => u.role === role);
    }
    // Return users without password hashes
    return Promise.resolve(filteredUsers.map(({ password, ...user }) => user));
};

/**
 * Authenticates a user against the database.
 * REAL-WORLD: This would be a POST request to /api/login with name and password.
 */
export const authenticateUser = async (name: string, passwordAttempt: string): Promise<User | null> => {
    console.log(`Simulating POST /api/login for user: ${name}`);
    await initializeDb(); // Ensure DB is ready
    
    const userRecord = mockDb.users.find(u => u.name === name);
    if (userRecord && userRecord.password) {
        const hashedAttempt = await simpleHash(passwordAttempt);
        if (hashedAttempt === userRecord.password) {
            const { password, ...userToReturn } = userRecord;
            return Promise.resolve(userToReturn);
        }
    }
    return Promise.resolve(null);
};

/**
 * Retrieves game logs, optionally filtered.
 * REAL-WORLD: This would be a GET request to /api/gamelogs with filter query params.
 */
export const getGameLogs = async (filters: { period?: FilterPeriod; managerId?: string } = {}): Promise<GameAuditLog[]> => {
    console.log(`Simulating GET /api/gamelogs with filters:`, filters);
    await initializeDb(); // Ensure DB is ready
    
    let logs = [...mockDb.gameLogs];

    if (filters.period && filters.period !== 'all') {
        const now = new Date();
        const daysToFilter = filters.period === '7d' ? 7 : 30;
        const filterDate = new Date();
        filterDate.setDate(now.getDate() - daysToFilter);
        logs = logs.filter(log => new Date(log.startTime) >= filterDate);
    }

    if (filters.managerId && filters.managerId !== 'all') {
        logs = logs.filter(log => log.managerId === filters.managerId);
    }
    
    logs.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    return Promise.resolve(logs);
};

/**
 * Saves a completed game log to the database.
 * REAL-WORLD: This would be a POST request to /api/gamelogs.
 */
export const saveGameLog = async (log: GameAuditLog): Promise<void> => {
    console.log(`Simulating POST /api/gamelogs for gameId: ${log.gameId}`);
    await initializeDb();
    mockDb.gameLogs.push(log);
    return Promise.resolve();
};

/**
 * Retrieves a specific setting value.
 * REAL-WORLD: This would be a GET request to /api/settings/:key.
 */
export const getSetting = async (key: string): Promise<string | null> => {
    console.log(`Simulating GET /api/settings/${key}`);
    await initializeDb();
    return Promise.resolve(mockDb.settings[key] || null);
};

/**
 * Sets a specific setting value.
 * REAL-WORLD: This would be a PUT or POST request to /api/settings.
 */
export const setSetting = async (key: string, value: string): Promise<void> => {
    console.log(`Simulating POST /api/settings with {${key}: ${value}}`);
    await initializeDb();
    mockDb.settings[key] = value;
    return Promise.resolve();
};

/**
 * Creates a new user (manager or admin).
 * REAL-WORLD: This would be a POST request to /api/users.
 */
export const createUser = async (name: string, passwordAttempt: string, role: 'manager' | 'admin'): Promise<{ success: boolean; message: string }> => {
    console.log(`Simulating POST /api/users to create ${role}: ${name}`);
    await initializeDb();

    if (mockDb.users.some(u => u.name === name)) {
        return Promise.resolve({ success: false, message: 'Username already exists.' });
    }

    const hashedPassword = await simpleHash(passwordAttempt);
    const newUser: User & { password?: string } = {
        id: `user-${Date.now()}`,
        name,
        password: hashedPassword,
        role,
    };
    mockDb.users.push(newUser);
    
    return Promise.resolve({ success: true, message: `User '${name}' created successfully as ${role}.` });
};

/**
 * Gets the list of enabled winning patterns from settings.
 */
export const getEnabledWinningPatterns = async (): Promise<WinningPattern[]> => {
    const patternsJson = await getSetting('enabled_winning_patterns');
    if (patternsJson) {
        try {
            const patterns = JSON.parse(patternsJson);
            if (Array.isArray(patterns)) {
                return patterns as WinningPattern[];
            }
        } catch (e) {
            console.error("Failed to parse enabled_winning_patterns setting:", e);
        }
    }
    return Object.values(WinningPattern);
};

/**
 * Clears game logs from the database.
 * REAL-WORLD: This would be a DELETE request to /api/gamelogs.
 */
export const clearGameLogs = async (olderThanDays?: number): Promise<{ success: boolean; message: string }> => {
    console.log(`Simulating DELETE /api/gamelogs older than ${olderThanDays || 'all'} days`);
    await initializeDb();
    
    const originalCount = mockDb.gameLogs.length;
    if (olderThanDays) {
        const date = new Date();
        date.setDate(date.getDate() - olderThanDays);
        mockDb.gameLogs = mockDb.gameLogs.filter(log => new Date(log.startTime) >= date);
    } else {
        mockDb.gameLogs = [];
    }
    const removedCount = originalCount - mockDb.gameLogs.length;

    const message = olderThanDays 
        ? `Successfully cleared ${removedCount} game logs older than ${olderThanDays} days.`
        : `Successfully cleared all ${removedCount} game logs.`;
    return Promise.resolve({ success: true, message });
};
