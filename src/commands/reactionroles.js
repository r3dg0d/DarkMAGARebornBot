const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reactionroles')
        .setDescription('Setup reaction roles (Founder Only)')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('Title for the reaction role embed')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('Description text for the embed')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('roles')
                .setDescription('Roles to include (mention them separated by spaces)')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('permanent')
                .setDescription('Whether roles are permanent (true) or toggleable (false)')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('max_roles')
                .setDescription('Maximum number of roles a user can have (optional)')
                .setRequired(false)),

    async execute(interaction, client) {
        // Permission Check (Founder)
        const founderRole = config.roles.founder;
        if (!interaction.member.roles.cache.has(founderRole) && !interaction.member.permissions.has('Administrator')) {
            return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
        }

        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const rolesText = interaction.options.getString('roles');
        const permanent = interaction.options.getBoolean('permanent') || false;
        const maxRoles = interaction.options.getInteger('max_roles');

        // Parse role mentions
        const roleMatches = rolesText.match(/<@&(\d+)>/g);
        if (!roleMatches) {
            return interaction.reply({ content: '❌ Please mention the roles you want to include.', ephemeral: true });
        }

        const roles = [];
        const rolesData = {};
        const seenRoleIds = new Set();
        let buttonIndex = 0;

        for (const match of roleMatches) {
            const roleId = match.replace(/[<@&>]/g, '');
            if (seenRoleIds.has(roleId)) continue;

            const role = interaction.guild.roles.cache.get(roleId);
            if (role) {
                roles.push(role);
                rolesData[roleId] = { name: role.name, id: roleId, customId: `reaction_role_${role.id}_${buttonIndex}` };
                seenRoleIds.add(roleId);
                buttonIndex++;
            }
        }

        if (roles.length === 0) {
            return interaction.reply({ content: '❌ No valid roles found.', ephemeral: true });
        }

        // Create Embed
        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle(title)
            .setDescription(description)
            .addFields({
                name: 'Available Roles',
                value: roles.map(r => `• ${r.name}`).join('\n')
            });

        if (maxRoles) embed.addFields({ name: 'Max Roles', value: `${maxRoles}`, inline: true });
        if (permanent) embed.addFields({ name: 'Type', value: 'Permanent', inline: true });

        embed.setFooter({ text: 'Dark MAGA Bot' });

        // Create Buttons
        const rows = [];
        let currentRow = new ActionRowBuilder();

        roles.forEach((role, index) => {
            const button = new ButtonBuilder()
                .setCustomId(rolesData[role.id].customId)
                .setLabel(role.name.length > 80 ? role.name.substring(0, 77) + '...' : role.name)
                .setStyle(ButtonStyle.Primary);

            currentRow.addComponents(button);

            if ((index + 1) % 5 === 0 || index === roles.length - 1) {
                rows.push(currentRow);
                currentRow = new ActionRowBuilder();
            }
        });

        if (rows.length > 5) {
            return interaction.reply({ content: '❌ Too many roles (max 25).', ephemeral: true });
        }

        try {
            const message = await interaction.channel.send({ embeds: [embed], components: rows });

            // Save to DB
            await client.database.saveReactionRoleMessage(
                interaction.guild.id,
                interaction.channel.id,
                message.id,
                rolesData,
                permanent,
                maxRoles
            );

            await interaction.reply({ content: '✅ Reaction role setup created!', ephemeral: true });

        } catch (error) {
            console.error('Error creating reaction roles:', error);
            await interaction.reply({ content: '❌ Error creating message.', ephemeral: true });
        }
    }
};
