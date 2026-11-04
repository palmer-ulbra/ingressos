import { describe, expect, test } from "vitest";
import { api, tokenDe } from "./apoio.js";

// Ponto de partida: o caminho feliz funciona. Os testes de segurança são com vocês.

describe("login", () => {
  test("com senha certa devolve um token", async () => {
    const res = await api().post("/login").send({ email: "ana@exemplo.com", senha: "senha123" });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
  });

  test("com senha errada responde 401", async () => {
    const res = await api().post("/login").send({ email: "ana@exemplo.com", senha: "errada" });
    expect(res.status).toBe(401);
  });
});

test("a lista de shows é pública", async () => {
  const res = await api().get("/shows");
  expect(res.status).toBe(200);
  expect(res.body).toHaveLength(3);
});

test("a Ana vê o próprio ingresso", async () => {
  const token = await tokenDe("ana@exemplo.com");
  const res = await api().get("/ingressos/1").auth(token, { type: "bearer" });
  expect(res.status).toBe(200);
  expect(res.body.titular).toBe("Ana Souza");
});

test("a Ana compra um ingresso pelo preço do show", async () => {
  const token = await tokenDe("ana@exemplo.com");
  const res = await api().post("/compras").auth(token, { type: "bearer" }).send({ show_id: 2 });
  expect(res.status).toBe(201);
  expect(res.body.preco_pago).toBe(8000);
});
