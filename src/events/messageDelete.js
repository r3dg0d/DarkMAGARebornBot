const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageDelete,
    execute(message, client) {
        if (!message.author || message.author.bot) return;

        client.lastDeletedMessage = {
            content: message.content,
            author: message.author,
            channel: message.channel,
            timestamp: new Date(),
            image: message.attachments.first() ? message.attachments.first().proxyURL : null
        };
    },
};
