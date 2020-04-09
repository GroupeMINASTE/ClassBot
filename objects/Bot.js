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

class Bot {

  // Constructor
  constructor(db) {
    // Get classes
    const Discord = require('discord.js');

    // Save database
    this._db = db;

    // Init client
    this._client = new Discord.Client();

    // When client is ready
    this._client.once('ready', this.onReady.bind(this));

    // Listen for messages
    this._client.on('message', this.onMessage.bind(this));

    // Login to Discord
    this._client.login(process.env.TOKEN);
  }

  // When bot is ready
  onReady() {
    // Log
    console.log('Discord bot is running!');

    // Run to check for a course
    setInterval(() => {
      // Keep the server up
      if (process.env.HOST !== undefined) {
        const https = require('https');
        https.get('https://' + process.env.HOST);
      }

      // Import moment
      const moment = require('moment');

      // Fetch all courses
      this._db.getCours((results) => {
        // Get current interval
        var before = moment().add(5, 'minutes');
        var after = moment().add(10, 'minutes');
        var expired = moment().subtract(1, 'hours');

        // Check if one is about to start
        results.forEach(cour => {
          var id = cour.id;
          var name = cour.name;
          var classe = cour.classe;
          var date = new Date(cour.start);
          var user = cour.user;
          var role = cour.role;

          // Check time
          if (moment(date).isBetween(before, after)) {
            // Course will start soon
            this.sendMessage(process.env.CHANNEL, '<@&' + role + '> Le cours de `' + name + ' (' + classe + ') ' + moment(date).format('[du] DD/MM/YYYY [à] HH:mm') + '` avec <@' + user + '> va bientôt commencer !');
          } else if (moment(date).isBefore(expired)) {
            // Delete the course
            this._db._con.query('DELETE FROM cours WHERE id = ?', [id], (err, results, fields) => {
              if (err) {
                return console.error(err.message);
              }
            });
          }
        });
      });

      // Fetch all homeworks
      this._db.getDevoirs((results) => {
        // Get current interval
        var before = moment().add(5, 'minutes');
        var after = moment().add(10, 'minutes');
        var expired = moment().startOf('day');

        // Check if one is about to start
        results.forEach(cour => {
          var id = cour.id;
          var name = cour.name;
          var classe = cour.classe;
          var content = cour.content;
          var date = new Date(cour.due);
          var user = cour.user;
          var role = cour.role;

          // Check time
          if (moment(date).isBetween(before, after)) {
            // Course will start soon
            this.sendMessage(process.env.CHANNEL, '<@&' + role + '> N\'oubliez pas les devoirs de `' + name + ' (' + classe + ') pour ' + moment(date).format('[le] DD/MM/YYYY') + '` avec <@' + user + '> !```' + content + '```');
          } else if (moment(date).isBefore(expired)) {
            // Delete the course
            this._db._con.query('DELETE FROM devoirs WHERE id = ?', [id], (err, results, fields) => {
              if (err) {
                return console.error(err.message);
              }
            });
          }
        });
      });
    }, 300000);
  }

  // When a message is received
  onMessage(message) {
    // Skip non commands
    if (!message.content.startsWith('$') || message.author.bot) return;

    // Get args and command
    const args = message.content.slice(1).split(/ +/);
    const command = args.shift().toLowerCase();

    // Import moment
    const moment = require('moment');

    // Handle commands
    if (command == 'ping') {
      // Ping
      message.reply('Pong');
    }

    // Add a classe
    else if (command == 'classe') {
      if (message.author.id == process.env.OWNER) {
        if (args.length == 2) {
          message.reply('J\'ajoute ça tout de suite dans la base de données...');

          // Add to database
          this._db.addClasse(args[0], args[1], () => {
            // Confirme
            message.channel.send('Parfait, la classe ' + args[1] + ' (<@&' + args[0] + '>) a été crée');
          });
        } else {
          message.reply('Il y a un problème avec ta commande, essaye `$classe <id> <classe>');
        }
      } else {
        message.reply('Tu n\'as pas le droit de gérer la liste des classes, demande à <@' + process.env.OWNER + '> de le faire.');
      }
    }

    // Add a teacher
    else if (command == 'prof') {
      if (message.author.id == process.env.OWNER) {
        if (args.length == 3) {
          message.reply('J\'ajoute ça tout de suite dans la base de données...');

          // Add to database
          this._db.addProf(args[0], args[1], args[2], (status) => {
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
        this._db.checkProf(message.author.id, args.shift(), args.shift(), process.env.OWNER, (status, prof) => {
          if (status == 1) {
            // Get date and time
            var date = args.shift().split('/');
            var heure = args.shift().split(':');

            // Check length
            if (date.length == 3 && heure.length == 2) {
              message.reply('J\'ajoute ça tout de suite dans la base de données...');

              // Add to database
              this._db.addCours(prof.id, date, heure, () => {
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
        this._db.checkProf(message.author.id, args.shift(), args.shift(), process.env.OWNER, (status, prof) => {
          if (status == 1) {
            // Get date and time
            var date = args.shift().split('/');
            var heure = args.shift().split(':');

            // Check length
            if (date.length == 3 && heure.length == 2) {
              message.reply('J\'ajoute ça tout de suite dans la base de données...');

              // Add to database
              this._db.addDevoirs(prof.id, date, heure, args.join(' '), () => {
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
      this._db.getProfs((results) => {
        // List them
        var string = 'Voici les matières :';
        results.forEach(cour => {
          var name = cour.name;
          var user = cour.user;
          var role = cour.role;

          // Add string
          string += '\n- `' + name +'` (<@&' + role +'> avec <@' + user +'>)';
        });
        message.channel.send(string);
      });
    }

    // List courses
    else if (command == 'liste') {
      // Fetch all courses
      this._db.getCours((results) => {
        // List them
        var string = 'Voici les cours à venir :';
        results.forEach(cour => {
          var name = cour.name;
          var classe = cour.classe;
          var date = new Date(cour.start);

          // Add string
          string += '```' + name +' (' + classe + '), ' + moment(date).format('[le] DD/MM/YYYY [à] HH:mm') +'```';
        });
        message.channel.send(string);
      });

      // Fetch all homeworks
      this._db.getDevoirs((results) => {
        // List them
        var string = 'Voici les devoirs à venir :';
        results.forEach(cour => {
          var name = cour.name;
          var classe = cour.classe;
          var content = cour.content;
          var date = new Date(cour.due);

          // Add string
          string += '```' + name +' (' + classe + '), pour ' + moment(date).format('[le] DD/MM/YYYY') +' : ' + content + '```';
        });
        message.channel.send(string);
      });
    }
  }

  sendMessage(channel, message) {
    this._client.channels.fetch(channel).then(givenChannel => {
      givenChannel.send(message);
    }).catch(console.error);
  }

}

module.exports = Bot;
