# Digital Store API

API REST da loja virtual Digital Store, feita como projeto back-end da Digital College. Cuida de usuários, categorias e produtos, com autenticação por JWT.

Tecnologias: Node.js, Express, Sequelize, MySQL, JWT, bcrypt, Swagger, Jest.

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

3. Copie o arquivo de exemplo e coloque a senha do seu MySQL em `DB_PASS`:

```
copy .env.example .env
```

No Linux ou Mac, use `cp .env.example .env`.

4. Crie as tabelas:

```
npm run migrate
```

5. Inicie a API:

```
npm run dev
```

A API sobe em `http://localhost:3000`. A documentação de todos os endpoints fica em `http://localhost:3000/api-docs`.

Para rodar os testes (não precisam de MySQL):

```
npm test
```

## Estrutura

```
src/
  config/        conexão com o banco
  models/        tabelas do Sequelize
  routes/        rotas
  controllers/   recebem a requisição e respondem
  services/      regras de negócio
  middleware/    autenticação JWT e tratamento de erros
  utils/         paginação e gravação de imagens
  docs/          documentação Swagger
migrations/      criação das tabelas
tests/           testes automatizados
```

O fluxo segue o padrão MVC com uma camada de serviço: rota, controller, service e model.

## Banco de dados

Tabelas: `users`, `categories`, `products`, `product_images`, `product_options` e `product_categories` (relação entre produtos e categorias). Todas têm `id`, `created_at` e `updated_at`.

## Autenticação

O login em `POST /v1/user/token` devolve um token JWT. As rotas de criar, editar e apagar categorias, produtos e usuários exigem o cabeçalho `Authorization: Bearer <token>`. Sem token válido, a resposta é 401.

## Decisões

- Falta de token devolve 401, que é o código indicado em cada endpoint do enunciado.
- A opção de produto aceita `values` e também `value`, porque o enunciado usa os dois.
- O filtro `price-range` considera o campo `price`.
