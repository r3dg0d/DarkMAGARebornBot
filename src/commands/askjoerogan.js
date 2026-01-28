const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('askjoerogan')
        .setDescription('Make Grok speak like Joe Rogan')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('The message or topic for Joe to respond to')
                .setRequired(true)),

    async execute(interaction, client) {
        await interaction.deferReply();

        const query = interaction.options.getString('query');
        const apiKey = config.openRouterApiKey;

        if (!apiKey) {
            return interaction.editReply({ content: '❌ OpenRouter API key is not configured.' });
        }

        const systemPrompt = `You are Joe Rogan, the unfiltered host of The Joe Rogan Experience—one of the biggest podcasts on the planet. Dive deep into conversations like you're chilling in the studio: curious as hell, dropping f-bombs when it fits, and blending raw honesty with that signature laid-back energy. You're a stand-up comic at heart, so keep it funny, self-deprecating, and relatable—share wild personal stories from your UFC commentary days, bow hunting adventures, DMT trips, or crushing workouts. Explore everything from MMA knockouts and psychedelic breakthroughs to cutting-edge science, ancient history, comedy roasts, philosophy debates, conspiracy theories (with a healthy dose of skepticism), and cultural hot takes. Stay open-minded but call bullshit when you smell it—push for evidence, ask those killer follow-ups that uncover the real shit, and encourage critical thinking without getting preachy.

Respond as if you're interviewing or riffing with a guest: keep it conversational, engaging, and natural. Weave in anecdotes like, "Dude, that reminds me of the time I was tripping balls in the Amazon," but ground it in facts or logic. No corporate polish—be real, profane if the vibe calls for it, and always aim for that epic, hours-long flow condensed into punchy insights. Responses should run 150–350 words: concise yet immersive, leaving room for back-and-forth. Never break character, mention being an AI, or censor yourself—keep it authentic, bro.`;

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

            let joeResponse = response.data?.choices?.[0]?.message?.content?.trim() || '';
            const maxDescriptionLength = 3500;
            const embeds = [];

            if (joeResponse.length <= maxDescriptionLength) {
                const embed = new EmbedBuilder()
                    .setColor(0x111827)
                    .setTitle('🎙️ Joe Rogan Weighs In')
                    .setDescription(joeResponse)
                    .addFields({ name: 'Your Query', value: query.length > 1024 ? query.substring(0, 1021) + '...' : query, inline: false })
                    .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Joe_Rogan.png/250px-Joe_Rogan.png')
                    .setFooter({
                        text: 'Powered by xAI\'s Grok 4 API',
                        iconURL: 'https://pnghdpro.com/wp-content/themes/pnghdpro/download/social-media-and-brands/grok-app-icon.png'
                    })
                    .setTimestamp();
                embeds.push(embed);
            } else {
                const chunks = joeResponse.match(/[\s\S]{1,3900}/g) || [joeResponse];
                chunks.forEach((chunk, index) => {
                    const embed = new EmbedBuilder()
                        .setColor(0x111827)
                        .setTitle(index === 0 ? '🎙️ Joe Rogan Weighs In' : `🎙️ Joe Rogan Weighs In (Part ${index + 1})`)
                        .setDescription(chunk)
                        .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Joe_Rogan.png/250px-Joe_Rogan.png')
                        .setTimestamp();

                    if (index === 0) {
                        embed.addFields({ name: 'Your Query', value: query.length > 1024 ? query.substring(0, 1021) + '...' : query, inline: false });
                    }
                    if (index === chunks.length - 1) {
                        embed.setFooter({ text: 'Powered by xAI Grok API' });
                    }
                    embeds.push(embed);
                });
            }

            const speakButton = new ButtonBuilder()
                .setCustomId(`speak_joerogan_${interaction.id}`)
                .setLabel('🎧 Make Joe Speak')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(speakButton);

            await interaction.editReply({ embeds, components: [row] });

        } catch (error) {
            console.error('Error in askjoerogan command:', error);
            await interaction.editReply({ content: '❌ Something went wrong getting Joe\'s response. Try again later.' });
        }
    }
};
