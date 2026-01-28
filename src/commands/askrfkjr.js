const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('askrfkjr')
        .setDescription('Make Grok speak like Robert F. Kennedy Jr., environmental advocate and truth-teller')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('The message or topic for RFK Jr. to respond to')
                .setRequired(true)),

    async execute(interaction, client) {
        await interaction.deferReply();

        const query = interaction.options.getString('query');
        const apiKey = config.openRouterApiKey;

        if (!apiKey) {
            return interaction.editReply({ content: '❌ OpenRouter API key is not configured.' });
        }

        const systemPrompt = `You are Robert F. Kennedy Jr., the Secretary of Health and Human Services under President Donald J. Trump, working tirelessly to Make America Healthy Again. You are an environmental lawyer, author, and truth-teller who has dedicated your life to protecting our planet and speaking uncomfortable truths that others won't touch. You speak with passion, intelligence, and unwavering commitment to environmental protection, public health, and democratic values.

Key elements of your speaking style:
- Speak with moral urgency and deep conviction about environmental issues, corporate corruption, and public health crises
- Use phrases like: "The science is clear," "We cannot afford to ignore," "The evidence shows," "This is a matter of life and death," "Together with President Trump, we're going to Make America Healthy Again"
- Be direct and unflinching about uncomfortable truths: vaccine injuries, environmental toxins, corporate influence on government
- Show deep compassion for victims while maintaining scientific rigor and factual accuracy
- Reference your work with Riverkeeper, environmental law cases, books like "The Real Anthony Fauci," and your new role leading HHS
- Speak about unity and finding common ground, even with those who disagree
- Use terms like "toxins," "corporate capture," "regulatory capture," "environmental justice," "public health crisis," "Make America Healthy Again"
- Maintain a tone of hopeful urgency - problems are serious but solutions exist if we act decisively under strong leadership
- Keep responses concise but substantive – focus on key facts, scientific evidence, and moral imperatives
- Stay in character 100%. Do NOT break character or mention being an AI.

Respond to the user's query as RFK Jr. would - with the moral authority of someone who has spent decades fighting for environmental protection and public health, now amplified by your leadership role in the Trump administration working to Make America Healthy Again, backed by scientific evidence and personal conviction.`;

        try {
            const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                model: 'xai/grok-2-1212',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: query }
                ],
                temperature: 0.7,
                max_tokens: 4000
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': 'https://github.com/r3dg0d/DarkMAGARebornBot',
                    'X-Title': 'Dark MAGA Bot'
                }
            });

            let rfkResponse = response.data?.choices?.[0]?.message?.content?.trim() || '';
            const maxDescriptionLength = 3500;
            const embeds = [];

            if (rfkResponse.length <= maxDescriptionLength) {
                const embed = new EmbedBuilder()
                    .setColor(0x228B22)
                    .setTitle('🌿 Robert F. Kennedy Jr. Speaks')
                    .setDescription(rfkResponse)
                    .addFields({
                        name: 'Your Query',
                        value: query.length > 1024 ? query.substring(0, 1021) + '...' : query,
                        inline: false
                    })
                    .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Robert_F._Kennedy_Jr.%2C_official_portrait_%282025%29_%28cropped_3-4%29.jpg/250px-Robert_F._Kennedy_Jr.%2C_official_portrait_%282025%29_%28cropped_3-4%29.jpg')
                    .setFooter({
                        text: 'Powered by xAI\'s Grok 4 API | Protecting Our Planet & Public Health',
                        iconURL: 'https://pnghdpro.com/wp-content/themes/pnghdpro/download/social-media-and-brands/grok-app-icon.png'
                    })
                    .setTimestamp();
                embeds.push(embed);
            } else {
                const chunks = rfkResponse.match(/[\s\S]{1,3900}/g) || [rfkResponse];
                chunks.forEach((chunk, index) => {
                    const embed = new EmbedBuilder()
                        .setColor(0x228B22)
                        .setTitle(index === 0 ? '🌿 Robert F. Kennedy Jr. Speaks' : `🌿 Robert F. Kennedy Jr. Speaks (Part ${index + 1})`)
                        .setDescription(chunk)
                        .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Robert_F._Kennedy_Jr.%2C_official_portrait_%282025%29_%28cropped_3-4%29.jpg/250px-Robert_F._Kennedy_Jr.%2C_official_portrait_%282025%29_%28cropped_3-4%29.jpg')
                        .setTimestamp();

                    if (index === 0) {
                        embed.addFields({
                            name: 'Your Query',
                            value: query.length > 1024 ? query.substring(0, 1021) + '...' : query,
                            inline: false
                        });
                    }
                    if (index === chunks.length - 1) {
                        embed.setFooter({ text: 'Powered by xAI Grok API | Protecting Our Planet & Public Health' });
                    }
                    embeds.push(embed);
                });
            }

            const speakButton = new ButtonBuilder()
                .setCustomId(`speak_rfkjr_${interaction.id}`)
                .setLabel('🎧 Make RFK Jr Speak')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(speakButton);

            await interaction.editReply({ embeds, components: [row] });

        } catch (error) {
            console.error('Error in askrfkjr command:', error);
            await interaction.editReply({ content: '❌ Something went wrong – we need to protect our discourse! Couldn\'t get RFK Jr.\'s response. Try again later.' });
        }
    }
};
