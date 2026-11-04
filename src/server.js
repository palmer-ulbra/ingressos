import { app } from "./app.js";
import { db } from "./db.js";
import { semear } from "./seed.js";

// Primeira vez: o banco nasce com o cenário da aula. Para voltar a ele: npm run seed.
if (!db.prepare("SELECT 1 FROM usuarios LIMIT 1").get()) semear(db);

const porta = process.env.PORT ?? 3000;
app.listen(porta, () => console.log(`Ingressos em http://localhost:${porta}`));
