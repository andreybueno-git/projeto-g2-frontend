/* Mentalista? OS: o desktop interativo projetado na tela do notebook.
 * Motor de janelas, dock, terminal e ampliação herdado da apresentação Vereda.
 * Os apps mostram o Marco 3. O "servidor" daqui é uma simulação em memória:
 * nada é enviado ao json-server real. Internet só abre sites após uma ação.
 */
(function (global) {
  'use strict';

  const WIDTH = 960, HEIGHT = 600;
  const REPO_URL = 'https://github.com/andreybueno-git/projeto-g2-frontend';
  const names = { terminal: 'Terminal', quadro: 'Quadro', formulario: 'Formulário', api: 'API', testes: 'Testes', internet: 'Internet', jogo: 'Caça-bug', palavra: 'Palavra' };
  const icons = {
    terminal: '<rect x="2" y="5" width="28" height="24" rx="4"/><path d="m8 13 5 4-5 4m9 1h7"/>',
    quadro: '<rect x="3" y="5" width="26" height="24" rx="3"/><path d="M12 5v24M21 5v24M6 10h3M15 10h3M24 10h2M6 15h3M15 15h3"/>',
    formulario: '<rect x="6" y="4" width="20" height="26" rx="3"/><path d="M10 10h12M10 15h12M10 20h7m3 4 2 2 4-5"/>',
    api: '<ellipse cx="16" cy="8" rx="10" ry="4"/><path d="M6 8v8c0 2 4 4 10 4s10-2 10-4V8M6 16v8c0 2 4 4 10 4s10-2 10-4v-8"/>',
    testes: '<circle cx="16" cy="17" r="12"/><path d="m10 17 4 4 8-9"/>',
    internet: '<circle cx="16" cy="17" r="13"/><ellipse cx="16" cy="17" rx="6" ry="13"/><path d="M3 17h26M6 9h20M6 25h20"/>',
    jogo: '<path d="M9 9h14c4 0 7 16 4 18-3 2-7-4-11-4s-8 6-11 4C2 25 5 9 9 9Z"/><path d="M8 16h8m-4-4v8m10-7v3m3 3h-3"/>',
    palavra: '<rect x="3" y="4" width="26" height="26" rx="4"/><path d="M3 17h26M16 4v26M7 13l3-6 3 6M8 11h4M20 23h5m-5 3h5"/>'
  };
  const ISSUES = [
    ['16','Ampliar o módulo da API (escrita)','Andrey','#58'],['17','Componente de formulário de tarefa','Pedro','#60'],
    ['18','Tela de nova tarefa','Andrey','#58'],['19','Tela de edição de tarefa','Pedro','#60'],
    ['20','Validar o formulário','Andrey','#62'],['21','Tornar o formulário acessível','Rayane','#61'],
    ['22','Cadastro e edição de projeto','Gabriel','#59'],['23','Slide de apresentação do Marco 3','Rayane','#63']
  ];
  const NEXT = ['Busca por título','Filtros por status e prioridade','Estado central da busca','Visão de quadro','Alternar lista e quadro','Mudar o status pelo cartão','Slide do Marco 4'];
  const TESTS = [
    ['api.integration','criar e atualizar projeto devolvem o registro completo e preservam campos'],
    ['api.integration','criar e atualizar tarefa preservam projeto, id e campos não enviados no PATCH'],
    ['api.integration','atualizar identificadores inexistentes propaga 404 sem criar registros'],
    ['api.integration','escritas da API funcionam por HTTP com o json-server instalado'],
    ['api','criarTarefa: método, endereço, JSON sem id e registro retornado'],['api','criarTarefa: erro HTTP conserva o status em ErroApi'],
    ['api','atualizarTarefa: método, endereço, JSON sem id e registro retornado'],['api','atualizarTarefa: erro HTTP conserva o status em ErroApi'],
    ['api','criarProjeto: método, endereço, JSON sem id e registro retornado'],['api','criarProjeto: erro HTTP conserva o status em ErroApi'],
    ['api','atualizarProjeto: método, endereço, JSON sem id e registro retornado'],['api','atualizarProjeto: erro HTTP conserva o status em ErroApi'],
    ['api','listarTarefas: leitura existente continua como GET'],['api','buscarTarefa: leitura existente continua como GET'],
    ['api','listarProjetos: leitura existente continua como GET'],['api','buscarProjeto: leitura existente continua como GET'],
    ['api','buscarProjetoComTarefas: leitura existente continua como GET'],['api','falha de conexão continua sendo rejeitada para a tela tratar'],
    ['projetos','hojeLocal usa a data do computador, não a de UTC'],['projetos','hojeLocal completa mês e dia com zero à esquerda'],
    ['validarObrigatorios','campos obrigatórios recusam vazio e diferentes espaços'],['validarObrigatorios','texto real é aceito sem modificar o conteúdo digitado']
  ];
  const PROJECTS = [['1','Interface Acadêmica'],['2','Sistema de Biblioteca'],['3','Fundamentos Python'],['4','Campus Conectado']];
  const STATUS = { 'a-fazer':'A fazer', 'em-andamento':'Em andamento', 'em-revisao':'Em revisão', 'concluida':'Concluída' };
  const PRIORITY = { baixa:'Baixa', media:'Média', alta:'Alta' };
  const state = { db: [], log: [], editing: null, saving: false, testsShown: 0, testsRunning: false, announcements: [] };
  let root, webApp, wordApp, callbacks = {}, active = null, visible = false;
  let expanded = false, expandedDialog = null, expansionReturnFocus = null, expansionWasVisible = false, rootPlaceholder = null;
  let clock = 0, moving = null, formCleanup = [];
  const reducedMotion = global.matchMedia('(prefers-reduced-motion: reduce)');
  const terminalHistory = [], bootTimers = new Set(), testTimers = new Set();
  let historyCursor = 0, booting = false, gameFrame = 0, gameLast = 0, gameCanvas, gameContext;
  const game = { score:0, goal:8, running:false, paused:true, player:{x:80,y:177}, keys:new Set(), trail:[] };
  const bugs = [{x:245,y:87},{x:490,y:242},{x:150,y:265},{x:517,y:110},{x:333,y:277},{x:84,y:72},{x:295,y:172},{x:505,y:287}];
  const gameDirections = { ArrowLeft:'left', a:'left', ArrowRight:'right', d:'right', ArrowUp:'up', w:'up', ArrowDown:'down', s:'down' };
  let removeListeners = [];
  const opened = new Set(), minimized = new Set();
  const q = (key) => root && root.querySelector('[data-vd="' + key + '"]');
  const win = (id) => root.querySelector('[data-vd-window="' + id + '"]');
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const escape = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const snapshot = (reason) => ({ reason, simulation: true, surface: 'desktop', tarefas: state.db.length, requests: state.log.length, editing: state.editing && state.editing.id });
  const svg = (id) => '<svg viewBox="0 0 32 34" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">' + icons[id] + '</svg>';
  function listen(target, type, fn, options) {
    target.addEventListener(type, fn, options);
    removeListeners.push(() => target.removeEventListener(type, fn, options));
  }
  function notify(reason) { if (typeof callbacks.onChange === 'function') callbacks.onChange(snapshot(reason)); }
  function emit(kind, detail) { global.dispatchEvent(new CustomEvent('vereda:interaction', { detail:{ kind, surface:'desktop', ...(detail || {}) } })); }
  function status(text) { q('status').textContent = text; }
  function randomId() { const a = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; let s = ''; for (let i = 0; i < 11; i++) s += a[Math.floor(Math.random() * a.length)]; return s; }

  // ---------- Validação e acessibilidade: o mesmo código do repositório, sem os tipos ----------
  // src/lib/utils/validarObrigatorios.ts
  function textoObrigatorioValido(valor) { return valor.trim().length > 0; }
  function validarObrigatorios(formulario) {
    const mensagem = 'Preencha este campo com texto, sem usar somente espaços.';
    const camposComErro = new Set();
    const ehTexto = (alvo) => alvo instanceof HTMLTextAreaElement || (alvo instanceof HTMLInputElement && alvo.type === 'text');
    function validar(campo) {
      if (campo.required && campo.value !== '' && !textoObrigatorioValido(campo.value)) { campo.setCustomValidity(mensagem); camposComErro.add(campo); }
      else if (camposComErro.has(campo)) { if (campo.validationMessage === mensagem) campo.setCustomValidity(''); camposComErro.delete(campo); }
    }
    const aoAlterar = (evento) => { if (ehTexto(evento.target)) validar(evento.target); };
    formulario.addEventListener('input', aoAlterar, true); formulario.addEventListener('change', aoAlterar, true);
    for (const campo of formulario.elements) if (ehTexto(campo)) validar(campo);
    return () => { formulario.removeEventListener('input', aoAlterar, true); formulario.removeEventListener('change', aoAlterar, true); for (const campo of camposComErro) if (campo.validationMessage === mensagem) campo.setCustomValidity(''); };
  }
  // src/lib/utils/acessibilidadeFormulario.ts
  function acessibilidadeFormulario(formulario) {
    const mensagens = new Map();
    const ehCampo = (alvo) => alvo instanceof HTMLInputElement || alvo instanceof HTMLSelectElement || alvo instanceof HTMLTextAreaElement;
    function limpar(campo) {
      const mensagem = mensagens.get(campo); if (!mensagem) return;
      const descricoes = (campo.getAttribute('aria-describedby') || '').split(/\s+/).filter((id) => id && id !== mensagem.id);
      if (descricoes.length) campo.setAttribute('aria-describedby', descricoes.join(' ')); else campo.removeAttribute('aria-describedby');
      campo.removeAttribute('aria-invalid'); mensagem.remove(); mensagens.delete(campo);
    }
    function mostrar(campo) {
      let mensagem = mensagens.get(campo);
      if (!mensagem) {
        mensagem = document.createElement('p'); mensagem.id = campo.id + '-erro'; mensagem.dataset.erroCampo = ''; mensagem.setAttribute('role', 'alert');
        campo.insertAdjacentElement('afterend', mensagem); mensagens.set(campo, mensagem);
        const descricoes = campo.getAttribute('aria-describedby');
        campo.setAttribute('aria-describedby', [descricoes, mensagem.id].filter(Boolean).join(' '));
      }
      campo.setAttribute('aria-invalid', 'true');
      mensagem.textContent = campo.validity.valueMissing ? (campo instanceof HTMLSelectElement ? 'Erro: selecione uma opção.' : 'Erro: preencha este campo.') : 'Erro: ' + campo.validationMessage;
      announce(campo, mensagem.textContent);
    }
    const aoInvalidar = (evento) => { if (ehCampo(evento.target)) mostrar(evento.target); };
    const aoCorrigir = (evento) => { const campo = evento.target; if (!ehCampo(campo) || !mensagens.has(campo)) return; if (campo.validity.valid) limpar(campo); else mostrar(campo); };
    formulario.addEventListener('invalid', aoInvalidar, true); formulario.addEventListener('input', aoCorrigir); formulario.addEventListener('change', aoCorrigir);
    return () => { formulario.removeEventListener('invalid', aoInvalidar, true); formulario.removeEventListener('input', aoCorrigir); formulario.removeEventListener('change', aoCorrigir); for (const campo of mensagens.keys()) limpar(campo); };
  }
  // O painel "o que o leitor de tela ouve" é uma visualização desta apresentação, não do app.
  function announce(campo, text) {
    const label = root.querySelector('label[for="' + campo.id + '"]');
    state.announcements.unshift((label ? label.textContent.replace(/\s*\(obrigatório\)/, '') + ', inválido. ' : '') + text);
    state.announcements = state.announcements.slice(0, 7);
    q('reader').innerHTML = state.announcements.map((t, i) => '<li' + (i ? '' : ' class="is-new"') + '>' + escape(t) + '</li>').join('');
  }

  function frameMarkup(id, content, extra) {
    return '<section class="vd-window ' + (extra || '') + '" data-vd-window="' + id + '" aria-labelledby="vd-title-' + id + '" hidden>' +
      '<header class="vd-window-bar" data-vd-drag="' + id + '"><div class="vd-window-controls">' +
      '<button type="button" class="vd-window-close" data-vd-close="' + id + '" aria-label="Fechar ' + names[id] + '"><span>×</span></button>' +
      '<button type="button" class="vd-window-min" data-vd-min="' + id + '" aria-label="Minimizar ' + names[id] + '"><span>−</span></button></div>' +
      '<h2 id="vd-title-' + id + '">' + svg(id) + names[id] + '</h2>' +
      '<button type="button" class="vd-window-expand" data-vd-expand aria-label="Ampliar computador">↗</button></header>' +
      '<div class="vd-window-body">' + content + '</div></section>';
  }
  function build() {
    root = document.createElement('div'); root.id = 'notebook-ui'; root.className = 'vd-desktop';
    root.setAttribute('aria-label', 'Computador Mentalista? OS. Apps do Marco 3 em simulação local.');
    root.setAttribute('role', 'region'); root.hidden = true;
    const terminal = '<div class="vd-terminal"><div class="vd-terminal-heading"><span>Mentalista? OS / 03</span><span>projeto-g2-frontend</span></div><div class="vd-terminal-launch"><button type="button" data-vd-command="start marco3"><strong>Iniciar apresentação <b>↗</b></strong><span>Cadastro e edição, issue por issue.</span></button><button type="button" data-vd-command="start jogo"><strong>Caça-bug <b>↗</b></strong><span>Feche as oito issues do marco.</span></button></div><div class="vd-terminal-log" data-vd="terminal-log" role="log" aria-live="polite" aria-label="Saída do terminal"><p class="vd-terminal-welcome">O que vamos abrir?</p><p>Escolha acima ou digite <strong>start marco3</strong>.</p><p class="vd-terminal-muted">Seu teclado funciona. As teclas do notebook também.</p></div><form class="vd-terminal-form" data-vd="terminal-form"><label for="vd-terminal-input">mentalista@g2 <span>~</span> <b>%</b></label><input id="vd-terminal-input" data-vd="terminal-input" type="text" maxlength="128" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" aria-label="Comando do terminal"><button type="submit" aria-label="Executar comando">↵</button></form><div class="vd-terminal-shortcuts"><button type="button" data-vd-command="open formulario">open formulario</button><button type="button" data-vd-command="node --test">node --test</button><button type="button" data-vd-command="git log">git log</button><button type="button" data-vd-command="help">help</button></div></div>';
    const board = '<div class="m3-board"><div class="m3-col"><h3>Marco 3 · Entregues <span>8</span></h3><ol>' + ISSUES.map(([n, t, who, pr]) => '<li><button type="button" class="m3-issue" data-vd-issue="' + n + '"><b>#' + n + '</b><span>' + escape(t) + '</span><small>' + who + ' · PR ' + pr + '</small></button></li>').join('') + '</ol></div><div class="m3-col m3-next"><h3>Marco 4 · A fazer <span>' + NEXT.length + '</span></h3><ol>' + NEXT.map((t, i) => '<li><b>#' + (24 + i) + '</b> ' + escape(t) + '</li>').join('') + '</ol><p class="m3-fine">GitHub Projects da equipe. A issue #19 foi entregue no PR #60, mas segue aberta no GitHub.</p></div></div>';
    const opts = (o, sel) => Object.entries(o).map(([v, l]) => '<option value="' + v + '"' + (v === sel ? ' selected' : '') + '>' + l + '</option>').join('');
    const form = '<div class="m3-form-app"><div class="m3-form-wrap"><div class="m3-form-head"><p class="vd-eyebrow" data-vd="form-route">/tarefas/nova</p><h3 data-vd="form-title">Nova tarefa</h3><p class="m3-fine" data-vd="form-note">Todos os campos são obrigatórios. Usa a mesma validação do repositório.</p></div>' +
      '<form class="m3-form" data-vd="form">' +
      '<div class="m3-field m3-wide"><label for="m3-projeto">Projeto</label><select id="m3-projeto" required><option value="">Selecione um projeto</option>' + PROJECTS.map(([id, n]) => '<option value="' + id + '">' + n + '</option>').join('') + '</select></div>' +
      '<div class="m3-field m3-wide"><label for="m3-titulo">Título</label><input id="m3-titulo" type="text" required autocomplete="off"></div>' +
      '<div class="m3-field m3-wide"><label for="m3-descricao">Descrição</label><textarea id="m3-descricao" rows="1" required></textarea></div>' +
      '<div class="m3-field"><label for="m3-status">Status</label><select id="m3-status" required>' + opts(STATUS, 'a-fazer') + '</select></div>' +
      '<div class="m3-field"><label for="m3-prioridade">Prioridade</label><select id="m3-prioridade" required>' + opts(PRIORITY, 'media') + '</select></div>' +
      '<div class="m3-field"><label for="m3-responsavel">Responsável</label><input id="m3-responsavel" type="text" required autocomplete="off"></div>' +
      '<div class="m3-field"><label for="m3-prazo">Prazo</label><input id="m3-prazo" type="date" required></div>' +
      '<div class="m3-actions m3-wide"><button type="submit" class="vd-button vd-primary" data-vd="form-submit">Salvar tarefa</button><button type="button" class="vd-link" data-vd="form-spaces">Testar título só com espaços</button><button type="button" class="vd-link" data-vd="form-new" hidden>Nova tarefa</button></div>' +
      '</form></div><aside class="m3-reader"><p class="vd-eyebrow">O que o leitor de tela anuncia</p><ol data-vd="reader" aria-live="off"><li class="m3-empty">Envie o formulário vazio para ouvir os erros.</li></ol><p class="m3-fine">role="alert", aria-invalid e aria-describedby, como no repositório. Envio simulado em memória.</p></aside></div>';
    const api = '<div class="m3-api"><section><p class="vd-eyebrow">Requisições</p><ol class="m3-log" data-vd="log"><li class="m3-empty">Nada enviado ainda. Salve uma tarefa no Formulário.</li></ol></section><section><p class="vd-eyebrow">db.json · tarefas <b data-vd="db-count"></b></p><pre class="m3-db" data-vd="db"></pre></section><p class="m3-fine m3-wide">Servidor simulado nesta apresentação. Para o real: <code>npm run api</code>, porta 3000.</p></div>';
    const tests = '<div class="m3-tests"><div class="m3-tests-head"><div><p class="vd-eyebrow">node --test tests/*.test.mjs</p><h3><span data-vd="tests-pass">0</span> / 22 passaram</h3></div><button type="button" class="vd-button vd-primary" data-vd="tests-run">Reproduzir resultado ↗</button></div><ol class="m3-tests-list" data-vd="tests-list">' + TESTS.map(([f, t]) => '<li><i aria-hidden="true"></i><span>' + escape(t) + '</span><small>' + f + '</small></li>').join('') + '</ol><p class="m3-fine">Resultado da main em 22/10/2026 reproduzido aqui; os testes não rodam dentro da apresentação.</p></div>';
    const gameApp = '<div class="vd-game"><div class="vd-game-paper"><canvas data-vd="game-canvas" width="600" height="350" tabindex="0" aria-label="Caça-bug. Use as setas ou WASD para levar o cursor até as oito issues do Marco 3."></canvas><div class="vd-game-caption"><span>Quadro do Marco 3</span><span>setas ou W A S D</span></div></div><aside class="vd-game-side"><p class="vd-eyebrow">Uma pausa entre commits</p><h3>Caça-bug</h3><p class="vd-copy">Leve o cursor até as oito issues e feche o marco.</p><div class="vd-game-score"><strong data-vd="game-score">0</strong><span>/ 8 issues</span></div><p class="vd-game-message" data-vd="game-message" role="status" aria-live="polite">Um quadro pronto para limpar.</p><div class="vd-game-actions"><button type="button" class="vd-button vd-primary" data-vd="game-start">Jogar ↗</button><button type="button" class="vd-button" data-vd="game-pause" disabled aria-pressed="true">Pausar</button></div><div class="vd-game-pad" aria-label="Mover o cursor"><button type="button" data-vd-direction="up" aria-label="Mover para cima">↑</button><button type="button" data-vd-direction="left" aria-label="Mover para a esquerda">←</button><button type="button" data-vd-direction="down" aria-label="Mover para baixo">↓</button><button type="button" data-vd-direction="right" aria-label="Mover para a direita">→</button></div></aside></div>';
    let lines = '';
    for (let i = 0; i < 16; i++) lines += '<path d="M' + (310+i*13) + ' 590 C' + (430+i*8) + ' 380,' + (980-i*10) + ' 490,990 ' + (160-i*11) + '"/>';
    root.innerHTML = '<div class="vd-wallpaper" aria-hidden="true"><svg viewBox="0 0 960 600" fill="none" stroke="currentColor" stroke-width="1">' + lines + '</svg><img src="assets/brand/marca.svg" alt=""><p>Cadastro e edição.<br>Marco 3.</p></div>' +
      '<header class="vd-menubar"><button type="button" class="vd-os" data-vd="home" aria-label="Mostrar a mesa"><span>mentalista?</span><b>OS</b></button><span class="vd-menubar-app" data-vd="app-name">Terminal</span><span class="vd-sim-label">simulação</span><time data-vd="clock"></time><button class="vd-top-expand" type="button" data-vd-expand aria-label="Ampliar computador">↗</button></header>' +
      '<div class="vd-desktop-files"><button type="button" class="vd-file" data-vd-open="terminal">' + svg('terminal') + '<span>Terminal</span></button><button type="button" class="vd-file" data-vd-open="formulario">' + svg('formulario') + '<span>Formulário</span></button><button type="button" class="vd-file" data-vd-open="jogo">' + svg('jogo') + '<span>Caça-bug</span></button></div>' +
      '<div class="vd-windows">' + frameMarkup('terminal', terminal, 'vd-terminal-window') + frameMarkup('quadro', board, 'm3-wide-window') + frameMarkup('formulario', form, 'm3-wide-window') + frameMarkup('api', api, 'm3-wide-window') + frameMarkup('testes', tests, 'm3-wide-window') + frameMarkup('jogo', gameApp, 'vd-game-window') + frameMarkup('internet', '<div data-vd-web-host></div>', 'vd-web-window') + frameMarkup('palavra', '<div data-vd-word-host></div>', 'vd-word-window') + '</div>' +
      '<p class="vd-status" data-vd="status" role="status" aria-live="polite">Escolha um aplicativo no dock para explorar o Marco 3.</p><nav class="vd-dock" aria-label="Aplicativos do computador">' + Object.keys(names).map(id => '<button type="button" class="vd-dock-app" data-vd-open="' + id + '" data-vd-dock="' + id + '" aria-label="Abrir ' + names[id] + '">' + svg(id) + '<span>' + names[id] + '</span><i aria-hidden="true"></i></button>').join('') + '</nav>';
    document.body.appendChild(root);
    webApp = global.VeredaWeb?.create(root.querySelector('[data-vd-web-host]'), { storeUrl: REPO_URL, embedStore: false });
    wordApp = global.VeredaWordGame?.create(root.querySelector('[data-vd-word-host]'));
    gameCanvas = q('game-canvas'); gameContext = gameCanvas.getContext('2d');
    const formEl = q('form'); formCleanup = [validarObrigatorios(formEl), acessibilidadeFormulario(formEl)];
    bind(); renderApi(); update(); updateClock(); updateGameUI(); openApp('terminal', false);
  }

  function openApp(id, focus) {
    if (!root || !names[id]) return;
    if (id !== 'terminal') cancelBoot();
    if (id !== 'jogo') pauseGame(true);
    webApp?.setVisible?.(id === 'internet' && visible); wordApp?.setVisible?.(id === 'palavra' && visible);
    opened.add(id); minimized.delete(id); active = id;
    root.querySelectorAll('[data-vd-window]').forEach(w => { w.hidden = w.dataset.vdWindow !== id; });
    q('app-name').textContent = names[id]; update();
    if (id === 'jogo') drawGame(performance.now());
    if (visible && focus !== false) emit('open', { app: id });
    if (focus !== false && visible) {
      const button = id === 'terminal' ? q('terminal-input') : id === 'jogo' ? q('game-start') : id === 'formulario' ? root.querySelector('#m3-projeto') : win(id).querySelector('button:not(:disabled)');
      if (id === 'internet') webApp?.focus(); else if (id === 'palavra') wordApp?.focus(); else if (button) button.focus({ preventScroll: true });
    }
  }
  function closeApp(id, minimize) {
    if (!names[id]) return;
    if (id === 'terminal') cancelBoot(); if (id === 'jogo') pauseGame(true); if (id === 'testes') stopTests(); if (id === 'internet') webApp?.setVisible?.(false); if (id === 'palavra') wordApp?.setVisible?.(false);
    win(id).hidden = true;
    if (minimize) minimized.add(id); else { opened.delete(id); minimized.delete(id); }
    active = null;
    const previous = Array.from(opened).reverse().find(n => n !== id && !minimized.has(n));
    if (previous) openApp(previous, false); else { q('app-name').textContent = 'Mesa'; update(); }
    const dock = root.querySelector('[data-vd-dock="' + id + '"]');
    if (visible && dock) dock.focus({ preventScroll: true });
  }
  function desktopPoint(event) {
    // Inverte a transformação projetiva da tela; o arrasto continua local
    // mesmo quando a superfície 960×600 é projetada por uma homografia.
    const css = global.getComputedStyle(root).transform;
    if (css && css !== 'none' && global.DOMMatrix) {
      const m = new DOMMatrix(css), x = event.clientX, y = event.clientY;
      const a = m.m11 - x*m.m14, b = m.m21 - x*m.m24, c = x*m.m44 - m.m41;
      const d = m.m12 - y*m.m14, e = m.m22 - y*m.m24, f = y*m.m44 - m.m42;
      const det = a*e-b*d;
      if (Math.abs(det)>1e-8) return { x:(c*e-b*f)/det, y:(a*f-c*d)/det };
    }
    const r = root.getBoundingClientRect();
    return { x:(event.clientX-r.left)*WIDTH/(r.width || WIDTH), y:(event.clientY-r.top)*HEIGHT/(r.height || HEIGHT) };
  }

  // ---------- Terminal ----------
  function terminalPrint(text, kind) {
    if (!root) return;
    const log = q('terminal-log'), line = document.createElement('p');
    line.textContent = text; if (kind) line.className = 'vd-terminal-' + kind;
    log.appendChild(line); while (log.children.length > 70) log.firstElementChild.remove();
    log.scrollTop = log.scrollHeight;
  }
  function cancelBoot() {
    bootTimers.forEach(timer => global.clearTimeout(timer)); bootTimers.clear();
    if (booting && root) terminalPrint('Inicialização pausada. Digite start marco3 para retomar.', 'muted');
    booting = false; if (root) q('terminal-input').removeAttribute('aria-busy');
  }
  function bootLater(fn, delay) {
    const timer = global.setTimeout(() => { bootTimers.delete(timer); if (visible && active === 'terminal' && !document.hidden) fn(); else cancelBoot(); }, reducedMotion.matches ? 0 : delay);
    bootTimers.add(timer);
  }
  function executeCommand(raw) {
    if (!root) return;
    const command = String(raw || '').slice(0, 128).trim().replace(/\s+/g, ' ');
    if (!command) return;
    cancelBoot(); terminalHistory.push(command); if (terminalHistory.length > 50) terminalHistory.shift(); historyCursor = terminalHistory.length;
    terminalPrint('mentalista@g2 ~ % ' + command, 'command');
    const normalized = command.replace(/^--\s*/, '').toLowerCase();
    if (normalized === 'clear') { q('terminal-log').replaceChildren(); return; }
    if (normalized === 'help') {
      ['start marco3      · inicia a apresentação', 'start jogo        · abre o Caça-bug', 'start termo       · abre Palavra, jogo de cinco letras',
       'npm run dev       · abre o Formulário (simulado)', 'npm run api       · abre a API e o db.json (simulado)', 'node --test       · reproduz os 22 testes',
       'git log           · commits do Marco 3', 'ls                · arquivos do Marco 3', 'open quadro | formulario | api | testes | jogo | internet | palavra',
       'open repo         · repositório no GitHub, em nova aba', 'pesquisar [termo] · busca no Google em nova aba', 'clear             · limpa esta janela'].forEach(l => terminalPrint(l));
      terminalPrint('Nada aqui executa programas no seu computador. Internet abre links reais.', 'muted'); return;
    }
    if (normalized === 'ls') {
      ['src/lib/servicos/api.ts', 'src/lib/componentes/FormularioTarefa.svelte   FormularioProjeto.svelte', 'src/lib/utils/validarObrigatorios.ts   acessibilidadeFormulario.ts   projetos.ts',
       'src/routes/tarefas/nova   tarefas/[id]/editar   projetos/novo   projetos/[id]/editar', 'tests/  4 *.test.mjs (22 testes)   api.types.ts (checagem de tipos)   tsconfig.json'].forEach(l => terminalPrint(l)); return;
    }
    if (normalized === 'git log' || normalized === 'git log --oneline') {
      ['e599c91 Completa a validacao dos formularios de tarefa (#20) (Andrey)', 'd5f5619 Adiciona apresentação do Marco 3 (#23) (Rayane)', 'da6d070 Melhora a acessibilidade dos formulários de tarefa (#21) (Rayane)',
       '3cb49f3 Cria formulário de tarefa e tela de edição (issues 17 e 19) (Pedro)', '76a499f Cria cadastro e edição de projeto (Gabriel)', '9c15871 Amplia API de escrita e guia de estudo da issue 16 (Andrey)',
       '4661d2a Cria tela de nova tarefa e guia de estudo da issue 18 (Andrey)', '54acb39 chore: organiza serviços e utilitários em src/lib (Rayane)'].forEach(l => terminalPrint(l)); return;
    }
    if (['start marco3', 'start marco 3', 'start apresentacao', 'start apresentação', 'apresentacao', 'apresentação', 'present', 'start vereda'].includes(normalized)) {
      booting = true; q('terminal-input').setAttribute('aria-busy', 'true');
      terminalPrint('↳ Abrindo o Marco 3…', 'muted');
      bootLater(() => terminalPrint('✓ 8 issues, 7 PRs, 22 testes passando.', 'success'), 150);
      bootLater(() => terminalPrint('✓ O código de cada capítulo fica em "Ver o código".', 'success'), 390);
      bootLater(() => {
        booting = false; q('terminal-input').removeAttribute('aria-busy');
        if (typeof callbacks.onPresent === 'function') { if (expanded) collapse(); status('A apresentação começa.'); emit('success', { action: 'present' }); callbacks.onPresent(snapshot('present')); }
        else terminalPrint('A apresentação não está disponível nesta prévia isolada.', 'muted');
      }, 650);
      return;
    }
    if (normalized === 'start jogo') { terminalPrint('↳ Abrindo Caça-bug.', 'success'); openApp('jogo'); return; }
    if (['start termo', 'start palavra'].includes(normalized)) { terminalPrint('↳ Abrindo Palavra.', 'success'); openApp('palavra'); return; }
    if (normalized === 'npm run dev') { terminalPrint('VITE ready · http://localhost:5173/ (simulado nesta apresentação)', 'success'); openApp('formulario'); return; }
    if (['npm run api', 'npx json-server db.json', 'json-server db.json'].includes(normalized)) { terminalPrint('JSON Server · http://localhost:3000 (simulado em memória)', 'success'); openApp('api'); return; }
    if (normalized === 'npm test') { terminalPrint('npm error Missing script: "test". No repositório, os testes rodam com node --test tests/*.test.mjs', 'muted'); }
    if (['npm test', 'node --test', 'node --test tests/*.test.mjs'].includes(normalized)) { terminalPrint('↳ Reproduzindo o resultado de 22/10: 22 testes.', 'success'); openApp('testes'); runTests(); return; }
    const searchCommand = /^(?:pesquisar|buscar|search)\s+(.+)$/i.exec(command.replace(/^--\s*/, ''));
    if (searchCommand) { openApp('internet'); webApp?.navigate(searchCommand[1]); return; }
    if (['open repo', 'open github', 'open repositorio', 'open repositório'].includes(normalized)) { openApp('internet'); webApp?.visitStore(); return; }
    if (normalized.startsWith('open ')) {
      const alias = { quadro:'quadro', issues:'quadro', formulario:'formulario', 'formulário':'formulario', form:'formulario', api:'api', 'db.json':'api', db:'api', testes:'testes', tests:'testes', jogo:'jogo', 'caca-bug':'jogo', 'caça-bug':'jogo', terminal:'terminal', internet:'internet', web:'internet', navegador:'internet', palavra:'palavra', termo:'palavra' };
      const app = alias[normalized.slice(5)];
      if (app) { terminalPrint('↳ Abrindo ' + names[app] + '.', 'success'); openApp(app); return; }
      terminalPrint('Aplicativo não encontrado. Digite help para ver os disponíveis.', 'muted'); return;
    }
    terminalPrint('Comando não reconhecido. Digite help para ver o que este terminal faz.', 'muted');
  }
  function submitTerminal() {
    const input = q('terminal-input'), command = input.value; input.value = '';
    emit('enter', { key: 'Enter', app: 'terminal' }); executeCommand(command);
  }
  // Teclas vindas do teclado 3D: vão para o campo focado do app ativo.
  function typeInto(input, key) {
    const start = input.selectionStart == null ? input.value.length : input.selectionStart, end = input.selectionEnd == null ? start : input.selectionEnd;
    if (key === 'Backspace') input.setRangeText('', start === end ? Math.max(0, start - 1) : start, end, 'end');
    else if (key === 'Delete') input.setRangeText('', start, start === end ? Math.min(input.value.length, end + 1) : end, 'end');
    else if (key === 'ArrowLeft' || key === 'ArrowRight') { const next = clamp((key === 'ArrowLeft' ? start - 1 : end + 1), 0, input.value.length); input.setSelectionRange(next, next); }
    else if (key.length === 1 && input.value.length - (end - start) < 128) input.setRangeText(key, start, end, 'end');
    else return false;
    input.dispatchEvent(new Event('input', { bubbles: true })); return true;
  }
  function typeKey(key) {
    if (!root || !visible || typeof key !== 'string') return false;
    if (key === 'Space' || key === 'Spacebar') key = ' ';
    if (key === 'Escape' && expanded) { collapse(); return true; }
    if (active === 'jogo') {
      const direction = gameDirections[key] || gameDirections[key.toLowerCase()];
      emit(key === 'Enter' ? 'enter' : 'key', { key, app: 'jogo' });
      if (direction && game.running && !game.paused) { moveGame(direction, 22); drawGame(performance.now()); return true; }
      if (key === 'Enter') { if (!game.running) startGame(); else toggleGamePause(); return true; }
      if (key === 'Escape') { closeApp('jogo', false); return true; }
      return !!direction;
    }
    if (key === 'Escape') { if (active) closeApp(active, false); return true; }
    if (active === 'palavra') return !!wordApp?.typeKey(key);
    if (active === 'internet') { const handled = webApp?.typeKey(key); if (handled) emit(key === 'Enter' ? 'enter' : 'key', { key, app: 'internet' }); return !!handled; }
    if (active === 'formulario') {
      const field = root.querySelector('.m3-form :focus') || root.querySelector('#m3-titulo');
      if (key === 'Enter') { q('form').requestSubmit(); return true; }
      if (field && (field.type === 'text' || field.tagName === 'TEXTAREA')) { field.focus({ preventScroll: true }); const ok = typeInto(field, key); if (ok) emit('key', { key, app: 'formulario' }); return ok; }
      return false;
    }
    if (active !== 'terminal') openApp('terminal');
    const input = q('terminal-input'); input.focus({ preventScroll: true });
    if (key === 'Enter') { submitTerminal(); return true; }
    if (key === 'ArrowUp' || key === 'ArrowDown') { terminalRecall(key === 'ArrowUp' ? -1 : 1); return true; }
    const ok = typeInto(input, key); if (ok) emit('key', { key, app: 'terminal' }); return ok;
  }
  function terminalRecall(direction) {
    historyCursor = clamp(historyCursor + direction, 0, terminalHistory.length);
    const input = q('terminal-input'); input.value = terminalHistory[historyCursor] || ''; input.setSelectionRange(input.value.length, input.value.length);
  }

  // ---------- Formulário e API simulada ----------
  const fields = () => ({ projetoId: root.querySelector('#m3-projeto').value, titulo: root.querySelector('#m3-titulo').value, descricao: root.querySelector('#m3-descricao').value, status: root.querySelector('#m3-status').value, prioridade: root.querySelector('#m3-prioridade').value, responsavel: root.querySelector('#m3-responsavel').value, prazo: root.querySelector('#m3-prazo').value });
  function setFormMode(tarefa) {
    state.editing = tarefa || null;
    q('form-route').textContent = tarefa ? '/tarefas/' + tarefa.id + '/editar' : '/tarefas/nova';
    q('form-title').textContent = tarefa ? 'Editar tarefa' : 'Nova tarefa';
    q('form-submit').textContent = tarefa ? 'Salvar alterações' : 'Salvar tarefa';
    q('form-new').hidden = !tarefa;
    root.querySelector('#m3-descricao').required = !tarefa;
    q('form-note').textContent = tarefa ? 'Os campos indicados como obrigatórios precisam ser preenchidos. A descrição é opcional, como no FormularioTarefa.' : 'Todos os campos são obrigatórios. Usa a mesma validação do repositório.';
    if (tarefa) Object.entries({ projeto: tarefa.projetoId, titulo: tarefa.titulo, descricao: tarefa.descricao, status: tarefa.status, prioridade: tarefa.prioridade, responsavel: tarefa.responsavel, prazo: tarefa.prazo }).forEach(([k, v]) => { root.querySelector('#m3-' + k).value = v; });
    else { q('form').reset(); }
  }
  function submitForm(event) {
    event.preventDefault();
    if (state.saving) return;
    if (!q('form').reportValidity()) { status('Formulário com erro: o foco foi para o primeiro campo inválido.'); emit('error', { app: 'formulario' }); return; }
    state.saving = true; q('form-submit').disabled = true; q('form-submit').textContent = 'Salvando...'; q('form').setAttribute('aria-busy', 'true');
    const dados = fields(), editing = state.editing;
    global.setTimeout(() => {
      state.saving = false; q('form').removeAttribute('aria-busy'); q('form-submit').disabled = false;
      if (!root) return;
      let tarefa;
      if (editing) { tarefa = Object.assign(state.db.find(t => t.id === editing.id) || editing, dados); state.log.unshift(['PATCH', '/tarefas/' + tarefa.id, 200]); status('PATCH /tarefas/' + tarefa.id + ' → 200. Alterações salvas na simulação.'); }
      else { tarefa = Object.assign({}, dados, { id: randomId() }); state.db.push(tarefa); state.log.unshift(['POST', '/tarefas', 201]); status('POST /tarefas → 201, id ' + tarefa.id + '. No app real, goto("/") volta para a lista; aqui ela abre em edição para você testar o PATCH.'); global.VeredaScene?.send(); }
      setFormMode(tarefa); renderApi(); notify(editing ? 'patch' : 'post'); emit('success', { action: editing ? 'patch' : 'post' });
    }, reducedMotion.matches ? 0 : 650);
  }
  function renderApi() {
    if (!root) return;
    q('log').innerHTML = state.log.length ? state.log.slice(0, 8).map(([m, p, s]) => '<li><b class="m3-' + m.toLowerCase() + '">' + m + '</b><code>' + escape(p) + '</code><span>' + s + '</span></li>').join('') : '<li class="m3-empty">Nada enviado ainda. Salve uma tarefa no Formulário.</li>';
    q('db-count').textContent = '(' + (9 + state.db.length) + ')';
    const shown = state.db.slice(-3).map(t => ({ id: t.id, projetoId: t.projetoId, titulo: t.titulo, status: t.status, prioridade: t.prioridade }));
    q('db').textContent = '[\n  … 9 tarefas do seed …' + (shown.length ? ',\n' + shown.map(t => '  ' + JSON.stringify(t)).join(',\n') : '') + '\n]';
  }

  // ---------- Testes ----------
  function stopTests() { testTimers.forEach(t => global.clearTimeout(t)); testTimers.clear(); state.testsRunning = false; if (root) q('tests-run').disabled = false; }
  function paintTests() { root.querySelectorAll('[data-vd="tests-list"] li').forEach((li, i) => li.classList.toggle('is-pass', i < state.testsShown)); q('tests-pass').textContent = state.testsShown; }
  function runTests() {
    stopTests(); state.testsShown = 0; paintTests(); state.testsRunning = true; q('tests-run').disabled = true;
    if (reducedMotion.matches) { state.testsShown = 22; paintTests(); stopTests(); status('22 testes, 22 passaram, 0 falharam.'); return; }
    TESTS.forEach((_, i) => { const t = global.setTimeout(() => { testTimers.delete(t); if (!visible || active !== 'testes' || document.hidden) { stopTests(); return; } state.testsShown = i + 1; paintTests(); emit('key', { key: 'test', app: 'testes' }); if (i === 21) { stopTests(); status('22 testes, 22 passaram, 0 falharam.'); emit('success', { action: 'tests' }); } }, 90 * (i + 1)); testTimers.add(t); });
  }

  // ---------- Caça-bug ----------
  function gameCanRun() { return !!(root && visible && active === 'jogo' && !document.hidden && game.running && !game.paused); }
  function cancelGameFrame() { if (gameFrame) { global.cancelAnimationFrame(gameFrame); gameFrame = 0; } gameLast = 0; }
  function pauseGame(silent) {
    const wasPlaying = game.running && !game.paused; game.paused = true; game.keys.clear(); cancelGameFrame();
    if (root) { updateGameUI(); if (visible && active === 'jogo') drawGame(performance.now()); }
    if (wasPlaying && !silent) emit('game', { action: 'pause', score: game.score });
  }
  function startGame() {
    game.score = 0; game.player = { x:80, y:177 }; game.trail = []; game.keys.clear(); game.running = true; game.paused = false;
    gameLast = 0; updateGameUI(); drawGame(performance.now()); requestGameFrame();
    if (visible) gameCanvas.focus({ preventScroll: true }); emit('game', { action: 'start', score: 0 });
  }
  function toggleGamePause() {
    if (!game.running) return;
    if (!game.paused) { pauseGame(false); return; }
    game.paused = false; gameLast = 0; updateGameUI(); drawGame(performance.now()); requestGameFrame();
    gameCanvas.focus({ preventScroll: true }); emit('game', { action: 'resume', score: game.score });
  }
  function updateGameUI() {
    if (!root) return;
    q('game-score').textContent = game.score;
    q('game-message').textContent = game.score === game.goal ? 'Marco 3 fechado. Oito de oito!' : !game.running ? 'Um quadro pronto para limpar.' : game.paused ? 'Pausa no quadro. Retome quando quiser.' : 'Siga até a issue #' + ISSUES[game.score][0] + '.';
    q('game-start').textContent = game.running || game.score ? 'Reiniciar ↺' : 'Jogar ↗';
    q('game-pause').disabled = !game.running; q('game-pause').textContent = game.paused ? 'Retomar' : 'Pausar'; q('game-pause').setAttribute('aria-pressed', String(game.paused));
    root.querySelectorAll('[data-vd-direction]').forEach(button => button.disabled = !game.running || game.paused);
  }
  function moveGame(direction, amount) {
    if (!gameCanRun()) return;
    if (direction === 'left') game.player.x -= amount; if (direction === 'right') game.player.x += amount;
    if (direction === 'up') game.player.y -= amount; if (direction === 'down') game.player.y += amount;
    game.player.x = clamp(game.player.x, 52, 566); game.player.y = clamp(game.player.y, 45, 315);
    const last = game.trail[game.trail.length - 1];
    if (!last || Math.hypot(last.x - game.player.x, last.y - game.player.y) > 15) { game.trail.push({ ...game.player }); if (game.trail.length > 45) game.trail.shift(); }
    const target = bugs[game.score];
    if (target && Math.hypot(target.x - game.player.x, target.y - game.player.y) < 26) {
      game.score++; emit('game', { action: game.score === game.goal ? 'win' : 'collect', score: game.score });
      if (game.score === game.goal) { game.running = false; game.paused = true; game.keys.clear(); cancelGameFrame(); }
      updateGameUI();
    }
  }
  function requestGameFrame() {
    if (gameFrame || !gameCanRun() || (reducedMotion.matches && !game.keys.size)) return;
    gameFrame = global.requestAnimationFrame(gameTick);
  }
  function gameTick(now) {
    gameFrame = 0; if (!gameCanRun()) { gameLast = 0; return; }
    const elapsed = gameLast ? Math.min((now - gameLast) / 1000, .05) : 1/60; gameLast = now;
    const diagonal = (game.keys.has('left') || game.keys.has('right')) && (game.keys.has('up') || game.keys.has('down'));
    const step = 142 * elapsed / (diagonal ? Math.SQRT2 : 1); game.keys.forEach(direction => moveGame(direction, step));
    drawGame(now); requestGameFrame();
  }
  function drawGame(now) {
    if (!gameContext || !root || !visible || active !== 'jogo' || document.hidden) return;
    const c = gameContext; c.clearRect(0, 0, 600, 350); c.fillStyle = '#f8fafc'; c.fillRect(0, 0, 600, 350);
    c.lineWidth = .6; c.strokeStyle = '#33415522';
    for (let x = 30; x < 600; x += 30) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 350); c.stroke(); }
    for (let y = 30; y < 350; y += 30) { c.beginPath(); c.moveTo(0, y); c.lineTo(600, y); c.stroke(); }
    c.fillStyle = '#475569'; c.font = '12px Manrope, sans-serif'; c.fillText('quadro / marco 3 · ' + game.score + ' de 8 fechadas', 18, 22);
    game.trail.forEach((point, i) => { c.globalAlpha = (i + 1) / game.trail.length * .3; c.fillStyle = '#2563eb'; c.beginPath(); c.arc(point.x, point.y, 2, 0, Math.PI * 2); c.fill(); }); c.globalAlpha = 1;
    const target = bugs[game.score];
    if (target) {
      const pulse = reducedMotion.matches || game.paused ? 1 : 1 + .08 * Math.sin(now / 380);
      c.save(); c.translate(target.x, target.y); c.scale(pulse, pulse);
      c.fillStyle = '#2563eb22'; c.beginPath(); c.arc(0, 0, 30, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#ffffff'; c.strokeStyle = '#2563eb'; c.lineWidth = 2; c.beginPath(); c.roundRect ? c.roundRect(-26, -17, 52, 34, 7) : c.rect(-26, -17, 52, 34); c.fill(); c.stroke();
      c.fillStyle = '#1d4ed8'; c.font = '700 15px Manrope, sans-serif'; c.textAlign = 'center'; c.fillText('#' + ISSUES[game.score][0], 0, 5); c.textAlign = 'left'; c.restore();
    }
    for (let i = 0; i < game.score; i++) { c.fillStyle = '#2563eb'; c.beginPath(); c.arc(470 + i * 15, 18, 5, 0, Math.PI * 2); c.fill(); }
    c.save(); c.translate(game.player.x, game.player.y);
    c.fillStyle = '#0f172a'; c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.beginPath(); c.moveTo(-6, -12); c.lineTo(-6, 12); c.lineTo(0, 6); c.lineTo(5, 16); c.lineTo(9, 14); c.lineTo(4, 4); c.lineTo(12, 4); c.closePath(); c.stroke(); c.fill(); c.restore();
    if (game.score === game.goal) { c.fillStyle = '#1e293b'; c.font = '600 25px Manrope, sans-serif'; c.fillText('Oito issues. Marco 3 fechado.', 125, 174); }
    else if (!game.running) { c.fillStyle = '#64748b'; c.font = '16px Manrope, sans-serif'; c.fillText('um cursor, oito issues.', 210, 330); }
  }

  function bind() {
    ['pointerdown','pointerup','click','keydown','keyup','wheel','touchmove'].forEach(type => {
      listen(root, type, event => event.stopPropagation(), { passive: type === 'wheel' || type === 'touchmove' });
    });
    listen(root, 'click', event => {
      const target = event.target.closest('button'); if (!target || target.disabled) return;
      if (target.dataset.vdOpen) openApp(target.dataset.vdOpen);
      if (target.dataset.vdClose) closeApp(target.dataset.vdClose, false);
      if (target.dataset.vdMin) closeApp(target.dataset.vdMin, true);
      if (target.dataset.vdCommand) { q('terminal-input').value = target.dataset.vdCommand; submitTerminal(); }
      if (target.dataset.vdIssue) { const i = ISSUES.find(x => x[0] === target.dataset.vdIssue); status('Issue #' + i[0] + ' · ' + i[1] + ' · ' + i[2] + ' · PR ' + i[3] + '.'); }
      if (target.hasAttribute('data-vd-expand')) expand();
    });
    listen(q('terminal-form'), 'submit', event => { event.preventDefault(); submitTerminal(); });
    listen(q('terminal-input'), 'keydown', event => {
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); terminalRecall(event.key === 'ArrowUp' ? -1 : 1); }
      if (!event.repeat && !event.metaKey && !event.ctrlKey && event.key !== 'Enter') emit('key', { key: event.key, app: 'terminal' });
    });
    listen(q('form'), 'submit', submitForm);
    listen(q('form'), 'keydown', event => { if (!event.repeat && !event.metaKey && !event.ctrlKey && event.key.length === 1) emit('key', { key: event.key, app: 'formulario' }); });
    listen(q('form-spaces'), 'click', () => { const t = root.querySelector('#m3-titulo'); t.value = '      '; t.dispatchEvent(new Event('input', { bubbles: true })); q('form').requestSubmit(); });
    listen(q('form-new'), 'click', () => { setFormMode(null); root.querySelector('#m3-projeto').focus({ preventScroll: true }); status('Formulário limpo para uma nova tarefa.'); });
    listen(q('tests-run'), 'click', runTests);
    listen(q('game-start'), 'click', startGame); listen(q('game-pause'), 'click', toggleGamePause);
    listen(root, 'keydown', event => {
      if (active !== 'jogo' || event.metaKey || event.ctrlKey || event.altKey) return;
      const direction = gameDirections[event.key] || gameDirections[event.key.toLowerCase()];
      if (!direction) return;
      event.preventDefault();
      if (!gameCanRun()) return;
      if (!game.keys.has(direction)) emit('key', { key: event.key, app: 'jogo' });
      game.keys.add(direction); requestGameFrame();
    });
    listen(root, 'keyup', event => {
      if (active !== 'jogo') return;
      const direction = gameDirections[event.key] || gameDirections[event.key.toLowerCase()];
      if (direction) { event.preventDefault(); game.keys.delete(direction); }
    });
    root.querySelectorAll('[data-vd-direction]').forEach(button => {
      const direction = button.dataset.vdDirection;
      listen(button, 'pointerdown', event => {
        if (!gameCanRun() || event.button !== 0) return; event.preventDefault();
        button.setPointerCapture(event.pointerId); game.keys.add(direction); requestGameFrame(); emit('key', { key: direction, app: 'jogo' });
      });
      ['pointerup','pointercancel','lostpointercapture'].forEach(type => listen(button, type, () => game.keys.delete(direction)));
      listen(button, 'click', event => { if (event.detail === 0 && gameCanRun()) { moveGame(direction, 22); drawGame(performance.now()); emit('key', { key: direction, app: 'jogo' }); } });
    });
    listen(global, 'blur', () => pauseGame(true));
    listen(q('home'), 'click', () => { cancelBoot(); pauseGame(true); stopTests(); webApp?.setVisible(false); wordApp?.setVisible(false); Array.from(opened).forEach(id => minimized.add(id)); root.querySelectorAll('[data-vd-window]').forEach(w => w.hidden = true); active = null; q('app-name').textContent = 'Mesa'; update(); });
    root.querySelectorAll('[data-vd-drag]').forEach(bar => {
      listen(bar, 'pointerdown', event => {
        if (expanded || event.target.closest('button') || event.button !== 0) return;
        const w = win(bar.dataset.vdDrag); moving = { id: event.pointerId, bar, w, start: desktopPoint(event), left: w.offsetLeft, top: w.offsetTop };
        bar.setPointerCapture(event.pointerId); event.preventDefault();
      });
      listen(bar, 'pointermove', event => {
        if (!moving || moving.id !== event.pointerId || moving.bar !== bar) return;
        const p = desktopPoint(event); moving.w.style.left = clamp(moving.left + p.x - moving.start.x, 8, WIDTH - moving.w.offsetWidth - 8) + 'px';
        moving.w.style.top = clamp(moving.top + p.y - moving.start.y, 46, HEIGHT - moving.w.offsetHeight - 86) + 'px';
      });
      ['pointerup','pointercancel','lostpointercapture'].forEach(type => listen(bar, type, () => moving = null));
    });
    listen(root, 'keydown', event => { if (event.key === 'Escape') { if (expanded) { event.preventDefault(); collapse(); } else if (active) { event.preventDefault(); closeApp(active, false); } } });
    listen(global, 'resize', () => { if (expanded && active === 'jogo') drawGame(performance.now()); });
    listen(document, 'visibilitychange', () => { if (document.hidden) { cancelBoot(); pauseGame(true); stopTests(); stopClock(); } else if (visible) { startClock(); if (active === 'jogo') drawGame(performance.now()); } });
  }
  function update() {
    if (!root) return;
    root.querySelectorAll('[data-vd-dock]').forEach(b => { const id = b.dataset.vdDock; b.classList.toggle('is-open', opened.has(id)); b.classList.toggle('is-active', active === id); b.setAttribute('aria-pressed', String(active === id)); });
    root.querySelector('.vd-sim-label').textContent = active === 'internet' ? 'web' : (active === 'jogo' || active === 'palavra') ? 'jogo' : 'simulação';
    root.dataset.activeApp = active || 'desktop';
  }
  function updateClock() { if (root) { q('clock').textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); q('clock').dateTime = new Date().toISOString(); } }
  function startClock() { stopClock(); updateClock(); clock = global.setInterval(() => { if (visible && !document.hidden) updateClock(); }, 60000); }
  function stopClock() { if (clock) { global.clearInterval(clock); clock = 0; } }
  function setVisible(value) {
    const next = expanded || !!value; if (next === visible) return;
    visible = next; if (!root) return;
    if (!visible && root.contains(document.activeElement)) document.activeElement.blur();
    root.hidden = !visible; root.setAttribute('aria-hidden', String(!visible)); webApp?.setVisible?.(visible && active === 'internet'); wordApp?.setVisible?.(visible && active === 'palavra');
    if ('inert' in root) root.inert = !visible;
    if (visible) { update(); startClock(); if (active === 'jogo') drawGame(performance.now()); } else { cancelBoot(); pauseGame(true); stopTests(); stopClock(); }
  }
  function ensureExpandedDialog() {
    if (expandedDialog) return;
    expandedDialog = document.createElement('dialog'); expandedDialog.id = 'vd-expanded-shell';
    expandedDialog.setAttribute('aria-label', 'Computador ampliado');
    expandedDialog.innerHTML = '<header class="vd-expanded-header"><span>Mentalista? OS <small>Marco 3</small></span><button type="button" data-vd-collapse>↙ Voltar ao notebook</button></header>';
    document.body.appendChild(expandedDialog);
    listen(expandedDialog.querySelector('[data-vd-collapse]'), 'click', collapse);
    listen(expandedDialog, 'cancel', event => { event.preventDefault(); collapse(); });
    listen(expandedDialog, 'close', () => { if (expanded && !expandedDialog.open) collapse(); });
    ['keydown','keyup','click','pointerdown','pointerup','wheel','touchmove'].forEach(type => listen(expandedDialog, type, event => event.stopPropagation(), { passive: type === 'wheel' || type === 'touchmove' }));
  }
  function expand() {
    if (!root) return api;
    if (expanded) return api;
    ensureExpandedDialog(); expansionReturnFocus = document.activeElement; expansionWasVisible = visible;
    rootPlaceholder = document.createComment('Desktop projection'); root.parentNode.insertBefore(rootPlaceholder, root);
    expanded = true; root.classList.add('vd-is-expanded'); expandedDialog.appendChild(root); setVisible(true);
    expandedDialog.showModal();
    const focus = active === 'terminal' ? q('terminal-input') : active === 'jogo' ? q('game-start') : active === 'formulario' ? root.querySelector('#m3-projeto') : active === 'internet' ? root.querySelector('[data-vd-web-host] input') : expandedDialog.querySelector('[data-vd-collapse]');
    if (active === 'palavra') wordApp?.focus(); else if (focus) focus.focus({ preventScroll: true });
    if (active === 'jogo') drawGame(performance.now()); emit('open', { app: active || 'desktop', expanded: true });
    return api;
  }
  function collapse() {
    if (!expanded) return api;
    pauseGame(true); expanded = false;
    if (rootPlaceholder && rootPlaceholder.parentNode) { rootPlaceholder.parentNode.insertBefore(root, rootPlaceholder); rootPlaceholder.remove(); }
    else document.body.appendChild(root);
    rootPlaceholder = null; root.classList.remove('vd-is-expanded');
    if (expandedDialog.open) expandedDialog.close();
    setVisible(expansionWasVisible); if (active === 'jogo') drawGame(performance.now());
    if (expansionReturnFocus && expansionReturnFocus.isConnected && typeof expansionReturnFocus.focus === 'function' && !expansionReturnFocus.closest('[hidden]')) expansionReturnFocus.focus({ preventScroll: true });
    expansionReturnFocus = null; return api;
  }
  function dispose() {
    if (expanded) collapse(); cancelBoot(); pauseGame(true); stopTests(); stopClock(); formCleanup.forEach(fn => fn()); formCleanup = []; removeListeners.forEach(fn => fn()); removeListeners = [];
    webApp?.dispose(); webApp = null; wordApp?.dispose(); wordApp = null;
    if (root) root.remove(); if (expandedDialog) expandedDialog.remove(); expandedDialog = null;
    root = null; gameCanvas = null; gameContext = null; active = null; visible = false; opened.clear(); minimized.clear();
  }
  const api = {
    init(options) { callbacks = options || {}; if (!root) build(); return api; },
    getElement() { return root; }, setVisible, openApp, typeKey, expand, collapse, isExpanded() { return expanded; },
    syncState() { return snapshot('sync'); },
    runCommand(command) { if (root && visible) { openApp('terminal'); executeCommand(command); } },
    getState() { return snapshot('inspect'); },
    getGameState() { return { score: game.score, goal: game.goal, running: game.running, paused: game.paused, player: { ...game.player }, target: bugs[game.score] ? { ...bugs[game.score] } : null, animating: !!gameFrame }; },
    closeApp(id) { if (root) closeApp(id || active, false); },
    minimizeApp(id) { if (root) closeApp(id || active, true); },
    dispose
  };
  global.VeredaDesktop = api;
})(window);
