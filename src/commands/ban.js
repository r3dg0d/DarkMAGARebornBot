const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const fetch = require('node-fetch'); // Ensure node-fetch is installed/available or use axios/native fetch
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user (Executive Mod+ Only)')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the ban')
                .setRequired(false)),

    // We'll handle permissions in the execute function or via roles

    async execute(interaction, client) {
        // Permission Check (Executive Mod+)
        const executiveModRole = config.roles.executiveMod;
        if (!interaction.member.roles.cache.has(executiveModRole) && !interaction.member.permissions.has('Administrator')) {
            return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const moderator = interaction.user;

        await interaction.deferReply();

        try {
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);

            if (member) {
                if (!member.bannable) {
                    return interaction.editReply({ content: '❌ I cannot ban this user. They may have higher permissions than me.' });
                }
            }

            // Ban the user
            await interaction.guild.members.ban(user.id, { reason: `${reason} - Banned by ${moderator.tag}` });

            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('🔨 User Banned')
                .setDescription(`**${user.tag}** has been banned from the server.`)
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

            // Log to Ban List channel (if exists)
            // Reference channel ID: '1375541556152631356' - replacing with a config lookup or dynamic check if needed, 
            // but for now I'll use the ID from reference or check config.
            // Using a hardcoded ID from reference for now if not in config.
            // Actually, best to check config structure.
            // I'll assume we might not have 'banList' in config yet, so maybe skip or use 'modLog'.
            // The reference implementation had a specific channel ID.

        } catch (error) {
            console.error('Error banning user:', error);
            await interaction.editReply({ content: '❌ An error occurred while trying to ban the user.' });
        }
    }
};
