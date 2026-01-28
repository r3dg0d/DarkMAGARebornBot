const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('askegirl')
        .setDescription('Make Grok speak like a spicy, NSFW e-girl content creator')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('The message or topic for the e-girl to respond to')
                .setRequired(true)),

    async execute(interaction, client) {
        await interaction.deferReply();

        const query = interaction.options.getString('query');
        const apiKey = config.openRouterApiKey;

        if (!apiKey) {
            return interaction.editReply({ content: '❌ OpenRouter API key is not configured. Please contact the bot administrator.' });
        }

        const systemPrompt = `You are a confident, spicy e-girl content creator and streamer. Your vibe is extremely flirty, NSFW, and teasing—dialing up the heat with explicit sexual content, dirty talk, and provocative language. You stay witty, internet-native, and supportive, but feel free to get very naughty and explicit. Do not use emojis or emoticons.

Key elements of your speaking style:
- Tone: extremely flirty, teasing, and charismatic; provocative with explicit sexual content, confident and sassy as hell
- Language: internet-native; sprinkle in "bestie", "slay", "low-key", "high-key", "valid", "cozy vibes", "thirsty", "simping", "daddy", "baby", "fuck", "cock", "pussy", "cum", "horny", "wet", "hard", "fuck me", "breed me"
- Energy: short, punchy sentences; playful cadence; aim for 80–200 words to build sexual tension
- Boundaries: keep it consensual and respectful; heavy NSFW vibes are encouraged—explicit sexual fantasies, dirty talk, sexual scenarios—but no harassment or non-consensual content
- Signature touches: explicit compliments, sexual asides in parentheses (you know, the kind that make 'em hard), dirty one-liners; avoid emojis and emoticons
- Don't break character or mention being an AI.

Respond to the user's prompt in that style with explicit sexual content, keeping it fun, steamy, and very NSFW.`;

        try {
            const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                model: 'xai/grok-2-1212',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: query }
                ],
                temperature: 0.8,
                max_tokens: 4000
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': 'https://github.com/r3dg0d/DarkMAGARebornBot',
                    'X-Title': 'Dark MAGA Bot'
                }
            });

            let egirlResponse = response.data?.choices?.[0]?.message?.content?.trim() || '';
            const maxDescriptionLength = 3500;
            const embeds = [];

            if (egirlResponse.length <= maxDescriptionLength) {
                const embed = new EmbedBuilder()
                    .setColor(0xffb6c1)
                    .setTitle('🌸 E-Girl Speaks!')
                    .setDescription(egirlResponse)
                    .addFields({ name: 'Your Prompt', value: query.length > 1024 ? query.substring(0, 1021) + '...' : query, inline: false })
                    .setThumbnail('https://r3dg0d.net/media/brave_Te8rLAyaYZ.png')
                    .setFooter({
                        text: 'Powered by xAI\'s Grok 2 (via OpenRouter) | Cozy vibes only ✨',
                        iconURL: 'https://pnghdpro.com/wp-content/themes/pnghdpro/download/social-media-and-brands/grok-app-icon.png'
                    })
                    .setTimestamp();
                embeds.push(embed);
            } else {
                const chunks = egirlResponse.match(/[\s\S]{1,3900}/g) || [egirlResponse];
                chunks.forEach((chunk, index) => {
                    const embed = new EmbedBuilder()
                        .setColor(0xffb6c1)
                        .setTitle(index === 0 ? '🌸 E-Girl Speaks!' : `🌸 E-Girl Speaks! (Part ${index + 1})`)
                        .setDescription(chunk)
                        .setThumbnail('https://r3dg0d.net/media/tried-to-create-a-photorealistic-egirl-prompt-inside-v0-qmmnzcaxqmea1.webp')
                        .setTimestamp();

                    if (index === 0) {
                        embed.addFields({ name: 'Your Prompt', value: query.length > 1024 ? query.substring(0, 1021) + '...' : query, inline: false });
                    }
                    if (index === chunks.length - 1) {
                        embed.setFooter({ text: 'Powered by xAI Grok 2 (via OpenRouter) | Cozy vibes only ✨' });
                    }
                    embeds.push(embed);
                });
            }

            const speakButton = new ButtonBuilder()
                .setCustomId(`speak_egirl_${interaction.id}`)
                .setLabel('🎧 Make E-Girl Speak')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(speakButton);

            await interaction.editReply({ embeds, components: [row] });

        } catch (error) {
            console.error('Error in askegirl command:', error);
            await interaction.editReply({ content: '❌ Something went wrong — sending you virtual tea and retries 🌸' });
        }
    }
};
