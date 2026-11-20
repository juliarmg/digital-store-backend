const { Sequelize } = require('sequelize');
const config = require('./config')[process.env.NODE_ENV || 'development'];

module.exports = new Sequelize(config.database, config.username, config.password, config);
