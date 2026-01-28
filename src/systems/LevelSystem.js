const config = require('../config');

class LevelSystem {
    constructor(client) {
        this.client = client;
        this.db = client.database;
        this.cooldowns = new Set();
    }

    calculateLevel(totalXp) {
        // Level 1 = 0-99 XP
        // Level 2 = 100-399 XP
        // Level = floor(sqrt(XP / 100)) + 1
        return Math.floor(Math.sqrt(totalXp / 100)) + 1;
    }

    xpForLevel(level) {
        // Curve: (level-1)^2 * 100
        return Math.pow(level - 1, 2) * 100;
    }

    xpForNextLevel(level) {
        // Total XP needed to reach next level
        return this.xpForLevel(level + 1);
    }

    getLevelProgress(totalXp, currentLevel) {
        const currentLevelXp = this.xpForLevel(currentLevel);
        const nextLevelXp = this.xpForLevel(currentLevel + 1);
        const needed = nextLevelXp - currentLevelXp;
        const current = totalXp - currentLevelXp;

        let percentage = Math.floor((current / needed) * 100);
        if (percentage < 0) percentage = 0;
        if (percentage > 100) percentage = 100;

        return { current, needed, percentage };
    }

    async getLeaderboard(guildId, limit) {
        return this.db.getLeaderboard(guildId, limit);
    }

    getRankName(level) {
        if (level >= 100) return "MAGA Legend";
        if (level >= 90) return "Patriot X";
        if (level >= 80) return "Patriot IX";
        if (level >= 70) return "Patriot VIII";
        if (level >= 60) return "Patriot VII";
        if (level >= 50) return "Patriot VI";
        if (level >= 40) return "Patriot V";
        if (level >= 30) return "Patriot IV";
        if (level >= 20) return "Patriot III";
        if (level >= 10) return "Patriot II";
        return "Patriot I";
    }

    getRankRoleId(level) {
        const r = config.roles;
        if (level >= 100) return r.magaLegend;
        if (level >= 90) return r.patriotX;
        if (level >= 80) return r.patriotIX;
        if (level >= 70) return r.patriotVIII;
        if (level >= 60) return r.patriotVII;
        if (level >= 50) return r.patriotVI;
        if (level >= 40) return r.patriotV;
        if (level >= 30) return r.patriotIV;
        if (level >= 20) return r.patriotIII;
        if (level >= 10) return r.patriotII;
        return r.patriotI;
    }

    async giveXp(message) {
        if (message.author.bot || !message.guild) return;

        const userId = message.author.id;
        const guildId = message.guild.id;
        const key = `${guildId}-${userId}`;

        if (this.cooldowns.has(key)) return;

        // Cooldown 60s
        this.cooldowns.add(key);
        setTimeout(() => this.cooldowns.delete(key), 60000);

        // Random XP 23-38 (approx 50% more than 15-25)
        const xpGain = Math.floor(Math.random() * 16) + 23;

        const user = await this.db.getUserLevel(userId, guildId);
        const newTotalXp = user.xp + xpGain;
        const newLevel = this.calculateLevel(newTotalXp);
        const messageCount = user.message_count + 1;

        await this.db.updateUserLevel(userId, guildId, newLevel, newTotalXp, messageCount);

        if (newLevel > user.level) {
            await this.handleLevelUp(message, newLevel, xpGain);
        }
    }

    async handleLevelUp(message, newLevel, xpGain) {
        const rankName = this.getRankName(newLevel);

        // Update Roles
        await this.updateRoles(message.member, newLevel);

        const embed = {
            color: 0x00ff00,
            title: '🎉 Level Up!',
            description: `**${message.author}** leveled up!`,
            fields: [
                { name: '📈 New Level', value: newLevel.toString(), inline: true },
                { name: '🏆 Rank', value: rankName, inline: true },
                { name: '✨ XP Gained', value: `+${xpGain}`, inline: true }
            ],
            footer: { text: 'Keep chatting to earn more XP!' },
            timestamp: new Date()
        };

        try {
            await message.reply({ embeds: [embed] });
        } catch (err) {
            try {
                await message.channel.send({ embeds: [embed] });
            } catch (e) {
                console.error('Failed to send level up message', e);
            }
        }
    }

    async updateRoles(member, level) {
        if (!member) return;

        const roleId = this.getRankRoleId(level);
        const allRankRoles = Object.values(config.roles).filter(id =>
            // Filter out non-rank roles if necessary, or just rely on the specific list
            [
                config.roles.patriotI, config.roles.patriotII, config.roles.patriotIII,
                config.roles.patriotIV, config.roles.patriotV, config.roles.patriotVI,
                config.roles.patriotVII, config.roles.patriotVIII, config.roles.patriotIX,
                config.roles.patriotX, config.roles.magaLegend
            ].includes(id)
        );

        // Remove old rank roles
        const toRemove = allRankRoles.filter(id => id !== roleId && member.roles.cache.has(id));
        if (toRemove.length > 0) {
            await member.roles.remove(toRemove).catch(console.error);
        }

        // Add new rank role
        if (roleId && !member.roles.cache.has(roleId)) {
            await member.roles.add(roleId).catch(console.error);
        }
    }

    // Helper methods for promo_check
    messagesForLevel(level) {
        const xpNeeded = this.xpForLevel(level);
        const currentLevelXp = this.xpForLevel(level - 1); // XP required for previous level
        // Wait, xpForLevel(level) returns TOTAL XP to reach that level.
        // So XP needed for this level from 0 is xpForLevel(level).

        // This is a rough estimate. User gets ~30 XP per message.
        return Math.ceil(xpNeeded / 30);
    }

    estimateTimeToNextLevel(messageCount, currentLevel, firstMessageDate) {
        if (!firstMessageDate || messageCount === 0) return null;

        const now = new Date();
        const firstMessage = new Date(firstMessageDate);
        const timeDiff = now - firstMessage;
        const minutesSinceFirst = timeDiff / (1000 * 60);

        if (minutesSinceFirst === 0) return null;

        const messagesPerMinute = messageCount / minutesSinceFirst;
        const nextLevel = currentLevel + 1;
        const totalMessagesForNextLevel = this.messagesForLevel(nextLevel);
        const messagesNeeded = totalMessagesForNextLevel - messageCount;

        if (messagesNeeded <= 0 || messagesPerMinute <= 0) return 0;

        return Math.ceil(messagesNeeded / messagesPerMinute);
    }
}

module.exports = LevelSystem;
