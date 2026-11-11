import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { spawnSync } from 'node:child_process';

// O endereço público da hospedagem não deve vazar para os testes locais.
// A sobrescrita fica somente neste subprocesso; o build mantém VITE_API_URL real.
const ambienteTeste = parseEnv(readFileSync(new URL('../.env.test', import.meta.url), 'utf8'));
const resultado = spawnSync(process.execPath, [
  '--test', 'tests/api.test.mjs', 'tests/api.integration.test.mjs', 'tests/api.ambiente.test.mjs',
], { env: { ...process.env, ...ambienteTeste }, stdio: 'inherit' });
if (resultado.error) console.error(resultado.error.message);
process.exitCode = resultado.status ?? 1;
