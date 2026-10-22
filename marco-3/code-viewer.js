/* Leitor de código do Marco 3: abre qualquer arquivo de marco3-code.js em tela
 * cheia, com fonte grande para projetor, números de linha, cores simples e as
 * linhas do Marco 3 marcadas. Qualquer elemento com data-code="caminho" abre o
 * arquivo; data-find e data-span destacam o trecho que o capítulo explica. */
(function (global) {
  'use strict';
  const data = global.MARCO3_CODE;
  if (!data) return;
  const SIZE_KEY = 'marco3.code.size', WRAP_KEY = 'marco3.code.wrap', ONLY_KEY = 'marco3.code.only';
  const read = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* armazenamento opcional */ } };
  let size = null, wrap = read(WRAP_KEY, true), onlyNew = read(ONLY_KEY, true), current = null, currentFind = null, currentSpan = null, openGaps = new Set(), returnFocus = null;
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const groupOf = (f) => data.groups.find(g => g.id === f.group);

  // Cores simples para TS, JS, Svelte e Markdown: comentário, texto, palavra-chave, tag e número.
  const KEYWORDS = /\b(import|export|from|const|let|var|function|return|if|else|for|of|in|while|async|await|try|catch|finally|throw|new|type|interface|extends|class|default|as|true|false|null|undefined|void|typeof|instanceof|break|continue)\b/g;
  function highlight(lines, path) {
    const md = /\.md$/.test(path);
    let inBlock = null; // '*/', '-->' ou '`'
    return lines.map(raw => {
      if (md) return /^#/.test(raw) ? '<span class="tk-k">' + esc(raw) + '</span>' : /^\s*[-*] /.test(raw) ? esc(raw) : /`/.test(raw) ? esc(raw).replace(/`([^`]+)`/g, '<span class="tk-s">`$1`</span>') : esc(raw);
      let out = '', i = 0;
      const push = (cls, text) => { out += cls ? '<span class="' + cls + '">' + esc(text) + '</span>' : codeText(text); };
      while (i < raw.length) {
        if (inBlock) {
          const end = raw.indexOf(inBlock, i);
          const cls = inBlock === '`' ? 'tk-s' : 'tk-c';
          if (end === -1) { push(cls, raw.slice(i)); i = raw.length; }
          else { push(cls, raw.slice(i, end + inBlock.length)); i = end + inBlock.length; inBlock = null; }
          continue;
        }
        const rest = raw.slice(i);
        let m;
        if ((m = /^\/\/.*/.exec(rest))) { push('tk-c', m[0]); i += m[0].length; continue; }
        if (rest.startsWith('/*')) { inBlock = '*/'; push('tk-c', '/*'); i += 2; continue; }
        if (rest.startsWith('<!--')) { inBlock = '-->'; push('tk-c', '<!--'); i += 4; continue; }
        if (rest[0] === '`') { inBlock = '`'; push('tk-s', '`'); i += 1; continue; }
        if ((m = /^(['"])(?:\\.|(?!\1).)*\1/.exec(rest))) { push('tk-s', m[0]); i += m[0].length; continue; }
        if ((m = /^<\/?[A-Za-z][\w:.-]*/.exec(rest))) { push('tk-t', m[0]); i += m[0].length; continue; }
        if ((m = /^\{[#/:@][a-z]+/.exec(rest))) { push('tk-k', m[0]); i += m[0].length; continue; }
        if ((m = /^\$[a-z]+\b/.exec(rest))) { push('tk-r', m[0]); i += m[0].length; continue; }
        if ((m = /^[A-Za-z_][\w]*|^\d+(?:\.\d+)?|^\s+|^./.exec(rest))) { push(null, m[0]); i += m[0].length; continue; }
      }
      return out;
    });
  }
  function codeText(text) {
    if (/^\d/.test(text)) return '<span class="tk-n">' + esc(text) + '</span>';
    KEYWORDS.lastIndex = 0;
    if (KEYWORDS.test(text) && /^[A-Za-z_]\w*$/.test(text)) return '<span class="tk-k">' + esc(text) + '</span>';
    if (/^[A-Z][A-Za-z0-9]*$/.test(text)) return '<span class="tk-y">' + esc(text) + '</span>';
    return esc(text);
  }

  let dialog, list, codeEl, meta, title, focusNote;
  function build() {
    if (size === null) size = read(SIZE_KEY, global.matchMedia('(max-width: 760px)').matches ? 15 : 19);
    dialog = document.createElement('dialog'); dialog.id = 'code-dialog'; dialog.setAttribute('aria-labelledby', 'code-title');
    const groups = data.groups.map(g => '<section class="cv-group"><h3><b>' + esc(g.issue) + '</b> ' + esc(g.title) + '</h3><ul>' +
      data.files.filter(f => f.group === g.id).map(f => { const i = data.files.indexOf(f); const parts = f.path.split('/'); return '<li><button type="button" data-cv-file="' + i + '"><span>' + esc(parts.pop()) + '</span><small>' + esc(parts.join('/') || '/') + '</small></button></li>'; }).join('') + '</ul></section>').join('');
    dialog.innerHTML = '<div class="cv-shell"><header class="cv-head"><div class="cv-title"><p class="cv-kicker">O código do Marco 3 · ' + esc(data.repo) + ' · commit ' + esc(data.head) + '</p><h2 id="code-title"></h2><p class="cv-meta" data-cv-meta></p></div>' +
      '<div class="cv-tools" role="group" aria-label="Leitura"><button type="button" data-cv-size="-1" aria-label="Diminuir a fonte">A−</button><button type="button" data-cv-size="1" aria-label="Aumentar a fonte">A+</button><button type="button" data-cv-only aria-pressed="true">Só o Marco 3</button><button type="button" data-cv-wrap aria-pressed="true">Quebrar linhas</button><button type="button" data-cv-step="-1" aria-label="Arquivo anterior">←</button><button type="button" data-cv-step="1" aria-label="Próximo arquivo">→</button><button type="button" class="cv-close" data-cv-close aria-label="Fechar o código">×</button></div></header>' +
      '<nav class="cv-files" aria-label="Arquivos do Marco 3"><label class="cv-select"><span>Arquivo</span><select data-cv-select>' + data.files.map((f, i) => '<option value="' + i + '">' + esc(f.path) + '</option>').join('') + '</select></label>' + groups + '</nav>' +
      '<div class="cv-main"><p class="cv-focus" data-cv-focus hidden></p><div class="cv-code" data-cv-code tabindex="0" role="region" aria-label="Código do arquivo"></div><p class="cv-legend"><i></i> linha criada ou alterada no Marco 3 <i class="cv-legend-focus"></i> trecho explicado no capítulo <span data-cv-legend-only></span></p></div></div>';
    document.body.appendChild(dialog);
    list = dialog.querySelector('.cv-files'); codeEl = dialog.querySelector('[data-cv-code]'); meta = dialog.querySelector('[data-cv-meta]'); title = dialog.querySelector('#code-title'); focusNote = dialog.querySelector('[data-cv-focus]');
    dialog.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (e.target === dialog) { close(); return; }
      if (!b) return;
      if (b.dataset.cvFile) show(Number(b.dataset.cvFile));
      if (b.hasAttribute('data-cv-only')) { onlyNew = !onlyNew; save(ONLY_KEY, onlyNew); applyLook(); show(current, currentFind, currentSpan, true); }
      if (b.dataset.cvGap) { openGaps.add(b.dataset.cvGap); show(current, currentFind, currentSpan, true); }
      if (b.dataset.cvSize) setSize(size + Number(b.dataset.cvSize) * 2);
      if (b.hasAttribute('data-cv-wrap')) { wrap = !wrap; save(WRAP_KEY, wrap); applyLook(); }
      if (b.dataset.cvStep) show((current + Number(b.dataset.cvStep) + data.files.length) % data.files.length);
      if (b.hasAttribute('data-cv-close')) close();
    });
    dialog.querySelector('[data-cv-select]').addEventListener('change', e => show(Number(e.target.value)));
    dialog.addEventListener('keydown', e => { if (e.key === '+' || e.key === '=') { e.preventDefault(); setSize(size + 2); } if (e.key === '-') { e.preventDefault(); setSize(size - 2); } });
    dialog.addEventListener('close', () => { if (returnFocus && returnFocus.isConnected) returnFocus.focus({ preventScroll: true }); returnFocus = null; });
    applyLook();
  }
  function setSize(v) { size = Math.max(13, Math.min(32, v)); save(SIZE_KEY, size); applyLook(); }
  function applyLook() { dialog.style.setProperty('--cv-size', size + 'px'); dialog.classList.toggle('cv-wrap', wrap); dialog.querySelector('[data-cv-wrap]').setAttribute('aria-pressed', String(wrap)); dialog.querySelector('[data-cv-only]').setAttribute('aria-pressed', String(onlyNew)); }
  function findFocus(f, find, span) {
    if (!find) return null;
    const lines = f.text.split('\n'), start = lines.findIndex(l => l.includes(find));
    if (start < 0) return null;
    return { from: start + 1, to: Math.min(lines.length, start + (Number(span) || 1)) };
  }
  function show(i, find, span, keepGaps) {
    const f = data.files[i]; if (!f) return; if (!keepGaps || i !== current) openGaps = new Set(); current = i; currentFind = find; currentSpan = span;
    const g = groupOf(f), lines = f.text.replace(/\n$/, '').split('\n'), added = new Set(f.status === 'novo' ? lines.map((_, k) => k + 1) : f.added);
    const focus = findFocus(f, find, span);
    title.textContent = f.path;
    const how = f.status === 'novo' ? 'arquivo novo' : f.status === 'movido' ? 'movido de ' + f.from : 'alterado';
    meta.innerHTML = '<span>' + esc(g.issue) + (g.pr ? ' · PR ' + esc(g.pr) : '') + '</span><span>' + esc(how) + '</span><span>' + esc(f.authors.join(', ')) + '</span><span>' + lines.length + ' linhas · ' + added.size + ' do Marco 3</span>';
    const html = highlight(lines, f.path);
    const inFocus = (n) => focus && n >= focus.from && n <= focus.to;
    const visibleLine = (n) => !onlyNew || added.has(n) || inFocus(n);
    let rows = '', k = 0;
    while (k < html.length) {
      const n = k + 1;
      if (visibleLine(n)) { rows += '<div class="cv-line' + (added.has(n) ? ' is-added' : '') + (inFocus(n) ? ' is-focus' : '') + '" data-n="' + n + '"><span class="cv-n" aria-hidden="true">' + n + '</span><code>' + (html[k] || ' ') + '</code></div>'; k++; continue; }
      let end = k; while (end < html.length && !visibleLine(end + 1)) end++;
      const key = (k + 1) + '-' + end;
      if (openGaps.has(key)) { for (let j = k; j < end; j++) rows += '<div class="cv-line is-old" data-n="' + (j + 1) + '"><span class="cv-n" aria-hidden="true">' + (j + 1) + '</span><code>' + (html[j] || ' ') + '</code></div>'; }
      else rows += '<button type="button" class="cv-gap" data-cv-gap="' + key + '">⋯ ' + (end - k) + (end - k === 1 ? ' linha que já existia' : ' linhas que já existiam') + ' antes do Marco 3 (linhas ' + (k + 1) + '–' + end + ', clique para ver)</button>';
      k = end;
    }
    codeEl.innerHTML = rows;
    dialog.querySelector('[data-cv-legend-only]').textContent = onlyNew && f.status !== 'novo' ? '· mostrando só o que o Marco 3 acrescentou' : '';
    focusNote.hidden = !focus; if (focus) focusNote.textContent = 'Linhas ' + focus.from + '–' + focus.to + ': o trecho explicado no capítulo.';
    list.querySelectorAll('[data-cv-file]').forEach(b => b.setAttribute('aria-current', String(Number(b.dataset.cvFile) === i)));
    dialog.querySelector('[data-cv-select]').value = String(i);
    const target = focus ? codeEl.querySelector('[data-n="' + focus.from + '"]') : null;
    if (keepGaps) return;
    requestAnimationFrame(() => { codeEl.scrollTop = target ? Math.max(0, target.offsetTop - codeEl.clientHeight * .18) : 0; codeEl.scrollLeft = 0; const active = list.querySelector('[aria-current="true"]'); if (active) active.scrollIntoView({ block: 'nearest' }); });
  }
  function open(path, find, span) {
    if (!dialog) build();
    const i = Math.max(0, data.files.findIndex(f => f.path === path));
    document.querySelectorAll('dialog[open]').forEach(d => { if (d !== dialog) d.close(); });
    if (!dialog.open) { returnFocus = document.activeElement; dialog.showModal(); }
    show(i, find, span); codeEl.focus({ preventScroll: true });
  }
  function close() { if (dialog && dialog.open) dialog.close(); }
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-code]');
    if (!t || (dialog && dialog.contains(t))) return;
    e.preventDefault(); open(t.dataset.code, t.dataset.find, t.dataset.span);
  });
  // Colore os trechos estáticos dos capítulos (o texto já vem certo do build).
  function paintSnippets() {
    document.querySelectorAll('.code-snippet[data-path]').forEach(fig => {
      const codes = [...fig.querySelectorAll('.cs-line code')];
      const html = highlight(codes.map(c => c.textContent), fig.dataset.path);
      codes.forEach((c, k) => { c.innerHTML = html[k] || ' '; });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', paintSnippets); else paintSnippets();
  global.MarcoCode = { open, close, get isOpen() { return !!(dialog && dialog.open); } };
})(window);
