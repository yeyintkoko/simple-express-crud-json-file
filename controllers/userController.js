const controller = {};
var { getDb } = require('../utils');

const saveDb = (data, callback) => {
    var fs = require('fs');
    const config = require('../config.json');
    fs.writeFile(config.db, JSON.stringify(data, null, 4), 'utf8', callback);
};

const getAllUsers = () => {
    const db = getDb();
    const users = Object.keys(db.items).map((key) => {
        return {
            id: key,
            ...db.items[key],
        };
    });
    return users;
};

const getUser = (id) => {
    const users = getAllUsers();
    const user = users.filter((it) => it.id === id)[0];
    return user;
};

const addUser = (user, callback) => {
    const db = getDb();
    const id = Math.max(...Object.keys(db.items));
    db.items[id + 1] = user;
    saveDb(db, callback);
};

const updateUser = (data, callback) => {
    const db = getDb();
    const user = db.items[data.id];
    if (user) {
        const id = data.id;
        delete data.id;
        db.items[id] = data;

        saveDb(db, callback);
    } else {
        callback(new Error('User not found'));
    }
};

const deleteUser = (id, callback) => {
    const db = getDb();
    delete db.items[id];
    saveDb(db, callback);
};

controller.list = (req, res) => {
    res.render('users', {
        data: getAllUsers(),
    });
};

controller.save = (req, res) => {
    const data = req.body;
    console.log(req.body);
    addUser(data, (err) => handleResponse(err, res));
};

controller.edit = (req, res) => {
    const { id } = req.params;
    res.render('users_edit', {
        data: getUser(id),
    });
};

controller.update = (req, res) => {
    const { id } = req.params;
    const data = req.body;
    data.id = id;
    updateUser(data, (err) => handleResponse(err, res));
};

controller.delete = (req, res) => {
    const { id } = req.params;
    deleteUser(id, (err) => handleResponse(err, res));
};

const handleResponse = (err, res) => {
    if (err) {
        res.render('error', {
            status: 500,
            message: err.message,
            error: err,
            url: req.url,
        });
    } else {
        res.redirect('/users');
    }
};

module.exports = controller;
