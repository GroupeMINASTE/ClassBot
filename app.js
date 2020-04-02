// require the discord.js and sqlite3 modules
const Discord = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const http = require('http');
const express = require('express');

// Support for HTTP
const app = express();
app.get('/', (request, response) => {
  console.log(Date.now() + ' Ping Received');
  response.sendStatus(200);
});
app.listen(process.env.PORT || 3000, () => console.log('Web server is running...'));
setInterval(() => {
  http.get('https://classbot-nathanfallet.herokuapp.com');
}, 280000);

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

// Setup database
db.run('CREATE TABLE IF NOT EXISTS `profs` (`id` int(11) NOT NULL AUTO_INCREMENT, `user` bigint(11) NOT NULL, `name` varchar(255) NOT NULL);');
db.run('CREATE TABLE IF NOT EXISTS `cours` (`id` int(11) NOT NULL AUTO_INCREMENT, `prof` int(11) NOT NULL, `start` datetime NOT NULL);');
db.run('CREATE TABLE IF NOT EXISTS `devoirs` (`id` int(11) NOT NULL AUTO_INCREMENT, `prof` int(11) NOT NULL, `content` text NOT NULL, `due` datetime NOT NULL);');

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
  const args = message.content.slice(1).split(' ');
  const command = args.shift().toLowerCase();

  // Handle commands
  if (command == 'ping') {
    // Ping
    message.reply('Pong');
  } else if (command == 'prof') {
    // Add a teacher

  }
});

// login to Discord with your app's token
client.login(process.env.TOKEN);
