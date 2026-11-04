import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";

export const SEGREDO = process.env.JWT_SECRET ?? "segredo-da-aula-15";

export function gerarHash(senha) {
  const sal = randomBytes(16).toString("hex");
  return `${sal}:${scryptSync(senha, sal, 32).toString("hex")}`;
}

export function senhaConfere(senha, hash) {
  const [sal, esperado] = hash.split(":");
  return timingSafeEqual(scryptSync(senha, sal, 32), Buffer.from(esperado, "hex"));
}

export function emitirToken(usuario) {
  return jwt.sign({ perfil: usuario.perfil }, SEGREDO, {
    subject: String(usuario.id),
    expiresIn: "1h",
  });
}

export function exigeToken(req, res, next) {
  const token = req.get("authorization")?.replace(/^Bearer /, "");
  try {
    const dados = jwt.verify(token, SEGREDO, { algorithms: ["HS256"] });
    req.usuario = { id: Number(dados.sub), perfil: dados.perfil };
    next();
  } catch {
    res.status(401).json({ erro: "token ausente, inválido ou expirado" });
  }
}

export function exigeAdmin(req, res, next) {
  if (req.usuario.perfil !== "ADMIN")
    return res.status(403).json({ erro: "apenas administradores" });
  next();
}
