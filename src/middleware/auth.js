const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

// Exige o cabeçalho Authorization: Bearer <token> nas rotas de escrita
module.exports = (req, res, next) => {
  const cabecalho = req.headers.authorization || '';
  const [tipo, token] = cabecalho.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return next(new ApiError(401, 'Token de autenticação não informado'));
  }

  try {
    const dados = jwt.verify(token, process.env.JWT_SECRET || 'segredo-de-desenvolvimento');
    req.userId = dados.id;
    return next();
  } catch (erro) {
    return next(new ApiError(401, 'Token inválido ou expirado'));
  }
};
