const restrict = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        req.session.error = 'Access denied!';
        res.redirect('/auth/login');
    }
};

const getDb = () => {
    const config = require('./config.json');
    const db = require(process.env.DB_URL || config.db);
    return db;
};

const getAdmins = () => {
    const config = require('./config.json');
    const db = require(config.admins);
    return db;
};

module.exports = {
    restrict,
    getDb,
    getAdmins,
};
