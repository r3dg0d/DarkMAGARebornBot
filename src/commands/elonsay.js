const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { fal } = require('@fal-ai/client');
const config = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('elonsay')
        .setDescription('Make Elon Musk say anything you want - to the moon!')
        .addStringOption(option =>
            option.setName('text')
                .setDescription('The exact text you want Elon to say')
                .setRequired(true)),

    async execute(interaction, client) {
        await interaction.deferReply();

        let text = interaction.options.getString('text');

        if (text.length > 200) {
            return interaction.editReply({ content: '❌ Text is too long! Please keep it under 200 characters.' });
        }

        const fishApiKey = config.fishAudioApiKey;
        if (!fishApiKey) {
            return interaction.editReply({
                content: '❌ Fish Audio API key is not configured. Please contact the bot administrator.'
            });
        }

        try {
            const modelId = '03397b4c4be74759b72533b663fbd001';

            // Generate TTS
            const ttsResponse = await axios.post(
                'https://api.fish.audio/v1/tts',
                {
                    text: text,
                    reference_id: modelId,
                    format: 'mp3'
                },
                {
                    headers: {
                        'Authorization': `Bearer ${fishApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    responseType: 'arraybuffer'
                }
            );

            const audioBuffer = Buffer.from(ttsResponse.data);

            const embed = new EmbedBuilder()
                .setColor(0x000000)
                .setTitle('🚀 Elon Musk Says...')
                .setDescription(`"${text}"`)
                .addFields(
                    {
                        name: 'Audio Generated',
                        value: `Using Elon Musk voice model`,
                        inline: false
                    }
                )
                .setThumbnail('https://pbs.twimg.com/profile_images/1683325380441128960/yRsRRjGO_400x400.jpg')
                .setFooter({
                    text: `Elon Musk Model ID: ${modelId} | Powered by Fish Audio`
                })
                .setTimestamp();

            await interaction.editReply({
                embeds: [embed],
                files: [
                    { attachment: audioBuffer, name: 'elonsay.mp3' }
                ]
            });

            // Lipsync Video
            const falApiKey = process.env.FAL_KEY;
            if (falApiKey) {
                try {
                    fal.config({ credentials: falApiKey });

                    const generatingEmbed = new EmbedBuilder()
                        .setColor(0xffa500)
                        .setTitle('🎬 Generating Lipsync Video...')
                        .setDescription('Creating AI lipsync video using fal.ai veed/fabric-1.0 model')
                        .setTimestamp();
                    const generatingMessage = await interaction.followUp({ embeds: [generatingEmbed] });

                    const audioFile = new File([audioBuffer], 'elonsay.mp3', { type: 'audio/mpeg' });
                    const audioUrl = await fal.storage.upload(audioFile);

                    const videoResult = await fal.subscribe("veed/fabric-1.0", {
                        input: {
                            image_url: "https://r3dg0d.net/media/7d4735d1f4429a3bf3bcbea898bec04e.jpg",
                            audio_url: audioUrl,
                            resolution: "480p"
                        },
                        logs: true,
                        onQueueUpdate: (update) => {
                            if (update.status === "IN_PROGRESS") {
                                const progressEmbed = new EmbedBuilder()
                                    .setColor(0xffa500)
                                    .setTitle('🎬 Generating Lipsync Video...')
                                    .setDescription(`Creating AI lipsync video...\n\n**Progress:** ${update.logs.map((log) => log.message).join('\n').substring(0, 1000)}`)
                                    .setTimestamp();
                                generatingMessage.edit({ embeds: [progressEmbed] }).catch(console.error);
                            }
                        },
                    });

                    if (videoResult.data?.video?.url) {
                        const videoResponse = await axios.get(videoResult.data.video.url, { responseType: 'arraybuffer' });
                        const videoBuffer = Buffer.from(videoResponse.data);

                        const videoEmbed = new EmbedBuilder()
                            .setColor(0xff6b35)
                            .setTitle('🎬 Elon Musk - Lipsync Video')
                            .setDescription('AI lipsync video using fal.ai veed/fabric-1.0')
                            .setFooter({ text: 'Powered by fal.ai veed/fabric-1.0' })
                            .setTimestamp();

                        await interaction.followUp({
                            embeds: [videoEmbed],
                            files: [{ attachment: videoBuffer, name: 'elon_lipsync.mp4' }]
                        });
                    }
                } catch (lipsyncError) {
                    console.error('Lipsync error:', lipsyncError);
                    const failEmbed = new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle('🎬 Lipsync Video Failed')
                        .setDescription('Could not generate lipsync video. Audio is available above.')
                        .setTimestamp();
                    await interaction.followUp({ embeds: [failEmbed] });
                }
            }

        } catch (error) {
            console.error('Error in elonsay command:', error);
            await interaction.editReply({ content: '❌ Something went wrong generating Elon\'s voice!' });
        }
    }
};
