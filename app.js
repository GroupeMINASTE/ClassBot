// Require the modules
const Discord = require('discord.js');
const mysql = require('mysql');
const https = require('https');
const moment = require('moment');
const express = require('express');

// Support for HTTP
const app = express();

// Create a new Discord client
const client = new Discord.Client();

// Connect to the database
var con = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
});
con.connect(function(err) {
  // Check for errors
  if (err) throw err;

  // We are connected!
  console.log('Connected!');

  // Setup database
  con.query('CREATE TABLE IF NOT EXISTS `profs` (`id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY, `user` bigint(11) NOT NULL, `name` varchar(255) NOT NULL);', function (err, result) {
    if (err) throw err;
  });
  con.query('CREATE TABLE IF NOT EXISTS `cours` (`id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY, `prof` int(11) NOT NULL, `start` datetime NOT NULL);', function (err, result) {
    if (err) throw err;
  });
  con.query('CREATE TABLE IF NOT EXISTS `devoirs` (`id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY, `prof` int(11) NOT NULL, `content` text NOT NULL, `due` datetime NOT NULL);', function (err, result) {
    if (err) throw err;
  });

  // Setup web
  app.get('/', (request, response) => {
    console.log(moment().format('[Le] DD/MM/YYYY [à] HH:mm') + ' Ping Received');
    response.sendStatus(200);
  });
  app.listen(process.env.PORT || 3000, () => console.log('Web server is running!'));

  // when the client is ready, run this code
  // this event will only trigger one time after logging in
  client.once('ready', () => {
    // Log
  	console.log('Discord bot is running!');

    // Run to check for a course
    setInterval(() => {
      // Keep the server up
      https.get('https://classbot-nathanfallet.herokuapp.com');

      // Fetch all courses
      con.query('SELECT cours.id as id, profs.name as name, cours.start as start, profs.user as user FROM cours LEFT JOIN profs ON cours.prof = profs.id', (err, results, fields) => {
        if (err) {
          return console.error(err.message);
        }

        // Get current interval
        var before = moment().subtract(5, 'minutes');
        var after = moment();
        var expired = moment().add(1, 'hours');

        // Check if one is about to start
        for (cour in results) {
          var id = results[cour].id;
          var name = results[cour].name;
          var date = new Date(results[cour].start);
          var user = results[cour].user;

          // Check time
          if (moment(date).isBetween(before, after)) {
            // Course will start soon
            client.channels.fetch(process.env.CHANNEL).then(channel => {
              channel.send('<@' + process.env.ROLE + '> Le cours de `' + name + ' ' + moment(date).format('[du] DD/MM/YYYY [à] HH:mm') + '` avec <@' + user + '> va bientôt commencer !')
            }).catch(console.error);
          } else if (moment(date).isAfter(expired)) {
            // Delete the course
            con.query('DELETE FROM cours WHERE id = ?', [id], (err, results, fields) => {
              if (err) {
                return console.error(err.message);
              }
            });
          }
        }
      });
    }, 300000);
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
      if (message.author.id == process.env.OWNER) {
        if (args.length == 2) {
          message.reply('J\'ajoute ça tout de suite dans la base de données...');

          // Add to database
          con.query('INSERT INTO profs (user, name) VALUES(?, ?)', args, (err, results, fields) => {
            if (err) {
              return console.error(err.message);
            }

            // Confirme
            message.channel.send('Parfait, <@' + args[0] + '> est maintenant défini(e) comme professeur(e) de ' + args[1]);
          });
        } else {
          message.reply('Il y a un problème avec ta commande, essaye `$prof <id> <matière>');
        }
      } else {
        message.reply('Tu n\'as pas le droit de gérer la liste des professeurs, demande à <@' + process.env.OWNER + '> de le faire.');
      }
    }

    // Add a course
    else if (command == 'cours') {
      if (args.length == 3) {
        // Get teacher for this sender
        con.query('SELECT * FROM profs WHERE user = ?', [message.author.id], (error, results, fields) => {
          if (error) {
            return console.error(error.message);
          }
          if (results && results.length > 0) {
            con.query('SELECT * FROM profs WHERE user = ? AND name = ?', [message.author.id, args[0]], (error, profs, fields) => {
              if (error) {
                return console.error(error.message);
              }
              if (profs && profs.length > 0) {
                // Get date and time
                var date = args[1].split('/');
                var heure = args[2].split(':');

                // Check length
                if (date.length == 3 && heure.length == 2) {
                  message.reply('J\'ajoute ça tout de suite dans la base de données...');

                  // Add to database
                  con.query('INSERT INTO cours (prof, start) VALUES(?, ?)', [profs[0].id, date[2] + '-' + date[1] + '-' + date[0] + ' ' + heure[0] + ':' + heure[1]], (err, results, fields) => {
                    if (err) {
                      return console.error(err.message);
                    }

                    // Confirme
                    message.channel.send('Parfait, le cours a été programmé !');
                  });
                } else {
                  message.reply('La date ou l\'heure n\'est pas au bon format, essaye `jj/mm/aaaa hh:mm`');
                }
              } else {
                message.reply('La matière demandée n\'est pas dans la base de données, ou vous n\'êtes pas professeur de cette matière.');
              }
            });
          } else {
            message.reply('Seuls les professeurs peuvent ajouter des cours.');
          }
        });
      } else {
        message.reply('Il y a un problème avec ta commande, essaye `$cours <matière> <jour/mois/année> <heure:minutes>`');
      }
    }

    // List courses
    else if (command == 'liste') {
      // Fetch all courses
      con.query('SELECT cours.id as id, profs.name as name, cours.start as start, profs.user as user FROM cours LEFT JOIN profs ON cours.prof = profs.id', (err, results, fields) => {
        if (err) {
          return console.error(err.message);
        }

        // List them
        var string = 'Voici les cours à venir :';
        for (cour in results) {
          var name = results[cour].name;
          var date = new Date(results[cour].start);

          // Add string
          string += '\n- `' + name +', ' + moment(date).format('[le] DD/MM/YYYY [à] HH:mm') +'`';
        }
        message.channel.send(string);
      });
    }
  });

  // login to Discord with your app's token
  client.login(process.env.TOKEN);
});
