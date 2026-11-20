const userService = require('../services/userService');
const { lerId } = require('../utils/query');

exports.buscar = async (req, res) => {
  res.status(200).json(await userService.buscarOuFalhar(lerId(req.params.id)));
};

exports.criar = async (req, res) => {
  res.status(201).json(await userService.criar(req.body));
};

exports.atualizar = async (req, res) => {
  await userService.atualizar(lerId(req.params.id), req.body);
  res.status(204).send();
};

exports.remover = async (req, res) => {
  await userService.remover(lerId(req.params.id));
  res.status(204).send();
};

exports.token = async (req, res) => {
  res.status(200).json({ token: await userService.gerarToken(req.body) });
};
