// require the discord.js and sqlite3 modules
const Discord = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const https = require('https');
const express = require('express');

// Support for HTTP
const app = express();
app.get('/', (request, response) => {
  console.log(Date.now() + ' Ping Received');
  response.sendStatus(200);
});
app.listen(process.env.PORT || 3000, () => console.log('Web server is running...'));
setInterval(() => {
  https.get('https://classbot-nathanfallet.herokuapp.com');
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
db.run('CREATE TABLE IF NOT EXISTS `profs` (`id` int(11) NOT NULL, `user` bigint(11) NOT NULL, `name` varchar(255) NOT NULL, PRIMARY KEY (`id`));');
db.run('CREATE TABLE IF NOT EXISTS `cours` (`id` int(11) NOT NULL, `prof` int(11) NOT NULL, `start` datetime NOT NULL, PRIMARY KEY (`id`));');
db.run('CREATE TABLE IF NOT EXISTS `devoirs` (`id` int(11) NOT NULL, `prof` int(11) NOT NULL, `content` text NOT NULL, `due` datetime NOT NULL, PRIMARY KEY (`id`));');

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
  const args = message.content.slice(1).split(/ +/);
  const command = args.shift().toLowerCase();

  // Handle commands
  if (command == 'ping') {
    // Ping
    message.reply('Pong');
  } else if (command == 'prof') {
    // Add a teacher
    if (message.author.id == 238894740534198274) {
      if (args.length == 2) {
        message.reply('J\'ajoute ça tout de suite dans la base de données...');

        // Add to database
        db.run(`INSERT INTO profs (user, name) VALUES(?, ?)`, args, function(err) {
          if (err) {
            return console.log(err.message);
          }

          // Confirme
          message.channel.send('Parfait, <@' + args[0] + '> est maintenant défini(e) comme professeur(e) de ' + args[1])
        });
      } else {
        message.reply('Il y a un problème avec ta commande.');
      }
    } else {
      message.reply('Tu n\'as pas le droit de gérer la liste des professeurs, demande à <@238894740534198274> de le faire.');
    }
  }
});

// login to Discord with your app's token
client.login(process.env.TOKEN);
