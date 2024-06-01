const TelegramBot = require('node-telegram-bot-api');
const { spawn } = require('child_process');
require('dotenv').config();

async function runPythonScript() {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python3', ['bin.py']);

        let filename = '';

        pythonProcess.stdout.on('data', (data) => {
            filename += data.toString().trim();
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Python script exited with code ${code}`));
            } else {
                resolve(filename);
            }
        });
    });
}

// Replace 'YOUR_BOT_TOKEN' with your actual bot token
const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Global variable to track if a command is running
let isRunning = false;

// Start command
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, 'Hi! Use /sendfile to get the file.');
});

// Send file command
bot.onText(/\/sendfile/, (msg) => {
    if (isRunning) {
        bot.sendMessage(msg.chat.id, 'Please wait, the previous command is still running...');
        return;
    }

    isRunning = true;
    bot.sendMessage(msg.chat.id, 'Processing your request...')
        .then(async () => {
            const filePath = await runPythonScript();
            bot.sendDocument(msg.chat.id, filePath)
                .then(() => {
                    isRunning = false;
                })
                .catch((error) => {
                    isRunning = false;
                    console.error(error);
                });
        })
        .catch((error) => {
            isRunning = false;
            console.error(error);
        });
});
