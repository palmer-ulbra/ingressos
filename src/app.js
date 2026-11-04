import { randomUUID } from "node:crypto";
import express from "express";
import { emitirToken, exigeAdmin, exigeToken, senhaConfere } from "./auth.js";
import { db } from "./db.js";

export const app = express();
app.use(express.json());

// ---------- Rotas públicas ----------

app.post("/login", (req, res) => {
  const { email, senha } = req.body ?? {};
  const usuario = db.prepare("SELECT * FROM usuarios WHERE email = ?").get(String(email));
  if (!usuario || !senhaConfere(String(senha), usuario.senha_hash))
    return res.status(401).json({ erro: "e-mail ou senha incorretos" });

  res.json({ token: emitirToken(usuario) });
});

app.get("/shows", (req, res) => {
  const busca = req.query.busca ?? "";
  const shows = db
    .prepare(
      `SELECT id, artista, local, data, preco, lugares FROM shows
        WHERE artista LIKE '%${busca}%' ORDER BY data`,
    )
    .all();
  res.json(shows);
});

// ---------- Daqui para baixo, só com token ----------

app.use(exigeToken);

app.get("/me", (req, res) => {
  res.json(db.prepare("SELECT * FROM usuarios WHERE id = ?").get(req.usuario.id));
});

app.get("/ingressos", (req, res) => {
  const ingressos = db
    .prepare(
      `SELECT i.id, i.codigo_qr, i.preco_pago, s.artista, s.local, s.data
         FROM ingressos i JOIN shows s ON s.id = i.show_id
        WHERE i.usuario_id = ? ORDER BY s.data`,
    )
    .all(req.usuario.id);
  res.json(ingressos);
});

app.get("/ingressos/:id", (req, res) => {
  const ingresso = db
    .prepare(
      `SELECT i.id, i.codigo_qr, i.preco_pago, s.artista, s.local, s.data,
              u.nome AS titular, u.cpf
         FROM ingressos i
         JOIN shows s ON s.id = i.show_id
         JOIN usuarios u ON u.id = i.usuario_id
        WHERE i.id = ?`,
    )
    .get(req.params.id);
  if (!ingresso) return res.status(404).json({ erro: "ingresso não encontrado" });

  res.json(ingresso);
});

app.delete("/ingressos/:id", (req, res) => {
  const ingresso = db.prepare("SELECT * FROM ingressos WHERE id = ?").get(req.params.id);
  if (!ingresso) return res.status(404).json({ erro: "ingresso não encontrado" });
  if (ingresso.usuario_id !== req.usuario.id)
    return res.status(403).json({ erro: "este ingresso não é seu" });

  db.exec("BEGIN");
  db.prepare("DELETE FROM ingressos WHERE id = ?").run(ingresso.id);
  db.prepare("UPDATE shows SET lugares = lugares + 1 WHERE id = ?").run(ingresso.show_id);
  db.exec("COMMIT");
  res.status(204).end();
});

app.post("/compras", (req, res) => {
  const { show_id, preco } = req.body ?? {};
  if (!Number.isInteger(show_id))
    return res.status(400).json({ erro: "show_id deve ser um número inteiro" });

  const show = db.prepare("SELECT * FROM shows WHERE id = ?").get(show_id);
  if (!show) return res.status(404).json({ erro: "show não encontrado" });
  if (show.lugares < 1) return res.status(409).json({ erro: "show esgotado" });

  const ingresso = {
    usuario_id: req.usuario.id,
    show_id,
    preco_pago: preco ?? show.preco,
    codigo_qr: `QR-${randomUUID().slice(0, 8).toUpperCase()}`,
  };
  db.exec("BEGIN");
  db.prepare("UPDATE shows SET lugares = lugares - 1 WHERE id = ?").run(show_id);
  const { lastInsertRowid } = db
    .prepare(
      "INSERT INTO ingressos (usuario_id, show_id, preco_pago, codigo_qr) VALUES (?, ?, ?, ?)",
    )
    .run(ingresso.usuario_id, ingresso.show_id, ingresso.preco_pago, ingresso.codigo_qr);
  db.exec("COMMIT");

  res.status(201).json({ id: Number(lastInsertRowid), ...ingresso });
});

// ---------- Administração ----------

app.post("/admin/shows", exigeAdmin, (req, res) => {
  const { artista, local, data, preco, lugares } = req.body ?? {};
  if (!artista || !local || !data || !(preco > 0) || !(lugares >= 0))
    return res.status(400).json({ erro: "artista, local, data, preco e lugares são obrigatórios" });

  const { lastInsertRowid } = db
    .prepare("INSERT INTO shows (artista, local, data, preco, lugares) VALUES (?, ?, ?, ?, ?)")
    .run(artista, local, data, preco, lugares);
  res.status(201).json({ id: Number(lastInsertRowid), artista, local, data, preco, lugares });
});

app.get("/admin/vendas", (req, res) => {
  const vendas = db
    .prepare(
      `SELECT i.id, s.artista, u.nome AS comprador, u.email, u.cpf, i.preco_pago
         FROM ingressos i
         JOIN shows s ON s.id = i.show_id
         JOIN usuarios u ON u.id = i.usuario_id
        ORDER BY i.id`,
    )
    .all();
  res.json(vendas);
});

// Erro inesperado: resposta genérica, sem pilha de chamadas nem SQL no corpo.
app.use((erro, req, res, next) => {
  console.error(erro);
  res.status(500).json({ erro: "erro interno" });
});
