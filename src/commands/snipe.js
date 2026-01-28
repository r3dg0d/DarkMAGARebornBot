const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('snipe')
        .setDescription('Fetch last deleted message'),

    async execute(interaction, client) {
        if (!client.lastDeletedMessage) {
            await interaction.reply({ content: 'No deleted message to snipe!', ephemeral: true });
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('🔫 Message Sniped!')
            .setDescription(client.lastDeletedMessage.content || 'No content (image?)')
            .addFields(
                {
                    name: 'Author',
                    value: client.lastDeletedMessage.author.tag,
                    inline: true
                },
                {
                    name: 'Channel',
                    value: client.lastDeletedMessage.channel.name,
                    inline: true
                },
                {
                    name: 'Time',
                    value: client.lastDeletedMessage.timestamp.toLocaleString(),
                    inline: true
                }
            )
            .setFooter({ text: 'Dark MAGA Bot' })
            .setTimestamp();

        if (client.lastDeletedMessage.image) {
            embed.setImage(client.lastDeletedMessage.image);
        }

        await interaction.reply({ embeds: [embed] });
    }
};
