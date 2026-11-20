const categoryService = require('../services/categoryService');
const { lerId } = require('../utils/query');

exports.listar = async (req, res) => {
  res.status(200).json(await categoryService.listar(req.query));
};

exports.buscar = async (req, res) => {
  res.status(200).json(await categoryService.detalhar(lerId(req.params.id)));
};

exports.criar = async (req, res) => {
  res.status(201).json(await categoryService.criar(req.body));
};

exports.atualizar = async (req, res) => {
  await categoryService.atualizar(lerId(req.params.id), req.body);
  res.status(204).send();
};

exports.remover = async (req, res) => {
  await categoryService.remover(lerId(req.params.id));
  res.status(204).send();
};
