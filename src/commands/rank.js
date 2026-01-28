const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Check your rank and level progress')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to check rank for (optional)')
                .setRequired(false)),

    async execute(interaction, client) {
        const targetUser = interaction.options.getUser('user') || interaction.user;

        await interaction.deferReply();

        try {
            const userData = await client.database.getUserLevel(targetUser.id, interaction.guild.id);
            const level = userData.level;
            const currentXp = userData.xp;
            const rankName = client.levelSystem.getRankName(level);

            // Calculate progress
            const progress = client.levelSystem.getLevelProgress(currentXp, level);

            // Create progress bar
            const progressBarLength = 20;
            const filledBars = Math.round((progress.percentage / 100) * progressBarLength);
            const emptyBars = progressBarLength - filledBars;
            const progressBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);

            const embed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle(`📊 ${targetUser.username}'s Rank`)
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: '🏆 Rank', value: rankName, inline: true },
                    { name: '📈 Level', value: level.toString(), inline: true },
                    { name: '✨ Total XP', value: currentXp.toLocaleString(), inline: true },
                    {
                        name: '📊 Progress',
                        value: `${progressBar} ${progress.percentage}%\n(${progress.current} / ${progress.needed} XP to next level)`,
                        inline: false
                    }
                )
                .setFooter({ text: 'Dark MAGA Bot - Leveling System' })
                .setTimestamp();

            if (level >= 100) {
                embed.addFields({
                    name: '🎉 Max Level Reached!',
                    value: 'You have achieved the highest rank! Keep being awesome!',
                    inline: false
                });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error getting rank:', error);
            await interaction.editReply({ content: '❌ An error occurred while fetching rank data.' });
        }
    }
};
