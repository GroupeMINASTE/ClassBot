// Constructor
function Database(con) {
  // Save connection
  this._con = con;

  // Setup database
  this._con.query('CREATE TABLE IF NOT EXISTS `profs` (`id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY, `user` varchar(255) NOT NULL, `name` varchar(255) NOT NULL);', function (err, result) {
    if (err) throw err;
  });
  this._con.query('CREATE TABLE IF NOT EXISTS `cours` (`id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY, `prof` int(11) NOT NULL, `start` datetime NOT NULL);', function (err, result) {
    if (err) throw err;
  });
  this._con.query('CREATE TABLE IF NOT EXISTS `devoirs` (`id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY, `prof` int(11) NOT NULL, `content` text NOT NULL, `due` datetime NOT NULL);', function (err, result) {
    if (err) throw err;
  });
};

// Get courses
Database.prototype.getCours = function(callback) {
  // Fetch all courses
  this._con.query('SELECT cours.id as id, profs.name as name, cours.start as start, profs.user as user FROM cours LEFT JOIN profs ON cours.prof = profs.id ORDER BY start', (err, results, fields) => {
    if (err) {
      return console.error(err.message);
    }

    // Callback
    callback(results);
  });
};

// Get homeworks
Database.prototype.getDevoirs = function(callback) {
  // Fetch all courses
  this._con.query('SELECT devoirs.id as id, profs.name as name, devoirs.due as due, devoirs.content as content, profs.user as user FROM devoirs LEFT JOIN profs ON devoirs.prof = profs.id ORDER BY due', (err, results, fields) => {
    if (err) {
      return console.error(err.message);
    }

    // Callback
    callback(results);
  });
};

// Get profs
Database.prototype.getProfs = function(callback) {
  // Fetch all teachers
  this._con.query('SELECT * FROM profs', (err, results, fields) => {
    if (err) {
      return console.error(err.message);
    }

    // Callback
    callback(results);
  });
};

// Check prof
Database.prototype.checkProf = function(user, matiere, callback) {
  // Fetch all teachers
  con.query('SELECT * FROM profs WHERE user = ?', [user], (error, results, fields) => {
    if (error) {
      return console.error(error.message);
    }
    if (results && results.length > 0) {
      con.query('SELECT * FROM profs WHERE user = ? AND name = ?', [user, matiere], (error, profs, fields) => {
        if (error) {
          return console.error(error.message);
        }

        // Callback
        callback(profs && profs.length > 0 ? 1 : 2);
      });
    } else {
      // Callback
      callback(3);
    }
  });
};

// Export
module.exports = Database;
