const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.UPLOAD_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'uploads-'));
process.env.JWT_SECRET = 'segredo-de-teste';

const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/models');

// PNG de 1x1 pixel
const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

let token;
let userId;

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

const auth = () => ({ Authorization: `Bearer ${token}` });

describe('usuários', () => {
  const dados = { firstname: 'Maria', surname: 'Silva', email: 'maria@email.com', password: '123456', confirmPassword: '123456' };

  test('cadastra e não devolve a senha', async () => {
    const res = await request(app).post('/v1/user').send(dados);
    expect(res.status).toBe(201);
    expect(res.body.password).toBeUndefined();
    userId = res.body.id;
  });

  test('recusa senhas diferentes e e-mail repetido', async () => {
    expect((await request(app).post('/v1/user').send({ ...dados, confirmPassword: 'x' })).status).toBe(400);
    expect((await request(app).post('/v1/user').send(dados)).status).toBe(400);
  });

  test('gera token e recusa credenciais erradas', async () => {
    const ok = await request(app).post('/v1/user/token').send({ email: dados.email, password: dados.password });
    expect(ok.status).toBe(200);
    token = ok.body.token;
    expect((await request(app).post('/v1/user/token').send({ email: dados.email, password: 'errada' })).status).toBe(400);
  });

  test('busca usuário e devolve 404 para inexistente', async () => {
    expect((await request(app).get(`/v1/user/${userId}`)).status).toBe(200);
    expect((await request(app).get('/v1/user/999')).status).toBe(404);
  });

  test('atualizar exige token', async () => {
    const corpo = { firstname: 'Maria', surname: 'Souza', email: dados.email };
    expect((await request(app).put(`/v1/user/${userId}`).send(corpo)).status).toBe(401);
    expect((await request(app).put(`/v1/user/${userId}`).set('Authorization', 'Bearer falso').send(corpo)).status).toBe(401);
    expect((await request(app).put(`/v1/user/${userId}`).set(auth()).send(corpo)).status).toBe(204);
    expect((await request(app).put('/v1/user/999').set(auth()).send(corpo)).status).toBe(404);
  });
});

describe('categorias', () => {
  let id;

  test('CRUD completo', async () => {
    expect((await request(app).post('/v1/category').send({ name: 'A', slug: 'a' })).status).toBe(401);
    expect((await request(app).post('/v1/category').set(auth()).send({ name: 'A' })).status).toBe(400);

    const criada = await request(app).post('/v1/category').set(auth()).send({ name: 'Tênis', slug: 'tenis', use_in_menu: true });
    expect(criada.status).toBe(201);
    id = criada.body.id;

    expect((await request(app).get(`/v1/category/${id}`)).body.slug).toBe('tenis');
    expect((await request(app).put(`/v1/category/${id}`).set(auth()).send({ name: 'Tênis novos', slug: 'tenis' })).status).toBe(204);
    expect((await request(app).get(`/v1/category/${id}`)).body.name).toBe('Tênis novos');
  });

  test('lista com paginação, fields e filtro', async () => {
    await request(app).post('/v1/category').set(auth()).send({ name: 'Bonés', slug: 'bones' });
    const todas = await request(app).get('/v1/category/search?limit=-1');
    expect(todas.body.total).toBe(2);

    const pagina = await request(app).get('/v1/category/search?limit=1&page=2&fields=name');
    expect(pagina.body.data).toEqual([{ id: expect.any(Number), name: 'Bonés' }]);

    const menu = await request(app).get('/v1/category/search?use_in_menu=true');
    expect(menu.body.data).toHaveLength(1);
    expect((await request(app).get('/v1/category/search?limit=abc')).status).toBe(400);
  });

  test('remove e devolve 404 depois', async () => {
    expect((await request(app).delete(`/v1/category/${id}`).set(auth())).status).toBe(204);
    expect((await request(app).delete(`/v1/category/${id}`).set(auth())).status).toBe(404);
  });
});

describe('produtos', () => {
  let categoriaId;
  let produto;

  beforeAll(async () => {
    const cat = await request(app).post('/v1/category').set(auth()).send({ name: 'Calçados', slug: 'calcados' });
    categoriaId = cat.body.id;
  });

  const novo = () => ({
    enabled: true,
    name: 'Tênis Nike',
    slug: 'tenis-nike',
    stock: 5,
    description: 'Tênis confortável',
    price: 200,
    price_with_discount: 180,
    category_ids: [categoriaId],
    images: [{ type: 'image/png', content: PNG }],
    options: [{ title: 'Tamanho', shape: 'square', type: 'text', values: ['40', '41'] }],
  });

  test('cria com imagens, opções e categorias', async () => {
    expect((await request(app).post('/v1/product').send(novo())).status).toBe(401);
    expect((await request(app).post('/v1/product').set(auth()).send({ name: 'x' })).status).toBe(400);
    expect((await request(app).post('/v1/product').set(auth()).send({ ...novo(), category_ids: [999] })).status).toBe(400);

    const res = await request(app).post('/v1/product').set(auth()).send(novo());
    expect(res.status).toBe(201);
    produto = res.body;
    expect(produto.category_ids).toEqual([categoriaId]);
    expect(produto.options[0].values).toEqual(['40', '41']);
    expect(produto.images).toHaveLength(1);

    const arquivo = path.join(process.env.UPLOAD_DIR, produto.images[0].content.replace('/uploads/', ''));
    expect(fs.existsSync(arquivo)).toBe(true);
  });

  test('detalha o produto', async () => {
    const res = await request(app).get(`/v1/product/${produto.id}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Tênis Nike');
    expect((await request(app).get('/v1/product/999')).status).toBe(404);
  });

  test('busca com filtros', async () => {
    await request(app).post('/v1/product').set(auth()).send({
      name: 'Camiseta', slug: 'camiseta', price: 50, price_with_discount: 40,
    });

    const todos = await request(app).get('/v1/product/search?limit=-1');
    expect(todos.body.total).toBe(2);

    expect((await request(app).get('/v1/product/search?match=nike')).body.total).toBe(1);
    expect((await request(app).get('/v1/product/search?match=confortável')).body.total).toBe(1);
    expect((await request(app).get(`/v1/product/search?category_ids=${categoriaId}`)).body.total).toBe(1);
    expect((await request(app).get('/v1/product/search?price-range=100-300')).body.total).toBe(1);
    expect((await request(app).get(`/v1/product/search?option[${produto.options[0].id}]=41`)).body.total).toBe(1);
    expect((await request(app).get(`/v1/product/search?option[${produto.options[0].id}]=99`)).body.total).toBe(0);

    const parcial = await request(app).get('/v1/product/search?fields=name,price&limit=1');
    expect(parcial.body.data[0]).toEqual({ id: expect.any(Number), name: 'Tênis Nike', price: 200 });
    expect((await request(app).get('/v1/product/search?price-range=abc')).status).toBe(400);
  });

  test('atualiza dados, imagens e opções', async () => {
    const imagemId = produto.images[0].id;
    const opcaoId = produto.options[0].id;

    const res = await request(app).put(`/v1/product/${produto.id}`).set(auth()).send({
      price: 250,
      images: [{ id: imagemId, deleted: true }, { type: 'image/png', content: PNG }],
      options: [{ id: opcaoId, values: ['40', '41', '42'] }, { title: 'Cor', type: 'color', values: ['#000'] }],
    });
    expect(res.status).toBe(204);

    const depois = (await request(app).get(`/v1/product/${produto.id}`)).body;
    expect(depois.price).toBe(250);
    expect(depois.images).toHaveLength(1);
    expect(depois.images[0].id).not.toBe(imagemId);
    expect(depois.options).toHaveLength(2);
    expect(depois.options[0].values).toEqual(['40', '41', '42']);

    expect((await request(app).put('/v1/product/999').set(auth()).send({ price: 1 })).status).toBe(404);
  });

  test('remove o produto e as imagens', async () => {
    const atual = (await request(app).get(`/v1/product/${produto.id}`)).body;
    const arquivo = path.join(process.env.UPLOAD_DIR, atual.images[0].content.replace('/uploads/', ''));

    expect((await request(app).delete(`/v1/product/${produto.id}`)).status).toBe(401);
    expect((await request(app).delete(`/v1/product/${produto.id}`).set(auth())).status).toBe(204);
    expect(fs.existsSync(arquivo)).toBe(false);
    expect((await request(app).get(`/v1/product/${produto.id}`)).status).toBe(404);
  });
});

describe('geral', () => {
  test('rota inexistente e JSON inválido', async () => {
    expect((await request(app).get('/nada')).status).toBe(404);
    const res = await request(app).post('/v1/user').set('Content-Type', 'application/json').send('{ruim');
    expect(res.status).toBe(400);
  });

  test('remove usuário', async () => {
    expect((await request(app).delete(`/v1/user/${userId}`).set(auth())).status).toBe(204);
  });
});
