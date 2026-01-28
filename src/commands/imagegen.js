const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { fal } = require('@fal-ai/client');
const axios = require('axios');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('imagegen')
        .setDescription('Generate an image using Flux via Fal.AI')
        .addStringOption(option =>
            option.setName('prompt')
                .setDescription('The prompt to generate the image from')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('aspect_ratio')
                .setDescription('Aspect ratio for the image')
                .addChoices(
                    { name: 'Square (1:1)', value: 'square_hd' },
                    { name: 'Portrait (9:16)', value: 'portrait_16_9' },
                    { name: 'Landscape (16:9)', value: 'landscape_16_9' }
                ))
        .addBooleanOption(option =>
            option.setName('safety_check')
                .setDescription('Enable safety checker (default: true)')),

    async execute(interaction, client) {
        await interaction.deferReply();

        const prompt = interaction.options.getString('prompt');
        const aspectRatio = interaction.options.getString('aspect_ratio') || 'square_hd';
        const safetyCheck = interaction.options.getBoolean('safety_check') ?? true;
        const falKey = process.env.FAL_KEY;

        if (!falKey) {
            return interaction.editReply({ content: '❌ Fal.AI API key is not configured.' });
        }

        try {
            fal.config({ credentials: falKey });

            // Using fal-ai/flux/dev for high quality generations
            const result = await fal.subscribe('fal-ai/flux/dev', {
                input: {
                    prompt: prompt,
                    image_size: aspectRatio,
                    safety_tolerance: safetyCheck ? '2' : '6', // 2 is stricter, 6 is lenient
                },
                logs: true,
                onQueueUpdate: (update) => {
                    if (update.status === 'IN_PROGRESS') {
                        // Optional: Log progress if needed
                    }
                },
            });

            if (result.data && result.data.images && result.data.images.length > 0) {
                const imageUrl = result.data.images[0].url;

                // Fetch image buffer for attachment
                const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                const imageBuffer = Buffer.from(imageResponse.data);
                const attachment = new AttachmentBuilder(imageBuffer, { name: 'generated_image.png' });

                const embed = new EmbedBuilder()
                    .setColor(0x00ff00)
                    .setTitle('🎨 Generated Image')
                    .setDescription(`**Prompt:** ${prompt}`)
                    .setImage('attachment://generated_image.png')
                    .setFooter({ text: 'Powered by Fal.AI (Flux Dev)' })
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed], files: [attachment] });
            } else {
                await interaction.editReply({ content: '❌ Failed to generate image.' });
            }

        } catch (error) {
            console.error('Error in imagegen command:', error);
            await interaction.editReply({ content: '❌ An error occurred while generating the image.' });
        }
    }
};
