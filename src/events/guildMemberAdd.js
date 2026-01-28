const { Events } = require('discord.js');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member, client) {
        // Autoroles
        try {
            const autoroles = await client.database.getAutoroles(member.guild.id);
            if (autoroles && autoroles.length > 0) {
                // Filter roles that still exist
                const validRoles = [];
                for (const roleId of autoroles) {
                    if (member.guild.roles.cache.has(roleId)) {
                        validRoles.push(roleId);
                    }
                }

                if (validRoles.length > 0) {
                    await member.roles.add(validRoles, 'Autorole assignment');
                    console.log(`Assigned autoroles to ${member.user.tag} in ${member.guild.name}`);
                }
            }
        } catch (error) {
            console.error('Error assigning autoroles:', error);
        }

        // Welcome Message
        try {
            const welcomeChannelId = await client.database.getWelcomeChannel(member.guild.id);
            if (welcomeChannelId) {
                const channel = member.guild.channels.cache.get(welcomeChannelId);
                if (channel) {
                    const embed = {
                        color: 0x00ff00,
                        title: 'Welcome to the Server!',
                        description: `Welcome to **${member.guild.name}**, ${member}! We're glad to have you here.`,
                        thumbnail: { url: member.user.displayAvatarURL({ dynamic: true, size: 256 }) },
                        footer: { text: 'Dark MAGA Bot' },
                        timestamp: new Date().toISOString()
                    };
                    await channel.send({ content: `${member}`, embeds: [embed] });
                }
            }
        } catch (error) {
            console.error('Error sending welcome message:', error);
        }
    }
};
