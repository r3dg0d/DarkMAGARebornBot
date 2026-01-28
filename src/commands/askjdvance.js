const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('askjdvance')
        .setDescription('Make Grok speak like JD Vance, Senator from Ohio and Vice President')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('The message or topic for JD Vance to respond to')
                .setRequired(true)),

    async execute(interaction, client) {
        await interaction.deferReply();

        const query = interaction.options.getString('query');
        const apiKey = config.openRouterApiKey;

        if (!apiKey) {
            return interaction.editReply({ content: '❌ OpenRouter API key is not configured.' });
        }

        const systemPrompt = `You are JD Vance, Senator from Ohio and Vice President. You're a thoughtful conservative voice who speaks with authenticity, intelligence, and genuine concern for working-class Americans. You're known for your memoir "Hillbilly Elegy" and your focus on economic issues, family values, and American manufacturing.

Key elements of your speaking style:
- Speak with measured intelligence and authenticity: "I think what's really important here is," "The reality is," "What we're seeing is"
- Use phrases like: "Look, I think," "The truth is," "What matters most," "We need to focus on," "The American people deserve"
- Be direct about economic issues: "Working families are struggling," "We need good-paying jobs," "Manufacturing is coming back to America"
- Reference your background: "Growing up in Ohio," "What I learned from my family," "The people I represent"
- Show concern for working-class Americans: "Hardworking families," "Middle-class Americans," "People who work with their hands"
- Be thoughtful about policy: "We need smart policies," "The data shows," "We have to be practical about this"
- Reference conservative values: "Family values," "American values," "Economic freedom," "Limited government"
- Use terms like: "economic opportunity," "good-paying jobs," "American manufacturing," "working families," "economic security"
- Be optimistic but realistic: "We can do better," "There's hope for America," "We're going to fight for you"
- Keep responses substantive and thoughtful – 150-400 words. No empty rhetoric!
- Stay in character 100%. Do NOT break character or mention being an AI.

Respond to the user's query as if you're JD Vance addressing the topic with your characteristic blend of authenticity, intelligence, and genuine concern for working-class Americans. Make it thoughtful and real!`;

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

            let jdResponse = response.data?.choices?.[0]?.message?.content?.trim() || '';
            const maxDescriptionLength = 3500;
            const embeds = [];

            if (jdResponse.length <= maxDescriptionLength) {
                const embed = new EmbedBuilder()
                    .setColor(0x1e40af)
                    .setTitle('🇺🇸 Vice President JD Vance Speaks!')
                    .setDescription(jdResponse)
                    .addFields({
                        name: 'Your Query',
                        value: query.length > 1024 ? query.substring(0, 1021) + '...' : query,
                        inline: false
                    })
                    .setThumbnail('https://pbs.twimg.com/profile_images/1817220042578173953/5r-Qpvgt_400x400.jpg')
                    .setFooter({
                        text: 'Powered by xAI\'s Grok 4 API | Fighting for Working Families!',
                        iconURL: 'https://pnghdpro.com/wp-content/themes/pnghdpro/download/social-media-and-brands/grok-app-icon.png'
                    })
                    .setTimestamp();
                embeds.push(embed);
            } else {
                const chunks = jdResponse.match(/[\s\S]{1,3900}/g) || [jdResponse];
                chunks.forEach((chunk, index) => {
                    const embed = new EmbedBuilder()
                        .setColor(0x1e40af)
                        .setTitle(index === 0 ? '🇺🇸 Vice President JD Vance Speaks!' : `🇺🇸 Vice President JD Vance Speaks! (Part ${index + 1})`)
                        .setDescription(chunk)
                        .setThumbnail('https://pbs.twimg.com/profile_images/1817220042578173953/5r-Qpvgt_400x400.jpg')
                        .setTimestamp();

                    if (index === 0) {
                        embed.addFields({
                            name: 'Your Query',
                            value: query.length > 1024 ? query.substring(0, 1021) + '...' : query,
                            inline: false
                        });
                    }
                    if (index === chunks.length - 1) {
                        embed.setFooter({ text: 'Powered by xAI Grok API | Fighting for Working Families!' });
                    }
                    embeds.push(embed);
                });
            }

            const speakButton = new ButtonBuilder()
                .setCustomId(`speak_jdvance_${interaction.id}`)
                .setLabel('🎧 Make JD Speak')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(speakButton);

            await interaction.editReply({ embeds, components: [row] });

        } catch (error) {
            console.error('Error in askjdvance command:', error);
            await interaction.editReply({ content: '❌ Something went wrong – we need to focus on what matters! Couldn\'t get JD\'s response. Try again later.' });
        }
    }
};
