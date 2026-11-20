// Documentação OpenAPI exibida em /api-docs

const erro = (descricao) => ({
  description: descricao,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Erro' } } },
});
const semCorpo = (descricao) => ({ description: descricao });
const json = (schema) => ({ required: true, content: { 'application/json': { schema } } });
const seguro = [{ bearerAuth: [] }];
const idParam = { name: 'id', in: 'path', required: true, schema: { type: 'integer' } };
const paginacao = [
  { name: 'limit', in: 'query', schema: { type: 'integer', default: 12 }, description: '-1 devolve todos os registros' },
  { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
  { name: 'fields', in: 'query', schema: { type: 'string' }, description: 'Campos separados por vírgula, ex.: name,slug' },
];

module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Digital Store API',
    version: '1.0.0',
    description: 'API REST da loja virtual: usuários, categorias e produtos.',
  },
  servers: [{ url: 'http://localhost:3000' }],
  tags: [{ name: 'Usuários' }, { name: 'Categorias' }, { name: 'Produtos' }],
  paths: {
    '/v1/user/token': {
      post: {
        tags: ['Usuários'],
        summary: 'Gera o token JWT',
        requestBody: json({
          type: 'object',
          properties: { email: { type: 'string' }, password: { type: 'string' } },
        }),
        responses: {
          200: { description: 'Token gerado', content: { 'application/json': { schema: { type: 'object', properties: { token: { type: 'string' } } } } } },
          400: erro('Email ou senha inválidos'),
        },
      },
    },
    '/v1/user': {
      post: {
        tags: ['Usuários'],
        summary: 'Cadastra um usuário',
        requestBody: json({ $ref: '#/components/schemas/UsuarioNovo' }),
        responses: { 201: { description: 'Usuário criado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Usuario' } } } }, 400: erro('Dados inválidos') },
      },
    },
    '/v1/user/{id}': {
      get: {
        tags: ['Usuários'],
        summary: 'Busca um usuário',
        parameters: [idParam],
        responses: { 200: { description: 'Usuário', content: { 'application/json': { schema: { $ref: '#/components/schemas/Usuario' } } } }, 404: erro('Não encontrado') },
      },
      put: {
        tags: ['Usuários'],
        summary: 'Atualiza um usuário',
        security: seguro,
        parameters: [idParam],
        requestBody: json({ $ref: '#/components/schemas/UsuarioEdicao' }),
        responses: { 204: semCorpo('Atualizado'), 400: erro('Dados inválidos'), 401: erro('Não autenticado'), 404: erro('Não encontrado') },
      },
      delete: {
        tags: ['Usuários'],
        summary: 'Remove um usuário',
        security: seguro,
        parameters: [idParam],
        responses: { 204: semCorpo('Removido'), 401: erro('Não autenticado'), 404: erro('Não encontrado') },
      },
    },
    '/v1/category/search': {
      get: {
        tags: ['Categorias'],
        summary: 'Lista categorias com paginação',
        parameters: [...paginacao, { name: 'use_in_menu', in: 'query', schema: { type: 'boolean' } }],
        responses: { 200: { description: 'Lista paginada' }, 400: erro('Parâmetros inválidos') },
      },
    },
    '/v1/category': {
      post: {
        tags: ['Categorias'],
        summary: 'Cria uma categoria',
        security: seguro,
        requestBody: json({ $ref: '#/components/schemas/CategoriaEntrada' }),
        responses: { 201: { description: 'Categoria criada' }, 400: erro('Dados inválidos'), 401: erro('Não autenticado') },
      },
    },
    '/v1/category/{id}': {
      get: { tags: ['Categorias'], summary: 'Busca uma categoria', parameters: [idParam], responses: { 200: { description: 'Categoria' }, 404: erro('Não encontrada') } },
      put: {
        tags: ['Categorias'],
        summary: 'Atualiza uma categoria',
        security: seguro,
        parameters: [idParam],
        requestBody: json({ $ref: '#/components/schemas/CategoriaEntrada' }),
        responses: { 204: semCorpo('Atualizada'), 400: erro('Dados inválidos'), 401: erro('Não autenticado'), 404: erro('Não encontrada') },
      },
      delete: {
        tags: ['Categorias'],
        summary: 'Remove uma categoria',
        security: seguro,
        parameters: [idParam],
        responses: { 204: semCorpo('Removida'), 401: erro('Não autenticado'), 404: erro('Não encontrada') },
      },
    },
    '/v1/product/search': {
      get: {
        tags: ['Produtos'],
        summary: 'Lista produtos com filtros e paginação',
        parameters: [
          ...paginacao,
          { name: 'match', in: 'query', schema: { type: 'string' }, description: 'Busca no nome ou na descrição' },
          { name: 'category_ids', in: 'query', schema: { type: 'string' }, description: 'Ids separados por vírgula, ex.: 15,24' },
          { name: 'price-range', in: 'query', schema: { type: 'string' }, description: 'Faixa de preço, ex.: 100-200' },
          { name: 'option[ID]', in: 'query', schema: { type: 'string' }, description: 'Valores da opção ID separados por vírgula, ex.: option[45]=GG,PP' },
        ],
        responses: { 200: { description: 'Lista paginada' }, 400: erro('Parâmetros inválidos') },
      },
    },
    '/v1/product': {
      post: {
        tags: ['Produtos'],
        summary: 'Cria um produto com imagens e opções',
        security: seguro,
        requestBody: json({ $ref: '#/components/schemas/ProdutoEntrada' }),
        responses: { 201: { description: 'Produto criado' }, 400: erro('Dados inválidos'), 401: erro('Não autenticado') },
      },
    },
    '/v1/product/{id}': {
      get: { tags: ['Produtos'], summary: 'Busca um produto', parameters: [idParam], responses: { 200: { description: 'Produto com imagens, opções e categorias' }, 404: erro('Não encontrado') } },
      put: {
        tags: ['Produtos'],
        summary: 'Atualiza um produto',
        description: 'Em images e options, itens com id são atualizados, itens com "deleted": true são removidos e itens sem id são criados.',
        security: seguro,
        parameters: [idParam],
        requestBody: json({ $ref: '#/components/schemas/ProdutoEntrada' }),
        responses: { 204: semCorpo('Atualizado'), 400: erro('Dados inválidos'), 401: erro('Não autenticado'), 404: erro('Não encontrado') },
      },
      delete: {
        tags: ['Produtos'],
        summary: 'Remove um produto',
        security: seguro,
        parameters: [idParam],
        responses: { 204: semCorpo('Removido'), 401: erro('Não autenticado'), 404: erro('Não encontrado') },
      },
    },
  },
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      Erro: { type: 'object', properties: { message: { type: 'string' } } },
      Usuario: {
        type: 'object',
        properties: { id: { type: 'integer' }, firstname: { type: 'string' }, surname: { type: 'string' }, email: { type: 'string' } },
      },
      UsuarioNovo: {
        type: 'object',
        required: ['firstname', 'surname', 'email', 'password', 'confirmPassword'],
        properties: {
          firstname: { type: 'string', example: 'Maria' },
          surname: { type: 'string', example: 'Silva' },
          email: { type: 'string', example: 'maria@email.com' },
          password: { type: 'string', example: 'senha123' },
          confirmPassword: { type: 'string', example: 'senha123' },
        },
      },
      UsuarioEdicao: {
        type: 'object',
        required: ['firstname', 'surname', 'email'],
        properties: { firstname: { type: 'string' }, surname: { type: 'string' }, email: { type: 'string' } },
      },
      CategoriaEntrada: {
        type: 'object',
        required: ['name', 'slug'],
        properties: { name: { type: 'string', example: 'Tênis' }, slug: { type: 'string', example: 'tenis' }, use_in_menu: { type: 'boolean', example: true } },
      },
      ProdutoEntrada: {
        type: 'object',
        required: ['name', 'slug', 'price', 'price_with_discount'],
        properties: {
          enabled: { type: 'boolean' },
          name: { type: 'string', example: 'Tênis Nike Revolution' },
          slug: { type: 'string', example: 'tenis-nike-revolution' },
          use_in_menu: { type: 'boolean' },
          stock: { type: 'integer', example: 10 },
          description: { type: 'string' },
          price: { type: 'number', example: 219 },
          price_with_discount: { type: 'number', example: 189 },
          category_ids: { type: 'array', items: { type: 'integer' } },
          images: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                type: { type: 'string', example: 'image/png' },
                content: { type: 'string', description: 'Imagem em base64' },
                deleted: { type: 'boolean' },
              },
            },
          },
          options: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                title: { type: 'string', example: 'Tamanho' },
                shape: { type: 'string', enum: ['square', 'circle'] },
                radius: { type: 'integer' },
                type: { type: 'string', enum: ['text', 'color'] },
                values: { type: 'array', items: { type: 'string' }, example: ['39', '40', '41'] },
                deleted: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
  },
};
