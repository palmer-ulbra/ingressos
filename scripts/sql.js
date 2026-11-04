// Roda um SQL no banco e mostra o resultado. Uso: npm run sql -- "SELECT * FROM ingressos"
import { db } from "../src/db.js";

const linhas = db.prepare(process.argv[2]).all();
console.table(linhas.length ? linhas : "ok");
