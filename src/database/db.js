const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs-extra');

class Database {
    constructor() {
        this.dbPath = path.join(__dirname, '../../database/bot.db');
        this.db = null;
    }

    async initialize() {
        await fs.ensureDir(path.dirname(this.dbPath));

        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Could not connect to database', err);
                    reject(err);
                } else {
                    console.log('Connected to SQLite database');
                    this.createTables().then(resolve).catch(reject);
                }
            });
        });
    }

    async createTables() {
        const tables = [
            `CREATE TABLE IF NOT EXISTS users (
                id TEXT,
                guild_id TEXT,
                xp INTEGER DEFAULT 0,
                level INTEGER DEFAULT 0,
                last_message INTEGER DEFAULT 0,
                message_count INTEGER DEFAULT 0,
                first_message_date TEXT,
                PRIMARY KEY (id, guild_id)
            )`,
            `CREATE TABLE IF NOT EXISTS tickets (
                channel_id TEXT PRIMARY KEY,
                user_id TEXT,
                created_at INTEGER
            )`,
            `CREATE TABLE IF NOT EXISTS reaction_roles (
                message_id TEXT,
                guild_id TEXT,
                role_data TEXT, -- JSON string of roles config
                permanent INTEGER DEFAULT 0,
                max_roles INTEGER DEFAULT 0,
                PRIMARY KEY (message_id)
            )`,
            `CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT
            )`,
            `CREATE TABLE IF NOT EXISTS detained_users (
                user_id TEXT,
                guild_id TEXT,
                roles TEXT, -- JSON array of role IDs
                detained_at INTEGER,
                PRIMARY KEY (user_id, guild_id)
            )`
        ];

        return Promise.all(tables.map(sql => this.run(sql)));
    }

    // Generic sqlite3 wrappers
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // --- Leveling Methods ---
    async getUserLevel(userId, guildId) {
        let user = await this.get('SELECT * FROM users WHERE id = ? AND guild_id = ?', [userId, guildId]);
        if (!user) {
            user = { id: userId, guild_id: guildId, xp: 0, level: 0, message_count: 0, first_message_date: new Date().toISOString() };
            await this.run('INSERT INTO users (id, guild_id, xp, level, message_count, first_message_date) VALUES (?, ?, ?, ?, ?, ?)',
                [userId, guildId, 0, 0, 0, user.first_message_date]);
        }
        return user;
    }

    async updateUserLevel(userId, guildId, level, xp, messageCount) {
        return this.run(
            'UPDATE users SET level = ?, xp = ?, message_count = ? WHERE id = ? AND guild_id = ?',
            [level, xp, messageCount, userId, guildId]
        );
    }

    async getLeaderboard(guildId, limit = 10) {
        return this.all('SELECT * FROM users WHERE guild_id = ? ORDER BY xp DESC LIMIT ?', [guildId, limit]);
    }

    // --- Modmail / Tickets ---
    async saveTicketMapping(channelId, userId) {
        return this.run('INSERT OR REPLACE INTO tickets (channel_id, user_id, created_at) VALUES (?, ?, ?)',
            [channelId, userId, Date.now()]);
    }

    async removeTicketMapping(channelId) {
        return this.run('DELETE FROM tickets WHERE channel_id = ?', [channelId]);
    }

    // --- Reaction Roles ---
    async getReactionRoleMessage(guildId, messageId) {
        const row = await this.get('SELECT * FROM reaction_roles WHERE message_id = ? AND guild_id = ?', [messageId, guildId]);
        if (row) {
            return {
                ...row,
                roles: JSON.parse(row.role_data)
            };
        }
        return null;
    }

    async saveReactionRoleMessage(guildId, channelId, messageId, rolesData, permanent, maxRoles) {
        return this.run(
            'INSERT OR REPLACE INTO reaction_roles (message_id, guild_id, role_data, permanent, max_roles) VALUES (?, ?, ?, ?, ?)',
            [messageId, guildId, JSON.stringify(rolesData), permanent ? 1 : 0, maxRoles || 0]
        );
    }

    // --- Settings / Chat Revive ---
    async getChatReviveSettings() {
        const row = await this.get('SELECT value FROM settings WHERE key = ?', ['chat_revive']);
        if (row) {
            return JSON.parse(row.value);
        }
        return { lastMessage: {} }; // Default structure
    }

    async saveChatReviveSettings(settings) {
        return this.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
            ['chat_revive', JSON.stringify(settings)]);
    }

    // --- Detain System ---
    async saveDetainedUserRoles(userId, guildId, roles) {
        return this.run('INSERT OR REPLACE INTO detained_users (user_id, guild_id, roles, detained_at) VALUES (?, ?, ?, ?)',
            [userId, guildId, JSON.stringify(roles), Date.now()]);
    }

    async getDetainedUserRoles(userId, guildId) {
        const row = await this.get('SELECT roles FROM detained_users WHERE user_id = ? AND guild_id = ?', [userId, guildId]);
        if (row) {
            return JSON.parse(row.roles);
        }
        return null;
    }

    async removeDetainedUserRoles(userId, guildId) {
        return this.run('DELETE FROM detained_users WHERE user_id = ? AND guild_id = ?', [userId, guildId]);
    }

    // --- Autoroles ---
    async getAutoroles(guildId) {
        const row = await this.get('SELECT value FROM settings WHERE key = ?', [`autoroles_${guildId}`]);
        if (row) {
            return JSON.parse(row.value);
        }
        return [];
    }

    async saveAutoroles(guildId, roles) {
        return this.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
            [`autoroles_${guildId}`, JSON.stringify(roles)]);
    }

    // --- Welcome System ---
    async getWelcomeChannel(guildId) {
        const row = await this.get('SELECT value FROM settings WHERE key = ?', [`welcome_channel_${guildId}`]);
        if (row) {
            return row.value;
        }
        return null;
    }

    async saveWelcomeChannel(guildId, channelId) {
        return this.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
            [`welcome_channel_${guildId}`, channelId]);
    }
}

module.exports = Database;
