// Erro com código HTTP, lançado pelos services e convertido em resposta pelo errorHandler
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

module.exports = ApiError;
