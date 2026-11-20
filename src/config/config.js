require('dotenv').config({ quiet: true });

// Opções compartilhadas: colunas em snake_case e timestamps created_at/updated_at
const define = {
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
};

const mysql = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'digital_store',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  dialect: 'mysql',
  logging: false,
  define,
};

module.exports = {
  development: mysql,
  production: mysql,
  // Nos testes usamos SQLite em memória para não depender de um MySQL rodando
  test: { dialect: 'sqlite', storage: ':memory:', logging: false, define },
};
