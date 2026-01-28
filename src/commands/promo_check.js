const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const moment = require('moment');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('promo_check')
        .setDescription('Check rank and estimated time to the next level')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to check (leave empty to check yourself)')
                .setRequired(false)),

    async execute(interaction, client) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const userId = targetUser.id;
        const guildId = interaction.guild.id;

        const userData = await client.database.getUserLevel(userId, guildId);

        if (!userData || userData.message_count === 0) {
            const message = targetUser.id === interaction.user.id
                ? 'You haven\'t sent any messages yet. Start chatting to earn ranks!'
                : `${targetUser.tag} hasn't sent any messages yet.`;

            await interaction.reply({
                content: message,
                ephemeral: true
            });
            return;
        }

        const level = userData.level;
        const messageCount = userData.message_count || 0;
        const rankName = client.levelSystem.getRankName(level);

        // Calculate messages needed for next level
        let messagesNeeded = 0;
        try {
            const messagesForNextLevel = client.levelSystem.messagesForLevel(level + 1);
            messagesNeeded = messagesForNextLevel - messageCount;
        } catch (error) {
            console.error('Error calculating messages for next level:', error);
            messagesNeeded = 0;
        }

        let timeEstimate = 'N/A';
        if (level < 100 && userData.first_message_date) {
            try {
                const estimatedMinutes = client.levelSystem.estimateTimeToNextLevel(
                    messageCount,
                    level,
                    userData.first_message_date
                );

                if (estimatedMinutes !== null) {
                    const hours = Math.floor(estimatedMinutes / 60);
                    const minutes = estimatedMinutes % 60;
                    timeEstimate = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                }
            } catch (error) {
                console.error('Error calculating time estimate:', error);
                timeEstimate = 'N/A';
            }
        }

        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('🇺🇸 Rank Check')
            .setDescription(`**${targetUser.tag}**`)
            .addFields(
                {
                    name: 'Current Rank',
                    value: rankName,
                    inline: true
                },
                {
                    name: 'Level',
                    value: level.toString(),
                    inline: true
                },
                {
                    name: 'Total XP',
                    value: userData.xp.toString(),
                    inline: true
                },
                {
                    name: 'Messages',
                    value: messageCount.toString(),
                    inline: true
                },
                {
                    name: 'Messages to Next Level',
                    value: level >= 100 ? 'Max Level!' : messagesNeeded.toString(),
                    inline: true
                },
                {
                    name: 'Estimated Time to Next Level',
                    value: timeEstimate,
                    inline: true
                }
            );

        // Only show first message date if it exists
        if (userData.first_message_date && userData.first_message_date !== new Date().toISOString()) {
            embed.addFields({
                name: 'First Message',
                value: moment(userData.first_message_date).format('MMM DD, YYYY'),
                inline: true
            });
        }

        embed.setFooter({ text: 'Dark MAGA Bot - Keep chatting to rank up!' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
