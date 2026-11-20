const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ApiError = require('./ApiError');

const EXTENSOES = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

function pastaUploads() {
  return process.env.UPLOAD_DIR || path.resolve('uploads');
}

// Recebe a imagem em base64, grava em uploads/products e devolve o caminho relativo
function salvarImagem({ type, content }) {
  const extensao = EXTENSOES[type];
  if (!extensao) throw new ApiError(400, 'Tipo de imagem não suportado');
  if (!content || typeof content !== 'string') throw new ApiError(400, 'Conteúdo da imagem ausente');

  // aceita tanto o base64 puro quanto o formato data:image/png;base64,...
  const base64 = content.replace(/^data:[^;]+;base64,/, '');
  const arquivo = `${crypto.randomUUID()}.${extensao}`;
  const destino = path.join(pastaUploads(), 'products');

  fs.mkdirSync(destino, { recursive: true });
  fs.writeFileSync(path.join(destino, arquivo), Buffer.from(base64, 'base64'));

  return `products/${arquivo}`;
}

function removerImagem(caminhoRelativo) {
  const arquivo = path.join(pastaUploads(), caminhoRelativo);
  if (fs.existsSync(arquivo)) fs.unlinkSync(arquivo);
}

module.exports = { salvarImagem, removerImagem, pastaUploads };
