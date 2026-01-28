const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('asksamaltman')
        .setDescription('Make Grok speak like Sam Altman, CEO of OpenAI and AI visionary')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('The message or topic for Sam Altman to respond to')
                .setRequired(true)),

    async execute(interaction, client) {
        await interaction.deferReply();

        const query = interaction.options.getString('query');
        const apiKey = config.openRouterApiKey;

        if (!apiKey) {
            return interaction.editReply({ content: '❌ OpenRouter API key is not configured.' });
        }

        const systemPrompt = `You are Sam Altman, CEO of OpenAI and a leading voice in artificial intelligence. You're a thoughtful, articulate leader who thinks deeply about the future of AI and its implications for humanity. You speak with measured optimism, technical precision, and genuine concern for AI safety and alignment.

Key elements of your speaking style:
- Speak thoughtfully and deliberately: "I think the key insight here is," "What's really interesting about this," "The way I think about it is"
- Use precise technical language: "AI alignment," "AGI," "scaling laws," "emergence," "capabilities vs. alignment," "compute scaling"
- Be optimistic but cautious about AI: "AI will be incredibly powerful," "We need to be careful about alignment," "The future could be amazing if we get this right"
- Reference OpenAI's mission: "Our mission is to ensure AGI benefits all of humanity," "We're building AI that's safe and beneficial"
- Use phrases like: "I believe," "The research suggests," "We're seeing," "It's important to note," "The key question is"
- Show concern for safety: "AI safety is paramount," "We need to solve alignment," "The stakes are incredibly high"
- Be humble and acknowledge uncertainty: "I don't know for sure," "It's still early," "We're learning as we go"
- Reference specific AI concepts: transformer architecture, reinforcement learning, RLHF, scaling, emergent capabilities
- Keep responses thoughtful and substantive – 150-400 words. No fluff!
- Stay in character 100%. Do NOT break character or mention being an AI.

Respond to the user's query as if you're Sam Altman addressing the topic with your characteristic blend of technical expertise, thoughtful analysis, and genuine concern for humanity's future with AI. Make it authentic and insightful!`;

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

            let samResponse = response.data?.choices?.[0]?.message?.content?.trim() || '';
            const maxDescriptionLength = 3500;
            const embeds = [];

            if (samResponse.length <= maxDescriptionLength) {
                const embed = new EmbedBuilder()
                    .setColor(0x00a8ff)
                    .setTitle('🤖 Sam Altman Speaks!')
                    .setDescription(samResponse)
                    .addFields({
                        name: 'Your Query',
                        value: query.length > 1024 ? query.substring(0, 1021) + '...' : query,
                        inline: false
                    })
                    .setThumbnail('https://pbs.twimg.com/profile_images/1701878932176351232/8gQB3h1a_400x400.jpg')
                    .setFooter({
                        text: 'Powered by xAI\'s Grok 4 API | Ensuring AGI Benefits All of Humanity',
                        iconURL: 'https://pnghdpro.com/wp-content/themes/pnghdpro/download/social-media-and-brands/grok-app-icon.png'
                    })
                    .setTimestamp();
                embeds.push(embed);
            } else {
                const chunks = samResponse.match(/[\s\S]{1,3900}/g) || [samResponse];
                chunks.forEach((chunk, index) => {
                    const embed = new EmbedBuilder()
                        .setColor(0x00a8ff)
                        .setTitle(index === 0 ? '🤖 Sam Altman Speaks!' : `🤖 Sam Altman Speaks! (Part ${index + 1})`)
                        .setDescription(chunk)
                        .setThumbnail('https://pbs.twimg.com/profile_images/1701878932176351232/8gQB3h1a_400x400.jpg')
                        .setTimestamp();

                    if (index === 0) {
                        embed.addFields({
                            name: 'Your Query',
                            value: query.length > 1024 ? query.substring(0, 1021) + '...' : query,
                            inline: false
                        });
                    }
                    if (index === chunks.length - 1) {
                        embed.setFooter({ text: 'Powered by xAI Grok API | Ensuring AGI Benefits All of Humanity' });
                    }
                    embeds.push(embed);
                });
            }

            const speakButton = new ButtonBuilder()
                .setCustomId(`speak_samaltman_${interaction.id}`)
                .setLabel('🎧 Make Sam Speak')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(speakButton);

            await interaction.editReply({ embeds, components: [row] });

        } catch (error) {
            console.error('Error in asksamaltman command:', error);
            await interaction.editReply({ content: '❌ Something went wrong – we need to ensure AI safety! Couldn\'t get Sam\'s response. Try again later.' });
        }
    }
};
