const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { fal } = require('@fal-ai/client');
const axios = require('axios');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('editimage')
        .setDescription('Edit an image using Flux via Fal.AI')
        .addStringOption(option =>
            option.setName('prompt')
                .setDescription('The prompt describing the changes')
                .setRequired(true))
        .addAttachmentOption(option =>
            option.setName('image')
                .setDescription('The image to edit')
                .setRequired(true))
        .addNumberOption(option =>
            option.setName('strength')
                .setDescription('The strength of the edit (0.0 to 1.0, default: 0.85)')
                .setMinValue(0.1)
                .setMaxValue(1.0)),

    async execute(interaction, client) {
        await interaction.deferReply();

        const prompt = interaction.options.getString('prompt');
        const inputImage = interaction.options.getAttachment('image');
        const strength = interaction.options.getNumber('strength') || 0.85;
        const falKey = process.env.FAL_KEY;

        if (!falKey) {
            return interaction.editReply({ content: '❌ Fal.AI API key is not configured.' });
        }

        if (!inputImage.contentType.startsWith('image/')) {
            return interaction.editReply({ content: '❌ Please upload a valid image file.' });
        }

        try {
            fal.config({ credentials: falKey });

            // Download and upload image to Fal storage
            const imageResponse = await axios.get(inputImage.url, { responseType: 'arraybuffer' });
            // Convert to a File-like object or Blob for fal.storage.upload
            // Since we are in Node.js, we might need a workaround or pass base64 if supported, 
            // but fal.storage.upload expects a File/Blob.
            // Alternatively, Flux sometimes accepts direct URLs. Let's try passing the URL first if possible, 
            // but discord CDN urls might have issues. 
            // Better to upload to Fal storage.

            // In Node environment, we can construct a specialized object for upload or just use the input URL if we trust it.
            // However, `fal.storage.upload` handles the upload.
            // For Node.js, `fal.storage.upload` accepts `Buffer` if using the polyfill or standard File.
            // Let's create a temporary file or buffer approach.
            // Actually, fal-js client in node supports buffer upload usually.

            const file = new File([imageResponse.data], 'input_image.png', { type: 'image/png' });
            const uploadedUrl = await fal.storage.upload(file);

            // Using fal-ai/flux/dev/image-to-image
            const result = await fal.subscribe('fal-ai/flux/dev/image-to-image', {
                input: {
                    prompt: prompt,
                    image_url: uploadedUrl,
                    strength: strength,
                    safety_tolerance: '2'
                },
                logs: true,
                onQueueUpdate: (update) => {
                    if (update.status === 'IN_PROGRESS') {
                        // Optional: Log progress
                    }
                },
            });

            if (result.data && result.data.images && result.data.images.length > 0) {
                const imageUrl = result.data.images[0].url;

                const resImgResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                const resImgBuffer = Buffer.from(resImgResponse.data);
                const attachment = new AttachmentBuilder(resImgBuffer, { name: 'edited_image.png' });

                const embed = new EmbedBuilder()
                    .setColor(0x00ff00)
                    .setTitle('🎨 Edited Image')
                    .setDescription(`**Prompt:** ${prompt}\n**Strength:** ${strength}`)
                    .setImage('attachment://edited_image.png')
                    .setThumbnail(inputImage.url)
                    .setFooter({ text: 'Powered by Fal.AI (Flux Image-to-Image)' })
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed], files: [attachment] });
            } else {
                await interaction.editReply({ content: '❌ Failed to edit image.' });
            }

        } catch (error) {
            console.error('Error in editimage command:', error);
            await interaction.editReply({ content: '❌ An error occurred while editing the image.' });
        }
    }
};
