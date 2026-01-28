const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rolelist')
        .setDescription('List all server roles (Founder Only)'),

    async execute(interaction, client) {
        // Permission Check (Founder)
        const founderRole = config.roles.founder;
        if (!interaction.member.roles.cache.has(founderRole) && !interaction.member.permissions.has('Administrator')) {
            return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
        }

        const roles = interaction.guild.roles.cache
            .filter(role => role.id !== interaction.guild.id)
            .sort((a, b) => b.position - a.position)
            .map(role => `${role.name} (${role.id})`)
            .join('\n');

        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('📜 Server Roles')
            .setDescription(roles.length > 0 ? roles : 'No roles found.')
            .setFooter({ text: 'Dark MAGA Bot' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
