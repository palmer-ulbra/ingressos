# Ingressos 🎟️ — app da Aula 15 (segurança nos testes)

Uma API mínima de venda de ingressos de shows:

**testes (vitest + supertest) → API (Express) → SQLite**

Precisa de Node 22.13 ou mais novo (usa o `node:sqlite`, que já vem no Node). Nenhum banco
para instalar nem configurar.

## Rodar

```bash
npm install
npm start          # http://localhost:3000 (na 1ª vez o banco já nasce com o cenário)
npm test           # os testes de ponto de partida
npm run seed       # volta o banco ao cenário da aula, a qualquer momento
```

Para explorar a API na mão, abra `http/ingressos.http` no VS Code (extensão REST Client)
ou use `curl`:

```bash
curl -X POST localhost:3000/login -H 'content-type: application/json' \
  -d '{"email":"ana@exemplo.com","senha":"senha123"}'          # { token }
curl localhost:3000/ingressos -H "authorization: Bearer <token>"
```

## O cenário (ids fixos)

Todos os usuários têm a senha **`senha123`**.

| id | Usuário | E-mail | Perfil |
| --- | --- | --- | --- |
| 1 | Ana Souza | `ana@exemplo.com` | CLIENTE |
| 2 | Bruno Lima | `bruno@exemplo.com` | CLIENTE |
| 3 | Carla Rocha | `admin@exemplo.com` | ADMIN |

| id | Show | Preço | Lugares |
| --- | --- | --- | --- |
| 1 | Banda Aurora | R$ 150,00 | 98 |
| 2 | Trio Maré Alta | R$ 80,00 | 49 |
| 3 | Orquestra do Guaíba | R$ 120,00 | 0 (esgotado) |

| id | Ingresso de | Show |
| --- | --- | --- |
| 1 | Ana | Banda Aurora |
| 2 | Bruno | Banda Aurora |
| 3 | Ana | Trio Maré Alta |

Preços em centavos na API: `15000` = R$ 150,00.

## Rotas

| Método | Rota | Quem | O que faz |
| --- | --- | --- | --- |
| POST | `/login` | público | `{ email, senha }` → `{ token }` (JWT, vale 1 h) |
| GET | `/shows?busca=` | público | lista os shows, filtrando pelo nome do artista |
| GET | `/me` | logado | os meus dados |
| GET | `/ingressos` | logado | os meus ingressos |
| GET | `/ingressos/:id` | dono | um ingresso, com QR e dados do titular |
| DELETE | `/ingressos/:id` | dono | cancela o ingresso e devolve o lugar |
| POST | `/compras` | logado | `{ show_id }` → compra um ingresso |
| POST | `/admin/shows` | ADMIN | cria um show |
| GET | `/admin/vendas` | ADMIN | todas as vendas, com dados dos compradores |

Token vai no cabeçalho `authorization: Bearer <token>`. O segredo de assinatura é
`segredo-da-aula-15` (variável `JWT_SECRET`), exportado como `SEGREDO` em `src/auth.js`
para os testes fabricarem tokens.

## Regras de segurança (o que o app DEVERIA fazer)

- **R1** Ingresso só para o dono: ler ou cancelar o ingresso de outra pessoa → `403`.
- **R2** Rotas `/admin/*` só para ADMIN: qualquer outro perfil → `403`.
- **R3** Toda rota, exceto `POST /login` e `GET /shows`, exige token válido: sem token,
  assinado com outro segredo ou expirado → `401`.
- **R4** O preço pago é sempre o preço do show no banco, nunca um valor vindo do cliente.
- **R5** A API nunca devolve hash de senha.
- **R6** Depois de 5 senhas erradas seguidas para o mesmo e-mail, o login responde `429`.
- **R7** O texto da busca é tratado como texto: nunca vira parte do SQL.

## Onde está cada coisa

| Arquivo | O que faz |
| --- | --- |
| `src/app.js` | as rotas |
| `src/auth.js` | hash de senha, emissão e checagem de token, checagem de perfil |
| `src/db.js` | abre o SQLite e cria as tabelas |
| `src/seed.js` | o cenário da aula |
| `tests/apoio.js` | `api()`, `tokenDe(email)` e o reset do banco antes de cada teste |
| `tests/api.test.js` | testes de ponto de partida (caminho feliz) |
| `http/ingressos.http` | requisições prontas para o REST Client |
| `scripts/sql.js` | `npm run sql -- "SELECT * FROM ingressos"` |

Os testes usam um banco em memória: rodar `npm test` não mexe no `data/ingressos.sqlite`.
