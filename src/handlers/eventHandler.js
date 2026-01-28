const fs = require('fs');
const path = require('path');

class EventHandler {
    constructor(client) {
        this.client = client;
    }

    async loadEvents() {
        const eventsPath = path.join(__dirname, '../events');
        await this.readEvents(eventsPath);
    }

    async readEvents(dir) {
        if (!fs.existsSync(dir)) return;

        const files = fs.readdirSync(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                await this.readEvents(filePath);
            } else if (file.endsWith('.js')) {
                const event = require(filePath);
                if (event.once) {
                    this.client.once(event.name, (...args) => event.execute(...args, this.client));
                } else {
                    this.client.on(event.name, (...args) => event.execute(...args, this.client));
                }
                console.log(`[INFO] Loaded event ${event.name}`);
            }
        }
    }
}

module.exports = EventHandler;
