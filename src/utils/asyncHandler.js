// Evita repetir try/catch nos controllers: qualquer erro cai no errorHandler
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
