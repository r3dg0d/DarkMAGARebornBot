const axios = require('axios');
const config = require('../config');

const MODEL_IDS = {
    trump: 'e58b0d7efca34eb38d5c4985e378abcb',
    elon: '03397b4c4be74759b72533b663fbd001',
    egirl: '3b3698528082474791f9dd22f024fd3c',
    jdvance: '86d3aee7cd9b4aab8cd8e54c3d35492b',
    joerogan: 'fb4a066b73954c03b325409d1a8592f0',
    njf: 'df3cfdc9b9dd42e9a0f589569f598263',
    rfkjr: '6aef9b079bc548cab88b4d2286ed75d4',
    samaltman: 'bfdf7429d1104ca38e0e86e25941c7bd'
};

/**
 * Generates speech using Fish Audio API
 * @param {string} text - The text to speak
 * @param {string} character - The character key (e.g., 'trump', 'elon')
 * @returns {Promise<Buffer>} - The audio buffer
 */
async function generateSpeech(text, character) {
    const apiKey = config.fishAudioApiKey;
    if (!apiKey) {
        throw new Error('Fish Audio API key is not configured');
    }

    const modelId = MODEL_IDS[character];
    if (!modelId) {
        throw new Error(`Unknown character: ${character}`);
    }

    try {
        const response = await axios.post(
            'https://api.fish.audio/v1/tts',
            {
                text: text,
                reference_id: modelId,
                format: 'mp3'
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                responseType: 'arraybuffer'
            }
        );

        return Buffer.from(response.data);
    } catch (error) {
        console.error('Fish Audio API Error:', error.response?.data ? new TextDecoder().decode(error.response.data) : error.message);
        throw error;
    }
}

module.exports = {
    generateSpeech,
    MODEL_IDS
};
