const { ValidationError, UniqueConstraintError } = require('sequelize');

// Converte qualquer erro em uma resposta JSON com o código HTTP adequado
// eslint-disable-next-line no-unused-vars
module.exports = (erro, req, res, next) => {
  if (erro.status) {
    return res.status(erro.status).json({ message: erro.message });
  }

  if (erro instanceof UniqueConstraintError) {
    return res.status(400).json({ message: 'Já existe um registro com esses dados' });
  }

  if (erro instanceof ValidationError) {
    return res.status(400).json({ message: erro.errors.map((e) => e.message).join('; ') });
  }

  // JSON malformado enviado pelo cliente
  if (erro.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'JSON inválido' });
  }

  console.error(erro);
  return res.status(500).json({ message: 'Erro interno do servidor' });
};
