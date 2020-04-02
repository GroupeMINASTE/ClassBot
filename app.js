// require the discord.js and sqlite3 modules
const Discord = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

// create a new Discord client
const client = new Discord.Client();

// Create and connect to the database
const db = new sqlite3.Database('./database.db', (err) => {
  // Check for errors
  if (err) {
    console.error(err.message);
    return;
  }

  // No error
  console.log('Connected to database!');
});

// when the client is ready, run this code
// this event will only trigger one time after logging in
client.once('ready', () => {
	console.log('Ready!');
});

// Listen for messages
client.on('message', message => {
  // Skip non commands
  if (!message.content.startsWith('$') || message.author.bot) return;

  // Get args and command
  const args = message.content.slice(prefix.length).split(' ');
  const command = args.shift().toLowerCase();

  // Handle commands
  if (command == 'ping') {
    message.reply('Pong');
  }
});
