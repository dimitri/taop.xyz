// Explain Plan Visualizer — replaces the pev2-based embed (static/pev/,
// removed) with an in-house, dependency-free implementation.
//
// The parser below (parseExplainText → nodeTypeTokens/matchNodeType) is a
// faithful JS port of app.taop.xyz's internal/explainplan package (parse.go
// + nodetype.go), which itself parses psql's default TEXT-format EXPLAIN
// output. That package renders to TikZ for the printed book; this file
// ports its parsing logic only and adds its own SVG renderer, adapted from
// app.taop.xyz's public/js/sample-interactive.js (renderExplainDiagram),
// which draws its diagram from JSON-format EXPLAIN instead — this page
// only ever accepts pasted TEXT-format EXPLAIN output, so the two renderers
// read from differently-shaped trees even though they look alike.
(function () {
  'use strict';

  // ── Regexes (ported 1:1 from parse.go) ──────────────────────────────
  var costScanner = /\(cost=([0-9.]+)\.\.([0-9.]+) rows=(\d+) width=(\d+)\)/;
  var actualScanner = /\(actual time=[0-9.]+\.\.([0-9.]+) rows=(\d+) loops=(\d+)\)/;
  var planningTimeRE = /^Planning Time:\s*([0-9.]+)\s*ms/;
  var executionTimeRE = /^Execution Time:\s*([0-9.]+)\s*ms/;
  var arrowRE = /^(\s*)->\s+/;
  var separatorRE = /^\s*[═=─-]{5,}\s*$/;
  var rowsFooterRE = /^\(\d+ rows?\)/;

  // ── Node-type classification (ported 1:1 from nodetype.go) ──────────
  var joinVariantPrefixes = [
    { prefix: 'Nested Loop', typ: 'nested-loop' },
    { prefix: 'Merge', typ: 'merge-join' },
    { prefix: 'Hash', typ: 'hash-join' },
  ];
  var joinVariantInfixes = [' Left', ' Right', ' Full', ' Semi', ' Anti'];

  var nodeTypeTokens = [
    { token: 'Index Only Scan Backward', typ: 'index-only-scan' },
    { token: 'Index Only Scan', typ: 'index-only-scan' },
    { token: 'Index Scan Backward', typ: 'index-scan' },
    { token: 'Index Scan', typ: 'index-scan' },
    { token: 'Bitmap Heap Scan', typ: 'bitmap-heap-scan' },
    { token: 'Bitmap Index Scan', typ: 'bitmap-index-scan' },
    { token: 'Tid Range Scan', typ: 'tid-range-scan' },
    { token: 'Tid Scan', typ: 'tid-scan' },
    { token: 'Sample Scan', typ: 'sample-scan' },
    { token: 'Function Scan', typ: 'function-scan' },
    { token: 'Table Function Scan', typ: 'table-function-scan' },
    { token: 'Values Scan', typ: 'values-scan' },
    { token: 'Foreign Scan', typ: 'foreign-scan' },
    { token: 'Subquery Scan', typ: 'subquery-scan' },
    { token: 'CTE Scan', typ: 'cte-scan' },
    { token: 'WorkTable Scan', typ: 'worktable-scan' },
    { token: 'Named Tuplestore Scan', typ: 'named-tuplestore-scan' },
    { token: 'Custom Scan', typ: 'custom-scan' },
    { token: 'Seq Scan', typ: 'seq-scan' },

    { token: 'Hash Aggregate', typ: 'hash-aggregate' },
    { token: 'HashAggregate', typ: 'hash-aggregate' },
    { token: 'Group Aggregate', typ: 'group-aggregate' },
    { token: 'GroupAggregate', typ: 'group-aggregate' },
    { token: 'Mixed Aggregate', typ: 'mixed-aggregate' },
    { token: 'MixedAggregate', typ: 'mixed-aggregate' },
    { token: 'Aggregate', typ: 'aggregate' },
    { token: 'Window Agg', typ: 'window-agg' },
    { token: 'WindowAgg', typ: 'window-agg' },
    { token: 'Group', typ: 'group' },

    { token: 'Incremental Sort', typ: 'incremental-sort' },
    { token: 'Sort', typ: 'sort' },
    { token: 'Unique', typ: 'unique' },
    { token: 'Merge Append', typ: 'merge-append' },
    { token: 'Append', typ: 'append' },
    { token: 'Materialize', typ: 'materialize' },
    { token: 'Material', typ: 'materialize' },
    { token: 'Memoize', typ: 'memoize' },
    { token: 'Limit', typ: 'limit' },
    { token: 'Lock Rows', typ: 'lock-rows' },
    { token: 'LockRows', typ: 'lock-rows' },
    { token: 'Set Op', typ: 'set-op' },
    { token: 'SetOp', typ: 'set-op' },
    { token: 'Result', typ: 'result' },
    { token: 'Gather Merge', typ: 'gather-merge' },
    { token: 'GatherMerge', typ: 'gather-merge' },
    { token: 'Gather', typ: 'gather' },
    { token: 'Recursive Union', typ: 'recursive-union' },
    { token: 'Project Set', typ: 'project-set' },
    { token: 'ProjectSet', typ: 'project-set' },

    { token: 'ModifyTable', typ: 'modify-table' },
    { token: 'Update', typ: 'update' },
    { token: 'Insert', typ: 'insert' },
    { token: 'Delete', typ: 'delete' },

    { token: 'Hash', typ: 'hash' },
  ];

  var nodeStyleMap = {
    limit: 'ctrl', sort: 'ctrl', 'incremental-sort': 'ctrl',
    unique: 'ctrl', append: 'ctrl', 'merge-append': 'ctrl',
    materialize: 'ctrl', memoize: 'ctrl', 'lock-rows': 'ctrl',
    'set-op': 'ctrl', result: 'ctrl', gather: 'ctrl',
    'gather-merge': 'ctrl', 'recursive-union': 'ctrl', 'cte-scan': 'ctrl',
    'worktable-scan': 'ctrl', 'project-set': 'ctrl', 'modify-table': 'ctrl',
    update: 'ctrl', insert: 'ctrl', delete: 'ctrl', group: 'ctrl',

    'hash-aggregate': 'agg', 'group-aggregate': 'agg', 'mixed-aggregate': 'agg',
    aggregate: 'agg', 'window-agg': 'agg',

    'hash-join': 'jnode', 'nested-loop': 'jnode', 'merge-join': 'jnode',

    'seq-scan': 'scan', 'index-scan': 'scan', 'index-only-scan': 'scan',
    'bitmap-heap-scan': 'scan', 'bitmap-index-scan': 'scan', 'tid-scan': 'scan',
    'tid-range-scan': 'scan', 'sample-scan': 'scan', 'function-scan': 'scan',
    'table-function-scan': 'scan', 'values-scan': 'scan', 'foreign-scan': 'scan',
    'subquery-scan': 'scan', 'named-tuplestore-scan': 'scan', 'custom-scan': 'scan',

    hash: 'build',
  };

  var typeLabelMap = {
    'index-only-scan': 'Index Only Scan', 'index-scan': 'Index Scan',
    'bitmap-heap-scan': 'Bitmap Heap Scan', 'bitmap-index-scan': 'Bitmap Index Scan',
    'tid-range-scan': 'Tid Range Scan', 'tid-scan': 'Tid Scan',
    'sample-scan': 'Sample Scan', 'function-scan': 'Function Scan',
    'table-function-scan': 'Table Function Scan', 'values-scan': 'Values Scan',
    'foreign-scan': 'Foreign Scan', 'subquery-scan': 'Subquery Scan',
    'cte-scan': 'CTE Scan', 'worktable-scan': 'WorkTable Scan',
    'named-tuplestore-scan': 'Named Tuplestore Scan', 'custom-scan': 'Custom Scan',
    'seq-scan': 'Seq Scan',
    'hash-aggregate': 'Hash Aggregate', 'group-aggregate': 'Group Aggregate',
    'mixed-aggregate': 'Mixed Aggregate', aggregate: 'Aggregate',
    'window-agg': 'Window Agg', group: 'Group',
    'incremental-sort': 'Incremental Sort', sort: 'Sort', unique: 'Unique',
    'merge-append': 'Merge Append', append: 'Append', materialize: 'Materialize',
    memoize: 'Memoize', limit: 'Limit', 'lock-rows': 'Lock Rows',
    'set-op': 'Set Op', result: 'Result', 'gather-merge': 'Gather Merge',
    gather: 'Gather', 'recursive-union': 'Recursive Union',
    'project-set': 'Project Set', 'modify-table': 'ModifyTable',
    update: 'Update', insert: 'Insert', delete: 'Delete',
    hash: 'Hash', 'hash-join': 'Hash Join', 'nested-loop': 'Nested Loop',
    'merge-join': 'Merge Join', unknown: 'Node',
  };

  function nodeStyle(typ) {
    return nodeStyleMap[typ] || 'ctrl';
  }

  function nodeLabel(node) {
    if (node.label) return node.label;
    return typeLabelMap[node.type] || 'Node';
  }

  function isWordBoundary(c) {
    return c === ' ' || c === '(' || c === '\n' || c === '\t';
  }

  function matchJoinVariant(text) {
    for (var i = 0; i < joinVariantPrefixes.length; i++) {
      var jv = joinVariantPrefixes[i];
      if (text.indexOf(jv.prefix) !== 0) continue;
      var rest = text.slice(jv.prefix.length);
      var matched = jv.prefix;
      for (;;) {
        var advanced = false;
        for (var j = 0; j < joinVariantInfixes.length; j++) {
          var infix = joinVariantInfixes[j];
          if (rest.indexOf(infix) === 0) {
            matched += infix;
            rest = rest.slice(infix.length);
            advanced = true;
            break;
          }
        }
        if (!advanced) break;
      }
      if (rest.indexOf(' Join') === 0) {
        matched += ' Join';
        rest = rest.slice(' Join'.length);
        var label = matched;
        if (label === jv.prefix + ' Join') label = '';
        return { typ: jv.typ, label: label, remainder: rest.trim(), ok: true };
      }
    }
    return { ok: false };
  }

  function matchNodeType(text) {
    var prefixes = ['Parallel ', 'Partial ', 'Finalize '];
    for (var i = 0; i < prefixes.length; i++) {
      var p = prefixes[i];
      if (text.indexOf(p) === 0) {
        var inner = matchNodeType(text.slice(p.length));
        return { typ: inner.typ, prefix: p.trim(), label: inner.label, remainder: inner.remainder };
      }
    }

    var jv = matchJoinVariant(text);
    if (jv.ok) return { typ: jv.typ, prefix: '', label: jv.label, remainder: jv.remainder };

    for (var k = 0; k < nodeTypeTokens.length; k++) {
      var tok = nodeTypeTokens[k];
      if (text.indexOf(tok.token) === 0) {
        var after = text.slice(tok.token.length);
        if (after === '' || isWordBoundary(after[0])) {
          return { typ: tok.typ, prefix: '', label: '', remainder: after.trim() };
        }
      }
    }
    return { typ: 'unknown', prefix: '', label: '', remainder: text };
  }

  function parseRelationAndAlias(s) {
    s = s.trim();
    var idx = s.indexOf(' on ');
    if (idx >= 0) {
      s = s.slice(idx + 4);
    } else if (s.indexOf('on ') !== 0) {
      return { relation: '', alias: '' };
    } else {
      s = s.slice(3);
    }
    var fields = s.split(/\s+/).filter(Boolean);
    if (!fields.length) return { relation: '', alias: '' };
    var relation = fields[0];
    var alias = fields.length > 1 && fields[1] !== relation ? fields[1] : '';
    return { relation: relation, alias: alias };
  }

  function parseNodeLine(text) {
    var node = {
      type: 'unknown', prefix: '', label: '', relation: '', alias: '',
      costStart: null, costEnd: null, rowsEstimate: null, rowsActual: null,
      timeActual: null, loops: null, props: [], children: [],
    };

    var rest = text;
    var cm = costScanner.exec(rest);
    if (cm) {
      node.costStart = parseFloat(cm[1]);
      node.costEnd = parseFloat(cm[2]);
      node.rowsEstimate = parseInt(cm[3], 10);
      rest = rest.slice(0, rest.indexOf(cm[0]));
    }
    var am = actualScanner.exec(text);
    if (am) {
      node.timeActual = parseFloat(am[1]);
      node.rowsActual = parseInt(am[2], 10);
      node.loops = parseInt(am[3], 10);
    }

    rest = rest.trim();
    var m = matchNodeType(rest);
    node.type = m.typ;
    node.prefix = m.prefix;
    node.label = m.label;
    if (m.remainder) {
      var ra = parseRelationAndAlias(m.remainder);
      node.relation = ra.relation;
      node.alias = ra.alias;
    }
    return node;
  }

  // extractPlanLines mirrors the Go version: start collecting at the first
  // "(cost=" line (skipping the "QUERY PLAN" header and its separator),
  // strip one leading space from every collected line, stop at the first
  // footer line.
  function extractPlanLines(out) {
    var result = [];
    var collecting = false;
    var rawLines = out.split('\n');
    for (var i = 0; i < rawLines.length; i++) {
      var line = rawLines[i];
      if (line.indexOf(' ') === 0) line = line.slice(1);
      var trimmed = line.trim();

      if (!collecting) {
        if (line.indexOf('(cost=') !== -1) {
          collecting = true;
        } else {
          continue;
        }
      }

      if (trimmed === 'Planning:' || rowsFooterRE.test(trimmed)) break;
      if (planningTimeRE.test(trimmed) || executionTimeRE.test(trimmed)) {
        result.push(line);
        continue;
      }
      if (separatorRE.test(line)) continue;
      result.push(line);
    }
    return result;
  }

  function hasPlan(text) {
    return text.indexOf('QUERY PLAN') !== -1 || text.indexOf('(cost=') !== -1;
  }

  // parseExplainText parses psql's default TEXT-format EXPLAIN output into
  // { root, planningTime, executionTime } or throws an Error with a
  // human-readable message on failure.
  function parseExplainText(out) {
    var lines = extractPlanLines(out);
    if (!lines.length) {
      throw new Error('No plan lines found — paste the full output of EXPLAIN or EXPLAIN ANALYZE.');
    }

    var plan = { root: null, planningTime: null, executionTime: null };
    var stack = []; // [{depth, node}]

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var trimmedLine = line.trim();

      var pm = planningTimeRE.exec(trimmedLine);
      if (pm) { plan.planningTime = parseFloat(pm[1]); continue; }
      var em = executionTimeRE.exec(trimmedLine);
      if (em) { plan.executionTime = parseFloat(em[1]); continue; }

      var am = arrowRE.exec(line);
      if (am) {
        var arrowCol = am[1].length;
        var depth = Math.floor((arrowCol + 4) / 6);
        var text = line.slice(am[0].length).trim();
        var node = parseNodeLine(text);

        while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
          stack.pop();
        }
        if (stack.length === 0) {
          plan.root = node;
        } else {
          stack[stack.length - 1].node.children.push(node);
        }
        stack.push({ depth: depth, node: node });
        continue;
      }

      if (trimmedLine === '') continue;

      if (stack.length === 0 && !plan.root) {
        plan.root = parseNodeLine(trimmedLine);
        stack.push({ depth: 0, node: plan.root });
        continue;
      }

      if (stack.length > 0) {
        stack[stack.length - 1].node.props.push(trimmedLine);
      }
    }

    if (!plan.root) {
      throw new Error('Could not find a root plan node in the pasted text.');
    }
    return plan;
  }

  // ── Rendering — light theme matching the book's own TikZ plan-tree
  //    figures (fig-plan-tree.svg: pale fills, dark text/borders, one hue
  //    per node family), not app.taop.xyz's dark-panel sample-interactive.js
  //    this was originally adapted from. ──
  var STYLE_COLORS = {
    scan: { stroke: '#2f9e8f', fill: '#e3f5f1', text: '#1c5f56' },
    jnode: { stroke: '#8a63d2', fill: '#efe9fb', text: '#4a2f85' },
    agg: { stroke: '#3ba0c9', fill: '#e6f4fa', text: '#1f5a76' },
    build: { stroke: '#c99a2e', fill: '#faf3df', text: '#7a5c14' },
    ctrl: { stroke: '#896da1', fill: '#f3eef8', text: '#372649' },
  };

  function escapeHtml(text) {
    var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text).replace(/[&<>"']/g, function (m) { return map[m]; });
  }

  function edgeWidth(rows) {
    if (!rows || rows <= 0) return 1;
    return Math.min(8, 1 + Math.log10(rows + 1));
  }

  function layoutPlanTree(root) {
    var SLOT_WIDTH = 220, ROW_HEIGHT = 116;
    var nodes = [];
    var edges = [];
    var nextSlot = 0;
    function visit(node, depth) {
      var children = node.children || [];
      var childLayouts = children.map(function (c) { return visit(c, depth + 1); });
      var x;
      if (!childLayouts.length) {
        x = nextSlot * SLOT_WIDTH;
        nextSlot++;
      } else {
        var xs = childLayouts.map(function (c) { return c.x; });
        x = (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2;
      }
      var laidOut = { node: node, x: x, y: depth * ROW_HEIGHT };
      nodes.push(laidOut);
      childLayouts.forEach(function (c) { edges.push({ from: laidOut, to: c }); });
      return laidOut;
    }
    visit(root, 0);
    return { nodes: nodes, edges: edges };
  }

  function renderDiagram(plan) {
    var root = plan.root;
    var NODE_WIDTH = 210, NODE_HEIGHT = 92;
    var laid = layoutPlanTree(root);
    var nodes = laid.nodes, edges = laid.edges;
    var xs = nodes.map(function (n) { return n.x; });
    var ys = nodes.map(function (n) { return n.y; });
    var minX = Math.min.apply(null, xs);
    var maxX = Math.max.apply(null, xs) + NODE_WIDTH;
    var maxY = Math.max.apply(null, ys) + NODE_HEIGHT;
    var vbWidth = maxX - minX + 40;
    var vbHeight = maxY + 40;

    var svg = '<svg viewBox="' + (minX - 20) + ' -20 ' + vbWidth + ' ' + vbHeight + '" width="' + vbWidth + '" height="' +
      vbHeight + '" xmlns="http://www.w3.org/2000/svg" font-family="JetBrains Mono, monospace" font-size="11">';

    edges.forEach(function (e) {
      var x1 = e.from.x + NODE_WIDTH / 2, y1 = e.from.y;
      var x2 = e.to.x + NODE_WIDTH / 2, y2 = e.to.y + NODE_HEIGHT;
      var midY = (y1 + y2) / 2;
      var w = edgeWidth(e.to.node.rowsActual != null ? e.to.node.rowsActual : e.to.node.rowsEstimate);
      svg += '<path d="M ' + x2 + ' ' + y2 + ' L ' + x2 + ' ' + midY + ' L ' + x1 + ' ' + midY + ' L ' + x1 + ' ' + y1 +
        '" fill="none" stroke="#c3b8d9" stroke-width="' + w + '" />';
    });

    nodes.forEach(function (laidNode) {
      var node = laidNode.node, x = laidNode.x, y = laidNode.y;
      var colors = STYLE_COLORS[nodeStyle(node.type)];
      var label = (node.prefix ? node.prefix + ' ' : '') + nodeLabel(node);
      var relText = node.relation ? (node.alias ? node.relation + ' (' + node.alias + ')' : node.relation) : '';
      var cost = node.costStart != null ? 'cost=' + node.costStart.toFixed(2) + '..' + node.costEnd.toFixed(2) : '';
      var actual = node.timeActual != null ? node.timeActual.toFixed(2) + 'ms, ' + node.rowsActual + ' rows' : '';
      var tooltip = [label, relText, cost, actual].concat(node.props || []).filter(Boolean).join('\n');

      svg += '<g><title>' + escapeHtml(tooltip) + '</title>' +
        '<rect x="' + x + '" y="' + y + '" width="' + NODE_WIDTH + '" height="' + NODE_HEIGHT + '" rx="6" fill="' +
        colors.fill + '" stroke="' + colors.stroke + '" stroke-width="1.5" />' +
        '<text x="' + (x + 8) + '" y="' + (y + 16) + '" fill="' + colors.text + '" font-weight="bold">' + escapeHtml(label) + '</text>';
      if (relText) {
        svg += '<text x="' + (x + 8) + '" y="' + (y + 32) + '" fill="#67527a" font-style="italic">' + escapeHtml(relText) + '</text>';
      }
      if (cost) {
        svg += '<text x="' + (x + 8) + '" y="' + (y + 48) + '" fill="#896da1" font-size="10">' + escapeHtml(cost) + '</text>';
      }
      if (actual) {
        svg += '<text x="' + (x + 8) + '" y="' + (y + 64) + '" fill="#b5780a" font-size="10">' + escapeHtml(actual) + '</text>';
      }
      if (node.props && node.props.length) {
        svg += '<text x="' + (x + 8) + '" y="' + (y + 80) + '" fill="#a89bc2" font-size="9">' + escapeHtml(node.props[0]) + '</text>';
      }
      svg += '</g>';
    });
    svg += '</svg>';

    var timing = '';
    if (plan.planningTime != null || plan.executionTime != null) {
      timing = (plan.planningTime != null ? 'Planning: ' + plan.planningTime.toFixed(2) + 'ms' : '') +
        (plan.planningTime != null && plan.executionTime != null ? ' &middot; ' : '') +
        (plan.executionTime != null ? 'Execution: ' + plan.executionTime.toFixed(2) + 'ms' : '');
    }
    var header = '<div class="explain-diagram-header">' +
      '<span>' + timing + '</span>' +
      '<span class="explain-diagram-zoom-controls">' +
        '<button type="button" class="explain-diagram-zoom-out" title="Zoom out">&minus;</button>' +
        '<button type="button" class="explain-diagram-zoom-reset" title="Reset zoom">Reset</button>' +
        '<button type="button" class="explain-diagram-zoom-in" title="Zoom in">+</button>' +
        '<button type="button" class="explain-diagram-fullscreen" title="Full screen">&#9974;</button>' +
        '<span class="explain-diagram-zoom-hint">scroll or pinch to zoom, drag to pan, hover a node for details</span>' +
      '</span>' +
      '</div>';
    return '<div class="explain-diagram">' + header + '<div class="explain-diagram-canvas">' + svg + '</div></div>';
  }

  // ── Zoom/pan: plain mouse-wheel zooms (centered on the cursor), no
  //    Ctrl/Cmd modifier required, since the canvas is a bounded box, not
  //    the page itself — drag pans, dblclick resets. Also exposes +/-/
  //    reset/fullscreen buttons for touch/trackpad users without wheel
  //    support. Fullscreen reuses this same zoom/pan state instead of a
  //    separate implementation — see openFullscreen below. ──
  function initDiagramZoom(root) {
    var canvas = root.querySelector('.explain-diagram-canvas');
    var svg = canvas && canvas.querySelector('svg');
    if (!canvas || !svg) return;

    var MIN_SCALE = 0.2, MAX_SCALE = 6;
    var scale = 1, tx = 0, ty = 0;

    var vbWidth = parseFloat(svg.getAttribute('width'));
    var vbHeight = parseFloat(svg.getAttribute('height'));
    svg.style.transformOrigin = '0 0';

    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

    function apply() {
      svg.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
    }

    function zoomAt(offsetX, offsetY, factor) {
      var contentX = (offsetX - tx) / scale;
      var contentY = (offsetY - ty) / scale;
      scale = clamp(scale * factor, MIN_SCALE, MAX_SCALE);
      tx = offsetX - contentX * scale;
      ty = offsetY - contentY * scale;
      apply();
    }

    // Fit-to-width — called on first render, on Reset/dblclick, and again
    // whenever the canvas itself is resized (entering/leaving fullscreen),
    // so the whole plan is always visible without any interaction first
    // instead of opening at native (often wider-than-the-box) size.
    function fitToWidth() {
      var canvasWidth = canvas.clientWidth || 860;
      scale = clamp(Math.min(1, (canvasWidth - 24) / vbWidth), MIN_SCALE, MAX_SCALE);
      tx = Math.max(12, (canvasWidth - vbWidth * scale) / 2);
      ty = 12;
      apply();
    }
    fitToWidth();

    canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      var rect = canvas.getBoundingClientRect();
      var factor = Math.pow(1.0015, -e.deltaY);
      zoomAt(e.clientX - rect.left, e.clientY - rect.top, factor);
    }, { passive: false });

    var dragging = false, dragStartX = 0, dragStartY = 0, startTx = 0, startTy = 0;
    canvas.addEventListener('mousedown', function (e) {
      dragging = true;
      dragStartX = e.clientX; dragStartY = e.clientY;
      startTx = tx; startTy = ty;
      canvas.classList.add('explain-diagram-dragging');
    });
    window.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      tx = startTx + (e.clientX - dragStartX);
      ty = startTy + (e.clientY - dragStartY);
      apply();
    });
    window.addEventListener('mouseup', function () {
      dragging = false;
      canvas.classList.remove('explain-diagram-dragging');
    });

    canvas.addEventListener('dblclick', fitToWidth);
    root.querySelector('.explain-diagram-zoom-in').addEventListener('click', function () {
      zoomAt(canvas.clientWidth / 2, canvas.clientHeight / 2, 1.3);
    });
    root.querySelector('.explain-diagram-zoom-out').addEventListener('click', function () {
      zoomAt(canvas.clientWidth / 2, canvas.clientHeight / 2, 1 / 1.3);
    });
    root.querySelector('.explain-diagram-zoom-reset').addEventListener('click', fitToWidth);

    // ── Fullscreen — moves the live canvas node (with all the listeners
    //    above still attached) into a shared full-viewport overlay, the
    //    same "one overlay, move the content in and out" pattern
    //    app.taop.xyz's figure-zoom.js uses for book/course figures. ──
    var placeholder = document.createComment('explain-diagram-canvas-slot');
    canvas.parentNode.insertBefore(placeholder, canvas);
    var overlay = null;
    var isFullscreen = false;

    function ensureOverlay() {
      if (overlay) return overlay;
      overlay = document.createElement('div');
      overlay.className = 'explain-diagram-fullscreen-overlay';
      overlay.innerHTML =
        '<button type="button" class="explain-diagram-fullscreen-close" aria-label="Close">&times;</button>' +
        '<div class="explain-diagram-fullscreen-stage"></div>' +
        '<p class="explain-diagram-fullscreen-hint">Scroll to zoom &middot; drag to pan &middot; Esc to close</p>';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay || e.target.classList.contains('explain-diagram-fullscreen-close')) closeFullscreen();
      });
      return overlay;
    }

    function openFullscreen() {
      ensureOverlay().querySelector('.explain-diagram-fullscreen-stage').appendChild(canvas);
      overlay.classList.add('explain-diagram-fullscreen-open');
      document.body.style.overflow = 'hidden';
      isFullscreen = true;
      fitToWidth();
    }

    function closeFullscreen() {
      if (!isFullscreen) return;
      placeholder.parentNode.insertBefore(canvas, placeholder);
      overlay.classList.remove('explain-diagram-fullscreen-open');
      document.body.style.overflow = '';
      isFullscreen = false;
      fitToWidth();
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isFullscreen) closeFullscreen();
    });
    root.querySelector('.explain-diagram-fullscreen').addEventListener('click', function () {
      if (isFullscreen) closeFullscreen(); else openFullscreen();
    });
  }

  // ── DOM wiring (browser only — guarded so this file can also be
  //    loaded under Node for testing the parser/renderer in isolation) ──
  if (typeof document !== 'undefined') {
    document.querySelectorAll('.explain-visualizer').forEach(function (root) {
      var input = root.querySelector('.explain-visualizer-input');
      var button = root.querySelector('.explain-visualizer-run');
      var output = root.querySelector('.explain-visualizer-output');

      function run() {
        var text = input.value;
        if (!text.trim()) {
          output.innerHTML = '<p class="explain-visualizer-error">Paste an EXPLAIN plan first.</p>';
          return;
        }
        if (!hasPlan(text)) {
          output.innerHTML = '<p class="explain-visualizer-error">That doesn\'t look like EXPLAIN output — expecting text containing "(cost=..." lines, the plain output of <code>EXPLAIN</code> or <code>EXPLAIN ANALYZE</code> (not FORMAT JSON).</p>';
          return;
        }
        try {
          var plan = parseExplainText(text);
          output.innerHTML = renderDiagram(plan);
          initDiagramZoom(output);
        } catch (err) {
          output.innerHTML = '<p class="explain-visualizer-error">' + escapeHtml(err.message) + '</p>';
        }
      }

      button.addEventListener('click', run);
      input.addEventListener('keydown', function (e) {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') run();
      });
    });
  }

  // Public API for other scripts on the same page (e.g. the PGlite
  // "Explain" button on YeSQL lessons, yesql/pglite.html) to reuse this
  // exact parser/renderer instead of a second implementation — the
  // .explain-visualizer wiring above is this page's own consumer, this
  // is everyone else's.
  if (typeof window !== 'undefined') {
    window.taopExplainVisualizer = {
      parseExplainText: parseExplainText,
      renderDiagram: renderDiagram,
      initDiagramZoom: initDiagramZoom,
      hasPlan: hasPlan
    };
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { parseExplainText: parseExplainText, renderDiagram: renderDiagram, hasPlan: hasPlan };
  }
})();
