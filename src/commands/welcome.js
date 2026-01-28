const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcome')
        .setDescription('Configure welcome channel (Founder Only)')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to send welcome messages in')
                .setRequired(true)),

    async execute(interaction, client) {
        // Permission Check (Founder)
        const founderRole = config.roles.founder;
        if (!interaction.member.roles.cache.has(founderRole) && !interaction.member.permissions.has('Administrator')) {
            return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
        }

        const channel = interaction.options.getChannel('channel');

        if (!channel.isTextBased()) {
            return interaction.reply({ content: '❌ Please select a text channel.', ephemeral: true });
        }

        await client.database.saveWelcomeChannel(interaction.guild.id, channel.id);

        await interaction.reply({ content: `✅ Welcome channel set to ${channel}.` });
    }
};
