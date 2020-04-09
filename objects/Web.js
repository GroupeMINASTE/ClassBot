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

class Web {

  // Constructor
  constructor(db) {
    // Get classes
    const express = require('express');

    // Save database
    this._db = db;

    // Init app
    this._app = express();

    // Init queries
    this._app.get('/', this.root.bind(this));
    this._app.get('/api/classbot', this.classbot.bind(this));
    this._app.get('/api/liste', this.liste.bind(this));
    this._app.get('/api/liste/:classe', this.listeClass.bind(this));

    // Set date format
    this._app.set('json replacer', this.replaceJSON);

    // Serv statis files
    this._app.use(express.static('public'))

    // Start web server
    this._app.listen(process.env.PORT || 3000, () => console.log('Web server is running!'));
  }

  // JSON replacer
  replaceJSON(key, value) {
    if (this[key] instanceof Date) {
      // Replace date format
      const moment = require('moment');
      value = moment(this[key]).format('YYYY-MM-DD HH:mm:ss');
    }

    return value;
  }

  // Root
  root(request, response) {
    response.sendStatus(200);
  }

  // Classbot verification
  classbot(request, response) {
    response.json({ classbot: true });
  }

  // General list
  liste(request, response) {
    this._db.getClasses((classes) => {
      this._db.getCours((cours) => {
        this._db.getDevoirs((devoirs) => {
          response.json({ classes: classes, cours: cours, devoirs: devoirs });
        });
      });
    });
  }

  // List for class
  listeClass(request, response) {
    this._db.getCours((cours) => {
      this._db.getDevoirs((devoirs) => {
        response.json({ cours: cours.filter(cours => cours.classe == request.params.classe), devoirs: devoirs.filter(devoirs => devoirs.classe == request.params.classe) });
      });
    });
  }

}

module.exports = Web;
