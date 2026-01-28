const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user (Mod+ Only)')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the kick')
                .setRequired(false)),

    async execute(interaction, client) {
        // Permission Check (Mod+)
        const modRole = config.roles.mod;
        const executiveModRole = config.roles.executiveMod;
        const hasPerms = interaction.member.roles.cache.has(modRole) ||
            interaction.member.roles.cache.has(executiveModRole) ||
            interaction.member.permissions.has('Administrator');

        if (!hasPerms) {
            return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const moderator = interaction.user;

        await interaction.deferReply();

        try {
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);

            if (!member) {
                return interaction.editReply({ content: '❌ User not found in this server.' });
            }

            if (!member.kickable) {
                return interaction.editReply({ content: '❌ I cannot kick this user. They may have higher permissions than me.' });
            }

            await member.kick(`${reason} - Kicked by ${moderator.tag}`);

            const embed = new EmbedBuilder()
                .setColor(0xffa500)
                .setTitle('👢 User Kicked')
                .setDescription(`**${user.tag}** has been kicked from the server.`)
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
            console.error('Error kicking user:', error);
            await interaction.editReply({ content: '❌ An error occurred while trying to kick the user.' });
        }
    }
};
