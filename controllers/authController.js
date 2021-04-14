var hash = require('pbkdf2-password')();
var session = require('express-session');
var { getAdmins } = require('../utils');

const controller = {};

controller.session = session({
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
    secret: 'shhhh, very secret',
});

// Session-persisted message middleware
controller.middleware = function (req, res, next) {
    var err = req.session.error;
    var msg = req.session.success;
    var user = req.session.user;
    delete req.session.error;
    delete req.session.success;
    res.locals.message = '';
    res.locals.errMsg = '';
    res.locals.user = {};
    if (err) res.locals.errMsg = err;
    if (msg) res.locals.message = msg;
    if (user) res.locals.user = { name: user.name };
    next();
};

const saveDb = (data, callback) => {
    var fs = require('fs');
    const config = require('../config.json');
    const writeStream = fs.createWriteStream(config.admins, { flags: 'w', encoding: 'utf8' });
    writeStream.write(JSON.stringify(data, null, 4));
    writeStream.end();

    writeStream.on('error', function (err) {
        callback(err);
    });
    writeStream.on('finish', function () {
        callback();
    });
};

// Authenticate using our plain-object database of doom!

function authenticate(name, pass, fn) {
    if (!module.parent) console.log('authenticating %s:%s', name, pass);
    var admins = getAdmins();
    var user = admins[name];
    // query the db for the given username
    if (!user) return fn(new Error('cannot find user'));
    // apply the same algorithm to the POSTed password, applying
    // the hash against the pass / salt, if there is a match we
    // found the user
    hash({ password: pass, salt: user.salt }, function (err, pass, salt, hash) {
        if (err) return fn(err);
        if (hash === user.hash) return fn(null, user);
        fn(new Error('invalid password'));
    });
}

// routes
controller.logout = function (req, res) {
    // destroy the user's session to log them out
    // will be re-created next request
    req.session.destroy(function () {
        res.redirect('/');
    });
};

controller.login = function (req, res) {
    res.render('login');
};

controller.verify = function (req, res) {
    if (req.body.create) {
        createUser(req, res);
    } else {
        loginUser(req, res);
    }
};

const loginUser = (req, res) => {
    authenticate(req.body.username, req.body.password, function (err, user) {
        if (user) {
            // Regenerate session when signing in
            // to prevent fixation
            req.session.regenerate(function () {
                // Store the user's primary key
                // in the session store to be retrieved,
                // or in this case the entire user object
                req.session.user = user;
                req.session.success = 'Authenticated as ' + user.name;
                res.redirect('/users/');
            });
        } else {
            req.session.error = 'Authentication failed, please check your ' + ' username and password.';
            res.redirect('/auth/login');
        }
    });
};

const createUser = (req, res) => {
    var admins = getAdmins();
    // when you create a user, generate a salt
    // and hash the password ('foobar' is the pass here)
    var user = admins[req.body.username];
    if (!user) {
        hash({ password: req.body.password }, function (err, pass, salt, hash) {
            if (err) throw err;
            // store the salt & hash in the "db"
            admins[req.body.username] = {
                name: req.body.username,
                salt,
                hash,
            };
            saveDb(admins, (err) => {
                if (err) {
                    req.session.error = err.message;
                    res.redirect('/auth/login');
                } else {
                    loginUser(req, res);
                }
            });
        });
    } else {
        req.session.error = 'User already exists, please try to login.';
        res.redirect('/auth/login');
    }
};

module.exports = controller;
