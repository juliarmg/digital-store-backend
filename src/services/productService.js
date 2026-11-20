const { Op } = require('sequelize');
const {
  sequelize, Product, ProductImage, ProductOption, ProductCategory, Category,
} = require('../models');
const ApiError = require('../utils/ApiError');
const { lerPaginacao, filtrarCampos } = require('../utils/query');
const { salvarImagem, removerImagem } = require('../utils/imageStorage');

const INCLUIR = [
  { model: ProductImage, as: 'images' },
  { model: ProductOption, as: 'options' },
  { model: ProductCategory, as: 'productCategories' },
];

// ordem fixa para produtos, imagens e opções saírem sempre na mesma sequência
const ORDEM = [
  ['id', 'ASC'],
  [{ model: ProductImage, as: 'images' }, 'id', 'ASC'],
  [{ model: ProductOption, as: 'options' }, 'id', 'ASC'],
];

// "PP,GG" ou ["PP", "GG"] viram sempre uma lista
function listaDeValores(valores) {
  if (Array.isArray(valores)) return valores.map(String);
  return String(valores).split(',').map((v) => v.trim()).filter(Boolean);
}

function formatar(produto) {
  return {
    id: produto.id,
    enabled: produto.enabled,
    name: produto.name,
    slug: produto.slug,
    use_in_menu: produto.use_in_menu,
    stock: produto.stock,
    description: produto.description,
    price: produto.price,
    price_with_discount: produto.price_with_discount,
    category_ids: produto.productCategories.map((pc) => pc.category_id),
    images: produto.images.map((img) => ({ id: img.id, content: `/uploads/${img.path}` })),
    options: produto.options.map((op) => ({
      id: op.id,
      title: op.title,
      shape: op.shape,
      radius: op.radius,
      type: op.type,
      values: listaDeValores(op.values),
    })),
  };
}

async function buscarOuFalhar(id, transaction) {
  const produto = id ? await Product.findByPk(id, { include: INCLUIR, order: ORDEM, transaction }) : null;
  if (!produto) throw new ApiError(404, 'Produto não encontrado');
  return produto;
}

function validarProduto(dados, parcial = false) {
  const obrigatorios = ['name', 'slug', 'price', 'price_with_discount'];
  if (!parcial) {
    const faltando = obrigatorios.filter((campo) => dados[campo] === undefined || dados[campo] === '');
    if (faltando.length) throw new ApiError(400, `Campos obrigatórios ausentes: ${faltando.join(', ')}`);
  }
  ['price', 'price_with_discount'].forEach((campo) => {
    if (dados[campo] !== undefined && (typeof dados[campo] !== 'number' || dados[campo] < 0)) {
      throw new ApiError(400, `${campo} deve ser um número maior ou igual a zero`);
    }
  });
  if (dados.stock !== undefined && !Number.isInteger(dados.stock)) {
    throw new ApiError(400, 'stock deve ser um número inteiro');
  }
  if (dados.category_ids !== undefined && !Array.isArray(dados.category_ids)) {
    throw new ApiError(400, 'category_ids deve ser uma lista');
  }
}

function dadosDoProduto(dados) {
  const campos = ['enabled', 'name', 'slug', 'use_in_menu', 'stock', 'description', 'price', 'price_with_discount'];
  return Object.fromEntries(campos.filter((c) => dados[c] !== undefined).map((c) => [c, dados[c]]));
}

function dadosDaOpcao(opcao) {
  const valores = opcao.values !== undefined ? opcao.values : opcao.value;
  const campos = { title: opcao.title, shape: opcao.shape, type: opcao.type };
  if (opcao.radius !== undefined) campos.radius = parseInt(opcao.radius, 10);
  if (valores !== undefined) campos.values = listaDeValores(valores).join(',');
  return Object.fromEntries(Object.entries(campos).filter(([, v]) => v !== undefined));
}

async function vincularCategorias(productId, categoryIds, transaction) {
  await ProductCategory.destroy({ where: { product_id: productId }, transaction });
  if (!categoryIds.length) return;

  const existentes = await Category.count({ where: { id: categoryIds }, transaction });
  if (existentes !== new Set(categoryIds).size) throw new ApiError(400, 'Alguma categoria informada não existe');

  await ProductCategory.bulkCreate(
    [...new Set(categoryIds)].map((category_id) => ({ product_id: productId, category_id })),
    { transaction }
  );
}

async function aplicarImagens(productId, imagens, transaction) {
  if (!Array.isArray(imagens)) throw new ApiError(400, 'images deve ser uma lista');

  for (const imagem of imagens) {
    const atual = imagem.id
      ? await ProductImage.findOne({ where: { id: imagem.id, product_id: productId }, transaction })
      : null;
    if (imagem.id && !atual) throw new ApiError(400, `Imagem ${imagem.id} não pertence ao produto`);

    if (atual && imagem.deleted) {
      removerImagem(atual.path);
      await atual.destroy({ transaction });
    } else if (atual) {
      // com novo conteúdo substitui o arquivo; sem conteúdo mantém o atual
      if (imagem.content) {
        removerImagem(atual.path);
        await atual.update({ path: salvarImagem(imagem) }, { transaction });
      }
    } else if (!imagem.deleted) {
      await ProductImage.create(
        { product_id: productId, enabled: true, path: salvarImagem(imagem) },
        { transaction }
      );
    }
  }
}

async function aplicarOpcoes(productId, opcoes, transaction) {
  if (!Array.isArray(opcoes)) throw new ApiError(400, 'options deve ser uma lista');

  for (const opcao of opcoes) {
    const atual = opcao.id
      ? await ProductOption.findOne({ where: { id: opcao.id, product_id: productId }, transaction })
      : null;
    if (opcao.id && !atual) throw new ApiError(400, `Opção ${opcao.id} não pertence ao produto`);

    if (atual && opcao.deleted) {
      await atual.destroy({ transaction });
    } else if (atual) {
      await atual.update(dadosDaOpcao(opcao), { transaction });
    } else if (!opcao.deleted) {
      if (!opcao.title || (opcao.values === undefined && opcao.value === undefined)) {
        throw new ApiError(400, 'Cada opção precisa de title e values');
      }
      await ProductOption.create({ ...dadosDaOpcao(opcao), product_id: productId }, { transaction });
    }
  }
}

async function criar(dados) {
  validarProduto(dados);

  const id = await sequelize.transaction(async (transaction) => {
    const produto = await Product.create(dadosDoProduto(dados), { transaction });
    await vincularCategorias(produto.id, dados.category_ids || [], transaction);
    if (dados.images) await aplicarImagens(produto.id, dados.images, transaction);
    if (dados.options) await aplicarOpcoes(produto.id, dados.options, transaction);
    return produto.id;
  });

  return formatar(await buscarOuFalhar(id));
}

async function atualizar(idProduto, dados) {
  validarProduto(dados, true);

  await sequelize.transaction(async (transaction) => {
    const produto = await buscarOuFalhar(idProduto, transaction);
    await produto.update(dadosDoProduto(dados), { transaction });
    if (dados.category_ids) await vincularCategorias(produto.id, dados.category_ids, transaction);
    if (dados.images) await aplicarImagens(produto.id, dados.images, transaction);
    if (dados.options) await aplicarOpcoes(produto.id, dados.options, transaction);
  });
}

async function remover(idProduto) {
  const produto = await buscarOuFalhar(idProduto);
  produto.images.forEach((img) => removerImagem(img.path));
  await produto.destroy();
}

async function detalhar(idProduto) {
  return formatar(await buscarOuFalhar(idProduto));
}

// Devolve os ids de produtos que atendem aos filtros que dependem de outras tabelas
async function idsPorFiltrosRelacionados(query) {
  let ids = null;
  const intersecao = (novos) => {
    ids = ids === null ? novos : ids.filter((id) => novos.includes(id));
  };

  if (query.category_ids) {
    const categorias = String(query.category_ids).split(',').map(Number).filter(Number.isInteger);
    const ligacoes = await ProductCategory.findAll({ where: { category_id: categorias } });
    intersecao([...new Set(ligacoes.map((l) => l.product_id))]);
  }

  // option[45]=GG,PP: o produto precisa ter a opção 45 com algum desses valores
  if (query.option && typeof query.option === 'object') {
    for (const [idOpcao, valores] of Object.entries(query.option)) {
      const desejados = listaDeValores(valores);
      const opcao = await ProductOption.findByPk(Number(idOpcao));
      const bate = opcao && listaDeValores(opcao.values).some((v) => desejados.includes(v));
      intersecao(bate ? [opcao.product_id] : []);
    }
  }

  return ids;
}

async function listar(query) {
  const { limit, page, options } = lerPaginacao(query);
  const where = {};

  if (query.match) {
    where[Op.or] = [
      { name: { [Op.like]: `%${query.match}%` } },
      { description: { [Op.like]: `%${query.match}%` } },
    ];
  }

  const faixa = query['price-range'];
  if (faixa) {
    const [minimo, maximo] = String(faixa).split('-').map(Number);
    if (Number.isNaN(minimo) || Number.isNaN(maximo)) {
      throw new ApiError(400, 'price-range deve seguir o formato 100-200');
    }
    where.price = { [Op.between]: [minimo, maximo] };
  }

  const ids = await idsPorFiltrosRelacionados(query);
  if (ids !== null) where.id = ids;

  const { rows, count } = await Product.findAndCountAll({
    where,
    include: INCLUIR,
    distinct: true,
    order: ORDEM,
    ...options,
  });

  return {
    data: rows.map((p) => filtrarCampos(formatar(p), query.fields)),
    total: count,
    limit,
    page: limit === -1 ? 1 : page,
  };
}

module.exports = { listar, detalhar, criar, atualizar, remover };
