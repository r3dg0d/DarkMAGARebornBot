const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Show the server leveling leaderboard')
        .addIntegerOption(option =>
            option.setName('limit')
                .setDescription('Number of users to show (1-20)')
                .setMinValue(1)
                .setMaxValue(20)
                .setRequired(false)),

    async execute(interaction, client) {
        const limit = interaction.options.getInteger('limit') || 10;

        await interaction.deferReply();

        try {
            // Get leaderboard data from LevelSystem
            const leaderboard = await client.levelSystem.getLeaderboard(interaction.guild.id, limit);

            if (!leaderboard || leaderboard.length === 0) {
                return interaction.editReply({
                    content: 'No leveling data found for this server yet. Start chatting to earn XP!'
                });
            }

            // Build leaderboard description
            let description = '';
            for (let i = 0; i < leaderboard.length; i++) {
                const userData = leaderboard[i];
                let username = 'Unknown User';
                try {
                    const user = await client.users.fetch(userData.id).catch(() => null);
                    if (user) username = user.username;
                } catch (e) { /* ignore */ }

                const rankName = client.levelSystem.getRankName(userData.level);
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**${i + 1}.**`;

                description += `${medal} **${username}**\n`;
                description += `└ ${rankName} (Level ${userData.level}) • ${userData.xp.toLocaleString()} XP\n\n`;
            }

            const embed = new EmbedBuilder()
                .setColor(0xffd700)
                .setTitle('🏆 Server Leaderboard')
                .setDescription(description)
                .setFooter({ text: `Dark MAGA Bot - Top ${leaderboard.length} Patriots` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error getting leaderboard:', error);
            await interaction.editReply({ content: '❌ An error occurred while fetching the leaderboard.' });
        }
    }
};
