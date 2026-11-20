const productService = require('../services/productService');
const { lerId } = require('../utils/query');

exports.listar = async (req, res) => {
  res.status(200).json(await productService.listar(req.query));
};

exports.buscar = async (req, res) => {
  res.status(200).json(await productService.detalhar(lerId(req.params.id)));
};

exports.criar = async (req, res) => {
  res.status(201).json(await productService.criar(req.body));
};

exports.atualizar = async (req, res) => {
  await productService.atualizar(lerId(req.params.id), req.body);
  res.status(204).send();
};

exports.remover = async (req, res) => {
  await productService.remover(lerId(req.params.id));
  res.status(204).send();
};
