const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('release')
        .setDescription('Release a user from detention (Mod+ Only)')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to release')
                .setRequired(true)),

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
        const detainedRoleId = config.roles.detained;

        if (!detainedRoleId) {
            return interaction.reply({ content: '❌ Detained role is not configured.', ephemeral: true });
        }

        await interaction.deferReply();

        try {
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);

            if (!member) {
                return interaction.editReply({ content: '❌ User not found in this server.' });
            }

            if (!member.roles.cache.has(detainedRoleId)) {
                return interaction.editReply({ content: '❌ User is not detained.' });
            }

            // Retrieve saved roles
            const savedRoleIds = await client.database.getDetainedUserRoles(user.id, interaction.guild.id);

            // Remove detained role
            await member.roles.remove(detainedRoleId, 'Released by moderator');

            // Restore roles
            let restoredCount = 0;
            if (savedRoleIds && savedRoleIds.length > 0) {
                // Filter out roles that might have been deleted or invalid
                const validRoles = [];
                for (const roleId of savedRoleIds) {
                    if (interaction.guild.roles.cache.has(roleId)) {
                        validRoles.push(roleId);
                    }
                }

                if (validRoles.length > 0) {
                    await member.roles.add(validRoles, 'Roles restored upon release');
                    restoredCount = validRoles.length;
                }

                // Clear from DB
                await client.database.removeDetainedUserRoles(user.id, interaction.guild.id);
            }

            const embed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('🔓 User Released')
                .setDescription(`**${user.tag}** has been released from detention.`)
                .addFields(
                    { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true },
                    { name: 'Roles Restored', value: `${restoredCount} roles restored`, inline: false }
                )
                .setFooter({ text: 'Dark MAGA Bot' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

            // Send log to jail-log channel
            const jailLogChannelId = config.channels.jailLog;
            if (jailLogChannelId) {
                const jailLogChannel = interaction.guild.channels.cache.get(jailLogChannelId);
                if (jailLogChannel) {
                    await jailLogChannel.send({ embeds: [embed] });
                }
            }

        } catch (error) {
            console.error('Error releasing user:', error);
            await interaction.editReply({ content: '❌ An error occurred while releasing the user.' });
        }
    }
};
