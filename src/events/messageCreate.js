const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.author.bot) return;

        // Leveling
        if (client.levelSystem) {
            try {
                await client.levelSystem.giveXp(message);
            } catch (error) {
                console.error('Leveling error:', error);
            }
        }
    },
};
