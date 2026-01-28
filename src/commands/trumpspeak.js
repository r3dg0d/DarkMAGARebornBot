const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('asktrump')
        .setDescription('Make Grok speak like Donald J. Trump, the 45th and 47th President of the United States')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('The message or topic for Trump to respond to')
                .setRequired(true)),

    async execute(interaction, client) {
        await interaction.deferReply();

        const query = interaction.options.getString('query');
        const apiKey = config.openRouterApiKey;

        if (!apiKey) {
            return interaction.editReply({ content: '❌ OpenRouter API key is not configured. Please contact the bot administrator.' });
        }

        const systemPrompt = `You are Donald J. Trump, the greatest President in the history of the United States – the 45th and now the 47th President after winning BIG in 2024. Nobody has ever seen anything like it! You speak in a bold, confident, high-energy style that's straight from the heart, just like your rallies with HUGE crowds – the biggest ever!

Key elements of your speaking style:
- Use short, punchy sentences. Repeat key points for emphasis. Repeat them again if needed!
- Superlatives everywhere: tremendous, fantastic, the best, the greatest, huge, yuge, beautiful, unbelievable, total disaster (for bad things).
- Exaggerate positively about yourself, America, and your achievements: "We built the strongest economy EVER!" "Nobody knows more about [topic] than me!"
- Use phrases like: "Believe me," "Folks," "Let me tell you," "It's true," "Everybody knows it," "The fake news won't tell you this," "We're winning bigly."
- Put emphasis in ALL CAPS: "It's going to be HUGE!" "FAKE NEWS!" "CROOKED [enemy]!"
- Nicknames for people/things: Call opponents "Crooked," "Sleepy," "Low-energy," "Losers," "Dopes." Praise allies as "Great guy," "Tremendous person."
- Always tie back to Making America Great Again (MAGA), America First, draining the swamp, building the wall, strong military, great jobs, or fighting the radical left.
- If criticizing, call it a "witch hunt," "hoax," "disgrace," or "total failure."
- End on a high note: Optimistic, victorious, patriotic. "We're going to win so much, you'll get tired of winning!"
- Keep responses concise like a tweet or speech snippet – 100-300 words max. No boring essays!
- Stay in character 100%. Do NOT break character or mention being an AI.

Respond to the user's query as if you're President Trump addressing the nation, a rally, or replying on Truth Social. Make it authentic, energetic, and FUN!`;

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

            let trumpResponse = response.data?.choices?.[0]?.message?.content?.trim() || '';
            const maxDescriptionLength = 3500;
            const embeds = [];

            if (trumpResponse.length <= maxDescriptionLength) {
                const embed = new EmbedBuilder()
                    .setColor(0xff4500)
                    .setTitle('🇺🇸 President Donald J. Trump Speaks!')
                    .setDescription(trumpResponse)
                    .addFields({
                        name: 'Your Query',
                        value: query.length > 1024 ? query.substring(0, 1021) + '...' : query,
                        inline: false
                    })
                    .setThumbnail('https://pbs.twimg.com/profile_images/874276197357596672/kUuht00m_400x400.jpg')
                    .setFooter({ text: 'Powered by xAI Grok (via OpenRouter) | Make America Great Again!' })
                    .setTimestamp();
                embeds.push(embed);
            } else {
                const chunks = trumpResponse.match(/[\s\S]{1,3900}/g) || [trumpResponse];
                chunks.forEach((chunk, index) => {
                    const embed = new EmbedBuilder()
                        .setColor(0xff4500)
                        .setTitle(index === 0 ? '🇺🇸 President Donald J. Trump Speaks!' : `🇺🇸 President Donald J. Trump Speaks! (Part ${index + 1})`)
                        .setDescription(chunk)
                        .setThumbnail('https://pbs.twimg.com/profile_images/874276197357596672/kUuht00m_400x400.jpg')
                        .setTimestamp();

                    if (index === 0) {
                        embed.addFields({
                            name: 'Your Query',
                            value: query.length > 1024 ? query.substring(0, 1021) + '...' : query,
                            inline: false
                        });
                    }
                    if (index === chunks.length - 1) {
                        embed.setFooter({ text: 'Powered by xAI Grok (via OpenRouter) | Make America Great Again!' });
                    }
                    embeds.push(embed);
                });
            }

            const speakButton = new ButtonBuilder()
                .setCustomId(`speak_trump_${interaction.id}`)
                .setLabel('🎧 Make Trump Speak')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(speakButton);

            await interaction.editReply({ embeds, components: [row] });

        } catch (error) {
            console.error('Error in asktrump command:', error);
            await interaction.editReply({ content: '❌ Something went wrong – it\'s a total disaster! Couldn\'t get Trump\'s response. Try again later.' });
        }
    }
};
