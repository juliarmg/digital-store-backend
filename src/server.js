require('dotenv').config({ quiet: true });
const app = require('./app');
const { sequelize } = require('./models');

const porta = process.env.PORT || 3000;

async function iniciar() {
  try {
    await sequelize.authenticate();
    app.listen(porta, () => console.log(`API rodando em http://localhost:${porta}`));
  } catch (erro) {
    console.error('Não foi possível conectar ao banco de dados:', erro.message);
    process.exit(1);
  }
}

iniciar();
