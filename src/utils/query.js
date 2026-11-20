const ApiError = require('./ApiError');

// Lê limit e page da query. limit=-1 devolve tudo e ignora a página.
function lerPaginacao(query) {
  const limit = query.limit === undefined ? 12 : Number(query.limit);
  const page = query.page === undefined ? 1 : Number(query.page);

  if (!Number.isInteger(limit) || (limit < 1 && limit !== -1)) {
    throw new ApiError(400, 'O parâmetro limit deve ser um inteiro positivo ou -1');
  }
  if (!Number.isInteger(page) || page < 1) {
    throw new ApiError(400, 'O parâmetro page deve ser um inteiro maior que zero');
  }

  if (limit === -1) return { limit, page, options: {} };
  return { limit, page, options: { limit, offset: (page - 1) * limit } };
}

// fields=name,price devolve só esses campos (o id sempre vai junto)
function filtrarCampos(objeto, fields) {
  if (!fields) return objeto;
  const lista = String(fields).split(',').map((campo) => campo.trim()).filter(Boolean);
  const resultado = { id: objeto.id };
  lista.forEach((campo) => {
    if (campo in objeto) resultado[campo] = objeto[campo];
  });
  return resultado;
}

function lerId(valor) {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
}

module.exports = { lerPaginacao, filtrarCampos, lerId };
