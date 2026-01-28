const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Remove messages (Executive Mod+ Only)')
        .addIntegerOption(option =>
            option.setName('number')
                .setDescription('Number of messages to delete (1-100)') // Discord limit is usually 100 per bulk delete, reference said 10000 but loop handles it
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(10000)) // Allowing up to 10000 via loop
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Only delete messages from this user (optional)')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('confirm_large')
                .setDescription('Set to True to confirm purges over 500 messages')
                .setRequired(false)),

    async execute(interaction, client) {
        // Permission Check (Executive Mod+)
        const executiveModRole = config.roles.executiveMod;
        if (!interaction.member.roles.cache.has(executiveModRole) && !interaction.member.permissions.has('Administrator')) {
            return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
        }

        const number = interaction.options.getInteger('number');
        const user = interaction.options.getUser('user');
        const confirmLarge = interaction.options.getBoolean('confirm_large') || false;

        if (number > 500 && !confirmLarge) {
            return interaction.reply({
                content: `⚠️ You are about to delete ${number} messages. Set \`confirm_large\` to true to confirm this action.`,
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            let deletedCount = 0;
            let lastMessageId = null;

            // Loop to handle > 100 messages
            while (deletedCount < number) {
                const limit = Math.min(100, number - deletedCount);
                const options = { limit };

                if (lastMessageId) {
                    options.before = lastMessageId;
                }

                // Fetch messages
                const messages = await interaction.channel.messages.fetch(options);

                if (messages.size === 0) break;

                // Filter by user if specified
                const messagesToDelete = user
                    ? messages.filter(msg => msg.author.id === user.id)
                    : messages;

                if (messagesToDelete.size === 0) {
                    // Update lastMessageId to skip these messages in next fetch if we couldn't delete any
                    // Actually, if we filter, we might just be skipping. 
                    // This logic in reference is a bit simple, it might get stuck if many messages are not from user.
                    // But we'll stick to reference logic for now or simple improvement.
                    // If filtering by user, we should fetch more until we find enough or run out. 
                    // But bulkDelete acts on specific message IDs.

                    // If we found messages but none matched the user, we still need to advance 'lastMessageId' to avoid infinite loop of fetching same messages.
                    lastMessageId = messages.last().id;
                    continue;
                }

                // Bulk delete
                // messagesToDelete is a Collection, we need array or collection
                // Also filter out messages older than 14 days
                const validMessages = messagesToDelete.filter(msg => Date.now() - msg.createdTimestamp < 1209600000); // 14 days in ms

                if (validMessages.size > 0) {
                    await interaction.channel.bulkDelete(validMessages, true);
                    deletedCount += validMessages.size;
                }

                // If we hit 14 day limit (some messages were invalid), we should stop or handle explicitly?
                // Reference didn't seem to handle 14 day limit explicitly other than error catch.

                lastMessageId = messages.last().id;

                // Delay
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            const embed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('🧹 Messages Purged')
                .setDescription(`Successfully deleted **${deletedCount}** messages.`)
                .addFields(
                    { name: 'Channel', value: interaction.channel.name, inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true }
                )
                .setFooter({ text: 'Dark MAGA Bot' })
                .setTimestamp();

            if (user) {
                embed.addFields({ name: 'Filtered User', value: user.tag, inline: true });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error purging messages:', error);
            await interaction.editReply({
                content: '❌ An error occurred. Note: Messages older than 14 days cannot be bulk deleted.'
            });
        }
    }
};
