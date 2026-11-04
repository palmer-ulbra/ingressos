import { gerarHash } from "./auth.js";

// O cenário da aula. Ids fixos: todo mundo reproduz exatamente o mesmo caso.
// Todos os usuários têm a senha "senha123".
export function semear(db) {
  const senha = () => gerarHash("senha123"); // um sal por usuário

  db.exec("BEGIN");
  db.exec("DELETE FROM ingressos; DELETE FROM shows; DELETE FROM usuarios;");

  const usuario = db.prepare(
    "INSERT INTO usuarios (id, nome, email, senha_hash, cpf, perfil) VALUES (?, ?, ?, ?, ?, ?)",
  );
  usuario.run(1, "Ana Souza", "ana@exemplo.com", senha(), "123.456.789-09", "CLIENTE");
  usuario.run(2, "Bruno Lima", "bruno@exemplo.com", senha(), "987.654.321-00", "CLIENTE");
  usuario.run(3, "Carla Rocha", "admin@exemplo.com", senha(), "111.444.777-35", "ADMIN");

  const show = db.prepare(
    "INSERT INTO shows (id, artista, local, data, preco, lugares) VALUES (?, ?, ?, ?, ?, ?)",
  );
  show.run(1, "Banda Aurora", "Auditório Araújo Vianna", "2026-12-05", 15000, 98);
  show.run(2, "Trio Maré Alta", "Opinião", "2026-12-12", 8000, 49);
  show.run(3, "Orquestra do Guaíba", "Teatro São Pedro", "2026-12-19", 12000, 0); // esgotado

  const ingresso = db.prepare(
    "INSERT INTO ingressos (id, usuario_id, show_id, preco_pago, codigo_qr) VALUES (?, ?, ?, ?, ?)",
  );
  ingresso.run(1, 1, 1, 15000, "QR-7F3A-ANA1");
  ingresso.run(2, 2, 1, 15000, "QR-91C4-BRU2");
  ingresso.run(3, 1, 2, 8000, "QR-2B8E-ANA3");

  db.exec("COMMIT");
}
