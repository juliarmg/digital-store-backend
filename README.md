# Digital Store API

API REST da loja virtual Digital Store, feita como projeto back-end da Digital College. Cuida de usuários, categorias e produtos (com imagens, opções e categorias), com autenticação por JWT.

## Tecnologias

Node.js, Express, Sequelize (ORM) com MySQL, JWT, bcrypt, dotenv, Swagger UI, Jest e Supertest.

## Como rodar

Precisa do Node 18 ou mais novo e de um MySQL rodando.

1. Instale as dependências:

```
npm install
```

2. Crie o banco no MySQL:

```
CREATE DATABASE digital_store;
```

3. Copie o arquivo de exemplo e ajuste usuário e senha do seu MySQL:

```
cp .env.example .env
```

| Variável | Para que serve |
| --- | --- |
| `PORT` | Porta da API (padrão 3000) |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME` | Conexão com o MySQL |
| `JWT_SECRET` | Segredo usado para assinar os tokens |
| `JWT_EXPIRES_IN` | Validade do token (padrão `1h`) |

4. Crie as tabelas com as migrations:

```
npm run migrate
```

5. Inicie a API:

```
npm run dev
```

A API sobe em `http://localhost:3000` e a documentação Swagger fica em `http://localhost:3000/api-docs`.

Outros comandos: `npm start` (sem nodemon), `npm test` (testes) e `npm run migrate:undo` (desfaz todas as migrations).

## Testes

Os testes usam Jest e Supertest, com SQLite em memória, então não precisam de MySQL. Cobrem cadastro e login, CRUD de categorias e produtos, filtros da busca, autenticação e códigos de erro.

## Estrutura

```
src/
  config/        conexão com o banco e configuração do Sequelize
  models/        User, Category, Product, ProductImage, ProductOption, ProductCategory
  routes/        definição das rotas
  controllers/   recebem a requisição e devolvem a resposta
  services/      regras de negócio e acesso ao banco
  middleware/    autenticação JWT e tratamento de erros
  utils/         paginação, validação de id, gravação de imagens
  docs/          documentação Swagger
  app.js         configuração do Express
  server.js      inicialização do servidor
migrations/      criação das tabelas
tests/           testes automatizados
```

O fluxo segue o padrão MVC com uma camada de serviço: a rota chama o controller, o controller chama o service, e o service usa os models.

## Banco de dados

Todas as tabelas têm `id` autoincrementado e `created_at` e `updated_at`.

- `users`: firstname, surname, email (único), password (hash bcrypt)
- `categories`: name, slug, use_in_menu
- `products`: enabled, name, slug, use_in_menu, stock, description, price, price_with_discount
- `product_images`: product_id, enabled, path
- `product_options`: product_id, title, shape (`square` ou `circle`), radius, type (`text` ou `color`), values (separados por vírgula)
- `product_categories`: product_id, category_id (relação muitos para muitos)

## Endpoints

Rotas marcadas com "token" exigem o cabeçalho `Authorization: Bearer <token>`.

| Método | Rota | Token | Respostas |
| --- | --- | --- | --- |
| POST | `/v1/user/token` | não | 200, 400 |
| POST | `/v1/user` | não | 201, 400 |
| GET | `/v1/user/:id` | não | 200, 404 |
| PUT | `/v1/user/:id` | sim | 204, 400, 401, 404 |
| DELETE | `/v1/user/:id` | sim | 204, 401, 404 |
| GET | `/v1/category/search` | não | 200, 400 |
| GET | `/v1/category/:id` | não | 200, 404 |
| POST | `/v1/category` | sim | 201, 400, 401 |
| PUT | `/v1/category/:id` | sim | 204, 400, 401, 404 |
| DELETE | `/v1/category/:id` | sim | 204, 401, 404 |
| GET | `/v1/product/search` | não | 200, 400 |
| GET | `/v1/product/:id` | não | 200, 404 |
| POST | `/v1/product` | sim | 201, 400, 401 |
| PUT | `/v1/product/:id` | sim | 204, 400, 401, 404 |
| DELETE | `/v1/product/:id` | sim | 204, 401, 404 |

### Busca e paginação

As rotas `search` aceitam `limit` (padrão 12, `-1` devolve tudo), `page` e `fields` (por exemplo `fields=name,price`). A resposta vem como `{ data, total, limit, page }`.

A busca de produtos aceita ainda:

- `match`: texto no nome ou na descrição
- `category_ids`: ids separados por vírgula, como `15,24`
- `price-range`: faixa de preço, como `100-200`
- `option[ID]`: valores de uma opção, como `option[45]=GG,PP`

### Exemplo de cadastro de produto

```json
{
  "enabled": true,
  "name": "Tênis Nike Revolution",
  "slug": "tenis-nike-revolution",
  "stock": 10,
  "description": "Tênis confortável",
  "price": 219,
  "price_with_discount": 189,
  "category_ids": [1, 2],
  "images": [{ "type": "image/png", "content": "<imagem em base64>" }],
  "options": [{ "title": "Tamanho", "shape": "square", "type": "text", "values": ["39", "40", "41"] }]
}
```

As imagens são gravadas na pasta `uploads/products` e devolvidas como `/uploads/products/arquivo.png`.

No `PUT` do produto, dentro de `images` e `options`, itens com `id` são atualizados, itens com `"deleted": true` são removidos e itens sem `id` são criados. Se `category_ids` for enviado, ele substitui as categorias atuais.

## Decisões

- Requisições sem token válido nas rotas protegidas devolvem 401, que é o código indicado na tabela de cada endpoint do enunciado.
- A opção do produto aceita `values` (lista ou texto separado por vírgula). O campo `value`, usado em um dos exemplos do enunciado, também é aceito.
- O cadastro de usuário e o login são públicos, e as demais rotas de escrita exigem token.
- A faixa de preço do filtro considera o campo `price`.
