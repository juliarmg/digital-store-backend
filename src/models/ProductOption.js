const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductOption = sequelize.define(
  'ProductOption',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    product_id: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: true } },
    shape: { type: DataTypes.ENUM('square', 'circle'), allowNull: false, defaultValue: 'square' },
    radius: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    type: { type: DataTypes.ENUM('text', 'color'), allowNull: false, defaultValue: 'text' },
    // valores separados por vírgula, por exemplo "PP,GG,M" ou "#000,#FFF"
    values: { type: DataTypes.STRING, allowNull: false },
  },
  { tableName: 'product_options' }
);

module.exports = ProductOption;
