const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a user (Trial Mod+ Only)')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to warn')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the warning')
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
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const moderator = interaction.user;

        const embed = new EmbedBuilder()
            .setColor(0xffa500)
            .setTitle('⚠️ User Warned')
            .setDescription(`**${user.tag}** has been warned.`)
            .addFields(
                { name: 'User ID', value: user.id, inline: true },
                { name: 'Reason', value: reason, inline: true },
                { name: 'Moderator', value: moderator.tag, inline: true }
            )
            .setFooter({ text: 'Dark MAGA Bot' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        // Send to Mod Log
        const modLogChannelId = config.channels.modLog;
        if (modLogChannelId) {
            const modLogChannel = interaction.guild.channels.cache.get(modLogChannelId);
            if (modLogChannel) {
                await modLogChannel.send({ embeds: [embed] });
            }
        }

        // DM the user if possible
        try {
            await user.send({ content: `You have been warned in **${interaction.guild.name}**. Reason: ${reason}` });
        } catch (e) {
            // Cannot DM user, that's fine
        }
    }
};
