const assert = require('assert');
const LevelSystem = require('./src/systems/LevelSystem');

// Mock Client and Database
const mockDb = {
    users: {},
    async getUserLevel(userId, guildId) {
        if (!this.users[`${guildId}-${userId}`]) {
            this.users[`${guildId}-${userId}`] = { id: userId, guild_id: guildId, xp: 0, level: 0, message_count: 0, first_message_date: new Date().toISOString() };
        }
        return this.users[`${guildId}-${userId}`];
    },
    async updateUserLevel(userId, guildId, level, xp, messageCount) {
        const user = await this.getUserLevel(userId, guildId);
        user.level = level;
        user.xp = xp;
        user.message_count = messageCount;
    },
    async getLeaderboard(guildId, limit) {
        return Object.values(this.users)
            .filter(u => u.guild_id === guildId)
            .sort((a, b) => b.xp - a.xp)
            .slice(0, limit);
    }
};

const mockClient = {
    database: mockDb
};

const system = new LevelSystem(mockClient);

async function runTests() {
    console.log('Starting LevelSystem Tests...');

    // Test XP Curve
    console.log('Test 1: XP Curve');
    // Level 1: 0 XP. 
    // xpForLevel(1) = 0.
    // xpForLevel(2) = 100.
    // xpForLevel(3) = 400.
    assert.strictEqual(system.xpForLevel(1), 0, 'Level 1 XP should be 0');
    assert.strictEqual(system.xpForLevel(2), 100, 'Level 2 XP should be 100');
    assert.strictEqual(system.xpForLevel(3), 400, 'Level 3 XP should be 400');

    // calculateLevel
    assert.strictEqual(system.calculateLevel(0), 1, '0 XP should be Level 1');
    assert.strictEqual(system.calculateLevel(99), 1, '99 XP should be Level 1');
    assert.strictEqual(system.calculateLevel(100), 2, '100 XP should be Level 2');
    assert.strictEqual(system.calculateLevel(399), 2, '399 XP should be Level 2');
    assert.strictEqual(system.calculateLevel(400), 3, '400 XP should be Level 3');
    console.log('Passed XP Curve Tests');

    // Test Progress Calculation
    console.log('Test 2: Progress Calculation');
    // Current Level 2 (100-400 range). Total XP 150.
    // Progress should be (150-100) / (400-100) = 50 / 300 = 16.66% -> 16%
    const progress = system.getLevelProgress(150, 2);
    assert.strictEqual(progress.current, 50, 'Current progress XP should be 50');
    assert.strictEqual(progress.needed, 300, 'Needed progress XP should be 300');
    assert.strictEqual(progress.percentage, 16, 'Percentage should be 16');
    console.log('Passed Progress Calculation Tests');

    // Test XP Giving
    console.log('Test 3: Giving XP');
    const msg = {
        author: { id: 'user1', bot: false },
        guild: { id: 'guild1' },
        reply: async () => { }, // mock
        channel: { send: async () => { } }, // mock
        member: { roles: { cache: new Map(), add: async () => { }, remove: async () => { } } } // mock
    };

    // Give XP
    await system.giveXp(msg);
    const user = await mockDb.getUserLevel('user1', 'guild1');
    console.log(`User XP after 1 message: ${user.xp}`);
    assert.ok(user.xp >= 23 && user.xp <= 38, 'XP gain should be between 23 and 38');
    assert.strictEqual(user.message_count, 1, 'Message count should be 1');

    // Test Cooldown
    await system.giveXp(msg); // Should be blocked by cooldown
    const user2 = await mockDb.getUserLevel('user1', 'guild1');
    assert.strictEqual(user2.xp, user.xp, 'XP should not increase due to cooldown');

    console.log('Passed XP Giving Tests');

    console.log('All Tests Passed!');
}

runTests().catch(console.error);
