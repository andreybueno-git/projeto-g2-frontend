// Gera marco3-code.js com o código completo de todos os arquivos que o Marco 3
// criou ou alterou, tirado direto do Git (nada é digitado à mão).
// Uso: node tools/build-code.cjs <checkout do projeto-g2-frontend> [base] [head]
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const repo = process.argv[2];
if (!repo) { console.error('Uso: node tools/build-code.cjs <checkout do projeto-g2-frontend> [base] [head]'); process.exit(1); }
const BASE = process.argv[3] || 'dd45d47', HEAD = process.argv[4] || '3edd465';
const git = (...a) => execFileSync('git', ['-C', repo, ...a], { encoding: 'utf8', maxBuffer: 1 << 26 });

// Em qual issue cada arquivo entra. Arquivos alterados por várias issues aparecem na principal.
const GROUPS = [
  { id: '16', title: 'API de escrita', issue: '#16', pr: '#58', files: ['src/lib/servicos/api.ts', 'src/tipos.ts', 'tests/api.test.mjs', 'tests/api.integration.test.mjs', 'tests/api.types.ts', 'tests/tsconfig.json'] },
  { id: '17-19', title: 'Formulário e edição de tarefa', issue: '#17 #19', pr: '#60', files: ['src/lib/componentes/FormularioTarefa.svelte', 'src/routes/tarefas/[id]/editar/+page.svelte', 'src/routes/tarefas/[id]/+page.svelte'] },
  { id: '18', title: 'Nova tarefa', issue: '#18', pr: '#58', files: ['src/routes/tarefas/nova/+page.svelte', 'src/routes/+page.svelte'] },
  { id: '20', title: 'Validação', issue: '#20', pr: '#62', files: ['src/lib/utils/validarObrigatorios.ts', 'tests/validarObrigatorios.test.mjs'] },
  { id: '21', title: 'Acessibilidade', issue: '#21', pr: '#61', files: ['src/lib/utils/acessibilidadeFormulario.ts'] },
  { id: '22', title: 'Projetos', issue: '#22', pr: '#59', files: ['src/lib/componentes/FormularioProjeto.svelte', 'src/routes/projetos/novo/+page.svelte', 'src/routes/projetos/[id]/editar/+page.svelte', 'src/lib/utils/projetos.ts', 'tests/projetos.test.mjs', 'src/routes/projetos/[id]/+page.svelte', 'src/routes/projetos/+page.svelte'] },
  { id: '57', title: 'Organização de src/lib', issue: 'PR #57', pr: '#57', files: ['src/lib/utils/rotulos.ts', 'src/lib/componentes/CartaoTarefa.svelte'] },
  { id: 'readme', title: 'Documentação', issue: 'README', pr: '', files: ['README.md'] }
];

const changed = git('diff', '--name-status', '-M', BASE, HEAD, '--', 'src', 'tests', 'README.md').trim().split('\n').map(l => { const p = l.split('\t'); return { status: p[0][0], path: p[p.length - 1], from: p.length > 2 ? p[1] : null }; });
const grouped = new Set(GROUPS.flatMap(g => g.files));
const missing = changed.filter(c => !grouped.has(c.path)).map(c => c.path);
if (missing.length) { console.error('Arquivos do Marco 3 sem grupo: ' + missing.join(', ')); process.exit(1); }
const extra = [...grouped].filter(p => !changed.some(c => c.path === p));
if (extra.length) { console.error('Arquivos nos grupos que o Marco 3 não alterou: ' + extra.join(', ')); process.exit(1); }

// Linhas acrescentadas ou modificadas no arquivo final, a partir dos hunks do diff.
function addedLines(c) {
  const args = ['diff', '-U0', '-M', BASE, HEAD, '--'];
  if (c.from) args.push(c.from);
  args.push(c.path);
  const out = git(...args), lines = [];
  for (const m of out.matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)) {
    const start = Number(m[1]), count = m[2] === undefined ? 1 : Number(m[2]);
    for (let i = 0; i < count; i++) lines.push(start + i);
  }
  return lines;
}
function authors(p) {
  const names = git('log', '--no-merges', '--format=%an', BASE + '..' + HEAD, '--', p).trim().split('\n').filter(Boolean);
  return [...new Set(names.map(n => n.split(' ')[0]))];
}

const files = [];
GROUPS.forEach(g => g.files.forEach(p => {
  const c = changed.find(x => x.path === p), text = git('show', HEAD + ':' + p);
  const added = c.status === 'A' ? [] : addedLines(c);
  files.push({ path: p, group: g.id, status: c.status === 'A' ? 'novo' : c.status === 'R' ? 'movido' : 'alterado', from: c.from, authors: authors(p), added, lineCount: text.replace(/\n$/, '').split('\n').length, text });
}));
const commits = git('log', '--no-merges', '--format=%h%x09%ad%x09%an%x09%s', '--date=format:%d/%m %H:%M', BASE + '..' + HEAD, '--', 'src', 'tests', 'README.md', 'docs').trim().split('\n').map(l => { const [hash, date, author, subject] = l.split('\t'); return { hash, date, author, subject }; });
const data = { repo: 'andreybueno-git/projeto-g2-frontend', base: BASE, head: git('rev-parse', '--short', HEAD).trim(), groups: GROUPS.map(({ files: f, ...g }) => ({ ...g, files: f })), files, commits };
const out = '/* Gerado por tools/build-code.cjs a partir do Git (' + BASE + '..' + data.head + '). Não edite à mão. */\nwindow.MARCO3_CODE=' + JSON.stringify(data).replace(/<\/(script)/gi, '<\\/$1') + ';\n';
fs.writeFileSync(path.join(__dirname, '..', 'marco3-code.js'), out);
const newLines = files.reduce((n, f) => n + (f.status === 'novo' ? f.lineCount : f.added.length), 0);
console.log('marco3-code.js: ' + files.length + ' arquivos, ' + newLines + ' linhas do Marco 3, ' + commits.length + ' commits, ' + out.length + ' bytes');
