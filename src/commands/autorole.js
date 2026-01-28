const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autorole')
        .setDescription('Manage autoroles (Founder Only)')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to add or remove from autoroles')
                .setRequired(true)),

    async execute(interaction, client) {
        // Permission Check (Founder)
        const founderRole = config.roles.founder;
        if (!interaction.member.roles.cache.has(founderRole) && !interaction.member.permissions.has('Administrator')) {
            return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
        }

        const role = interaction.options.getRole('role');

        // Check bot permissions
        if (!interaction.guild.members.me.permissions.has('ManageRoles')) {
            return interaction.reply({ content: '❌ I do not have permission to manage roles.', ephemeral: true });
        }

        if (role.position >= interaction.guild.members.me.roles.highest.position) {
            return interaction.reply({ content: '❌ I cannot manage this role as it is higher or equal to my highest role.', ephemeral: true });
        }

        // Get current autoroles
        const autoroles = await client.database.getAutoroles(interaction.guild.id);
        const roleIndex = autoroles.indexOf(role.id);

        if (roleIndex > -1) {
            // Remove
            autoroles.splice(roleIndex, 1);
            await client.database.saveAutoroles(interaction.guild.id, autoroles);

            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('❌ Autorole Removed')
                .setDescription(`**${role.name}** has been removed from autoroles.`)
                .setFooter({ text: 'Dark MAGA Bot' })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } else {
            // Add
            autoroles.push(role.id);
            await client.database.saveAutoroles(interaction.guild.id, autoroles);

            const embed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('✅ Autorole Added')
                .setDescription(`**${role.name}** has been added to autoroles.`)
                .setFooter({ text: 'Dark MAGA Bot' })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }
    }
};
