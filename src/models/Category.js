const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define(
  'Category',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: true } },
    slug: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: true } },
    use_in_menu: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { tableName: 'categories' }
);

module.exports = Category;
