/*
 *  Copyright (C) 2020 Groupe MINASTE
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 *
 */

// Require the modules
const Discord = require('discord.js');
const mysql = require('mysql');
const https = require('https');
const path = require('path');
const moment = require('moment');
const express = require('express');
const fs = require('fs');

// Check if .env is present
try {
  if (fs.existsSync('.env')) {
    // Load .env file
    const dotenv = require('dotenv');
    dotenv.config();
  }
} catch (err) {
  console.error(err);
}

// Our classes
const Database = require(path.join(__dirname, 'Database'));

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
  var db = new Database(con);

  // Setup web
  app.get('/', (request, response) => {
    response.sendStatus(200);
  });
  app.get('/api/classbot', (request, response) => {
    response.json({ classbot: true });
  });
  app.get('/api/liste', (request, response) => {
    db.getCours((cours) => {
      db.getDevoirs((devoirs) => {
        response.json({ cours: cours, devoirs: devoirs });
      });
    });
  });
  app.get('/api/liste/:classe', (request, response) => {
    db.getCours((cours) => {
      db.getDevoirs((devoirs) => {
        response.json({ cours: cours.filter(cours => cours.classe == request.params.classe), devoirs: devoirs.filter(devoirs => devoirs.classe == request.params.classe) });
      });
    });
  });
  app.set('json replacer', function (key, value) {
    if (this[key] instanceof Date) {
      // Replace date format
      value = moment(this[key]).format('YYYY-MM-DD HH:mm:ss');
    }

    return value;
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
      if (process.env.HOST !== undefined) {
        https.get('https://' + process.env.HOST);
      }

      // Fetch all courses
      db.getCours((results) => {
        // Get current interval
        var before = moment();
        var after = moment().add(5, 'minutes');
        var expired = moment().subtract(1, 'hours');

        // Check if one is about to start
        for (cour in results) {
          var id = results[cour].id;
          var name = results[cour].name;
          var classe = results[cour].classe;
          var date = new Date(results[cour].start);
          var user = results[cour].user;
          var role = results[cour].role;

          // Check time
          if (moment(date).isBetween(before, after)) {
            // Course will start soon
            var message = '<@&' + role + '> Le cours de `' + name + ' (' + classe + ') ' + moment(date).format('[du] DD/MM/YYYY [à] HH:mm') + '` avec <@' + user + '> va bientôt commencer !';
            client.channels.fetch(process.env.CHANNEL).then(channel => {
              channel.send(message);
            }).catch(console.error);
          } else if (moment(date).isBefore(expired)) {
            // Delete the course
            con.query('DELETE FROM cours WHERE id = ?', [id], (err, results, fields) => {
              if (err) {
                return console.error(err.message);
              }
            });
          }
        }
      });

      // Fetch all homeworks
      db.getDevoirs((results) => {
        // Get current interval
        var before = moment();
        var after = moment().add(5, 'minutes');
        var expired = moment().startOf('day');

        // Check if one is about to start
        for (cour in results) {
          var id = results[cour].id;
          var name = results[cour].name;
          var classe = results[cour].classe;
          var content = results[cour].content;
          var date = new Date(results[cour].due);
          var user = results[cour].user;
          var role = results[cour].role;

          // Check time
          if (moment(date).isBetween(before, after)) {
            // Course will start soon
            var message = '<@&' + role + '> Les devoirs de `' + name + ' (' + classe + ') pour ' + moment(date).format('[le] DD/MM/YYYY') + '` sont à rendre à <@' + user + '> !```' + content + '```';
            client.channels.fetch(process.env.CHANNEL).then(channel => {
              channel.send(message);
            }).catch(console.error);
          } else if (moment(date).isBefore(expired)) {
            // Delete the course
            con.query('DELETE FROM devoirs WHERE id = ?', [id], (err, results, fields) => {
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
        if (args.length == 3) {
          message.reply('J\'ajoute ça tout de suite dans la base de données...');

          // Add to database
          db.addProf(args[0], args[1], args[2], (status) => {
            if (status == 1) {
              // Confirme
              message.channel.send('Parfait, <@' + args[0] + '> est maintenant défini(e) comme professeur(e) de ' + args[2] + ' pour la classe ' + args[1]);
            } else {
              message.reply('La classe demandée n\'a pas été trouvée !');
            }
          });
        } else {
          message.reply('Il y a un problème avec ta commande, essaye `$prof <id> <classe> <matière>');
        }
      } else {
        message.reply('Tu n\'as pas le droit de gérer la liste des professeurs, demande à <@' + process.env.OWNER + '> de le faire.');
      }
    }

    // Add a course
    else if (command == 'cours') {
      if (args.length == 4) {
        // Get teacher for this sender
        db.checkProf(message.author.id, args.shift(), args.shift(), process.env.OWNER, (status, prof) => {
          if (status == 1) {
            // Get date and time
            var date = args.shift().split('/');
            var heure = args.shift().split(':');

            // Check length
            if (date.length == 3 && heure.length == 2) {
              message.reply('J\'ajoute ça tout de suite dans la base de données...');

              // Add to database
              db.addCours(prof.id, date, heure, () => {
                // Confirme
                message.channel.send('Parfait, le cours a été programmé !');
              });
            } else {
              message.reply('La date ou l\'heure n\'est pas au bon format, essaye `jj/mm/aaaa hh:mm`');
            }
          } else if (status == 2) {
            message.reply('La matière demandée n\'est pas dans la base de données, ou vous n\'êtes pas professeur de cette matière pour cette classe.');
          } else {
            message.reply('Seuls les professeurs peuvent ajouter des cours.');
          }
        });
      } else {
        message.reply('Il y a un problème avec ta commande, essaye `$cours <classe> <matière> <jour/mois/année> <heure:minutes>`');
      }
    }

    // Add an homework
    else if (command == 'devoirs') {
      if (args.length > 4) {
        // Get teacher for this sender
        db.checkProf(message.author.id, args.shift(), args.shift(), process.env.OWNER, (status, prof) => {
          if (status == 1) {
            // Get date and time
            var date = args.shift().split('/');
            var heure = args.shift().split(':');

            // Check length
            if (date.length == 3 && heure.length == 2) {
              message.reply('J\'ajoute ça tout de suite dans la base de données...');

              // Add to database
              db.addDevoirs(prof.id, date, heure, args.join(' '), () => {
                // Confirme
                message.channel.send('Parfait, les devoirs ont été programmé !');
              });
            } else {
              message.reply('La date ou l\'heure n\'est pas au bon format, essaye `jj/mm/aaaa hh:mm`');
            }
          } else if (status == 2) {
            message.reply('La matière demandée n\'est pas dans la base de données, ou vous n\'êtes pas professeur de cette matière pour cette classe.');
          } else {
            message.reply('Seuls les professeurs peuvent ajouter des cours.');
          }
        });
      } else {
        message.reply('Il y a un problème avec ta commande, essaye `$devoirs <classe> <matière> <jour/mois/année> <heure:minutes> <contenu>`');
      }
    }

    // List porfs
    else if (command == 'matières') {
      // Fetch all courses
      db.getProfs((results) => {
        // List them
        var string = 'Voici les matières :';
        for (cour in results) {
          var name = results[cour].name;
          var user = results[cour].user;
          var role = results[cour].role;

          // Add string
          string += '\n- `' + name +'` (<@&' + role +'> avec <@' + user +'>)';
        }
        message.channel.send(string);
      });
    }

    // List courses
    else if (command == 'liste') {
      // Fetch all courses
      db.getCours((results) => {
        // List them
        var string = 'Voici les cours à venir :';
        for (cour in results) {
          var name = results[cour].name;
          var classe = results[cour].classe;
          var date = new Date(results[cour].start);

          // Add string
          string += '```' + name +' (' + classe + '), ' + moment(date).format('[le] DD/MM/YYYY [à] HH:mm') +'```';
        }
        message.channel.send(string);
      });

      // Fetch all homeworks
      db.getDevoirs((results) => {
        // List them
        var string = 'Voici les devoirs à venir :';
        for (cour in results) {
          var name = results[cour].name;
          var classe = results[cour].classe;
          var content = results[cour].content;
          var date = new Date(results[cour].due);

          // Add string
          string += '```' + name +' (' + classe + '), pour ' + moment(date).format('[le] DD/MM/YYYY') +' : ' + content + '```';
        }
        message.channel.send(string);
      });
    }
  });

  // login to Discord with your app's token
  client.login(process.env.TOKEN);
});
