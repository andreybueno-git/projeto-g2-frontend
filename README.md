# Mentalista? — Gerenciador de tarefas

Projeto da G2 da disciplina de **Desenvolvimento Frontend**, semestre **2026.2**, da Profª Marianne Lacerda Dutra Theodoro.

Todas as equipes da turma constroem a mesma aplicação, um gerenciador de tarefas com projetos e tarefas, em 6 marcos. Cada equipe usa um framework. A nossa usa **Svelte com TypeScript**.

O repositório está no **Marco 1**: o projeto roda, o contrato de dados está definido e a API local responde. A página inicial ainda não busca dados da API. A listagem de tarefas é o Marco 2.

## Equipe

Nome da equipe: **Mentalista?**

- Andrey Bueno Isoton
- Gabriel Silva de Miranda
- Rayane Araujo Teles
- Pedro Herique Araujo

## Tecnologias

- **Svelte 5** com SvelteKit e Vite, criado com `npx sv create` (modelo mínimo, TypeScript, sem add-ons). O projeto está em modo de runas: `$state`, `$props`, `$derived`.
- **TypeScript**.
- **json-server 1.x** como API local. A versão está fixada em `1.0.0-beta.15` no `package.json`, para ser a mesma em todas as máquinas.

## Pré-requisito

**Node.js 24 ou superior.** Confira com:

```sh
node -v
```

Com uma versão mais antiga, o `npm install` para com o erro `EBADENGINE`. Nesse caso, atualize o Node e reabra o terminal.

## Como rodar

Clone o repositório e instale as dependências:

```sh
git clone https://github.com/andreybueno-git/projeto-g2-frontend.git
cd projeto-g2-frontend
npm install
```

Depois abra **dois terminais** na pasta do projeto.

**Terminal 1: a aplicação**

```sh
npm run dev
```

Abre em <http://localhost:5173>.

**Terminal 2: a API**

```sh
npx json-server db.json
```

Responde em <http://localhost:3000/projetos> e <http://localhost:3000/tarefas>.

O atalho `npm run api` faz o mesmo que o comando do terminal 2. Para parar qualquer um dos dois, use `Ctrl + C`.

### Outros comandos

| Comando | O que faz |
| --- | --- |
| `npm run check` | Confere os tipos do projeto com o `svelte-check` |
| `npm run build` | Compila a aplicação para produção. O adaptador de publicação ainda não foi escolhido, então o comando termina com um aviso sobre isso |
| `npm run preview` | Abre em <http://localhost:4173> o que o `build` compilou |

## Contrato de dados

O contrato fica em [`src/tipos.ts`](src/tipos.ts) e é o mesmo para todas as equipes. Não mude nomes, ordem nem tipos.

```ts
export type Status = 'a-fazer' | 'em-andamento' | 'em-revisao' | 'concluida'
export type Prioridade = 'baixa' | 'media' | 'alta'

export interface Projeto {
  id: string
  nome: string
  descricao: string
  disciplina: string
  criadoEm: string
}

export interface Tarefa {
  id: string
  projetoId: string
  titulo: string
  descricao: string
  status: Status
  prioridade: Prioridade
  responsavel: string
  prazo: string
}

export type NovaTarefa = Omit<Tarefa, 'id'>
```

- `id` é texto porque o json-server gera texto.
- `criadoEm` e `prazo` são texto no formato `AAAA-MM-DD`. O JSON não tem tipo data.
- `projetoId` guarda o `id` do projeto a que a tarefa pertence.
- `NovaTarefa` é a tarefa sem `id`. Serve para criar: quem gera o `id` é o json-server.

## API local

O [`db.json`](db.json) tem duas chaves, `projetos` e `tarefas`. Cada chave vira uma coleção com `GET`, `POST`, `PUT`, `PATCH` e `DELETE`.

Os dados de exemplo são 4 projetos e 9 tarefas. As tarefas vieram do `dados.json` da E3 e foram passadas para o formato do contrato.

### Rotas que os próximos marcos vão usar

Com a API ligada e o `db.json` original:

| Requisição | Resultado esperado |
| --- | --- |
| `GET /tarefas?status=a-fazer` | Filtra por igualdade: devolve as 3 tarefas com status `a-fazer` (ids `1`, `2` e `3`) |
| `GET /tarefas?_sort=-prazo` | Ordena pelo prazo, e o `-` inverte: a primeira é a de prazo `2026-09-08` e a última, a de `2026-08-19` |
| `GET /projetos/1?_embed=tarefas` | O projeto `Interface Acadêmica` com as 3 tarefas dele dentro, na chave `tarefas` |
| `POST /tarefas` | Status `201` e a tarefa criada, com o `id` gerado em texto |
| `GET /tarefas/999` | Status `404` |

As rotas com `GET` abrem direto no navegador, por exemplo <http://localhost:3000/tarefas?status=a-fazer>.

Para testar o `POST` pelo terminal (no Windows, use o Git Bash):

```sh
curl -X POST http://localhost:3000/tarefas \
  -H "Content-Type: application/json" \
  -d '{"projetoId":"1","titulo":"Tarefa de teste","descricao":"Criada para testar o POST.","status":"a-fazer","prioridade":"baixa","responsavel":"Andrey Bueno Isoton","prazo":"2026-10-20"}'
```

**Atenção:** cada `POST` grava no `db.json`. Ao gravar, o json-server também acrescenta a chave `$schema` no fim do arquivo. Depois de testar, pare a API com `Ctrl + C`, volte ao arquivo original e ligue a API de novo, para não versionar dado de teste:

```sh
git checkout db.json
npx json-server db.json
```

Pare a API antes: se ela ficar ligada durante o `git checkout`, continua servindo os dados de teste que estão na memória.

Esta é a versão 1.x do json-server: usa `_per_page` no lugar de `_limit` e `_embed` no lugar de `_expand`. Tutoriais antigos usam a 0.x.

## Estrutura de pastas

```text
projeto-g2-frontend/
├── db.json                  dados da API local (projetos e tarefas)
├── package.json             scripts e dependências
├── package-lock.json        versões exatas das dependências
├── vite.config.ts           configuração do Vite e do SvelteKit
├── tsconfig.json            configuração do TypeScript
├── .npmrc                   faz o npm recusar versões do Node abaixo da exigida
├── .gitignore               o que o Git não versiona (node_modules, .svelte-kit...)
├── .vscode/
│   └── extensions.json      recomenda a extensão do Svelte para o VS Code
├── static/
│   └── robots.txt           arquivo servido como está
└── src/
    ├── app.html             esqueleto HTML da aplicação (lang="pt-BR")
    ├── app.d.ts             tipos globais do SvelteKit
    ├── tipos.ts             contrato de dados da disciplina
    ├── lib/                 código reutilizável, importado por #lib
    │   ├── index.ts
    │   └── assets/
    │       └── favicon.svg
    └── routes/
        ├── +layout.svelte   moldura comum a todas as páginas
        └── +page.svelte     página inicial
```

## Marco 1

- [x] Repositório da equipe no GitHub
- [ ] Integrantes e professora (@mariannedutra) adicionados ao repositório
- [x] Projeto criado no framework da equipe (Svelte), com TypeScript
- [x] `README.md` com o nome completo de todos os integrantes e o nome da equipe
- [x] `db.json` e `src/tipos.ts` com o contrato da disciplina
- [x] json-server no ar com `npx json-server db.json`
- [ ] Quadro no GitHub Projects

Critério de pronto do marco: qualquer integrante clona, roda `npm install`, `npm run dev` e `npx json-server db.json`, e tudo funciona.
