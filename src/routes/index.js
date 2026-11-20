const { Router } = require('express');
const auth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const user = require('../controllers/userController');
const category = require('../controllers/categoryController');
const product = require('../controllers/productController');

const router = Router();

// Usuários
router.post('/user/token', asyncHandler(user.token));
router.post('/user', asyncHandler(user.criar));
router.get('/user/:id', asyncHandler(user.buscar));
router.put('/user/:id', auth, asyncHandler(user.atualizar));
router.delete('/user/:id', auth, asyncHandler(user.remover));

// Categorias (a rota /search precisa vir antes de /:id)
router.get('/category/search', asyncHandler(category.listar));
router.get('/category/:id', asyncHandler(category.buscar));
router.post('/category', auth, asyncHandler(category.criar));
router.put('/category/:id', auth, asyncHandler(category.atualizar));
router.delete('/category/:id', auth, asyncHandler(category.remover));

// Produtos
router.get('/product/search', asyncHandler(product.listar));
router.get('/product/:id', asyncHandler(product.buscar));
router.post('/product', auth, asyncHandler(product.criar));
router.put('/product/:id', auth, asyncHandler(product.atualizar));
router.delete('/product/:id', auth, asyncHandler(product.remover));

module.exports = router;
