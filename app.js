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
  app.get('/api/:path', (request, response) => {
    if (request.params.path == 'classbot') {
      response.json({ classbot: true });
    } else if (request.params.path == 'liste') {
      db.getCours((cours) => {
        db.getDevoirs((devoirs) => {
          response.json({ cours: cours, devoirs: devoirs });
        });
      });
    } else {
      response.sendStatus(404);
    }
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
              channel.send('<@&' + process.env.ROLE + '> Le cours de `' + name + ' ' + moment(date).format('[du] DD/MM/YYYY [à] HH:mm') + '` avec <@' + user + '> va bientôt commencer !')
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
        var expired = moment().add(1, 'days');

        // Check if one is about to start
        for (cour in results) {
          var id = results[cour].id;
          var name = results[cour].name;
          var content = results[cour].content;
          var date = new Date(results[cour].due);
          var user = results[cour].user;

          // Check time
          if (moment(date).isBetween(before, after)) {
            // Course will start soon
            client.channels.fetch(process.env.CHANNEL).then(channel => {
              channel.send('<@&' + process.env.ROLE + '> Les devoirs de `' + name + ' pour ' + moment(date).format('[le] DD/MM/YYYY') + '` sont à rendre à <@' + user + '> !```' + content + '```')
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
        db.checkProf(message.author.id, args.shift(), (status) => {
          if (status == 1) {
            // Get date and time
            var date = args.shift().split('/');
            var heure = args.shift().split(':');

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
          } else if (status == 2) {
            message.reply('La matière demandée n\'est pas dans la base de données, ou vous n\'êtes pas professeur de cette matière.');
          } else {
            message.reply('Seuls les professeurs peuvent ajouter des cours.');
          }
        });
      } else {
        message.reply('Il y a un problème avec ta commande, essaye `$cours <matière> <jour/mois/année> <heure:minutes>`');
      }
    }

    // Add an homework
    else if (command == 'devoirs') {
      if (args.length > 3) {
        // Get teacher for this sender
        db.checkProf(message.author.id, args.shift(), (status) => {
          if (status == 1) {
            // Get date and time
            var date = args.shift().split('/');
            var heure = args.shift().split(':');

            // Check length
            if (date.length == 3 && heure.length == 2) {
              message.reply('J\'ajoute ça tout de suite dans la base de données...');

              // Add to database
              con.query('INSERT INTO devoirs (prof, due, content) VALUES(?, ?, ?)', [profs[0].id, date[2] + '-' + date[1] + '-' + date[0] + ' ' + heure[0] + ':' + heure[1], args.join(' ')], (err, results, fields) => {
                if (err) {
                  return console.error(err.message);
                }

                // Confirme
                message.channel.send('Parfait, les devoirs ont été programmé !');
              });
            } else {
              message.reply('La date ou l\'heure n\'est pas au bon format, essaye `jj/mm/aaaa hh:mm`');
            }
          } else if (status == 2) {
            message.reply('La matière demandée n\'est pas dans la base de données, ou vous n\'êtes pas professeur de cette matière.');
          } else {
            message.reply('Seuls les professeurs peuvent ajouter des cours.');
          }
        });
      } else {
        message.reply('Il y a un problème avec ta commande, essaye `$devoirs <matière> <jour/mois/année> <heure:minutes> <contenu>`');
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

          // Add string
          string += '\n- `' + name +'` (professeur : <@' + user +'>)';
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
          var date = new Date(results[cour].start);

          // Add string
          string += '```' + name +', ' + moment(date).format('[le] DD/MM/YYYY [à] HH:mm') +'```';
        }
        message.channel.send(string);
      });

      // Fetch all homeworks
      db.getDevoirs((results) => {
        // List them
        var string = 'Voici les devoirs à venir :';
        for (cour in results) {
          var name = results[cour].name;
          var content = results[cour].content;
          var date = new Date(results[cour].due);

          // Add string
          string += '```' + name +', pour ' + moment(date).format('[le] DD/MM/YYYY') +' : ' + content + '```';
        }
        message.channel.send(string);
      });
    }
  });

  // login to Discord with your app's token
  client.login(process.env.TOKEN);
});
