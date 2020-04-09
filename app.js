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
const Database = require(path.join(__dirname, 'objects/Database'));
const Web = require(path.join(__dirname, 'objects/Web'));
const Bot = require(path.join(__dirname, 'objects/Bot'));

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

  // Setup Web server
  var web = new Web(db);

  // Setup Bot
  var bot = new Bot(db);
});
