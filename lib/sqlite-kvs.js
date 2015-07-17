// [Node.js module]
// Key-Value store using SQLite3

var SQLite3 = require('sqlite3').verbose();

var kvs = function () {
  this.db = null;
};

// open database (instantiate db object)
kvs.prototype.open = function (dbpath, callback) {
  var db = new kvs();
  db._open(dbpath, callback);
  return db;
};

kvs.prototype.close = function () {
  if (this.db) this.db.close();
};

kvs.prototype._open = function (dbpath, callback) {
  var self = this;
  var db = self.db = new SQLite3.Database(dbpath);
  db.serialize(function() {
    db.run(
      'CREATE TABLE IF NOT EXISTS items(' +
      ' key   TEXT PRIMARY KEY,' +
      ' value TEXT,' +
      ' ctime INTEGER,' +
      ' mtime INTEGER)');
    self.stmt_get  = db.prepare(
      'SELECT * FROM items WHERE key=? LIMIT 1'
    );
    self.stmt_insert = db.prepare(
      'INSERT INTO items (key,value,ctime,mtime) VALUES (?,?,?,?)'
    );
    self.stmt_update = db.prepare(
      'UPDATE items SET value=?, mtime=? WHERE key=?'
    );
    self.stmt_all = db.prepare(
      'SELECT * FROM items'
    );
    self.stmt_find = db.prepare(
      'SELECT * FROM items WHERE key LIKE ?'
    );
  }, callback);
};

kvs.prototype.get = function (key, callback) {
  var self = this;
  if (typeof(callback) != "function") return self;
  self.stmt_get.get([key], function (err, row) {
    if (err) {
      callback(undefined);
      return;
    }
    // empty key
    if (row == undefined) {
      callback(undefined);
      return;
    }
    // return key
    callback(row.value);
  });
  return self;
};

kvs.prototype.put = function (key, value, callback) {
  var self = this;
  var t = (new Date()).getTime();
  this.get(key, function (v) {
    if (v == undefined) {
      self.stmt_insert.run([key,value,t,t], callback);
    } else {
      self.stmt_update.run([value, t, key], callback);
    }
  });
  return self;
};

kvs.prototype.all = function (callback) {
  if (typeof(callback) != "function") return this;
  var self = this;
  self.stmt_all.all([], function (err, rows) {
    var r = {};
    for (var i in rows) {
      var row = rows[i];
      var key = row.key;
      r[key] = row.value;
    }
    callback(r);
  });
  return self;
};

kvs.prototype.find = function (prefix, callback) {
  if (typeof(callback) != "function") return this;
  var self = this;
  self.stmt_find.all([prefix+"%"], function (err, rows) {
    var r = {};
    for (var i in rows) {
      var row = rows[i];
      var key = row.key;
      r[key] = row.value;
    }
    callback(r);
  });
  return self;
};

// export
module.exports = new kvs();
