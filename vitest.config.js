import { defineConfig } from "vitest/config";

// Banco em memória: cada arquivo de teste tem o seu, e o data/ingressos.sqlite não é tocado.
export default defineConfig({
  test: { env: { DB_FILE: ":memory:" } },
});
