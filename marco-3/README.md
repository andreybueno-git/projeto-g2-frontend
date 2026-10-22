# Marco 3 · Cadastro e edição

Apresentação interativa do Marco 3 do projeto G2 de Front-end (equipe Mentalista?). Ela usa o mesmo motor da apresentação da Vereda: personagem com o celular, notebook 3D que você abre e liga, Terminal, apps dentro da tela e uma história em 11 capítulos conduzida pela rolagem. Todo o código do marco está dentro dela, em letra grande.

Publicada em https://andreybueno-git.github.io/projeto-g2-frontend/marco-3/.

## Abrir no computador

Dentro desta pasta:

```sh
python3 -m http.server 8843 --bind 127.0.0.1
```

Abra http://127.0.0.1:8843/. Use HTTP, não `file://`, para o modelo 3D carregar. No Mac, `Abrir apresentacao.command` faz isso sozinho.

## Como apresentar

1. Clique no notebook para abrir a tampa e depois em **Ligar notebook**.
2. No Terminal, digite `start marco3` e Enter (ou clique em **Iniciar apresentação**).
3. Setas, PageUp/PageDown e Espaço trocam de capítulo. `I` abre o índice e `N` abre os detalhes do capítulo.
4. Nos capítulos API, Edição, Validação e Testes, role devagar: o cartão vai ao json-server, é editado, é barrado pelo `validarObrigatorios` (título só com espaços; o `required` cuida do vazio) e as 22 marcas acendem.
5. Em Nova tarefa e Acessibilidade, o notebook mostra o app **Formulário**. Ele usa a mesma validação e acessibilidade do repositório (`validarObrigatorios` e `acessibilidadeFormulario`, portados de TS para JS). Envie vazio, teste o título só com espaços e salve.
6. O capítulo **Todo o código** lista os 24 arquivos que o marco criou ou alterou, agrupados por issue, com quem fez. O capítulo final traz o roteiro da demonstração no app real (`npm run api` e `npm run dev`).

## Ler o código

Cada capítulo tem um botão **Ler o código**, que abre o arquivo inteiro em tela cheia, com o trecho explicado destacado em amarelo. As linhas criadas ou alteradas no Marco 3 ficam marcadas em azul.

- **A−** e **A+** (ou `−` e `+`) mudam o tamanho da letra; a escolha fica salva no navegador.
- **Quebrar linhas** evita rolagem horizontal no projetor.
- **←** e **→** passam para o arquivo anterior ou o próximo; a lista à esquerda abre qualquer arquivo.
- Esc fecha e volta ao capítulo.

O código vem do Git, sem edição: `tools/build-code.cjs` lê os arquivos do commit `3edd465` e marca as linhas pelo diff contra `dd45d47`, o fim do Marco 2. Para atualizar depois de novos commits:

```sh
node tools/build-code.cjs ../caminho/do/projeto-g2-frontend dd45d47 HEAD
node tools/build-index.cjs
```

## Apps do notebook

Terminal (`help`, `git log`, `node --test`, `npm run dev`, `start jogo`, `start termo`), Quadro (issues #16–#23 e o Marco 4), Formulário, API (requisições e db.json), Testes, Internet (abre o repositório em nova aba), Caça-bug e Palavra. **Ampliar computador** mostra os apps em tamanho grande.

## O que é simulado

A API do notebook é **em memória**: o Formulário não grava no json-server real. O app Testes reproduz o resultado de `node --test tests/*.test.mjs` na main em 22/10/2026 (22 passaram, 0 falharam); ele não executa os testes. O painel do leitor de tela é uma visualização do que `role="alert"` faz anunciar.

## Origem

Notebook 3D, abertura, entrada, teclado, áudio, Palavra e Internet vêm da apresentação [vereda-ciclo-de-vida](https://github.com/andreybueno-git/vereda-ciclo-de-vida). Cena, apps e conteúdo foram refeitos a partir do [projeto-g2-frontend](https://github.com/andreybueno-git/projeto-g2-frontend) (issues #16–#23, PRs #57–#63). Three.js r128 e Manrope (OFL) estão em `assets/`. Para mudar capítulos, edite `marco3-content.js` e `tools/build-index.cjs` e rode `node tools/build-index.cjs`.
