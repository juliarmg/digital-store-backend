const sequelize = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const ProductImage = require('./ProductImage');
const ProductOption = require('./ProductOption');
const ProductCategory = require('./ProductCategory');

// Um produto tem várias imagens, várias opções e pertence a várias categorias
Product.hasMany(ProductImage, { as: 'images', foreignKey: 'product_id', onDelete: 'CASCADE' });
ProductImage.belongsTo(Product, { foreignKey: 'product_id' });

Product.hasMany(ProductOption, { as: 'options', foreignKey: 'product_id', onDelete: 'CASCADE' });
ProductOption.belongsTo(Product, { foreignKey: 'product_id' });

Product.hasMany(ProductCategory, { as: 'productCategories', foreignKey: 'product_id', onDelete: 'CASCADE' });
Category.hasMany(ProductCategory, { as: 'productCategories', foreignKey: 'category_id', onDelete: 'CASCADE' });
ProductCategory.belongsTo(Product, { foreignKey: 'product_id' });
ProductCategory.belongsTo(Category, { foreignKey: 'category_id' });

module.exports = { sequelize, User, Category, Product, ProductImage, ProductOption, ProductCategory };
