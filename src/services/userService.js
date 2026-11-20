const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');

const CAMPOS_PUBLICOS = ['id', 'firstname', 'surname', 'email'];

async function buscarOuFalhar(id) {
  const usuario = id ? await User.findByPk(id, { attributes: CAMPOS_PUBLICOS }) : null;
  if (!usuario) throw new ApiError(404, 'Usuário não encontrado');
  return usuario;
}

async function criar({ firstname, surname, email, password, confirmPassword }) {
  if (!firstname || !surname || !email || !password) {
    throw new ApiError(400, 'Informe firstname, surname, email e password');
  }
  if (password !== confirmPassword) {
    throw new ApiError(400, 'A confirmação de senha não confere');
  }

  const hash = await bcrypt.hash(password, 10);
  const usuario = await User.create({ firstname, surname, email, password: hash });
  return buscarOuFalhar(usuario.id);
}

async function atualizar(id, { firstname, surname, email }) {
  const usuario = id ? await User.findByPk(id) : null;
  if (!usuario) throw new ApiError(404, 'Usuário não encontrado');
  if (!firstname || !surname || !email) {
    throw new ApiError(400, 'Informe firstname, surname e email');
  }
  await usuario.update({ firstname, surname, email });
}

async function remover(id) {
  const usuario = id ? await User.findByPk(id) : null;
  if (!usuario) throw new ApiError(404, 'Usuário não encontrado');
  await usuario.destroy();
}

async function gerarToken({ email, password }) {
  if (!email || !password) throw new ApiError(400, 'Informe email e password');

  const usuario = await User.findOne({ where: { email } });
  const senhaCorreta = usuario && (await bcrypt.compare(password, usuario.password));
  if (!senhaCorreta) throw new ApiError(400, 'Email ou senha inválidos');

  return jwt.sign({ id: usuario.id }, process.env.JWT_SECRET || 'segredo-de-desenvolvimento', {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });
}

module.exports = { buscarOuFalhar, criar, atualizar, remover, gerarToken };
