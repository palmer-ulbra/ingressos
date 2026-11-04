import request from "supertest";
import { beforeEach } from "vitest";
import { app } from "../src/app.js";
import { db } from "../src/db.js";
import { semear } from "../src/seed.js";

export const api = () => request(app);

// Antes de cada teste, o banco volta ao cenário da aula.
beforeEach(() => semear(db));

export async function tokenDe(email) {
  const res = await api().post("/login").send({ email, senha: "senha123" });
  return res.body.token;
}
