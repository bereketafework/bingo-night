import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';
import { User, GameAuditLog, FilterPeriod, UserRole, WinningPattern } from '../types';

const DB_STORAGE_KEY = 'bingo_sqlite_db_v2';

let db: Database | null = null;
let SQL: any = null; // To hold the sql.js module

// --- Hashing Utility (Simple, for demonstration only) ---
// NOTE FOR PRODUCTION: This is a simple, unsalted hash. For a real production
// environment, a stronger, salted hashing algorithm like bcrypt or Argon2
// should be used to protect user passwords.
const simpleHash = async (text: string): Promise<string> => {
    const buffer = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// --- Database Persistence ---
// NOTE FOR PRODUCTION: Storing the entire database in localStorage is not suitable
// for a real production application. It has size limits, is unencrypted, can be
// cleared by the user, and is not accessible server-side for auditing or backup.
// A proper backend with a dedicated database (e.g., PostgreSQL, MySQL) is required.
const persistDb = () => {
    if (db) {
        const data = db.export();
        // Convert Uint8Array to a base64 string for localStorage
        const base64 = btoa(String.fromCharCode.apply(null, Array.from(data)));
        localStorage.setItem(DB_STORAGE_KEY, base64);
    }
};

const loadDbFromStorage = (): Uint8Array | null => {
    const base64 = localStorage.getItem(DB_STORAGE_KEY);
    if (base64) {
        try {
            // Convert base64 string back to Uint8Array
            const binaryString = atob(base64);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes;
        } catch (e) {
            console.error("Failed to parse database from localStorage, creating a new one.", e);
            localStorage.removeItem(DB_STORAGE_KEY);
            return null;
        }
    }
    return null;
};

// --- Schema and Seeding ---
const createTables = () => {
    if (!db) return;
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS game_logs (
            gameId TEXT PRIMARY KEY,
            startTime TEXT NOT NULL,
            managerId TEXT NOT NULL,
            managerName TEXT NOT NULL,
            settings TEXT NOT NULL, -- JSON string
            players TEXT NOT NULL, -- JSON string
            calledNumbersSequence TEXT NOT NULL, -- JSON string
            winner TEXT -- JSON string or NULL
        );

        CREATE TABLE IF NOT EXISTS app_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
    `);
};

const seedData = async () => {
    if (!db) return;
    // Seed users
    const userRes = db.exec("SELECT COUNT(*) FROM users");
    const userCount = userRes[0].values[0][0] as number;

    if (userCount === 0) {
        console.log("Database is empty, seeding initial users...");
        const users = [
            { name: 'superadmin', role: 'super_admin', pass: 'superadmin123' },
            { name: 'admin', role: 'admin', pass: 'admin123' },
            { name: 'manager1', role: 'manager', pass: 'pass123' },
            { name: 'manager2', role: 'manager', pass: 'pass123' },
        ];

        for (const [index, user] of users.entries()) {
            const hashedPassword = await simpleHash(user.pass);
            db.run(
                "INSERT INTO users (id, name, password, role) VALUES (?, ?, ?, ?)",
                [`user-${Date.now()}-${index}`, user.name, hashedPassword, user.role]
            );
        }
        console.log("Users seeded successfully.");
    }
    
    // Seed settings
    const settingRes = db.exec("SELECT COUNT(*) FROM app_settings WHERE key = 'winner_prize_percentage'");
    const settingCount = settingRes[0].values.length > 0 ? (settingRes[0].values[0][0] as number) : 0;
    if (settingCount === 0) {
        console.log("Seeding initial app settings...");
        db.run("INSERT INTO app_settings (key, value) VALUES (?, ?)", ['winner_prize_percentage', '0.7']);
    }

    const patternsSettingRes = db.exec("SELECT COUNT(*) FROM app_settings WHERE key = 'enabled_winning_patterns'");
    const patternsSettingCount = patternsSettingRes[0].values.length > 0 ? (patternsSettingRes[0].values[0][0] as number) : 0;
    if (patternsSettingCount === 0) {
        console.log("Seeding initial winning patterns setting...");
        db.run("INSERT INTO app_settings (key, value) VALUES (?, ?)", ['enabled_winning_patterns', JSON.stringify(Object.values(WinningPattern))]);
    }
};

// --- Public API ---
export const initializeDb = async () => {
    if (db) return; // Avoid re-initialization

    try {
        SQL = await initSqlJs({
             locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
        });

        const dbData = loadDbFromStorage();
        if (dbData) {
            console.log("Loading existing database from storage.");
            db = new SQL.Database(dbData);
        } else {
            console.log("Creating new SQLite database.");
            db = new SQL.Database();
        }

        createTables();
        await seedData();
        persistDb(); // Persist the DB state after setup
    } catch (e) {
        console.error("Fatal error initializing SQLite database:", e);
    }
};

export const getUsers = (role?: UserRole): User[] => {
    if (!db) return [];
    try {
        let query = "SELECT id, name, role FROM users";
        const params: string[] = [];
        if (role) {
            query += " WHERE role = ?";
            params.push(role);
        }
        const stmt = db.prepare(query);
        stmt.bind(params);
        const users: User[] = [];
        while (stmt.step()) {
            users.push(stmt.getAsObject() as unknown as User);
        }
        stmt.free();
        return users;
    } catch (e) {
        console.error("Failed to get users from DB:", e);
        return [];
    }
};

export const authenticateUser = async (name: string, passwordAttempt: string): Promise<User | null> => {
    if (!db) return null;
    try {
        const stmt = db.prepare("SELECT id, name, role, password FROM users WHERE name = :name");
        stmt.bind({ ':name': name });
        
        if (stmt.step()) {
            const userRecord = stmt.getAsObject() as unknown as User & { password?: string };
            const hashedAttempt = await simpleHash(passwordAttempt);

            if (userRecord.password && hashedAttempt === userRecord.password) {
                delete userRecord.password; // Don't send password hash to the app state
                stmt.free();
                return userRecord;
            }
        }
        stmt.free();
        return null;
    } catch (e) {
        console.error("DB authentication failed:", e);
        return null;
    }
};

export const getGameLogs = (filters: { period?: FilterPeriod; managerId?: string } = {}): GameAuditLog[] => {
    if (!db) return [];

    let query = "SELECT * FROM game_logs";
    const whereClauses: string[] = [];
    const params: (string | number)[] = [];

    // Filter by period
    if (filters.period && filters.period !== 'all') {
        const now = new Date();
        const daysToFilter = filters.period === '7d' ? 7 : 30;
        const filterDate = new Date();
        filterDate.setDate(now.getDate() - daysToFilter);
        whereClauses.push("startTime >= ?");
        params.push(filterDate.toISOString());
    }

    // Filter by manager
    if (filters.managerId && filters.managerId !== 'all') {
        whereClauses.push("managerId = ?");
        params.push(filters.managerId);
    }
    
    if (whereClauses.length > 0) {
        query += " WHERE " + whereClauses.join(" AND ");
    }
    
    query += " ORDER BY startTime DESC";

    try {
        const stmt = db.prepare(query);
        stmt.bind(params);
        
        const logs: GameAuditLog[] = [];
        while (stmt.step()) {
            const row = stmt.getAsObject();
            try {
                logs.push({
                    gameId: row.gameId as string,
                    startTime: row.startTime as string,
                    managerId: row.managerId as string,
                    managerName: row.managerName as string,
                    settings: JSON.parse(row.settings as string),
                    players: JSON.parse(row.players as string),
                    calledNumbersSequence: JSON.parse(row.calledNumbersSequence as string),
                    winner: row.winner ? JSON.parse(row.winner as string) : null
                });
            } catch (jsonError) {
                console.error(`Failed to parse JSON for log ${row.gameId}:`, jsonError);
            }
        }
        stmt.free();
        return logs;
    } catch (e) {
        console.error("Failed to load audit logs from DB with filters:", e);
        return [];
    }
};

export const saveGameLog = (log: GameAuditLog) => {
    if (!db) return;
    try {
        db.run("INSERT INTO game_logs VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
            log.gameId,
            log.startTime,
            log.managerId,
            log.managerName,
            JSON.stringify(log.settings),
            JSON.stringify(log.players),
            JSON.stringify(log.calledNumbersSequence),
            log.winner ? JSON.stringify(log.winner) : null
        ]);
        persistDb(); // Save database state after writing new log
    } catch (e) {
        console.error("Failed to save audit log to DB:", e);
    }
};

// --- New/Updated Admin Functions ---

export const getSetting = (key: string): string | null => {
    if (!db) return null;
    try {
        const stmt = db.prepare("SELECT value FROM app_settings WHERE key = ?");
        stmt.bind([key]);
        const value = stmt.step() ? stmt.get()[0] as string : null;
        stmt.free();
        return value;
    } catch (e) {
        console.error(`Failed to get setting '${key}':`, e);
        return null;
    }
};

export const setSetting = (key: string, value: string) => {
    if (!db) return;
    try {
        // Use INSERT OR REPLACE to handle both creation and update
        db.run("INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)", [key, value]);
        persistDb();
    } catch (e) {
        console.error(`Failed to set setting '${key}':`, e);
    }
};

export const createUser = async (name: string, passwordAttempt: string, role: 'manager' | 'admin'): Promise<{ success: boolean; message: string }> => {
    if (!db) return { success: false, message: 'Database not initialized.' };

    try {
        // Check if user exists
        const checkStmt = db.prepare("SELECT id FROM users WHERE name = ?");
        checkStmt.bind([name]);
        const userExists = checkStmt.step();
        checkStmt.free();
        if (userExists) {
            return { success: false, message: 'Username already exists.' };
        }

        const hashedPassword = await simpleHash(passwordAttempt);
        const newId = `user-${Date.now()}`;
        
        db.run(
            "INSERT INTO users (id, name, password, role) VALUES (?, ?, ?, ?)",
            [newId, name, hashedPassword, role]
        );
        
        persistDb();
        return { success: true, message: `User '${name}' created successfully as ${role}.` };
    } catch (e) {
        console.error("Failed to create user:", e);
        return { success: false, message: 'An internal error occurred.' };
    }
};

export const getEnabledWinningPatterns = (): WinningPattern[] => {
    const patternsJson = getSetting('enabled_winning_patterns');
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
    // Fallback to all patterns if setting is missing or corrupt
    return Object.values(WinningPattern);
};

export const clearGameLogs = (olderThanDays?: number): { success: boolean; message: string } => {
    if (!db) return { success: false, message: "Database not initialized." };
    try {
        let query = "DELETE FROM game_logs";
        const params: any[] = [];
        if (olderThanDays) {
            const date = new Date();
            date.setDate(date.getDate() - olderThanDays);
            query += ` WHERE startTime < ?`;
            params.push(date.toISOString());
        }
        const stmt = db.prepare(query);
        stmt.run(params);
        stmt.free();
        persistDb();
        const message = olderThanDays 
            ? `Successfully cleared game logs older than ${olderThanDays} days.`
            : 'Successfully cleared all game logs.';
        return { success: true, message };
    } catch (e) {
        const error = e as Error;
        console.error("Failed to clear game logs:", error);
        return { success: false, message: `An error occurred while clearing logs: ${error.message}` };
    }
};
