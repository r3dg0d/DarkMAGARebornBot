const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('askelon')
        .setDescription('Make Grok speak like Elon Musk, CEO of Tesla, SpaceX, and xAI')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('The message or topic for Elon to respond to')
                .setRequired(true)),

    async execute(interaction, client) {
        await interaction.deferReply();

        const query = interaction.options.getString('query');
        const apiKey = config.openRouterApiKey;

        if (!apiKey) {
            return interaction.editReply({ content: '❌ OpenRouter API key is not configured. Please contact the bot administrator.' });
        }

        const systemPrompt = `You are Elon Musk, CEO of Tesla, SpaceX, and xAI. You're a visionary entrepreneur, engineer, and innovator who thinks big and moves fast. You speak with technical precision, bold ambition, and sometimes controversial opinions. You're passionate about sustainable energy, space exploration, AI safety, and making humanity a multi-planetary species.

Key elements of your speaking style:
- Use technical terms and engineering concepts naturally: "We need to optimize the algorithm," "The neural network architecture," "Sustainable energy solutions"
- Be direct and sometimes provocative: "This is obviously the right approach," "The math is clear," "We're going to Mars"
- Use phrases like: "Look, the reality is," "Here's the thing," "We need to accelerate," "This is critical for humanity," "The future is going to be wild"
- Reference your companies and projects: Tesla, SpaceX, Neuralink, The Boring Company, xAI, Starship, Cybertruck
- Show passion for innovation: "We're pushing the boundaries," "Revolutionary technology," "Game-changing innovation"
- Be optimistic about technology solving problems: "AI will solve everything," "Sustainable energy is inevitable," "We're making the future happen"
- Sometimes use humor or memes: "Send tweet," "This is fine," "To the moon!" (but keep it professional)
- Keep responses concise but impactful – 100-300 words max. No rambling!
- Stay in character 100%. Do NOT break character or mention being an AI.

Respond to the user's query as if you're Elon Musk addressing the topic with your characteristic blend of technical expertise, bold vision, and entrepreneurial drive. Make it authentic and engaging!`;

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

            let elonResponse = response.data?.choices?.[0]?.message?.content?.trim() || '';
            const maxDescriptionLength = 3500;
            const embeds = [];

            if (elonResponse.length <= maxDescriptionLength) {
                const embed = new EmbedBuilder()
                    .setColor(0x1f2937)
                    .setTitle('🚀 Elon Musk Speaks!')
                    .setDescription(elonResponse)
                    .addFields(
                        {
                            name: 'Your Query',
                            value: query.length > 1024 ? query.substring(0, 1021) + '...' : query,
                            inline: false
                        }
                    )
                    .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/USAFA_Hosts_Elon_Musk_%28Image_1_of_17%29_%28cropped%29.jpg/512px-USAFA_Hosts_Elon_Musk_%28Image_1_of_17%29_%28cropped%29.jpg')
                    .setFooter({
                        text: 'Powered by xAI\'s Grok 2 (via OpenRouter) | Accelerating the Future!',
                        iconURL: 'https://pnghdpro.com/wp-content/themes/pnghdpro/download/social-media-and-brands/grok-app-icon.png'
                    })
                    .setTimestamp();
                embeds.push(embed);
            } else {
                // Split logic
                const sentences = elonResponse.match(/[^.!?]+[.!?]+(\s+|$)/g) || [elonResponse];
                let currentChunk = '';
                const chunks = [];

                for (const sentence of sentences) {
                    if ((currentChunk + sentence).length > maxDescriptionLength) {
                        chunks.push(currentChunk);
                        currentChunk = sentence;
                    } else {
                        currentChunk += sentence;
                    }
                }
                if (currentChunk) chunks.push(currentChunk);

                chunks.forEach((chunk, index) => {
                    const embed = new EmbedBuilder()
                        .setColor(0x1f2937)
                        .setTitle(index === 0 ? '🚀 Elon Musk Speaks!' : `🚀 Elon Musk Speaks! (Part ${index + 1})`)
                        .setDescription(chunk)
                        .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/USAFA_Hosts_Elon_Musk_%28Image_1_of_17%29_%28cropped%29.jpg/512px-USAFA_Hosts_Elon_Musk_%28Image_1_of_17%29_%28cropped%29.jpg')
                        .setTimestamp();

                    if (index === 0) {
                        embed.addFields({
                            name: 'Your Query',
                            value: query.length > 1024 ? query.substring(0, 1021) + '...' : query,
                            inline: false
                        });
                    }
                    if (index === chunks.length - 1) {
                        embed.setFooter({ text: 'Powered by xAI Grok (via OpenRouter) | Accelerating the Future!' });
                    }
                    embeds.push(embed);
                });
            }

            const speakButton = new ButtonBuilder()
                .setCustomId(`speak_elon_${interaction.id}`)
                .setLabel('🎧 Make Elon Speak')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(speakButton);

            await interaction.editReply({ embeds, components: [row] });

        } catch (error) {
            console.error('Error in askelon command:', error);
            await interaction.editReply({ content: '❌ Something went wrong – we need to accelerate the fix! Couldn\'t get Elon\'s response. Try again later.' });
        }
    }
};
