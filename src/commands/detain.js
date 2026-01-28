const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('detain')
        .setDescription('Detain a user (Mod+ Only)')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to detain')
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

            if (member.roles.cache.has(detainedRoleId)) {
                return interaction.editReply({ content: '❌ User is already detained.' });
            }

            // Get all roles except @everyone and detained role (and managed roles)
            const rolesToRemove = member.roles.cache.filter(r =>
                r.id !== interaction.guild.id &&
                r.id !== detainedRoleId &&
                !r.managed // Can't remove managed roles (like bot roles)
            );
            const roleIds = rolesToRemove.map(r => r.id);

            // Save the user's current roles
            if (roleIds.length > 0) {
                await client.database.saveDetainedUserRoles(user.id, interaction.guild.id, roleIds);
            }

            // Remove roles and add detained role
            if (rolesToRemove.size > 0) {
                await member.roles.remove(rolesToRemove, 'Detained by moderator');
            }
            await member.roles.add(detainedRoleId, 'Detained by moderator');

            const embed = new EmbedBuilder()
                .setColor(0xffa500)
                .setTitle('🚨 User Detained')
                .setDescription(`**${user}** has been detained.`)
                .addFields(
                    { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true },
                    { name: 'Roles Saved', value: roleIds.length > 0 ? `${roleIds.length} roles saved` : 'No roles to save', inline: false }
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
            console.error('Error detaining user:', error);
            await interaction.editReply({ content: '❌ An error occurred while trying to detain the user.' });
        }
    }
};
