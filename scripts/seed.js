// Volta o banco ao cenário da aula (ids fixos). Pode rodar com o servidor ligado.
import { db } from "../src/db.js";
import { semear } from "../src/seed.js";

semear(db);
console.log("data/ingressos.sqlite no cenário da aula: 3 usuários, 3 shows, 3 ingressos");
