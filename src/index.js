require('dotenv').config();
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const Database = require('./database/db');
const CommandHandler = require('./handlers/commandHandler');
const EventHandler = require('./handlers/eventHandler');
const config = require('./config');

class DarkMAGABot {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.DirectMessages,
                GatewayIntentBits.DirectMessageReactions,
                GatewayIntentBits.MessageContent
            ],
            partials: [Partials.Message, Partials.Channel, Partials.Reaction]
        });

        this.client.commands = new Collection();
        this.client.cooldowns = new Collection();
        this.client.lastDeletedMessage = null; // For snipe command

        // Modules
        this.database = new Database();
        this.commandHandler = new CommandHandler(this.client);
        this.eventHandler = new EventHandler(this.client);
        this.levelSystem = require('./systems/LevelSystem'); // Class ref

        // Store context in client for easy access
        this.client.database = this.database;
        this.client.config = config;
        this.client.commandHandler = this.commandHandler;
    }

    async initialize() {
        try {
            await this.database.initialize();

            // Initialize Systems
            this.client.levelSystem = new this.levelSystem(this.client);

            await this.commandHandler.loadCommands();
            await this.eventHandler.loadEvents();

            this.client.login(config.token);
        } catch (error) {
            console.error('Failed to initialize bot:', error);
        }
    }
}

const bot = new DarkMAGABot();
bot.initialize();
