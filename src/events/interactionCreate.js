const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (interaction.isChatInputCommand()) {
            await client.commandHandler.handleCommand(interaction);
        } else if (interaction.isButton()) {
            // Reaction Roles
            if (interaction.customId.startsWith('reaction_role_')) {
                const parts = interaction.customId.split('_');
                // Format: reaction_role_roleId_index
                const roleId = parts[2];
                const role = interaction.guild.roles.cache.get(roleId);

                if (!role) {
                    return interaction.reply({ content: '❌ Role not found.', ephemeral: true });
                }

                try {
                    const member = interaction.member;
                    if (member.roles.cache.has(roleId)) {
                        // Check if permanent (we need to fetch DB for this, but for now let's assume toggleable unless we check message settings)
                        // To properly check permanence, we need the message ID.
                        // However, button interaction contains message.id
                        const rrSettings = await client.database.getReactionRoleMessage(interaction.guild.id, interaction.message.id);

                        if (rrSettings && rrSettings.permanent) {
                            return interaction.reply({ content: '❌ This role is permanent and cannot be removed.', ephemeral: true });
                        }

                        await member.roles.remove(role);
                        await interaction.reply({ content: `❌ Removed role: **${role.name}**`, ephemeral: true });
                    } else {
                        // Check max roles limits
                        const rrSettings = await client.database.getReactionRoleMessage(interaction.guild.id, interaction.message.id);
                        if (rrSettings && rrSettings.max_roles > 0) {
                            // Count how many roles from this message user has
                            const userRoles = member.roles.cache;
                            let count = 0;
                            const availableRoles = rrSettings.roles; // Object of roles

                            for (const rId of Object.keys(availableRoles)) {
                                if (userRoles.has(rId)) count++;
                            }

                            if (count >= rrSettings.max_roles) {
                                return interaction.reply({ content: `❌ You can only select up to ${rrSettings.max_roles} roles.`, ephemeral: true });
                            }
                        }

                        await member.roles.add(role);
                        await interaction.reply({ content: `✅ Added role: **${role.name}**`, ephemeral: true });
                    }
                } catch (error) {
                    console.error('Error handling reaction role:', error);
                    await interaction.reply({ content: '❌ Failed to update roles.', ephemeral: true });
                }
            }
            // TTS Buttons (ask* commands) - Placeholder check
            else if (interaction.customId.startsWith('speak_')) {
                // Implement or delegate to specific handler if needed
                // For now, let's keep it here or separate file
                console.log(`TTS Button clicked: ${interaction.customId}`);
                await interaction.reply({ content: '🔊 TTS generation starting... (Placeholder)', ephemeral: true });
            }
        }
    },
};
