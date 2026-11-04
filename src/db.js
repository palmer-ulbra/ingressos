import { DatabaseSync } from "node:sqlite";

// Nos testes, DB_FILE=":memory:": cada arquivo de teste tem o próprio banco.
export const db = new DatabaseSync(process.env.DB_FILE ?? "data/ingressos.sqlite");

// Preços em centavos: 15000 = R$ 150,00.
db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS usuarios (
    id         INTEGER PRIMARY KEY,
    nome       TEXT NOT NULL,
    email      TEXT NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    cpf        TEXT NOT NULL,
    perfil     TEXT NOT NULL CHECK (perfil IN ('CLIENTE', 'ADMIN'))
  );

  CREATE TABLE IF NOT EXISTS shows (
    id      INTEGER PRIMARY KEY,
    artista TEXT NOT NULL,
    local   TEXT NOT NULL,
    data    TEXT NOT NULL,
    preco   INTEGER NOT NULL CHECK (preco > 0),
    lugares INTEGER NOT NULL CHECK (lugares >= 0)
  );

  CREATE TABLE IF NOT EXISTS ingressos (
    id         INTEGER PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios (id),
    show_id    INTEGER NOT NULL REFERENCES shows (id),
    preco_pago INTEGER NOT NULL,
    codigo_qr  TEXT NOT NULL UNIQUE
  );
`);
