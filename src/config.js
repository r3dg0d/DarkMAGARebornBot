require('dotenv').config();

module.exports = {
    // Bot Configuration
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID,

    // Role IDs (Directly from reference)
    roles: {
        founder: '1465984056767287432',
        coFounder: '1465997175950409791',
        executiveMod: '1465997341067837515',
        mod: '1465997371849834649',
        trialMod: '1465997410336637103',
        minecraftStaff: '1465998170113839156',
        maga: '1465998153487745176',
        ogMembers: '1465998266213863489',
        patriotI: '1465996696323358989',
        patriotII: '1465996729869402308',
        patriotIII: '1465996790514974822',
        patriotIV: '1465996824014884937',
        patriotV: '1465996849826758710',
        patriotVI: '1465996873931161769',
        patriotVII: '1465996908425248789',
        patriotVIII: '1465996937055572133',
        patriotIX: '1465996966327615602',
        patriotX: '1465997002834710634',
        magaLegend: '1465997028327821413',
        detained: '1465997486689620147'
    },

    // Channel IDs
    channels: {
        modLog: process.env.MOD_LOG_CHANNEL_ID,
        ticketCategory: process.env.TICKET_CATEGORY_ID,
        welcome: '1465989005811384518',
        chatReviveChannels: [
            '1465981916208697491',
            '1465984467985367193'
        ],
        jailLog: '1465999326793957491'
    },

    // API Configuration
    openRouterApiKey: process.env.OPENROUTER_API_KEY,
    fishAudioApiKey: process.env.FISH_AUDIO_API_KEY,
    falKey: process.env.FAL_KEY,
    uncensoredLmApiUrl: process.env.UNCENSORED_LM_API_URL,

    // Chat Revive Configuration
    chatRevive: {
        enabled: process.env.CHAT_REVIVE_ENABLED === 'true',
        checkInterval: 10800000, // 3 hours
        cooldown: 10800000 // 3 hours
    },

    // Database Configuration
    database: {
        path: './database/bot.db'
    },

    // Chat Revive Ping Role
    chatRevivePingRole: '1465999537402282100'
};
