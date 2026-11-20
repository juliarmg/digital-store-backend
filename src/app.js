const express = require('express');
const cors = require('cors');
const qs = require('qs');
const swaggerUi = require('swagger-ui-express');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const swaggerDocument = require('./docs/swagger');
const { pastaUploads } = require('./utils/imageStorage');

const app = express();

// O padrão do Express 5 não entende filtros como option[45]=GG,PP. Com parseArrays desligado,
// o 45 vira chave de objeto em vez de posição de lista.
app.set('query parser', (texto) => qs.parse(texto, { parseArrays: false }));

app.use(cors());
// as imagens chegam em base64 dentro do JSON, então o limite padrão é pequeno demais
app.use(express.json({ limit: '10mb' }));

app.use('/uploads', express.static(pastaUploads()));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/v1', routes);

app.use((req, res) => res.status(404).json({ message: 'Rota não encontrada' }));
app.use(errorHandler);

module.exports = app;
