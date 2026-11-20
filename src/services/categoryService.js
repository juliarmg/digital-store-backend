const { Category } = require('../models');
const ApiError = require('../utils/ApiError');
const { lerPaginacao, filtrarCampos } = require('../utils/query');

function formatar(categoria) {
  return {
    id: categoria.id,
    name: categoria.name,
    slug: categoria.slug,
    use_in_menu: categoria.use_in_menu,
  };
}

async function buscarOuFalhar(id) {
  const categoria = id ? await Category.findByPk(id) : null;
  if (!categoria) throw new ApiError(404, 'Categoria não encontrada');
  return categoria;
}

function validar({ name, slug, use_in_menu: useInMenu }) {
  if (!name || !slug) throw new ApiError(400, 'Informe name e slug');
  if (useInMenu !== undefined && typeof useInMenu !== 'boolean') {
    throw new ApiError(400, 'use_in_menu deve ser verdadeiro ou falso');
  }
}

async function listar(query) {
  const { limit, page, options } = lerPaginacao(query);
  const where = {};
  if (query.use_in_menu !== undefined) where.use_in_menu = query.use_in_menu === 'true';

  const { rows, count } = await Category.findAndCountAll({ where, order: [['id', 'ASC']], ...options });
  return {
    data: rows.map((c) => filtrarCampos(formatar(c), query.fields)),
    total: count,
    limit,
    page: limit === -1 ? 1 : page,
  };
}

async function detalhar(id) {
  return formatar(await buscarOuFalhar(id));
}

async function criar(dados) {
  validar(dados);
  const categoria = await Category.create({
    name: dados.name,
    slug: dados.slug,
    use_in_menu: dados.use_in_menu,
  });
  return formatar(categoria);
}

async function atualizar(id, dados) {
  const categoria = await buscarOuFalhar(id);
  validar(dados);
  const campos = { name: dados.name, slug: dados.slug };
  if (dados.use_in_menu !== undefined) campos.use_in_menu = dados.use_in_menu;
  await categoria.update(campos);
}

async function remover(id) {
  const categoria = await buscarOuFalhar(id);
  await categoria.destroy();
}

module.exports = { listar, detalhar, criar, atualizar, remover };
