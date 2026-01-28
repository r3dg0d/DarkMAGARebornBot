const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a user (Trial Mod+ Only)')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to timeout')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Duration in minutes')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(40320)) // 4 weeks max
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the timeout')
                .setRequired(false)),

    async execute(interaction, client) {
        // Permission Check (Trial Mod+)
        const trialModRole = config.roles.trialMod;
        const modRole = config.roles.mod;
        const executiveModRole = config.roles.executiveMod;
        const hasPerms = interaction.member.roles.cache.has(trialModRole) ||
            interaction.member.roles.cache.has(modRole) ||
            interaction.member.roles.cache.has(executiveModRole) ||
            interaction.member.permissions.has('Administrator');

        if (!hasPerms) {
            return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const duration = interaction.options.getInteger('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const moderator = interaction.user;

        await interaction.deferReply();

        try {
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);

            if (!member) {
                return interaction.editReply({ content: '❌ User not found.' });
            }

            if (!member.moderatable) {
                return interaction.editReply({ content: '❌ I cannot timeout this user.' });
            }

            await member.timeout(duration * 60 * 1000, `${reason} - Time out by ${moderator.tag}`);

            const embed = new EmbedBuilder()
                .setColor(0xffa500)
                .setTitle('⏳ User Timed Out')
                .setDescription(`**${user.tag}** has been timed out for ${duration} minutes.`)
                .addFields(
                    { name: 'User ID', value: user.id, inline: true },
                    { name: 'Reason', value: reason, inline: true },
                    { name: 'Moderator', value: moderator.tag, inline: true }
                )
                .setFooter({ text: 'Dark MAGA Bot' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

            // Send to Mod Log
            const modLogChannelId = config.channels.modLog;
            if (modLogChannelId) {
                const modLogChannel = interaction.guild.channels.cache.get(modLogChannelId);
                if (modLogChannel) {
                    await modLogChannel.send({ embeds: [embed] });
                }
            }

        } catch (error) {
            console.error('Error timing out user:', error);
            await interaction.editReply({ content: '❌ An error occurred while timing out the user.' });
        }
    }
};
