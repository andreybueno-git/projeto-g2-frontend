# Mentalista? — Gerenciador de tarefas

Projeto da G2 da disciplina de **Desenvolvimento Frontend**, semestre **2026.2**, da Profª Marianne Lacerda Dutra Theodoro.

Todas as equipes da turma constroem a mesma aplicação, um gerenciador de tarefas com projetos e tarefas, em 6 marcos. Cada equipe usa um framework. A nossa usa **Svelte com TypeScript**.

O projeto já possui listagem, cadastro, filtros, quadro e tratamento de erros. No Marco 6, o build estático e o fallback de navegação preparam a publicação. A disponibilização online ainda depende da API hospedada e do deploy do frontend.

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

### Endereço da API por ambiente

O endereço é definido pela variável pública `VITE_API_URL`. No desenvolvimento, o arquivo versionado `.env.development` aponta para `http://localhost:3000`, onde o comando `npm run api` inicia o json-server. Para alterar o endereço apenas na sua máquina, crie um arquivo `.env.development.local` com `VITE_API_URL=http://localhost:OUTRA_PORTA` e reinicie o servidor de desenvolvimento.

Para produção, configure `VITE_API_URL` na plataforma de hospedagem **antes do build**, com o endereço real da API hospedada. Como alternativa local, copie `.env.production.example` para `.env.production` e substitua o exemplo pelo endereço real. O domínio de exemplo não é uma API funcional. Não inclua uma barra final; caso exista, a aplicação a remove.

O build sem essa variável falha com uma mensagem de configuração, evitando publicar uma versão sem endereço de API. Para testar o build localmente enquanto a API hospedada não existe, no PowerShell execute:

```powershell
$env:VITE_API_URL = 'http://localhost:3000'
npm run build
Remove-Item Env:VITE_API_URL
```

Essa configuração serve apenas ao teste local: `localhost` em uma aplicação publicada aponta para o dispositivo de cada visitante. O valor é incorporado ao código durante o build; alterá-lo depois exige gerar e publicar um novo build. Por ser uma variável `VITE_`, seu conteúdo fica visível no navegador: não coloque senhas ou chaves secretas nela. A hospedagem da API e a configuração de CORS ficam para a tarefa 40.

### Outros comandos

| Comando | O que faz |
| --- | --- |
| `npm run check` | Confere os tipos do projeto com o `svelte-check` |
| `npm run test:api` | Executa os testes da API com a configuração de teste |
| `npm run build` | Gera a aplicação estática na pasta `build/`, com fallback `200.html` |
| `npm run test:publicacao` | Testa o build estático em Chromium, incluindo acesso direto e recarga das rotas (veja abaixo) |
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
├── db.json                  dados da API local
├── package.json             scripts e dependências
├── package-lock.json        versões exatas das dependências
├── vite.config.ts           configuração do Vite e do SvelteKit
├── tsconfig.json            configuração do TypeScript
├── .npmrc
├── .gitignore
├── .vscode/
│   └── extensions.json
├── static/                  arquivos servidos sem transformação
│   └── robots.txt
└── src/
    ├── app.html             esqueleto HTML da aplicação
    ├── app.d.ts             tipos globais do SvelteKit
    ├── tipos.ts             contrato de dados da disciplina (mantido neste caminho)
    ├── lib/                 código reutilizável, importado por #lib
    │   ├── index.ts
    │   ├── assets/
    │   │   └── favicon.svg
    │   ├── componentes/
    │   │   └── CartaoTarefa.svelte
    │   ├── servicos/
    │   │   └── api.ts       acesso à API local
    │   └── utils/
    │       └── rotulos.ts   rótulos e formatação de datas
    └── routes/             páginas e rotas do SvelteKit
        ├── +layout.svelte
        ├── +error.svelte
        ├── +page.svelte
        ├── projetos/
        │   ├── +page.svelte
        │   └── [id]/
        │       └── +page.svelte
        └── tarefas/
            └── [id]/
                └── +page.svelte
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


## Marco 6: publicação estática e rotas diretas (#42 e #43)

A aplicação usa `@sveltejs/adapter-static`. O arquivo `src/routes/+layout.ts`
desabilita a renderização no servidor, pois os dados vêm da API externa no
navegador. O build contém HTML, JavaScript, CSS e fontes, sem exigir um servidor
Node para o frontend. Isso não hospeda a API: ela continua sendo um serviço separado.

### Publicação preparada para Netlify

1. Conclua a hospedagem da API da tarefa #40 e confira `/projetos` e `/tarefas`.
   Use HTTPS, preserve o contrato de dados e permita CORS para o domínio do frontend.
   Não use `localhost` nem o domínio fictício de `.env.production.example`.
2. No Netlify, importe este repositório com a branch de produção revisada. O arquivo
   `netlify.toml` define Node 24, os comandos de verificação/build e a pasta `build`.
   Esta configuração é uma opção preparada, não a confirmação de um site publicado.
3. Configure `VITE_API_URL` com a URL real da API **antes** de gerar o build.
   É um valor público, incorporado aos arquivos JavaScript, e não deve conter segredo.
4. Publique e valide o site. Depois de confirmar o funcionamento, registre abaixo
   a URL real e o commit publicado. Não considere a tarefa #42 concluída sem essa etapa.

**Situação:** publicação online pendente. Nenhum link de produção foi confirmado.
A branch `gh-pages` existente contém materiais de estudo e não deve ser sobrescrita
com o build da aplicação.

### Por que abrir `/tarefas/2` não deve dar 404 da hospedagem

Em uma navegação interna o roteador do SvelteKit troca a tela. Em uma recarga ou
link direto o navegador pede o endereço ao servidor estático. Por isso,
`static/_redirects`, copiado para `build/_redirects`, define:

```text
/* /200.html 200
```

No Netlify, arquivos existentes são servidos primeiro. Os outros endereços recebem
`200.html`, e o roteador abre a página correta no navegador. Isso também cobre
IDs criados depois do build, como `/tarefas/123/editar` e `/projetos/456`.
Uma tarefa inexistente continua mostrando a mensagem da aplicação. Uma rota
inexistente mostra “Página não encontrada”, em vez do erro da hospedagem.

Essa configuração assume a aplicação na raiz de um domínio. Outros provedores
precisam de uma regra equivalente de reescrita; não basta copiar `_redirects`
para GitHub Pages, que não lê esse arquivo.

### Teste local do artefato publicado

Instale as dependências e o navegador de teste uma vez:

```sh
npm ci
npx playwright install chromium
```

Gere um build de teste. No PowerShell:

```powershell
$env:VITE_API_URL = 'http://localhost:3000'
npm run build
Remove-Item Env:VITE_API_URL
npm run test:publicacao
```

No Bash:

```sh
VITE_API_URL=http://localhost:3000 npm run build
npm run test:publicacao
```

O teste serve somente os arquivos de `build/`, sem Vite nem servidor SvelteKit,
e reproduz a regra de fallback. Confere abertura direta e recarga das dez URLs,
Cancelamento, Voltar/Avançar, endereços inexistentes e largura de celular/desktop.
A API é interceptada com dados fictícios; nenhum dado local ou remoto é gravado.
`PLAYWRIGHT_EXECUTABLE_PATH` permite usar um Chromium já instalado.
Esse teste local não substitui a conferência da hospedagem e da API reais.
O workflow `Verificar build estático` também executa essas verificações em pull
requests e na branch principal. Ele usa dados fictícios e não faz deploy.

### Checklist depois do deploy

- [ ] URL real e commit do frontend registrados neste README.
- [ ] API HTTPS funcionando com CORS, dados e persistência esperados (#40).
- [ ] Listagem, cadastro, edição e exclusão testados com dados de demonstração.
- [ ] `/tarefas/2` aberta em nova aba e recarregada sem 404 da hospedagem.
- [ ] `/tarefas/2/editar`, `/projetos/1` e `/projetos/1/editar` abertas diretamente.
- [ ] Rota de uma tarefa criada depois do build aberta diretamente.
- [ ] “Tarefa não encontrada” e “Página não encontrada” exibidas nos casos corretos.
- [ ] Layout e navegação conferidos no celular e no desktop.

As tarefas #42 e #43 só devem ser encerradas depois dessa validação na URL pública.
