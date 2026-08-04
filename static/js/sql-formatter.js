// SQL Formatter widget — loads github.com/dimitri/sqlfmt's WASM build
// (vendored under /wasm/sqlfmt/, see that repo's README "WebAssembly build"
// section) and wires it to an app.taop.xyz-style editable/highlighted SQL
// editor. The Go program itself never returns (its wasm/main.go blocks in
// `select {}` after registering `globalThis.sqlfmt.format`), so `go.run()`
// is fire-and-forget, not awaited — the exported function is available as
// soon as `main()` has run past the js.Global().Set(...) call, which
// happens synchronously within `go.run()`'s own microtask, before control
// returns here.
(function () {
  'use strict';

  function escapeHtml(text) {
    var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text).replace(/[&<>"']/g, function (m) { return map[m]; });
  }

  // ── Tokenizer / SQL highlighter — ported verbatim from
  //    app.taop.xyz's public/js/sample-interactive.js (tokenize/highlightSQL),
  //    itself ported from TheArtOfPostgreSQL/src/query-ui, so a query here
  //    reads with the exact same syntax colors as the book/course site. ──
  function tokenize(code, pattern) {
    var out = '';
    var lastIndex = 0;
    var m;
    pattern.lastIndex = 0;
    while ((m = pattern.exec(code)) !== null) {
      out += escapeHtml(code.slice(lastIndex, m.index));
      var cls = Object.keys(m.groups).find(function (k) { return m.groups[k] !== undefined; });
      out += '<span class="tok-' + cls + '">' + escapeHtml(m[0]) + '</span>';
      lastIndex = m.index + m[0].length;
      if (m.index === pattern.lastIndex) pattern.lastIndex++;
    }
    out += escapeHtml(code.slice(lastIndex));
    return out;
  }

  var SQL_KEYWORDS =
    'select|from|where|join|left|right|inner|outer|full|cross|on|using|group|by|order|' +
    'having|limit|offset|insert|into|values|update|set|delete|create|table|temp|temporary|alter|drop|' +
    'with|recursive|as|and|or|not|null|is|in|exists|distinct|union|all|except|intersect|case|when|then|' +
    'else|end|asc|desc|returning|lateral|over|partition|window|filter|extract|cast|interval|between|' +
    'like|ilike|similar|true|false|primary|key|foreign|references|unique|check|default|constraint|' +
    'index|view|begin|commit|rollback|transaction|explain|analyze|vacuum|truncate';

  function highlightSQL(code) {
    var pattern = new RegExp(
      '(?<comment>--.*$|/\\*[\\s\\S]*?\\*/)' +
        "|(?<string>'(?:[^'\\\\]|''|\\\\.)*')" +
        '|(?<number>\\b\\d+\\.?\\d*\\b)' +
        '|(?<keyword>\\b(?:' + SQL_KEYWORDS + ')\\b)',
      'gmi'
    );
    return tokenize(code, pattern);
  }

  // ── Copy-to-clipboard — same pattern as app.taop.xyz's copyToClipboard/
  //    flashCopyButton: navigator.clipboard when available (needs a secure
  //    context), falling back to a hidden-textarea execCommand('copy'). ──
  function copyToClipboard(text, button) {
    var ok = true;
    function flash() {
      var original = button.innerHTML;
      button.innerHTML = ok ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-xmark"></i>';
      button.classList.add(ok ? 'copied' : 'copy-failed');
      button.disabled = true;
      setTimeout(function () {
        button.innerHTML = original;
        button.classList.remove('copied', 'copy-failed');
        button.disabled = false;
      }, 1200);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(flash, function () {
        ok = false;
        flash();
      });
      return;
    }
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      ok = document.execCommand('copy');
    } catch (e) {
      ok = false;
    }
    document.body.removeChild(ta);
    flash();
  }

  document.querySelectorAll('.sql-formatter').forEach(function (root) {
    var input = root.querySelector('.sql-formatter-input');
    var highlightCode = root.querySelector('.sql-formatter-highlight code');
    var highlightPre = root.querySelector('.sql-formatter-highlight');
    var button = root.querySelector('.sql-formatter-run');
    var copyButton = root.querySelector('.sql-formatter-copy-button');
    var errorEl = root.querySelector('.sql-formatter-error');
    var ready = false;

    function renderHighlight() {
      highlightCode.innerHTML = highlightSQL(input.value) + ' ';
    }
    renderHighlight();

    input.addEventListener('input', renderHighlight);
    input.addEventListener('scroll', function () {
      highlightPre.scrollTop = input.scrollTop;
      highlightPre.scrollLeft = input.scrollLeft;
    });

    copyButton.addEventListener('click', function () {
      copyToClipboard(input.value, copyButton);
    });

    function run() {
      if (!ready) return;
      var text = input.value;
      if (!text.trim()) {
        errorEl.textContent = 'Paste some SQL first.';
        return;
      }
      var res;
      try {
        res = window.sqlfmt.format(text);
      } catch (err) {
        errorEl.textContent = err.message || String(err);
        return;
      }
      if (res.error) {
        errorEl.textContent = res.error;
        return;
      }
      errorEl.textContent = '';
      input.value = res.output;
      renderHighlight();
    }

    button.addEventListener('click', run);
    input.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        run();
      }
    });

    function onReady() {
      ready = true;
      button.disabled = false;
      button.textContent = 'Format SQL';
    }

    function onLoadError(err) {
      button.textContent = 'Formatter failed to load';
      errorEl.textContent = 'Could not load the formatter: ' +
        (err && err.message ? err.message : String(err)) + '. Try reloading the page.';
    }

    var go = new Go();

    // Prefer the pre-compressed module (~130KB over the wire vs ~330KB
    // plain) via the standard Compression Streams API; fall back to the
    // plain .wasm for any browser without DecompressionStream support.
    var loadPromise;
    if (typeof DecompressionStream !== 'undefined') {
      loadPromise = fetch('/wasm/sqlfmt/sqlfmt.wasm.gz')
        .then(function (response) {
          if (!response.ok) throw new Error('HTTP ' + response.status);
          var stream = response.body.pipeThrough(new DecompressionStream('gzip'));
          return new Response(stream).arrayBuffer();
        })
        .then(function (bytes) {
          return WebAssembly.instantiate(bytes, go.importObject);
        });
    } else {
      loadPromise = fetch('/wasm/sqlfmt/sqlfmt.wasm').then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return WebAssembly.instantiateStreaming(response, go.importObject);
      });
    }

    loadPromise
      .then(function (result) {
        go.run(result.instance);
        onReady();
      })
      .catch(onLoadError);
  });
})();
