/* ==========================================================================
   baileyes/eyes — Design Patterns UI · единый файл
   --------------------------------------------------------------------------
   Часть 1: ЯДРО (роутинг, темы, поиск, терминал, подсветка, UML-хелперы)
   Часть 2: все 13 паттернов (Strategy, State, Chains, Adapter, Bridge,
            Decorator, Facade, Factory, Circuit-breaker, ExceptionHandler,
            Logger-starter, Kafka-starter, api-composition)
   ========================================================================== */

/* =========================================================================
   ЧАСТЬ 1. ЯДРО
   ========================================================================= */
(function (global) {
    'use strict';

    /* ----- Утилиты ----- */
    function esc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function pad(n, w) { w = w || 2; return String(n).padStart(w, '0'); }
    function uuid() {
        if (global.crypto && typeof global.crypto.randomUUID === 'function') return global.crypto.randomUUID();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    function hashCode(str) {
        var h = 0, i;
        for (i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
        return Math.abs(h);
    }
    function stamp(d) {
        d = d || new Date();
        return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) + '.' + pad(d.getMilliseconds(), 3);
    }

    /* ----- Жизненный цикл таймеров (чтобы демо не писали в удалённый DOM) ----- */
    var _timers = [], _rafs = [], _cleanups = [];
    function later(ms, fn) { var id = setTimeout(function () { drop(_timers, id); fn(); }, ms); _timers.push(id); return id; }
    function every(ms, fn) { var id = setInterval(fn, ms); _timers.push(id); return id; }
    function frame(fn) { var id = requestAnimationFrame(fn); _rafs.push(id); return id; }
    function cancel(id) { clearTimeout(id); clearInterval(id); cancelAnimationFrame(id); drop(_timers, id); drop(_rafs, id); }
    function onLeave(fn) { _cleanups.push(fn); }
    function drop(arr, v) { var i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); }
    function teardown() {
        _timers.forEach(function (id) { clearTimeout(id); clearInterval(id); });
        _rafs.forEach(function (id) { cancelAnimationFrame(id); });
        _timers.length = 0; _rafs.length = 0;
        while (_cleanups.length) { try { _cleanups.pop()(); } catch (e) { /* */ } }
    }

    /* ----- Терминал ----- */
    function createTerminal(title, opts) {
        opts = opts || {};
        var wrap = document.createElement('div');
        wrap.className = 'term';
        wrap.innerHTML =
            '<div class="term-bar">' +
            '<span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>' +
            '<span class="term-title">' + esc(title || 'application console') + '</span>' +
            '<button class="term-clear" type="button" aria-label="Очистить лог">clear</button>' +
            '</div><div class="term-body" role="log" aria-live="polite" tabindex="0"></div>';
        var body = wrap.querySelector('.term-body');
        var empty = document.createElement('div');
        empty.className = 'term-empty'; empty.textContent = '// лог пуст — запустите демо';
        body.appendChild(empty);
        wrap.querySelector('.term-clear').addEventListener('click', clear);

        function clear() {
            body.innerHTML = '';
            var e = document.createElement('div'); e.className = 'term-empty'; e.textContent = '// лог очищен';
            body.appendChild(e);
        }
        function append(html, levelClass) {
            if (empty && empty.parentNode) { body.innerHTML = ''; empty = null; }
            var line = document.createElement('div');
            line.className = 'term-line' + (levelClass ? ' ' + levelClass : '');
            line.innerHTML = html; body.appendChild(line);
            var near = body.scrollHeight - body.scrollTop - body.clientHeight < 90;
            if (near || opts.forceScroll) body.scrollTop = body.scrollHeight;
            if (opts.maxLines && body.children.length > opts.maxLines) body.removeChild(body.firstChild);
            return line;
        }
        function log(msg, level, logger) {
            level = level || 'INFO';
            var head = '<span class="ts">' + stamp() + '</span> <span class="lv lv-' + level + '">' + level.padEnd(5, ' ') + '</span> ';
            if (logger) head += '<span class="lg">' + esc(logger).padEnd(22, ' ') + '</span>: ';
            return append(head + msg, 'l-' + level);
        }
        return {
            node: wrap, body: body, log: log, clear: clear,
            info: function (m, lg) { return log(m, 'INFO', lg); },
            warn: function (m, lg) { return log(m, 'WARN', lg); },
            error: function (m, lg) { return log(m, 'ERROR', lg); },
            debug: function (m, lg) { return log(m, 'DEBUG', lg); },
            ok: function (m, lg) { return log(m, 'OK', lg); },
            raw: function (html, cls) { return append(html, cls); }
        };
    }

    /* ----- Подсветка Java ----- */
    var JAVA_KEYWORDS = ('abstract assert boolean break byte case catch char class const continue default do double ' +
        'else enum extends final finally float for goto if implements import instanceof int interface long native new ' +
        'package private protected public return short static strictfp super switch synchronized this throw throws ' +
        'transient try var void volatile while record sealed permits yield').split(' ');
    var KW_SET = {}; JAVA_KEYWORDS.forEach(function (k) { KW_SET[k] = 1; });
    var TOKEN_RE = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|("(?:\\.|[^"\\])*")|(@[A-Za-z_][\w.]*)|\b(\d[\d_]*(?:\.\d+)?[LlFfDd]?)\b|\b([A-Za-z_$][\w$]*)\b/g;

    function hlJava(src) {
        var out = '', last = 0, m;
        TOKEN_RE.lastIndex = 0;
        while ((m = TOKEN_RE.exec(src)) !== null) {
            out += esc(src.slice(last, m.index));
            if (m[1] != null) out += '<span class="tok-com">' + esc(m[1]) + '</span>';
            else if (m[2] != null) out += '<span class="tok-str">' + esc(m[2]) + '</span>';
            else if (m[3] != null) out += '<span class="tok-ann">' + esc(m[3]) + '</span>';
            else if (m[4] != null) out += '<span class="tok-num">' + esc(m[4]) + '</span>';
            else {
                var w = m[5];
                if (KW_SET[w]) out += '<span class="tok-kw">' + w + '</span>';
                else if (/^[A-Z]/.test(w)) out += '<span class="tok-cls">' + w + '</span>';
                else out += esc(w);
            }
            last = TOKEN_RE.lastIndex;
        }
        return out + esc(src.slice(last));
    }
    function hlJson(src) {
        return esc(src)
            .replace(/&quot;([^&]*?)&quot;(\s*:)/g, '<span class="j-key">&quot;$1&quot;</span>$2')
            .replace(/:\s*&quot;([\s\S]*?)&quot;/g, ': <span class="j-str">&quot;$1&quot;</span>')
            .replace(/\b(true|false)\b/g, '<span class="j-bool">$1</span>')
            .replace(/\bnull\b/g, '<span class="j-null">null</span>')
            .replace(/:\s*(-?\d+(?:\.\d+)?)/g, ': <span class="j-num">$1</span>');
    }

    /* ----- UML-хелперы ----- */
    var umlSeq = 0;
    function Uml(w, h) { this.w = w; this.h = h; this.n = ++umlSeq; this.body = ''; }
    Uml.prototype.box = function (x, y, w, title, stereo, rows, kind) {
        var headH = stereo ? 32 : 22, rowH = 15;
        var h = headH + (rows && rows.length ? rows.length * rowH + 6 : 6);
        var cls = 'uml-box' + (kind ? ' ' + kind : '');
        var s = '<g><rect class="' + cls + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="5"/>';
        if (stereo) s += '<text class="uml-stereo" x="' + (x + w / 2) + '" y="' + (y + 13) + '" text-anchor="middle">' + esc(stereo) + '</text>';
        s += '<text class="uml-title' + (/interface|abstract/.test(stereo || '') ? ' i' : '') + '" x="' + (x + w / 2) + '" y="' + (y + (stereo ? 26 : 15)) + '" text-anchor="middle">' + esc(title) + '</text>';
        s += '<line class="uml-edge" x1="' + x + '" y1="' + (y + headH) + '" x2="' + (x + w) + '" y2="' + (y + headH) + '"/>';
        (rows || []).forEach(function (r, i) {
            s += '<text class="uml-row" x="' + (x + 9) + '" y="' + (y + headH + 12 + i * rowH) + '">' + esc(r) + '</text>';
        });
        this.body += s + '</g>';
        return { x: x, y: y, w: w, h: h, cx: x + w / 2, cy: y + h / 2 };
    };
    Uml.prototype.arrow = function (x1, y1, x2, y2, kind, label, lblDx, lblDy) {
        kind = kind || 'assoc';
        var n = this.n, dashed = (kind === 'impl' || kind === 'dep') ? ' dashed' : '';
        var spring = kind === 'spring' ? ' spring' : '';
        if (kind === 'spring') dashed = ' dashed';
        var markerEnd = '', markerStart = '';
        if (kind === 'impl' || kind === 'ext') markerEnd = ' marker-end="url(#' + n + '-tri)"';
        else if (kind === 'dep' || kind === 'assoc' || kind === 'spring') markerEnd = ' marker-end="url(#' + n + '-arr)"';
        if (kind === 'agg') markerStart = ' marker-start="url(#' + n + '-agg)"';
        if (kind === 'comp') markerStart = ' marker-start="url(#' + n + '-comp)"';
        var dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy) || 1;
        var ux = dx / len, uy = dy / len;
        var sx = x1 + ux * 2, sy = y1 + uy * 2, ex = x2 - ux * 3, ey = y2 - uy * 3;
        var s = '<line class="uml-edge' + dashed + spring + '" x1="' + sx.toFixed(1) + '" y1="' + sy.toFixed(1) +
            '" x2="' + ex.toFixed(1) + '" y2="' + ey.toFixed(1) + '"' + markerStart + markerEnd + '/>';
        if (label) s += '<text class="uml-lbl" x="' + ((sx + ex) / 2 + (lblDx || 0)).toFixed(1) + '" y="' + ((sy + ey) / 2 + (lblDy || -5)).toFixed(1) + '" text-anchor="middle">' + esc(label) + '</text>';
        this.body += s;
    };
    Uml.prototype.html = function (ariaLabel) {
        var n = this.n;
        var defs =
            '<defs>' +
            '<marker id="' + n + '-tri" class="mk-tri" markerWidth="14" markerHeight="13" refX="12.5" refY="6" orient="auto" markerUnits="userSpaceOnUse"><path d="M1,1 L13,6 L1,11 z"/></marker>' +
            '<marker id="' + n + '-arr" class="mk-arr" markerWidth="13" markerHeight="12" refX="11" refY="6" orient="auto" markerUnits="userSpaceOnUse"><path d="M1,1.5 L11,6 L1,10.5"/></marker>' +
            '<marker id="' + n + '-agg" class="mk-agg" markerWidth="16" markerHeight="13" refX="1.5" refY="6" orient="auto" markerUnits="userSpaceOnUse"><path d="M1.5,6 L8,1 L14.5,6 L8,11 z"/></marker>' +
            '<marker id="' + n + '-comp" class="mk-comp" markerWidth="16" markerHeight="13" refX="1.5" refY="6" orient="auto" markerUnits="userSpaceOnUse"><path d="M1.5,6 L8,1 L14.5,6 L8,11 z"/></marker>' +
            '</defs>';
        return '<div class="uml-wrap"><svg class="uml" viewBox="0 0 ' + this.w + ' ' + this.h + '" width="' + this.w + '" role="img" aria-label="' + esc(ariaLabel || 'UML-диаграмма') + '" preserveAspectRatio="xMidYMid meet">' +
            defs + this.body + '</svg></div>' + legendHtml();
    };
    function legendHtml() {
        function l(path, cls, txt) {
            return '<span><svg width="42" height="12" viewBox="0 0 42 12" aria-hidden="true"><path class="lg-line ' + (cls || '') + '" d="' + path + '"/></svg>' + txt + '</span>';
        }
        return '<div class="uml-legend">' +
            l('M2,6 H40', '', 'ассоциация / вызов') +
            l('M2,6 H40', 'd', 'реализация интерфейса (..|>)') +
            '<span><svg width="42" height="12" viewBox="0 0 42 12" aria-hidden="true"><path class="lg-line" d="M2,6 H30"/><path d="M30,1 L40,6 L30,11 z" fill="var(--panel)" stroke="var(--uml-line)" stroke-width="1.2"/></svg>наследование</span>' +
            '<span><svg width="42" height="12" viewBox="0 0 42 12" aria-hidden="true"><path d="M2,6 L9,1 L16,6 L9,11 z" fill="var(--panel)" stroke="var(--uml-line)" stroke-width="1.2"/><path class="lg-line" d="M16,6 H40"/></svg>агрегация</span>' +
            '<span><svg width="42" height="12" viewBox="0 0 42 12" aria-hidden="true"><path d="M2,6 L9,1 L16,6 L9,11 z" fill="var(--uml-line)"/><path class="lg-line" d="M16,6 H40"/></svg>композиция</span>' +
            '</div>';
    }

    /* ----- Реестр паттернов ----- */
    var CATS = {
        creational:     { title: 'GoF · Creational',      desc: 'Порождающие: кто и как создаёт объекты',         color: 'var(--warn)'   },
        behavioral:     { title: 'GoF · Behavioral',      desc: 'Поведенческие: распределение ответственности',   color: 'var(--accent)' },
        structural:     { title: 'GoF · Structural',      desc: 'Структурные: композиция классов и объектов',     color: 'var(--violet)' },
        infrastructure: { title: 'Spring Infrastructure', desc: 'Инфраструктурные стартеры и аспекты',            color: 'var(--ok)'     },
        integration:    { title: 'Integration',           desc: 'Агрегация удалённых микросервисов',              color: 'var(--err)'    }
    };
    var patterns = [], byId = Object.create(null);
    function registerPattern(id, def) { def.id = id; if (!def.category) def.category = 'behavioral'; byId[id] = def; patterns.push(def); return def; }
    function indexOf(id) { for (var i = 0; i < patterns.length; i++) if (patterns[i].id === id) return i; return -1; }

    /* ----- Тема ----- */
    var THEME_KEY = 'eyes-theme';
    function preferredTheme() {
        var saved = null; try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
        if (saved === 'light' || saved === 'dark') return saved;
        return (global.matchMedia && matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
    }
    function applyTheme(t) {
        document.documentElement.setAttribute('data-theme', t);
        try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
        var btn = document.getElementById('themeToggle');
        if (btn) btn.setAttribute('aria-label', t === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему');
    }

    /* ----- Рендер ----- */
    var view, breadcrumbs, sideNav;
    function crumb(items) {
        breadcrumbs.innerHTML = items.map(function (it, i) {
            var last = i === items.length - 1;
            var sep = i ? '<span class="sep" aria-hidden="true">/</span>' : '';
            if (last) return sep + '<span class="cur" aria-current="page">' + esc(it.label) + '</span>';
            return sep + '<a href="' + it.href + '">' + esc(it.label) + '</a>';
        }).join('');
    }
    function renderHome() {
        crumb([{ label: 'Главная', href: '#/' }]);
        document.title = 'Design Patterns · baileyes/eyes';
        var totalClasses = patterns.reduce(function (a, p) { return a + (p.javaClasses ? p.javaClasses.length : 0); }, 0);
        view.innerHTML =
            '<section class="hero"><h1>Паттерны проектирования в Java&nbsp;Spring&nbsp;Boot</h1>' +
            '<p>Интерактивная визуализация репозитория <code>baileyes/eyes</code>: для каждого паттерна — суть, ' +
            'UML-структура реальных классов, работающее JS-демо логики и исходный Java-код. ' +
            'Фронтенд статический, отдаётся встроенным Tomcat из <code>src/main/resources/static/</code>.</p>' +
            '<div class="hero-stats"><span class="stat"><b>' + patterns.length + '</b> паттернов</span>' +
            '<span class="stat"><b>' + Object.keys(CATS).length + '</b> категорий</span>' +
            '<span class="stat"><b>' + totalClasses + '</b> Java-классов</span>' +
            '<span class="stat"><b>0</b> зависимостей</span></div></section>' +
            '<div id="groups"></div><div id="homeEmpty" class="empty" hidden>Ничего не найдено.</div>';
        var groupsHost = view.querySelector('#groups');
        Object.keys(CATS).forEach(function (catKey) {
            var list = patterns.filter(function (p) { return p.category === catKey; });
            if (!list.length) return;
            var cat = CATS[catKey];
            var sec = document.createElement('section');
            sec.className = 'group c-' + catKey;
            sec.innerHTML = '<div class="group-head"><h2><span class="dot" aria-hidden="true"></span>' + esc(cat.title) + '</h2>' +
                '<p>' + esc(cat.desc) + ' · ' + list.length + ' шт.</p></div><div class="grid">' + list.map(cardHtml).join('') + '</div>';
            groupsHost.appendChild(sec);
        });
        Array.prototype.forEach.call(view.querySelectorAll('.card'), function (c) {
            c.addEventListener('click', function () { location.hash = '#/' + c.getAttribute('data-id'); });
        });
        applySearch(document.getElementById('search').value);
        syncSidebar();
    }
    function cardHtml(p) {
        var idx = patterns.indexOf(p) + 1, cat = CATS[p.category] || CATS.behavioral;
        var chips = (p.javaClasses || []).slice(0, 5).map(function (c) { return '<span class="chip">' + esc(c) + '</span>'; }).join('');
        var rest = (p.javaClasses || []).length - 5; if (rest > 0) chips += '<span class="chip more">+' + rest + '</span>';
        var blob = (p.id + ' ' + p.title + ' ' + p.subtitle + ' ' + (p.javaClasses || []).join(' ') + ' ' + cat.title).toLowerCase();
        return '<button type="button" class="card" data-id="' + p.id + '" data-search="' + esc(blob) + '" style="--dotc:' + cat.color + '" aria-label="' + esc(p.title) + '">' +
            '<div class="card-top"><span class="card-idx">' + pad(idx) + '</span><h3>' + esc(p.title) + '</h3></div>' +
            '<div class="sub" data-role="sub">' + esc(p.subtitle) + '</div><div class="chips">' + chips + '</div>' +
            '<span class="badge b-' + p.category + '">' + esc(cat.title) + '</span></button>';
    }
    function renderPattern(id) {
        var p = byId[id]; if (!p) { renderHome(); return; }
        var cat = CATS[p.category] || CATS.behavioral, idx = indexOf(id);
        document.title = p.title + ' · Design Patterns';
        crumb([{ label: 'Главная', href: '#/' }, { label: cat.title, href: '#/?cat=' + p.category }, { label: p.title, href: '#/' + p.id }]);
        view.innerHTML =
            '<header class="p-head"><div class="row"><span class="badge b-' + p.category + '">' + esc(cat.title) + '</span>' +
            '<span class="hash">#/' + esc(p.id) + '</span><span class="card-idx">паттерн ' + pad(idx + 1) + ' из ' + patterns.length + '</span></div>' +
            '<h1>' + esc(p.title) + '</h1><p class="sub">' + esc(p.subtitle) + '</p>' +
            '<div class="kv">' + (p.javaClasses || []).map(function (c) { return '<span class="chip">' + esc(c) + '</span>'; }).join('') + '</div></header>' +
            '<nav class="toc"><a href="#sec-essence">① Суть</a><a href="#sec-structure">② Структура</a><a href="#sec-demo">③ Демо</a><a href="#sec-code">④ Код</a></nav>' +
            '<section class="section" id="sec-essence"><h2><span class="ic">①</span>Суть паттерна</h2><div class="lead">' + (p.essence || '') + '</div></section>' +
            '<section class="section" id="sec-structure"><h2><span class="ic">②</span>Структура классов</h2><div id="diagramHost"></div></section>' +
            '<section class="section" id="sec-demo"><h2><span class="ic">③</span>Интерактивное демо</h2><div id="demoHost" class="demo-grid"></div></section>' +
            '<section class="section" id="sec-code"><h2><span class="ic">④</span>Java-код</h2><div id="codeHost"></div></section>' +
            '<nav class="pager" id="pager"></nav><a class="pager-home" href="#/">← На главную</a>';
        var dh = view.querySelector('#diagramHost');
        if (typeof p.diagram === 'function') p.diagram(dh);
        var demoHost = view.querySelector('#demoHost');
        var ctx = {
            terminal: createTerminal, esc: esc, uuid: uuid, later: later, every: every,
            frame: frame, cancel: cancel, onLeave: onLeave, hashCode: hashCode,
            stamp: stamp, hlJson: hlJson, hlJava: hlJava, pattern: p, host: demoHost
        };
        if (typeof p.demo === 'function') p.demo(demoHost, ctx);
        renderCodeTabs(view.querySelector('#codeHost'), p.code || []);
        var prev = patterns[(idx - 1 + patterns.length) % patterns.length];
        var next = patterns[(idx + 1) % patterns.length];
        view.querySelector('#pager').innerHTML =
            '<a href="#/' + prev.id + '"><span class="dir">← предыдущий</span><span class="nm">' + esc(prev.title) + '</span></a>' +
            '<a class="next" href="#/' + next.id + '"><span class="dir">следующий →</span><span class="nm">' + esc(next.title) + '</span></a>';
        syncSidebar(); global.scrollTo({ top: 0, behavior: 'smooth' });
    }
    function renderCodeTabs(host, files) {
        if (!files.length) { host.innerHTML = '<p class="hint">Код не задан.</p>'; return; }
        var tabsId = 'ct-' + (++umlSeq);
        host.innerHTML =
            '<div class="code-tabs" role="tablist">' +
            files.map(function (f, i) { return '<button type="button" role="tab" id="' + tabsId + '-t' + i + '" class="code-tab" aria-selected="' + (i === 0) + '" aria-controls="' + tabsId + '-p' + i + '" tabindex="' + (i === 0 ? 0 : -1) + '">' + esc(f.file) + '</button>'; }).join('') +
            '</div>' +
            files.map(function (f, i) {
                return '<div role="tabpanel" class="code-panel" id="' + tabsId + '-p' + i + '" aria-labelledby="' + tabsId + '-t' + i + '"' + (i ? ' hidden' : '') + ' tabindex="0">' +
                    '<div class="code-head"><span class="pkg">' + esc(f.pkg || '') + '</span><button type="button" class="copy-btn" data-i="' + i + '">copy</button></div>' +
                    '<pre class="code"><code>' + hlJava(f.src) + '</code></pre></div>';
            }).join('');
        var tabs = Array.prototype.slice.call(host.querySelectorAll('[role="tab"]'));
        function select(i, focus) {
            tabs.forEach(function (t, k) { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; host.querySelector('#' + tabsId + '-p' + k).hidden = (k !== i); });
            if (focus) tabs[i].focus();
        }
        tabs.forEach(function (t, i) {
            t.addEventListener('click', function () { select(i, false); });
            t.addEventListener('keydown', function (e) {
                var k = null;
                if (e.key === 'ArrowRight') k = (i + 1) % tabs.length;
                else if (e.key === 'ArrowLeft') k = (i - 1 + tabs.length) % tabs.length;
                if (k !== null) { e.preventDefault(); select(k, true); }
            });
        });
        Array.prototype.forEach.call(host.querySelectorAll('.copy-btn'), function (btn) {
            btn.addEventListener('click', function () {
                var src = files[Number(btn.getAttribute('data-i'))].src;
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(src).then(function () {
                        btn.textContent = 'скопировано'; btn.classList.add('done');
                        setTimeout(function () { btn.textContent = 'copy'; btn.classList.remove('done'); }, 1400);
                    });
                }
            });
        });
    }

    /* ----- Сайдбар, поиск ----- */
    function buildSidebar() {
        var html = '<a class="side-link" href="#/" data-home="1"><span class="n">⌂</span>Главная</a>';
        Object.keys(CATS).forEach(function (catKey) {
            var list = patterns.filter(function (p) { return p.category === catKey; });
            if (!list.length) return;
            html += '<div class="side-group"><h3>' + esc(CATS[catKey].title) + '</h3>';
            list.forEach(function (p) {
                html += '<a class="side-link" href="#/' + p.id + '" data-id="' + p.id + '" data-search="' +
                    esc((p.id + ' ' + p.title + ' ' + (p.javaClasses || []).join(' ')).toLowerCase()) + '">' +
                    '<span class="n">' + pad(indexOf(p.id) + 1) + '</span>' + esc(p.title) + '</a>';
            });
            html += '</div>';
        });
        sideNav.innerHTML = html;
    }
    function syncSidebar() {
        var cur = currentHash();
        Array.prototype.forEach.call(sideNav.querySelectorAll('.side-link'), function (a) {
            var isCur = a.getAttribute('data-id') ? a.getAttribute('data-id') === cur : !cur;
            if (isCur) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
        });
    }
    function applySearch(q) {
        q = (q || '').trim().toLowerCase();
        Array.prototype.forEach.call(sideNav.querySelectorAll('.side-link[data-id]'), function (a) {
            a.classList.toggle('hidden', !!q && a.getAttribute('data-search').indexOf(q) < 0);
        });
        var cards = view.querySelectorAll('.card');
        if (!cards.length) return;
        Array.prototype.forEach.call(cards, function (c) {
            var hit = !q || c.getAttribute('data-search').indexOf(q) >= 0;
            c.classList.toggle('hidden', !hit);
            var sub = c.querySelector('[data-role="sub"]');
            var p = byId[c.getAttribute('data-id')];
            if (sub && p) sub.innerHTML = q && hit ? esc(p.subtitle).replace(new RegExp('(' + esc(q) + ')', 'gi'), '<mark>$1</mark>') : esc(p.subtitle);
        });
        Array.prototype.forEach.call(view.querySelectorAll('.group'), function (g) {
            g.style.display = g.querySelectorAll('.card:not(.hidden)').length ? '' : 'none';
        });
        var e = document.getElementById('homeEmpty'); if (e) e.hidden = !!view.querySelectorAll('.card:not(.hidden)').length;
    }
    function setSidebar(open) {
        var sb = document.getElementById('sidebar'), bd = document.getElementById('backdrop'), bg = document.getElementById('burger');
        sb.classList.toggle('open', open); bd.hidden = !open;
        requestAnimationFrame(function () { bd.classList.toggle('show', open); });
        bg.setAttribute('aria-expanded', String(open));
    }

    /* ----- Роутинг ----- */
    function currentHash() { return location.hash.replace(/^#\/?/, '').split('?')[0].trim(); }
    function route() {
        teardown(); setSidebar(false);
        var id = currentHash();
        if (!id || !byId[id]) renderHome(); else renderPattern(id);
    }
    function boot() {
        view = document.getElementById('view');
        breadcrumbs = document.getElementById('breadcrumbs');
        sideNav = document.getElementById('sideNav');
        applyTheme(preferredTheme());
        buildSidebar();
        document.getElementById('themeToggle').addEventListener('click', function () {
            applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
        });
        document.getElementById('burger').addEventListener('click', function () {
            setSidebar(!document.getElementById('sidebar').classList.contains('open'));
        });
        document.getElementById('backdrop').addEventListener('click', function () { setSidebar(false); });
        var searchInput = document.getElementById('search');
        searchInput.addEventListener('input', function () {
            if (currentHash() && byId[currentHash()]) { location.hash = '#/'; setTimeout(function () { applySearch(searchInput.value); }, 0); }
            else applySearch(searchInput.value);
        });
        document.addEventListener('keydown', function (e) {
            var tag = (e.target.tagName || '').toLowerCase();
            if (e.key === '/' && tag !== 'input' && tag !== 'textarea') { e.preventDefault(); searchInput.focus(); searchInput.select(); }
            if (e.key === 'Escape') { if (document.activeElement === searchInput) { searchInput.value = ''; applySearch(''); } setSidebar(false); }
        });
        global.addEventListener('hashchange', route);
        route();
    }

    /* ----- Публичный API (для блока паттернов) ----- */
    global.App = {
        esc: esc, uuid: uuid, pad: pad, hashCode: hashCode, stamp: stamp,
        later: later, every: every, frame: frame, cancel: cancel, onLeave: onLeave,
        terminal: createTerminal, hlJava: hlJava, hlJson: hlJson, Uml: Uml,
        registerPattern: registerPattern, CATS: CATS
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})(window);


/* =========================================================================
   ЧАСТЬ 2. ВСЕ 13 ПАТТЕРНОВ
   ========================================================================= */
(function (App) {
    'use strict';
    var esc = App.esc, Uml = App.Uml;
    function put(host, uml, caption) {
        host.innerHTML = uml.html() + (caption ? '<p class="hint" style="margin-top:10px">' + caption + '</p>' : '');
    }

    /* ===== 1. STRATEGY ===== */
    App.registerPattern('strategy', {
        title: 'Strategy', subtitle: 'EnumMap<Animals, AnimalStrategy> внутри AnimalContext', category: 'behavioral',
        javaClasses: ['AnimalStrategy', 'CatStrategy', 'DogStrategy', 'AnimalContext', 'Cat', 'Dog', 'Animals'],
        essence: '<p><strong>Strategy</strong> выносит «как создать животное» из <code>AnimalContext</code> в отдельные классы-стратегии. ' +
            'Контекст хранит <code>Map&lt;Animals, AnimalStrategy&gt;</code> и на вызов <code>getAnimal(type)</code> просто достаёт нужную стратегию.</p>' +
            '<p>При отсутствии ключа контекст бросает <code>IllegalArgumentException</code>, который на странице ' +
            '<a href="#/exception-handler">ExceptionHandler</a> превращается в HTTP 400.</p>',
        diagram: function (host) {
            var u = new Uml(820, 400);
            u.box(20, 30, 250, 'AnimalContext', '@Service', ['- Map<Animals, AnimalStrategy> strategies', '- CatStrategy catStrategy', '- DogStrategy dogStrategy', '+ @PostConstruct init()', '+ getAnimal(Animals) : Object'], 'spring');
            u.box(360, 30, 210, 'AnimalStrategy', '«interface»', ['+ getAnimal() : Object'], 'iface');
            u.box(330, 160, 120, 'CatStrategy', '@Component', ['+ getAnimal()'], 'spring');
            u.box(480, 160, 120, 'DogStrategy', '@Component', ['+ getAnimal()'], 'spring');
            u.box(330, 275, 120, 'Cat', '@Entity', ['UUID id', 'String name', 'int age'], 'entity');
            u.box(480, 275, 120, 'Dog', '@Entity', ['UUID id', 'String name', 'int age'], 'entity');
            u.box(640, 30, 160, 'Animals', '«enum»', ['CAT', 'DOG']);
            u.arrow(270, 78, 360, 62, 'agg', 'strategies');
            u.arrow(378, 160, 420, 108, 'impl', '');
            u.arrow(545, 160, 505, 108, 'impl', '');
            u.arrow(390, 208, 390, 275, 'comp', 'new Cat()');
            u.arrow(540, 208, 540, 275, 'comp', 'new Dog()');
            put(host, u, 'Пунктир — реализация интерфейса; ромб — агрегация (мапа стратегий); закрашенный ромб — композиция.');
        },
        demo: function (host, ctx) {
            host.innerHTML =
                '<div class="demo-controls">' +
                '<button class="btn primary" data-an="CAT">Animals.CAT</button>' +
                '<button class="btn primary" data-an="DOG">Animals.DOG</button>' +
                '<button class="btn err" data-an="UNKNOWN">Animals.UNKNOWN</button>' +
                '<button class="btn ghost sm" data-clear>очистить</button>' +
                '</div>' +
                '<div class="two-col"><div class="stack-col">' +
                '<div class="panel"><h4>EnumMap strategies</h4><div class="slot-map">' +
                '<div class="slot" data-slot="CAT"><div class="k">CAT →</div><div class="v">CatStrategy</div><div class="impl">return new Cat()</div></div>' +
                '<div class="slot" data-slot="DOG"><div class="k">DOG →</div><div class="v">DogStrategy</div><div class="impl">return new Dog()</div></div>' +
                '</div></div>' +
                '<div class="panel"><h4>Результат getAnimal()</h4><div id="stResult"><p class="hint">Нажмите кнопку.</p></div></div>' +
                '</div><div id="stTerm"></div></div>';
            var term = ctx.terminal('baileyes.eyes.strategy · SLF4J');
            host.querySelector('#stTerm').appendChild(term.node);
            var result = host.querySelector('#stResult');
            var strategies = {
                CAT: { bean: 'CatStrategy', entity: 'Cat', emoji: '🐱', make: function () { return { type: 'Cat', id: ctx.uuid(), name: 'Murka', age: 3 }; } },
                DOG: { bean: 'DogStrategy', entity: 'Dog', emoji: '🐶', make: function () { return { type: 'Dog', id: ctx.uuid(), name: 'Rex', age: 5 }; } }
            };
            function setSlot(key) {
                Array.prototype.forEach.call(host.querySelectorAll('.slot'), function (s) {
                    var on = s.getAttribute('data-slot') === key; s.classList.toggle('active', on);
                    if (on) { s.classList.remove('pulse'); void s.offsetWidth; s.classList.add('pulse'); }
                });
            }
            function getAnimal(type) {
                term.info('getAnimal(Animals.' + type + ') invoked', 'AnimalContext');
                var s = strategies[type];
                if (!s) {
                    var msg = 'Unknown animal type: ' + type;
                    term.error('IllegalArgumentException: ' + esc(msg), 'AnimalContext');
                    result.innerHTML = '<div class="result-card error"><div class="emoji">⛔</div><div class="meta">' +
                        '<span class="err-title">java.lang.IllegalArgumentException</span><span>' + esc(msg) + '</span>' +
                        '<span>→ GlobalExceptionHandler вернёт HTTP 400 (см. <a href="#/exception-handler">ExceptionHandler</a>)</span></div></div>';
                    return;
                }
                setSlot(type);
                term.debug('strategy resolved: ' + s.bean, 'AnimalContext');
                var a = s.make();
                term.info('getAnimal() -> ' + s.entity + '(id=' + a.id + ', name=' + a.name + ', age=' + a.age + ')', s.bean);
                result.innerHTML = '<div class="result-card"><div class="emoji">' + s.emoji + '</div><div class="meta">' +
                    '<b>' + esc(a.type) + ' · ' + esc(a.name) + '</b><span>@Id UUID: ' + esc(a.id) + '</span>' +
                    '<span>age: ' + a.age + ' · created by ' + s.bean + '</span></div></div>';
            }
            Array.prototype.forEach.call(host.querySelectorAll('[data-an]'), function (b) {
                b.addEventListener('click', function () { getAnimal(b.getAttribute('data-an')); });
            });
            host.querySelector('[data-clear]').addEventListener('click', function () { term.clear(); });
            term.info('AnimalContext initialized: strategies={CAT, DOG}', 'AnimalContext');
        },
        code: [
            { file: 'AnimalStrategy.java', pkg: 'baileyes.eyes.strategy', src:
                    `package baileyes.eyes.strategy;

/** Контракт стратегии: вернуть готовый объект животного. */
public interface AnimalStrategy {

    Object getAnimal();
}` },
            { file: 'AnimalContext.java', pkg: 'baileyes.eyes.strategy', src:
                    `package baileyes.eyes.strategy;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.EnumMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AnimalContext {

    private final CatStrategy catStrategy;
    private final DogStrategy dogStrategy;
    private final Map<Animals, AnimalStrategy> strategies = new EnumMap<>(Animals.class);

    @PostConstruct
    public void init() {
        strategies.put(Animals.CAT, catStrategy);
        strategies.put(Animals.DOG, dogStrategy);
    }

    public Object getAnimal(Animals type) {
        AnimalStrategy strategy = strategies.get(type);
        if (strategy == null) {
            throw new IllegalArgumentException("Unknown animal type: " + type);
        }
        return strategy.getAnimal();
    }
}` },
            { file: 'CatStrategy.java', pkg: 'baileyes.eyes.strategy', src:
                    `package baileyes.eyes.strategy;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class CatStrategy implements AnimalStrategy {

    @Override
    public Object getAnimal() {
        log.info("CatStrategy: creating Cat");
        Cat cat = new Cat();
        cat.setName("Murka");
        cat.setAge(3);
        return cat;
    }
}` },
            { file: 'Cat.java', pkg: 'baileyes.eyes.strategy', src:
                    `package baileyes.eyes.strategy;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Getter @Setter @NoArgsConstructor
public class Cat {

    @Id
    private UUID id = UUID.randomUUID();
    private String name;
    private int age;
}` }
        ]
    });

    /* ===== 2. STATE ===== */
    var STATE_NODES = [
        { id: 'UNDER_REVIEW',          x: 40,  y: 34,  w: 190, h: 56, label: 'UNDER_REVIEW' },
        { id: 'AWAITING_CONFIRMATION', x: 380, y: 34,  w: 210, h: 56, label: 'AWAITING_CONFIRMATION' },
        { id: 'CONFIRMED',             x: 380, y: 236, w: 190, h: 56, label: 'CONFIRMED' },
        { id: 'REJECTED',              x: 40,  y: 236, w: 190, h: 56, label: 'REJECTED' }
    ];
    var TRANSITIONS = {
        UNDER_REVIEW: {
            review:  { to: 'UNDER_REVIEW', msg: 'Документ уже на рассмотрении.', deny: true },
            confirm: { to: 'CONFIRMED',    msg: 'Документ подтвержден.' },
            reject:  { to: 'REJECTED',     msg: 'Документ отклонен.' }
        },
        AWAITING_CONFIRMATION: {
            review:  { to: 'UNDER_REVIEW', msg: 'Документ возвращен на рассмотрение.' },
            confirm: { to: 'CONFIRMED',    msg: 'Документ подтвержден.' },
            reject:  { to: 'REJECTED',     msg: 'Документ отклонен.' }
        },
        CONFIRMED: {
            review:  { to: 'CONFIRMED', msg: 'Документ уже подтвержден, изменение состояния невозможно.', deny: true },
            confirm: { to: 'CONFIRMED', msg: 'Документ уже подтвержден, повторное подтверждение невозможно.', deny: true },
            reject:  { to: 'CONFIRMED', msg: 'Документ уже подтвержден, отклонение невозможно.', deny: true }
        },
        REJECTED: {
            review:  { to: 'UNDER_REVIEW', msg: 'Документ возвращен на рассмотрение.' },
            confirm: { to: 'REJECTED', msg: 'Документ отклонен, его нельзя подтвердить.', deny: true },
            reject:  { to: 'REJECTED', msg: 'Документ уже отклонен.', deny: true }
        }
    };

    App.registerPattern('state', {
        title: 'State', subtitle: 'Конечный автомат жизненного цикла документа в константах enum DocumentState', category: 'behavioral',
        javaClasses: ['DocumentState', 'Document', 'DocumentService'],
        essence: '<p>Паттерн <strong>State</strong>: каждая константа enum <code>DocumentState</code> сама переопределяет ' +
            '<code>review/confirm/reject</code> и возвращает следующее состояние. <code>Document</code> лишь делегирует вызов: ' +
            '<code>state = state.review(this)</code>.</p>',
        diagram: function (host) {
            var u = new Uml(800, 330);
            u.box(20, 40, 230, 'Document', '@Component', ['- DocumentState state = UNDER_REVIEW', '+ review() : void', '+ confirm() : void', '+ reject() : void'], 'spring');
            u.box(330, 20, 250, 'DocumentState', '«enum» · abstract', ['UNDER_REVIEW', 'AWAITING_CONFIRMATION', 'CONFIRMED', 'REJECTED', '+ review/confirm/reject(Document)'], 'abs');
            u.box(640, 40, 145, 'DocumentService', '@Service', ['+ processDocument()'], 'spring');
            u.arrow(250, 92, 330, 92, 'assoc', 'state');
            u.arrow(640, 80, 580, 80, 'dep', 'вызывает');
            put(host, u, 'Enum с abstract-методами компилируется в набор анонимных подклассов — каждая константа со своей реализацией.');
        },
        demo: function (host, ctx) {
            var W = 640, H = 330;
            host.innerHTML =
                '<div class="demo-controls">' +
                '<button class="btn primary" data-act="review">document.review()</button>' +
                '<button class="btn ok" data-act="confirm">document.confirm()</button>' +
                '<button class="btn err" data-act="reject">document.reject()</button>' +
                '<button class="btn" data-scenario>▶ Сценарий DocumentService</button>' +
                '<button class="btn ghost sm" data-reset>сброс</button>' +
                '<button class="btn ghost sm" data-clear>очистить</button>' +
                '</div>' +
                '<div class="two-col"><div class="stack-col">' +
                '<div class="panel"><h4>Document.state</h4><div class="state-wrap"><svg class="state-svg" id="stGraph" viewBox="0 0 ' + W + ' ' + H + '"></svg></div></div>' +
                '<div class="panel"><h4>Таблица переходов</h4><div class="table-scroll"><table class="transitions-table" id="stTable"></table></div></div>' +
                '</div><div id="stTerm"></div></div>';
            var term = ctx.terminal('baileyes.eyes.state · DocumentService');
            host.querySelector('#stTerm').appendChild(term.node);
            var svg = host.querySelector('#stGraph');
            var state = 'UNDER_REVIEW', busy = false;
            function node(id) { for (var i = 0; i < STATE_NODES.length; i++) if (STATE_NODES[i].id === id) return STATE_NODES[i]; }
            function border(a, b) {
                var dx = b.cx - a.cx, dy = b.cy - a.cy;
                if (!dx && !dy) return { x: a.cx, y: a.cy };
                var sx = (a.w / 2) / Math.abs(dx || 1e-6), sy = (a.h / 2) / Math.abs(dy || 1e-6);
                var s = Math.min(sx, sy);
                return { x: a.cx + dx * s, y: a.cy + dy * s };
            }
            function drawGraph() {
                var s = '';
                var drawn = {};
                Object.keys(TRANSITIONS).forEach(function (from) {
                    Object.keys(TRANSITIONS[from]).forEach(function (act) {
                        var t = TRANSITIONS[from][act], key = from + '>' + t.to;
                        if (drawn[key]) return; drawn[key] = 1;
                        var a = node(from), b = node(t.to);
                        if (from === t.to) {
                            s += '<path class="st-edge" data-e="' + from + '|' + act + '" d="M' + (a.x + 26) + ',' + a.y + ' c -18,-40 ' + (a.w - 34) + ',-40 ' + (a.w - 52) + ',0" />';
                        } else {
                            var p1 = border(a, b), p2 = border(b, a);
                            var mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
                            var dx = p2.x - p1.x, dy = p2.y - p1.y, len = Math.hypot(dx, dy) || 1;
                            var bend = 26, cx = mx - dy / len * bend, cy = my + dx / len * bend;
                            s += '<path class="st-edge" data-e="' + from + '|' + act + '" d="M' + p1.x.toFixed(1) + ',' + p1.y.toFixed(1) + ' Q' + cx.toFixed(1) + ',' + cy.toFixed(1) + ' ' + p2.x.toFixed(1) + ',' + p2.y.toFixed(1) + '" />';
                            s += '<text class="st-elbl" data-l="' + from + '|' + act + '" x="' + ((p1.x + 2 * cx + p2.x) / 4).toFixed(1) + '" y="' + (((p1.y + 2 * cy + p2.y) / 4) - 4).toFixed(1) + '">' + act + '()</text>';
                        }
                    });
                });
                STATE_NODES.forEach(function (n) {
                    n.cx = n.x + n.w / 2; n.cy = n.y + n.h / 2;
                    s += '<g class="st-node" data-n="' + n.id + '"><rect x="' + n.x + '" y="' + n.y + '" width="' + n.w + '" height="' + n.h + '" rx="9"/>' +
                        '<text x="' + n.cx + '" y="' + (n.cy + 4) + '">' + esc(n.label) + '</text></g>';
                });
                svg.innerHTML = s;
                paint();
            }
            function paint() {
                Array.prototype.forEach.call(svg.querySelectorAll('.st-node'), function (g) { g.classList.toggle('current', g.getAttribute('data-n') === state); });
                var rows = '<thead><tr><th class="mono">state</th><th class="mono">review()</th><th class="mono">confirm()</th><th class="mono">reject()</th></tr></thead><tbody>';
                Object.keys(TRANSITIONS).forEach(function (from) {
                    rows += '<tr data-r="' + from + '"><td class="mono"><b>' + from + '</b></td>';
                    ['review', 'confirm', 'reject'].forEach(function (act) {
                        var t = TRANSITIONS[from][act];
                        rows += '<td class="mono" data-c="' + from + '|' + act + '" ' + (t.deny ? 'style="color:var(--err)"' : '') + '>' +
                            (t.deny ? '⛔ ' : '→ ') + t.to.replace(from, 'same') + '<br><span style="color:var(--faint);font-size:10.4px">' + esc(t.msg) + '</span></td>';
                    });
                    rows += '</tr>';
                });
                host.querySelector('#stTable').innerHTML = rows + '</tbody>';
            }
            function flashEdge(from, act, on) {
                var e = svg.querySelector('[data-e="' + from + '|' + act + '"]');
                var l = svg.querySelector('[data-l="' + from + '|' + act + '"]');
                if (e) e.classList.toggle('hot', on); if (l) l.classList.toggle('hot', on);
                var row = host.querySelector('[data-r="' + from + '"]'); if (row) row.classList.toggle('hit', on);
            }
            function travel(from, act, done) {
                var path = svg.querySelector('[data-e="' + from + '|' + act + '"]');
                if (!path) { done(); return; }
                var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                dot.setAttribute('r', '5.5'); dot.setAttribute('class', 'st-dot');
                svg.appendChild(dot);
                var len = path.getTotalLength(), t0 = performance.now(), dur = 460, raf;
                function step(now) {
                    var k = Math.min(1, (now - t0) / dur);
                    var pt = path.getPointAtLength(len * (0.1 + 0.9 * k));
                    dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y);
                    if (k < 1) raf = App.frame(step); else { dot.remove(); done(); }
                }
                raf = App.frame(step);
                ctx.onLeave(function () { cancelAnimationFrame(raf); if (dot.parentNode) dot.remove(); });
            }
            function apply(act, cb) {
                if (busy) return; busy = true;
                var from = state, t = TRANSITIONS[from][act];
                term.info('document.' + act + '()  →  state.' + act + '(document)', 'Document');
                flashEdge(from, act, true);
                travel(from, act, function () {
                    var g = svg.querySelector('[data-n="' + from + '"]');
                    if (t.deny && g) { g.classList.remove('deny'); void g.offsetWidth; g.classList.add('deny'); }
                    if (t.deny) term.warn(t.msg + '  (состояние не меняется: ' + from + ')', 'DocumentState.' + from);
                    else { term.info(t.msg, 'DocumentState.' + from); if (t.to !== from) term.debug('state: ' + from + ' → ' + t.to, 'Document'); state = t.to; paint(); }
                    ctx.later(520, function () { flashEdge(from, act, false); busy = false; if (cb) cb(); });
                });
            }
            function scenario() {
                if (busy) return; reset(true);
                term.info('=== DocumentService.processDocument() ===', 'DocumentService');
                var steps = [
                    function (n) { apply('review', n); },
                    function (n) { term.debug('setState(AWAITING_CONFIRMATION)', 'DocumentService'); state = 'AWAITING_CONFIRMATION'; paint(); ctx.later(420, n); },
                    function (n) { apply('confirm', n); },
                    function (n) { term.info('пробуем reject на CONFIRMED…', 'DocumentService'); apply('reject', n); },
                    function (n) { apply('review', n); },
                    function () { term.ok('=== сценарий завершён, итог: ' + state + ' ===', 'DocumentService'); busy = false; }
                ];
                busy = true;
                (function next(i) { if (i < steps.length) steps[i](function () { next(i + 1); }); })(0);
            }
            function reset(silent) { state = 'UNDER_REVIEW'; busy = false; paint(); if (!silent) { term.clear(); term.info('Document создан, state=UNDER_REVIEW', 'Document'); } }
            Array.prototype.forEach.call(host.querySelectorAll('[data-act]'), function (b) { b.addEventListener('click', function () { apply(b.getAttribute('data-act')); }); });
            host.querySelector('[data-scenario]').addEventListener('click', scenario);
            host.querySelector('[data-reset]').addEventListener('click', function () { reset(false); });
            host.querySelector('[data-clear]').addEventListener('click', function () { term.clear(); });
            drawGraph();
            term.info('Document создан, state=UNDER_REVIEW', 'Document');
        },
        code: [
            { file: 'DocumentState.java', pkg: 'baileyes.eyes.state', src:
                    `package baileyes.eyes.state;

/**
 * State-паттерн на enum: каждая константа переопределяет
 * abstract-методы и сама решает, в какое состояние перейти.
 */
public enum DocumentState {

    UNDER_REVIEW {
        @Override public DocumentState review(Document d) { d.log("Документ уже на рассмотрении."); return UNDER_REVIEW; }
        @Override public DocumentState confirm(Document d) { d.log("Документ подтвержден."); return CONFIRMED; }
        @Override public DocumentState reject(Document d)  { d.log("Документ отклонен."); return REJECTED; }
    },
    AWAITING_CONFIRMATION {
        @Override public DocumentState review(Document d) { d.log("Документ возвращен на рассмотрение."); return UNDER_REVIEW; }
        @Override public DocumentState confirm(Document d) { d.log("Документ подтвержден."); return CONFIRMED; }
        @Override public DocumentState reject(Document d)  { d.log("Документ отклонен."); return REJECTED; }
    },
    CONFIRMED {
        @Override public DocumentState review(Document d)  { d.log("Документ уже подтвержден, изменение состояния невозможно."); return CONFIRMED; }
        @Override public DocumentState confirm(Document d) { d.log("Документ уже подтвержден, повторное подтверждение невозможно."); return CONFIRMED; }
        @Override public DocumentState reject(Document d)  { d.log("Документ уже подтвержден, отклонение невозможно."); return CONFIRMED; }
    },
    REJECTED {
        @Override public DocumentState review(Document d)  { d.log("Документ возвращен на рассмотрение."); return UNDER_REVIEW; }
        @Override public DocumentState confirm(Document d) { d.log("Документ отклонен, его нельзя подтвердить."); return REJECTED; }
        @Override public DocumentState reject(Document d)  { d.log("Документ уже отклонен."); return REJECTED; }
    };

    public abstract DocumentState review(Document document);
    public abstract DocumentState confirm(Document document);
    public abstract DocumentState reject(Document document);
}` },
            { file: 'Document.java', pkg: 'baileyes.eyes.state', src:
                    `package baileyes.eyes.state;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j @Getter @Component
public class Document {

    private DocumentState state = DocumentState.UNDER_REVIEW;

    public void review()  { state = state.review(this); }
    public void confirm() { state = state.confirm(this); }
    public void reject()  { state = state.reject(this); }

    public void setState(DocumentState state) { this.state = state; }
    public void log(String message) { log.info(message); }
}` }
        ]
    });

    /* ===== 3. CHAINS ===== */
    App.registerPattern('chains', {
        title: 'Chains (Chain of Responsibility)', subtitle: 'ChainManager прогоняет ProcessDataDto через List<ChainPart> с @Order', category: 'behavioral',
        javaClasses: ['ChainPart', 'FirstChainPart', 'SecondChainPart', 'ChainManager', 'ProcessDataDto'],
        essence: '<p>Chain of Responsibility: <code>ChainManager</code> инжектит <code>List&lt;ChainPart&gt;</code>, ' +
            'Spring сортирует по <code>@Order</code>. Менеджер гоняет DTO по циклу: <code>process = chainPart.process(process)</code>.</p>',
        diagram: function (host) {
            var u = new Uml(820, 280);
            u.box(20, 30, 250, 'ChainManager', '@Service', ['- List<ChainPart> chain', '+ addSomething(UUID, Object)', '+ getSomething(UUID)'], 'spring');
            u.box(350, 20, 220, 'ChainPart', '«interface»', ['+ process(ProcessDataDto<?>) : ProcessDataDto<?>'], 'iface');
            u.box(320, 150, 130, 'FirstChainPart', '@Component @Order(1)', ['+ process(…)'], 'spring');
            u.box(470, 150, 130, 'SecondChainPart', '@Component @Order(2)', ['+ process(…)'], 'spring');
            u.box(640, 30, 165, 'ProcessDataDto<T>', '@Builder', ['UUID id', 'T data'], 'entity');
            u.arrow(270, 70, 350, 55, 'agg', 'chain (List)');
            u.arrow(395, 150, 420, 92, 'impl', '');
            u.arrow(520, 150, 500, 92, 'impl', '');
            u.arrow(570, 60, 640, 60, 'dep', 'создаёт');
            put(host, u, 'Менеджер ничего не знает о конкретных звеньях — только об интерфейсе и о том, что список уже отсортирован.');
        },
        demo: function (host, ctx) {
            host.innerHTML =
                '<div class="demo-controls">' +
                '<div class="field"><label for="chData">data</label><input id="chData" type="text" value="{\\"city\\":\\"Moscow\\"}" style="min-width:230px"></div>' +
                '<button class="btn primary" data-send>Отправить по цепочке</button>' +
                '<button class="btn" data-transform>Demo transform</button>' +
                '<label class="switch"><input type="checkbox" id="chReal" checked><span class="track"></span>show real logic (identity)</label>' +
                '<button class="btn ghost sm" data-clear>очистить</button>' +
                '</div>' +
                '<div class="panel" style="position:relative;overflow:visible"><h4>List&lt;ChainPart&gt; chain</h4>' +
                '<div class="pipe" id="chPipe">' +
                '<div class="capsule" id="chCap">ProcessDataDto</div>' +
                '<div class="pipe-node" data-node="0"><div class="ord">entry</div><div class="nm">ChainManager</div><div class="st" data-st>idle</div></div>' +
                '<div class="pipe-arrow"><svg width="42" height="16"><path d="M0,8 H34" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M32,3 L41,8 L32,13" stroke="currentColor" stroke-width="1.6" fill="none"/></svg></div>' +
                '<div class="pipe-node" data-node="1"><div class="ord">@Order(1)</div><div class="nm">FirstChainPart</div><div class="st" data-st>idle</div></div>' +
                '<div class="pipe-arrow"><svg width="42" height="16"><path d="M0,8 H34" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M32,3 L41,8 L32,13" stroke="currentColor" stroke-width="1.6" fill="none"/></svg></div>' +
                '<div class="pipe-node" data-node="2"><div class="ord">@Order(2)</div><div class="nm">SecondChainPart</div><div class="st" data-st>idle</div></div>' +
                '<div class="pipe-arrow"><svg width="42" height="16"><path d="M0,8 H34" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M32,3 L41,8 L32,13" stroke="currentColor" stroke-width="1.6" fill="none"/></svg></div>' +
                '<div class="pipe-node" data-node="3"><div class="ord">result</div><div class="nm">ProcessDataDto</div><div class="st" data-st>—</div></div>' +
                '</div>' +
                '<div class="order-note"><span class="tag">@Order(1)</span> FirstChainPart → <span class="tag">@Order(2)</span> SecondChainPart · Spring сортирует List&lt;ChainPart&gt; до инжекции</div>' +
                '</div>' +
                '<div class="two-col" style="margin-top:14px"><div class="panel"><h4>Выходные данные</h4><div class="data-out" id="chOut">—</div></div><div id="chTerm"></div></div>';
            var term = ctx.terminal('baileyes.eyes.chains · ChainManager');
            host.querySelector('#chTerm').appendChild(term.node);
            var pipe = host.querySelector('#chPipe'), cap = host.querySelector('#chCap'), out = host.querySelector('#chOut');
            var nodes = Array.prototype.slice.call(pipe.querySelectorAll('.pipe-node'));
            function setSt(i, txt, cls) {
                var n = nodes[i]; if (!n) return;
                n.querySelector('[data-st]').textContent = txt;
                n.classList.remove('lit', 'done'); if (cls) n.classList.add(cls);
            }
            function moveTo(i) {
                var n = nodes[i]; if (!n) return;
                cap.classList.add('fly');
                cap.style.left = (n.offsetLeft + n.offsetWidth / 2 - cap.offsetWidth / 2) + 'px';
            }
            function run(transformMode) {
                var real = host.querySelector('#chReal').checked && !transformMode;
                var id = ctx.uuid(), data = host.querySelector('#chData').value;
                var dto = { id: id, data: data };
                nodes.forEach(function (_, i) { setSt(i, 'idle'); });
                out.textContent = '—';
                term.info('addSomething(id=' + id + ', data=' + data + ')', 'ChainManager');
                term.debug('chain = [FirstChainPart, SecondChainPart] (sorted by @Order)', 'ChainManager');
                var step = 0;
                function next() {
                    if (step > 2) {
                        setSt(3, 'готово', 'done'); moveTo(3);
                        term.ok('chain finished: ProcessDataDto{id=' + dto.id + '}', 'ChainManager');
                        out.innerHTML = '<span class="seg b">' + esc(typeof dto.data === 'string' ? dto.data : JSON.stringify(dto.data)) + '</span>';
                        return;
                    }
                    setSt(step, 'processing…', 'lit'); moveTo(step);
                    var name = step === 0 ? 'ChainManager' : (step === 1 ? 'FirstChainPart' : 'SecondChainPart');
                    term.info('Step ' + step + ': processing id=' + dto.id, name);
                    ctx.later(620, function () {
                        if (step > 0) {
                            if (real) term.debug('identity-проход: return previousData', name);
                            else {
                                var add = step === 1 ? ' +street' : ' +zipCode';
                                dto.data = (typeof dto.data === 'string' ? dto.data : JSON.stringify(dto.data)) + add;
                                term.info('enriched data → ' + dto.data, name);
                            }
                        }
                        setSt(step, 'done', 'done'); step++; next();
                    });
                }
                cap.textContent = 'DTO · ' + id.slice(0, 8);
                ctx.later(60, function () { moveTo(0); cap.classList.add('fly'); next(); });
            }
            host.querySelector('[data-send]').addEventListener('click', function () { run(false); });
            host.querySelector('[data-transform]').addEventListener('click', function () {
                host.querySelector('#chReal').checked = false;
                term.warn('demo transform: звенья обогащают data', 'ChainManager');
                run(true);
            });
            host.querySelector('[data-clear]').addEventListener('click', function () { term.clear(); });
            ctx.later(80, function () { moveTo(0); });
            term.info('ChainManager initialized with 2 chain parts', 'ChainManager');
        },
        code: [
            { file: 'ChainPart.java', pkg: 'baileyes.eyes.chains', src:
                    `package baileyes.eyes.chains;

public interface ChainPart {
    ProcessDataDto<?> process(ProcessDataDto<?> previousData);
}` },
            { file: 'FirstChainPart.java', pkg: 'baileyes.eyes.chains', src:
                    `package baileyes.eyes.chains;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Slf4j @Order(1) @Component
public class FirstChainPart implements ChainPart {
    @Override
    public ProcessDataDto<?> process(ProcessDataDto<?> previousData) {
        log.info("Step 1: processing id={}", previousData.getId());
        return previousData;
    }
}` },
            { file: 'ChainManager.java', pkg: 'baileyes.eyes.chains', src:
                    `package baileyes.eyes.chains;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Slf4j @Service @RequiredArgsConstructor
public class ChainManager {

    private final List<ChainPart> chain;

    public ProcessDataDto<?> addSomething(UUID id, Object data) {
        log.info("addSomething id={}", id);
        return run(ProcessDataDto.builder().id(id).data(data).build());
    }

    private ProcessDataDto<?> run(ProcessDataDto<?> process) {
        for (ChainPart chainPart : chain) {
            process = chainPart.process(process);
        }
        return process;
    }
}` }
        ]
    });

    /* ===== 4. ADAPTER ===== */
    App.registerPattern('adapter', {
        title: 'Adapter', subtitle: 'ToyAdapter приводит OldCatToy.play() к интерфейсу NewCatToy', category: 'structural',
        javaClasses: ['OldCatToy', 'NewCatToy', 'ToyAdapter', 'AdapterConfig', 'AdapterService'],
        essence: '<p>Adapter: <code>ToyAdapter implements NewCatToy</code> держит ссылку на <code>OldCatToy</code> и делегирует ему <code>play()</code>.</p>',
        diagram: function (host) {
            var u = new Uml(800, 260);
            u.box(20, 30, 200, 'AdapterService', '@Service', ['- NewCatToy newCatToy', '+ playWithToy() : String'], 'spring');
            u.box(290, 20, 210, 'NewCatToy', '«interface» · target', ['+ play() : String'], 'iface');
            u.box(290, 150, 210, 'ToyAdapter', '@RequiredArgsConstructor', ['- OldCatToy oldCatToy', '+ play() : String'], 'spring');
            u.box(580, 150, 200, 'OldCatToy', 'adaptee · «старый API»', ['+ play() : String'], 'abs');
            u.arrow(220, 62, 290, 50, 'assoc', 'DI');
            u.arrow(395, 150, 395, 96, 'impl', 'реализует');
            u.arrow(500, 190, 580, 190, 'agg', 'o— делегирует');
            put(host, u, '<code>ToyAdapter ..|> NewCatToy</code> и <code>ToyAdapter o— OldCatToy</code>.');
        },
        demo: function (host, ctx) {
            host.innerHTML =
                '<div class="demo-controls">' +
                '<button class="btn err" data-direct>play() без адаптера</button>' +
                '<button class="btn primary" data-connect>подключить ToyAdapter</button>' +
                '<button class="btn ok" data-play disabled>newCatToy.play()</button>' +
                '<button class="btn ghost sm" data-clear>очистить</button>' +
                '</div>' +
                '<div class="panel"><h4>Стыковка разъёмов</h4><div class="plug-stage" id="adStage">' +
                '<div class="plug-row">' +
                '<div class="plug old" id="adOld"><div class="t">OldCatToy</div><div class="d">«старый API»</div><span class="pin"></span></div>' +
                '<div class="adapter-chip" id="adChip"><div class="t">ToyAdapter</div><div class="d">implements NewCatToy</div></div>' +
                '<div class="plug new" id="adNew"><span class="pin"></span><div class="t">NewCatToy</div><div class="d">target</div></div>' +
                '</div></div></div>' +
                '<div class="two-col" style="margin-top:14px"><div class="panel"><h4>Возврат play()</h4><div class="data-out" id="adOut">—</div></div><div id="adTerm"></div></div>';
            var term = ctx.terminal('baileyes.eyes.adapter · AdapterService');
            host.querySelector('#adTerm').appendChild(term.node);
            var old = host.querySelector('#adOld'), chip = host.querySelector('#adChip'), neo = host.querySelector('#adNew');
            var out = host.querySelector('#adOut'), playBtn = host.querySelector('[data-play]');
            var connected = false;
            host.querySelector('[data-direct]').addEventListener('click', function () {
                old.classList.remove('rejected'); void old.offsetWidth; old.classList.add('rejected');
                neo.classList.remove('rejected'); void neo.offsetWidth; neo.classList.add('rejected');
                term.error('interface mismatch: NewCatToy cannot be resolved from OldCatToy', 'AdapterService');
                out.innerHTML = '<span style="color:var(--err);font-weight:700">NoSuchBeanDefinitionException</span>';
            });
            host.querySelector('[data-connect]').addEventListener('click', function () {
                if (connected) return;
                term.info('@Bean ToyAdapter created', 'AdapterConfig');
                chip.classList.add('on');
                ctx.later(320, function () {
                    old.classList.add('connected'); neo.classList.add('connected');
                    connected = true; playBtn.disabled = false;
                    term.ok('ToyAdapter wired: NewCatToy <- ToyAdapter -> OldCatToy', 'AdapterConfig');
                });
            });
            playBtn.addEventListener('click', function () {
                if (!connected) return;
                term.info('newCatToy.play() -> oldCatToy.play()', 'ToyAdapter');
                ctx.later(280, function () {
                    term.ok('return "Play with old toy"', 'OldCatToy');
                    out.innerHTML = '<span class="seg b">"Play with old toy"</span>';
                });
            });
            host.querySelector('[data-clear]').addEventListener('click', function () { term.clear(); });
        },
        code: [
            { file: 'ToyAdapter.java', pkg: 'baileyes.eyes.adapter', src:
                    `package baileyes.eyes.adapter;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class ToyAdapter implements NewCatToy {

    private final OldCatToy oldCatToy;

    @Override
    public String play() {
        return oldCatToy.play();
    }
}` },
            { file: 'AdapterConfig.java', pkg: 'baileyes.eyes.adapter', src:
                    `package baileyes.eyes.adapter;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AdapterConfig {

    @Bean
    public OldCatToy oldCatToy() { return new OldCatToy(); }

    @Bean
    public ToyAdapter toyAdapter(OldCatToy oldCatToy) {
        return new ToyAdapter(oldCatToy);
    }
}` }
        ]
    });

    /* ===== 5. BRIDGE ===== */
    App.registerPattern('bridge', {
        title: 'Bridge', subtitle: 'Animal + AnimalBehavior: две независимые иерархии через @Qualifier', category: 'structural',
        javaClasses: ['Animal', 'HappyCat', 'HappyDog', 'AnimalBehavior', 'CatBehavior', 'DogBehavior'],
        essence: '<p>Bridge разделяет абстракцию и реализацию. <code>abstract class Animal</code> хранит ' +
            '<code>protected AnimalBehavior behavior</code>, а наследники получают поведение через <code>@Qualifier</code>.</p>',
        diagram: function (host) {
            var u = new Uml(820, 280);
            u.box(20, 30, 235, 'Animal', '«abstract class»', ['# AnimalBehavior behavior', '+ showBehavior() «abstract»'], 'abs');
            u.box(20, 175, 110, 'HappyCat', '@Component', ['+ showBehavior()'], 'spring');
            u.box(145, 175, 110, 'HappyDog', '@Component', ['+ showBehavior()'], 'spring');
            u.box(470, 30, 250, 'AnimalBehavior', '«interface»', ['+ performAction() : void'], 'iface');
            u.box(470, 175, 115, 'CatBehavior', '@Component', ['+ performAction()'], 'spring');
            u.box(600, 175, 115, 'DogBehavior', '@Component', ['+ performAction()'], 'spring');
            u.arrow(75, 175, 100, 128, 'ext', '');
            u.arrow(200, 175, 175, 128, 'ext', '');
            u.arrow(527, 175, 555, 100, 'impl', '');
            u.arrow(657, 175, 630, 100, 'impl', '');
            u.arrow(255, 66, 470, 66, 'agg', 'behavior (BRIDGE)', 0, -9);
            put(host, u, 'Горизонтальная связь <code>Animal o— AnimalBehavior</code> — «мост» между иерархиями.');
        },
        demo: function (host, ctx) {
            host.innerHTML =
                '<div class="bridge-stage">' +
                '<div class="axis"><h4>Абстракция</h4>' +
                '<button class="axis-item sel" data-ab="HappyCat"><div class="nm">HappyCat</div><div class="ds">extends Animal</div></button>' +
                '<button class="axis-item" data-ab="HappyDog"><div class="nm">HappyDog</div><div class="ds">extends Animal</div></button>' +
                '</div>' +
                '<div class="bridge-mid">' +
                '<svg width="120" height="72" viewBox="0 0 120 72"><path d="M4,36 H116" stroke="var(--accent)" stroke-width="3" stroke-dasharray="7 5" fill="none">' +
                '<animate attributeName="stroke-dashoffset" from="24" to="0" dur="1s" repeatCount="indefinite"/></path>' +
                '<circle cx="4" cy="36" r="4" fill="var(--accent)"/><circle cx="116" cy="36" r="4" fill="var(--violet)"/></svg>' +
                '<div class="wire">@Qualifier → protected behavior</div>' +
                '<button class="btn primary" data-show>showBehavior()</button>' +
                '</div>' +
                '<div class="axis"><h4>Реализация</h4>' +
                '<button class="axis-item sel" data-bh="CatBehavior"><div class="nm">CatBehavior</div><div class="ds">implements AnimalBehavior</div></button>' +
                '<button class="axis-item" data-bh="DogBehavior"><div class="nm">DogBehavior</div><div class="ds">implements AnimalBehavior</div></button>' +
                '</div>' +
                '</div>' +
                '<div class="panel" style="margin-top:14px"><h4>2 × 2 = 4 комбинации без 4 подклассов</h4><div class="combo-grid" id="brCombos"></div></div>' +
                '<div id="brTerm" style="margin-top:14px"></div>';
            var term = ctx.terminal('baileyes.eyes.bridge · console');
            host.querySelector('#brTerm').appendChild(term.node);
            var ab = 'HappyCat', bh = 'CatBehavior';
            var combos = [['HappyCat', 'CatBehavior'], ['HappyCat', 'DogBehavior'], ['HappyDog', 'CatBehavior'], ['HappyDog', 'DogBehavior']];
            var combosHost = host.querySelector('#brCombos');
            function paint() {
                combosHost.innerHTML = combos.map(function (c) {
                    var live = c[0] === ab && c[1] === bh;
                    return '<div class="combo' + (live ? ' live' : '') + '">' + c[0] + ' × ' + c[1] +
                        '<em>' + (live ? '● активная пара' : '○ свободная комбинация') + '</em></div>';
                }).join('');
                Array.prototype.forEach.call(host.querySelectorAll('[data-ab]'), function (b) { b.classList.toggle('sel', b.getAttribute('data-ab') === ab); });
                Array.prototype.forEach.call(host.querySelectorAll('[data-bh]'), function (b) { b.classList.toggle('sel', b.getAttribute('data-bh') === bh); });
            }
            Array.prototype.forEach.call(host.querySelectorAll('[data-ab]'), function (b) {
                b.addEventListener('click', function () { ab = b.getAttribute('data-ab'); paint(); term.debug('мост: абстракция = ' + ab, 'Spring'); });
            });
            Array.prototype.forEach.call(host.querySelectorAll('[data-bh]'), function (b) {
                b.addEventListener('click', function () { bh = b.getAttribute('data-bh'); paint(); term.debug('@Qualifier("' + bh.charAt(0).toLowerCase() + bh.slice(1) + '")', 'Spring'); });
            });
            host.querySelector('[data-show]').addEventListener('click', function () {
                term.info(ab + '.showBehavior() invoked', ab);
                ctx.later(240, function () {
                    term.raw('<span class="ansi-bright-cyan">' + esc(ab + ': ') + '</span><span class="ansi-green">' + esc(bh + ': performAction') + '</span>');
                });
            });
            paint();
        },
        code: [
            { file: 'HappyCat.java', pkg: 'baileyes.eyes.bridge', src:
                    `package baileyes.eyes.bridge;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

@Component
public class HappyCat extends Animal {

    public HappyCat(@Qualifier("catBehavior") AnimalBehavior behavior) {
        this.behavior = behavior;
    }

    @Override
    public void showBehavior() {
        System.out.print("HappyCat: ");
        behavior.performAction();
    }
}` },
            { file: 'CatBehavior.java', pkg: 'baileyes.eyes.bridge', src:
                    `package baileyes.eyes.bridge;

import org.springframework.stereotype.Component;

@Component("catBehavior")
public class CatBehavior implements AnimalBehavior {
    @Override
    public void performAction() {
        System.out.println("CatBehavior: performAction");
    }
}` }
        ]
    });

    /* ===== 6. DECORATOR ===== */
    App.registerPattern('decorator', {
        title: 'Decorator', subtitle: 'BaseServiceDecorator(FirstDecorator(BaseService)) — слои без изменения базы', category: 'structural',
        javaClasses: ['BaseService', 'BaseServiceDecorator', 'FirstDecorator', 'SecondDecorator', 'RandomDataDTO'],
        essence: '<p>Decorator: <code>FirstDecorator</code>/<code>SecondDecorator</code> дописывают к результату через <code>data.concat(…)</code>. ' +
            'Порядок обёрток определяет порядок concat.</p>',
        diagram: function (host) {
            var u = new Uml(820, 280);
            u.box(290, 15, 240, 'BaseService', '@Service', ['+ performAction() : RandomDataDTO', '+ performDecoratedAction()'], 'spring');
            u.box(290, 130, 240, 'BaseServiceDecorator', '«abstract»', ['# BaseService baseService', '+ performAction()'], 'abs');
            u.box(120, 220, 175, 'FirstDecorator', 'extends', ['+ performAction()', 'concat(" First Decorator Data")']);
            u.box(520, 220, 180, 'SecondDecorator', 'extends', ['+ performAction()', 'concat(" Second Decorator Data")']);
            u.arrow(410, 130, 410, 92, 'ext', 'extends');
            u.arrow(200, 220, 340, 180, 'ext', '');
            u.arrow(610, 220, 480, 180, 'ext', '');
            u.arrow(560, 168, 530, 168, 'agg', 'o— baseService', 0, -8);
            put(host, u, 'Декораторы — is-a BaseService и has-a BaseService, поэтому обёртки вкладываются произвольно.');
        },
        demo: function (host, ctx) {
            host.innerHTML =
                '<div class="demo-controls">' +
                '<label class="switch"><input type="checkbox" id="dcFirst" checked><span class="track"></span>+ FirstDecorator</label>' +
                '<label class="switch"><input type="checkbox" id="dcSecond" checked><span class="track"></span>+ SecondDecorator</label>' +
                '<button class="btn primary" data-run>performAction()</button>' +
                '<button class="btn" data-decorated>performDecoratedAction()</button>' +
                '<button class="btn ghost sm" data-clear>очистить</button>' +
                '</div>' +
                '<div class="two-col"><div class="panel"><h4>Башня обёрток</h4><div class="onion" id="dcOnion"></div></div>' +
                '<div class="stack-col"><div class="panel"><h4>RandomDataDTO.data</h4><div class="data-out" id="dcOut">—</div></div><div id="dcTerm"></div></div></div>';
            var term = ctx.terminal('baileyes.eyes.decorator');
            host.querySelector('#dcTerm').appendChild(term.node);
            var onion = host.querySelector('#dcOnion'), out = host.querySelector('#dcOut');
            var f = host.querySelector('#dcFirst'), s = host.querySelector('#dcSecond');
            function render() {
                var inner = '<div class="layer core" data-l="base"><div class="lname">BaseService</div></div>';
                if (f.checked) inner = '<div class="layer l1" data-l="first"><div class="lname">FirstDecorator</div>' + inner + '</div>';
                if (s.checked) inner = '<div class="layer l2" data-l="second"><div class="lname">SecondDecorator</div>' + inner + '</div>';
                onion.innerHTML = inner;
            }
            function layers() {
                var arr = [];
                if (s.checked) arr.push('second');
                if (f.checked) arr.push('first');
                arr.push('base'); return arr;
            }
            function run() {
                render();
                var order = layers(), segs = [{ cls: 'b', txt: 'Base Service Data' }];
                term.info('performAction() on ' + order.join(' → '), 'BaseService');
                var i = 0;
                function step() {
                    if (i >= order.length) { finish(); return; }
                    var l = order[i];
                    var el = onion.querySelector('[data-l="' + l + '"]');
                    if (el) { el.classList.add('unwind'); ctx.later(420, function () { el.classList.remove('unwind'); }); }
                    if (l !== 'base') segs.push({ cls: l === 'first' ? 'd1' : 'd2', txt: l === 'first' ? ' First Decorator Data' : ' Second Decorator Data' });
                    i++; ctx.later(450, step);
                }
                function finish() {
                    out.innerHTML = segs.map(function (sg, n) {
                        return '<span class="seg ' + sg.cls + '" style="animation-delay:' + (n * 90) + 'ms">' + esc(sg.txt.trim()) + '</span>';
                    }).join(' ');
                    term.ok('result = "' + segs.map(function (x) { return x.txt.trim(); }).join(' ') + '"', 'BaseService');
                }
                step();
            }
            f.addEventListener('change', render); s.addEventListener('change', render);
            host.querySelector('[data-run]').addEventListener('click', run);
            host.querySelector('[data-decorated]').addEventListener('click', function () { f.checked = true; s.checked = true; run(); });
            host.querySelector('[data-clear]').addEventListener('click', function () { term.clear(); });
            render();
        },
        code: [
            { file: 'FirstDecorator.java', pkg: 'baileyes.eyes.decorator', src:
                    `package baileyes.eyes.decorator;

public class FirstDecorator extends BaseServiceDecorator {

    public FirstDecorator(BaseService baseService) { super(baseService); }

    @Override
    public RandomDataDTO performAction() {
        RandomDataDTO dto = super.performAction();
        return new RandomDataDTO(dto.getData().concat(" First Decorator Data"));
    }
}` },
            { file: 'BaseService.java', pkg: 'baileyes.eyes.decorator', src:
                    `package baileyes.eyes.decorator;

import org.springframework.stereotype.Service;

@Service
public class BaseService {

    public RandomDataDTO performAction() {
        return new RandomDataDTO("Base Service Data");
    }

    public RandomDataDTO performDecoratedAction() {
        return new SecondDecorator(new FirstDecorator(this)).performAction();
    }
}` }
        ]
    });

    /* ===== 7. FACADE ===== */
    App.registerPattern('facade', {
        title: 'Facade + async composition', subtitle: 'Facade.performTasks() = taskA.thenCombine(taskB) — ~2 с вместо ~4', category: 'creational',
        javaClasses: ['Facade', 'SubsystemA', 'SubsystemB', 'AsyncService', 'CustomAsyncConfig'],
        essence: '<p>Facade: <code>taskA.thenCombine(taskB, (a, b) -&gt; a + " | " + b)</code>. Параллельно ~2 с, не ~4 с.</p>',
        diagram: function (host) {
            var u = new Uml(820, 250);
            u.box(20, 30, 210, 'AsyncService', '@Service @Async', ['+ executeAsyncTasks()'], 'spring');
            u.box(300, 25, 210, 'Facade', '@Component', ['+ performTasks() : CompletableFuture<String>'], 'spring');
            u.box(250, 150, 150, 'SubsystemA', '@Component', ['+ performTaskA()', 'sleep(2000)'], 'spring');
            u.box(430, 150, 150, 'SubsystemB', '@Component', ['+ performTaskB()', 'sleep(2000)'], 'spring');
            u.box(620, 25, 180, 'CustomAsyncConfig', '@Configuration', ['taskExecutor'], 'spring');
            u.arrow(230, 58, 300, 58, 'assoc', 'DI');
            u.arrow(360, 96, 320, 150, 'assoc', 'taskA');
            u.arrow(450, 96, 505, 150, 'assoc', 'taskB');
            put(host, u, 'Фасад — единая точка входа, скрывает и подсистемы, и композицию CompletableFuture.');
        },
        demo: function (host, ctx) {
            host.innerHTML =
                '<div class="demo-controls">' +
                '<button class="btn primary" data-run>▶ Facade.performTasks()</button>' +
                '<label class="switch"><input type="checkbox" id="fcSeq"><span class="track"></span>последовательно</label>' +
                '<button class="btn ghost sm" data-clear>очистить</button>' +
                '</div>' +
                '<div class="two-col"><div class="panel"><h4>Прогресс</h4>' +
                '<div class="sys-row"><span class="nm">SubsystemA</span><div class="bar"><i id="fcBarA"></i></div><span class="ms" id="fcMsA">0 ms</span></div>' +
                '<div class="sys-row"><span class="nm">SubsystemB</span><div class="bar"><i id="fcBarB"></i></div><span class="ms" id="fcMsB">0 ms</span></div>' +
                '<div id="fcOut"></div></div><div id="fcTerm"></div></div>';
            var term = ctx.terminal('baileyes.eyes.facade');
            host.querySelector('#fcTerm').appendChild(term.node);
            var DUR = 2000, running = false;
            var barA = host.querySelector('#fcBarA'), barB = host.querySelector('#fcBarB');
            var msA = host.querySelector('#fcMsA'), msB = host.querySelector('#fcMsB');
            var seq = host.querySelector('#fcSeq'), out = host.querySelector('#fcOut');
            function run() {
                if (running) return; running = true;
                out.innerHTML = '';
                barA.style.width = '0%'; barB.style.width = '0%';
                msA.textContent = '0 ms'; msB.textContent = '0 ms';
                var parallel = !seq.checked, t0 = performance.now();
                var sA = 0, sB = parallel ? 0 : DUR, eA = DUR, eB = (parallel ? DUR : DUR * 2);
                term.info(parallel ? 'Facade.performTasks(): параллельно' : 'Последовательно', 'Facade');
                var iv = ctx.every(50, function () {
                    var e = performance.now() - t0;
                    barA.style.width = Math.min(100, Math.max(0, (e - sA) / DUR * 100)) + '%';
                    barB.style.width = Math.min(100, Math.max(0, (e - sB) / DUR * 100)) + '%';
                    msA.textContent = Math.round(Math.min(e, DUR)) + ' ms';
                    msB.textContent = (sB <= e ? Math.round(Math.min(e - sB, DUR)) : 0) + ' ms';
                });
                var done = 0;
                function finish() {
                    if (++done < 2) return;
                    var total = Math.round(performance.now() - t0);
                    ctx.cancel(iv);
                    term.ok('TOTAL: ' + total + ' ms ' + (parallel ? '(параллельно)' : '(последовательно)'), 'Facade');
                    out.innerHTML = '<div class="merge-out">"Result from Subsystem A | Result from Subsystem B"</div>' +
                        '<p class="hint">Замер: <b>' + total + ' ms</b>. ' + (parallel ? 'Выигрыш фасада ~2×.' : 'Времена сложились.') + '</p>';
                    running = false;
                }
                ctx.later(DUR, function () { finish(); });
                ctx.later(eB, function () { finish(); });
            }
            host.querySelector('[data-run]').addEventListener('click', run);
            host.querySelector('[data-clear]').addEventListener('click', function () { term.clear(); });
        },
        code: [
            { file: 'Facade.java', pkg: 'baileyes.eyes.facade', src:
                    `package baileyes.eyes.facade;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;

@Component @RequiredArgsConstructor
public class Facade {

    private final SubsystemA subsystemA;
    private final SubsystemB subsystemB;

    public CompletableFuture<String> performTasks() {
        CompletableFuture<String> taskA = subsystemA.performTaskA();
        CompletableFuture<String> taskB = subsystemB.performTaskB();
        return taskA.thenCombine(taskB, (a, b) -> a + " | " + b);
    }
}` },
            { file: 'SubsystemA.java', pkg: 'baileyes.eyes.facade', src:
                    `package baileyes.eyes.facade;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;

@Slf4j @Component
public class SubsystemA {
    public CompletableFuture<String> performTaskA() {
        return CompletableFuture.supplyAsync(() -> {
            try { Thread.sleep(2000); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            return "Result from Subsystem A";
        });
    }
}` }
        ]
    });

    /* ===== 8. FACTORY ===== */
    App.registerPattern('factory', {
        title: 'Factory Method + Abstract Factory', subtitle: 'ToyFactory.someOperation() + PetToyFactory — два уровня фабрик', category: 'creational',
        javaClasses: ['PetToy', 'BallToy', 'RopeToy', 'ToyFactory', 'BallToyFactory', 'RopeToyFactory', 'PetToyFactory', 'CatBall', 'DogBone', 'CatScratcher', 'DogChewToy'],
        essence: '<p>Factory Method: абстрактная <code>ToyFactory</code> и <code>someOperation()</code>. ' +
            'Abstract Factory: <code>PetToyFactory</code> гарантирует согласованное семейство <code>CatToy + DogToy</code>.</p>',
        diagram: function (host) {
            var u = new Uml(820, 280);
            u.box(300, 15, 220, 'ToyFactory', '«abstract»', ['+ createToy() : PetToy', '+ someOperation()'], 'abs');
            u.box(120, 140, 175, 'BallToyFactory', '@Component', ['+ createToy() → BallToy'], 'spring');
            u.box(520, 140, 175, 'RopeToyFactory', '@Component', ['+ createToy() → RopeToy'], 'spring');
            u.box(320, 140, 180, 'PetToy', '«interface»', ['+ use()'], 'iface');
            u.box(250, 240, 140, 'BallToy', '@Component', ['+ use()'], 'spring');
            u.box(430, 240, 140, 'RopeToy', '@Component', ['+ use()'], 'spring');
            u.arrow(210, 140, 340, 92, 'ext', '');
            u.arrow(600, 140, 480, 92, 'ext', '');
            u.arrow(330, 240, 385, 196, 'impl', '');
            u.arrow(490, 240, 440, 196, 'impl', '');
            put(host, u, 'someOperation() не знает, какой именно продукт получит.');
        },
        demo: function (host, ctx) {
            host.innerHTML =
                '<div class="demo-controls">' +
                '<div class="field"><span class="lbl">ToyFactory</span>' +
                '<select id="fmFactory"><option value="BallToyFactory">BallToyFactory</option><option value="RopeToyFactory">RopeToyFactory</option></select></div>' +
                '<button class="btn primary" data-fm>someOperation()</button>' +
                '<button class="btn ghost sm" data-fmclear>очистить</button>' +
                '</div>' +
                '<div class="panel"><h4>Конвейер</h4><div class="conveyor" id="fmBelt"><span class="hint">Пусто</span></div></div>' +
                '<div id="fmTerm" style="margin-top:14px"></div>';
            var t1 = ctx.terminal('ToyProductionService');
            host.querySelector('#fmTerm').appendChild(t1.node);
            var belt = host.querySelector('#fmBelt');
            var TOYS = {
                BallToyFactory: { product: 'BallToy', emoji: '⚽', log: 'Playing with BallToy' },
                RopeToyFactory: { product: 'RopeToy', emoji: '🪢', log: 'Playing with RopeToy' }
            };
            host.querySelector('[data-fm]').addEventListener('click', function () {
                var f = host.querySelector('#fmFactory').value, t = TOYS[f];
                t1.info('toyFactory = ' + f, 'ToyProductionService');
                t1.debug('someOperation() → createToy().use()', f);
                ctx.later(320, function () {
                    belt.innerHTML = '<div class="toy"><span class="em">' + t.emoji + '</span>' + t.product + '</div>';
                    t1.ok(t.product + '.use(): ' + t.log, t.product);
                });
            });
            host.querySelector('[data-fmclear]').addEventListener('click', function () { t1.clear(); });
        },
        code: [
            { file: 'ToyFactory.java', pkg: 'baileyes.eyes.factory', src:
                    `package baileyes.eyes.factory;

public abstract class ToyFactory {
    public abstract PetToy createToy();
    public void someOperation() { createToy().use(); }
}` },
            { file: 'BallToyFactory.java', pkg: 'baileyes.eyes.factory', src:
                    `package baileyes.eyes.factory;

import org.springframework.stereotype.Component;

@Component
public class BallToyFactory extends ToyFactory {
    @Override public PetToy createToy() { return new BallToy(); }
}` }
        ]
    });

    /* ===== 9. CIRCUIT-BREAKER ===== */
    App.registerPattern('circuit-breaker', {
        title: 'Circuit-breaker starter', subtitle: 'CircuitBreakerAspect (@Around) оборачивает методы в Resilience4j', category: 'infrastructure',
        javaClasses: ['CircuitBreakerAspect', 'Resilience4jConfig'],
        essence: '<p><code>CircuitBreakerAspect</code> точкой среза <code>within(*.service..*)</code> оборачивает каждый метод в ' +
            '<code>registry.circuitBreaker("defaultCircuitBreaker").executeCallable(...)</code>. При превышении failureRate — OPEN, ' +
            'через wait-duration — HALF_OPEN.</p>',
        diagram: function (host) {
            var u = new Uml(830, 260);
            u.box(20, 20, 260, 'CircuitBreakerAspect', '@Aspect @Component', ['- CircuitBreakerRegistry registry', '+ serviceMethod()', '+ @Around wrapWithCircuitBreaker'], 'spring');
            u.box(340, 20, 230, 'Resilience4jConfig', '@Configuration', ['+ circuitBreakerRegistry()'], 'spring');
            u.box(620, 20, 195, 'CircuitBreakerRegistry', 'resilience4j', ['+ circuitBreaker(name)'], 'iface');
            u.box(340, 160, 230, 'TargetService', '*.service', ['+ doWork()'], 'spring');
            u.arrow(280, 55, 340, 55, 'dep', '');
            u.arrow(570, 55, 620, 55, 'assoc', 'DI');
            u.arrow(150, 120, 380, 160, 'dep', 'перехватывает');
            put(host, u, 'Если в классе уже есть поле CircuitBreaker, аспект не вмешивается.');
        },
        demo: function (host, ctx) {
            host.innerHTML =
                '<div class="demo-controls">' +
                '<button class="btn primary" data-call>вызвать service.method()</button>' +
                '<button class="btn" data-burst>10 вызовов подряд</button>' +
                '<label class="switch"><input type="checkbox" id="cbFail"><span class="track"></span>метод падает</label>' +
                '<label class="switch"><input type="checkbox" id="cbInjected"><span class="track"></span>есть поле CircuitBreaker</label>' +
                '<button class="btn ghost sm" data-reset>сброс</button>' +
                '</div>' +
                '<div class="breaker-stage">' +
                '<div class="panel breaker-box" id="cbBox">' +
                '<h4>Рубильник</h4>' +
                '<svg class="brk-svg" viewBox="0 0 200 150">' +
                '<rect class="brk-body" x="20" y="24" width="160" height="104" rx="10"/>' +
                '<circle cx="60" cy="96" r="7" fill="var(--uml-line)"/>' +
                '<circle cx="150" cy="52" r="7" fill="var(--uml-line)"/>' +
                '<line class="brk-lever" x1="60" y1="96" x2="150" y2="52"/>' +
                '<circle class="brk-lamp" cx="100" cy="42" r="9"/>' +
                '<text x="100" y="122" text-anchor="middle" class="uml-lbl">defaultCircuitBreaker</text>' +
                '</svg>' +
                '<div class="brk-state" id="cbState">CLOSED</div>' +
                '<div class="waitbar"><i id="cbWait"></i></div>' +
                '</div>' +
                '<div class="panel" style="flex:2 1 320px;min-width:260px"><h4>Метрики Resilience4j</h4><div class="metrics" id="cbMetrics"></div></div>' +
                '</div>' +
                '<div id="cbTerm" style="margin-top:14px"></div>';
            var term = ctx.terminal('CircuitBreakerAspect');
            host.querySelector('#cbTerm').appendChild(term.node);
            var box = host.querySelector('#cbBox'), stateEl = host.querySelector('#cbState'), metrics = host.querySelector('#cbMetrics');
            var waitBar = host.querySelector('#cbWait');
            var CFG = { window: 10, minCalls: 5, failureRate: 50, wait: 6000, halfOpenPermitted: 3 };
            var S = { state: 'CLOSED', windowBuf: [], success: 0, failed: 0, notPermitted: 0, openedAt: 0, halfDone: 0, halfFail: 0, waitTimer: null };
            function failureRate() { if (!S.windowBuf.length) return 0; return Math.round(S.windowBuf.filter(function (x) { return !x; }).length / S.windowBuf.length * 100); }
            function paint() {
                box.className = 'panel breaker-box state-' + S.state;
                stateEl.textContent = S.state;
                var fr = failureRate();
                metrics.innerHTML =
                    m('failureRate', fr + '%', fr >= CFG.failureRate ? 'bad' : 'good') +
                    m('buffered', S.windowBuf.length + '/' + CFG.window, '') +
                    m('success', S.success, 'good') +
                    m('failed', S.failed, S.failed ? 'bad' : '') +
                    m('notPermitted', S.notPermitted, S.notPermitted ? 'warnc' : '') +
                    m('state', S.state, S.state === 'OPEN' ? 'bad' : (S.state === 'HALF_OPEN' ? 'warnc' : 'good'));
                function m(k, v, c) { return '<div class="metric"><div class="k">' + k + '</div><div class="v ' + c + '">' + v + '</div></div>'; }
            }
            function to(ns, reason) {
                if (S.state === ns) return;
                var old = S.state; S.state = ns;
                if (ns === 'OPEN') { S.openedAt = Date.now(); S.halfDone = 0; S.halfFail = 0; term.error('→ OPEN: failureRate=' + failureRate() + '% (' + reason + ')', 'CB'); startWait(); }
                else if (ns === 'HALF_OPEN') term.warn('→ HALF_OPEN', 'CB');
                else { S.windowBuf = []; term.ok('→ CLOSED', 'CB'); }
                paint();
            }
            function startWait() {
                if (S.waitTimer) ctx.cancel(S.waitTimer);
                var t0 = Date.now();
                S.waitTimer = ctx.every(120, function () {
                    var p = (Date.now() - t0) / CFG.wait;
                    waitBar.style.width = Math.min(100, p * 100) + '%';
                    if (p >= 1) { ctx.cancel(S.waitTimer); S.waitTimer = null; waitBar.style.width = '0%'; to('HALF_OPEN', 'wait'); }
                });
                ctx.onLeave(function () { if (S.waitTimer) ctx.cancel(S.waitTimer); });
            }
            function call() {
                var injected = host.querySelector('#cbInjected').checked, fails = host.querySelector('#cbFail').checked;
                if (injected) {
                    term.info('usesInjectedCircuitBreaker() = true → bypass default breaker', 'CBAspect');
                    if (fails) { term.error('RuntimeException: downstream timeout', 'Target'); S.failed++; }
                    else term.ok('TargetService.doWork() = ok', 'Target');
                    paint(); return;
                }
                if (S.state === 'OPEN') {
                    var left = CFG.wait - (Date.now() - S.openedAt);
                    if (left > 0) { S.notPermitted++; term.error('CallNotPermittedException: ' + (left / 1000).toFixed(1) + ' s left', 'CB'); paint(); return; }
                    to('HALF_OPEN', 'wait');
                }
                if (S.state === 'HALF_OPEN') {
                    S.halfDone++;
                    if (fails) { S.halfFail++; S.failed++; term.error('probe failed', 'Target'); }
                    else { S.success++; term.ok('probe success', 'Target'); }
                    if (S.halfDone >= CFG.halfOpenPermitted) {
                        var okRate = (S.halfDone - S.halfFail) / S.halfDone * 100;
                        to(okRate >= (100 - CFG.failureRate) ? 'CLOSED' : 'OPEN', 'probe');
                    } else paint();
                    return;
                }
                term.info('executeCallable(pjp::proceed)', 'CBAspect');
                if (fails) { S.failed++; S.windowBuf.push(false); term.error('RuntimeException: timeout', 'Target'); }
                else { S.success++; S.windowBuf.push(true); term.ok('doWork() = ok', 'Target'); }
                if (S.windowBuf.length > CFG.window) S.windowBuf.shift();
                paint();
                if (S.windowBuf.length >= CFG.minCalls && failureRate() >= CFG.failureRate) to('OPEN', 'threshold');
            }
            host.querySelector('[data-call]').addEventListener('click', call);
            host.querySelector('[data-burst]').addEventListener('click', function () {
                var n = 0, iv = ctx.every(180, function () { call(); if (++n >= 10) ctx.cancel(iv); });
            });
            host.querySelector('[data-reset]').addEventListener('click', function () {
                if (S.waitTimer) ctx.cancel(S.waitTimer);
                S = { state: 'CLOSED', windowBuf: [], success: 0, failed: 0, notPermitted: 0, openedAt: 0, halfDone: 0, halfFail: 0, waitTimer: null };
                waitBar.style.width = '0%'; paint(); term.clear();
            });
            paint();
        },
        code: [
            { file: 'CircuitBreakerAspect.java', pkg: 'baileyes.eyes.circuitbreaker', src:
                    `package baileyes.eyes.circuitbreaker;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;

import java.lang.reflect.Field;
import java.util.Arrays;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Aspect @Component @RequiredArgsConstructor
public class CircuitBreakerAspect {

    private final CircuitBreakerRegistry registry;
    private final ConcurrentMap<Class<?>, Boolean> cache = new ConcurrentHashMap<>();

    @Pointcut("within(ru.your.project.*.service..*) && !@annotation(CircuitBreaker)")
    public void serviceMethods() {}

    @Around("serviceMethods()")
    public Object wrapWithCircuitBreaker(ProceedingJoinPoint pjp) throws Throwable {
        Class<?> type = pjp.getTarget().getClass();
        if (usesInjectedCircuitBreaker(type)) {
            return pjp.proceed();
        }
        return registry.circuitBreaker("defaultCircuitBreaker").executeCallable(pjp::proceed);
    }

    private boolean usesInjectedCircuitBreaker(Class<?> type) {
        return cache.computeIfAbsent(type, c ->
            Arrays.stream(c.getDeclaredFields())
                  .map(Field::getType)
                  .anyMatch(CircuitBreaker.class::isAssignableFrom));
    }
}` }
        ]
    });

    /* ===== 10. EXCEPTION HANDLER ===== */
    App.registerPattern('exception-handler', {
        title: 'GlobalExceptionHandler', subtitle: '@RestControllerAdvice превращает исключения в JSON с нужным HTTP-статусом', category: 'infrastructure',
        javaClasses: ['GlobalExceptionHandler', 'ErrorResponse'],
        essence: '<p>Маппинг: <code>MissingServletRequestParameterException</code> → 400, ' +
            '<code>IllegalArgumentException</code> → 400, <code>NullPointerException</code> → 500. ' +
            '<code>buildErrorResponseEntity</code> склеивает suppressed через <code>"\\nSuppressed: "</code>.</p>',
        diagram: function (host) {
            var u = new Uml(830, 260);
            u.box(270, 15, 290, 'GlobalExceptionHandler', '@RestControllerAdvice @Aspect', ['+ handleMissingParam(…)', '+ handleValidation(…)', '+ handleIllegalArgument(…)', '+ handleNpe(…)', '- buildErrorResponseEntity(status, msg, ex)'], 'spring');
            u.box(20, 40, 200, 'MissingServletRequestParameterException', '→ 400', []);
            u.box(20, 130, 200, 'IllegalArgumentException', '→ 400', []);
            u.box(620, 40, 190, 'NullPointerException', '→ 500', []);
            u.box(620, 140, 190, 'ErrorResponse', 'body', ['String message'], 'entity');
            u.arrow(220, 60, 270, 60, 'dep', '@ExceptionHandler');
            u.arrow(220, 150, 270, 120, 'dep', '');
            u.arrow(620, 60, 560, 70, 'dep', '');
            u.arrow(560, 220, 620, 180, 'comp', 'new');
            put(host, u, 'Все обработчики сходятся в один приватный buildErrorResponseEntity.');
        },
        demo: function (host, ctx) {
            host.innerHTML =
                '<div class="demo-controls">' +
                '<div class="field"><span class="lbl">что бросить</span>' +
                '<select id="exKind" style="min-width:290px">' +
                '<option value="success">успех 200</option>' +
                '<option value="missing">MissingServletRequestParameterException</option>' +
                '<option value="validation">MethodArgumentNotValidException</option>' +
                '<option value="illegal" selected>IllegalArgumentException</option>' +
                '<option value="npe">NullPointerException</option>' +
                '<option value="other">RuntimeException</option>' +
                '</select></div>' +
                '<label class="switch"><input type="checkbox" id="exSup"><span class="track"></span>+ suppressed</label>' +
                '<button class="btn primary" data-send>POST /api/demo</button>' +
                '<button class="btn ghost sm" data-clear>очистить</button>' +
                '</div>' +
                '<div class="http-split">' +
                '<div class="stack-col"><div class="panel"><h4>Запрос</h4><pre class="json" id="exReq"></pre></div><div id="exTerm"></div></div>' +
                '<div class="panel" style="padding:0"><div style="padding:13px"><h4>Ответ</h4></div>' +
                '<div class="http-resp" style="border:none"><div class="http-status" id="exStatus"></div><pre class="json" id="exBody">{ }</pre><div class="stack" id="exStack"></div></div>' +
                '</div></div>';
            var term = ctx.terminal('GlobalExceptionHandler');
            host.querySelector('#exTerm').appendChild(term.node);
            var reqEl = host.querySelector('#exReq'), stEl = host.querySelector('#exStatus');
            var bodyEl = host.querySelector('#exBody'), stackEl = host.querySelector('#exStack');
            var CASES = {
                success:    { status: 200, msg: null },
                missing:    { status: 400, name: 'MissingServletRequestParameterException', msg: 'Missing request parameter: individualId' },
                validation: { status: 400, name: 'MethodArgumentNotValidException', msg: 'Validation error: name must not be blank' },
                illegal:    { status: 400, name: 'IllegalArgumentException', msg: 'The provided argument is invalid: Unknown animal type: UNKNOWN' },
                npe:        { status: 500, name: 'NullPointerException', msg: 'Internal server error: null' },
                other:      { status: 500, name: 'RuntimeException', msg: 'Internal server error: unexpected failure' }
            };
            function badge(s) { return '<span class="status-badge s-' + (s < 300 ? '2' : (s < 500 ? '4' : '5')) + 'xx">' + s + '</span>'; }
            function send() {
                var kind = host.querySelector('#exKind').value, withSup = host.querySelector('#exSup').checked, c = CASES[kind];
                reqEl.textContent = 'POST /api/demo HTTP/1.1\nContent-Type: application/json\n\n{\n  "scenario": "' + kind + '"\n}';
                stackEl.textContent = '';
                if (kind === 'success') {
                    ctx.later(260, function () {
                        term.ok('handled successfully → 200', 'DemoController');
                        stEl.innerHTML = badge(200) + ' OK';
                        bodyEl.innerHTML = App.hlJson('{\n  "status": "OK"\n}');
                    });
                    return;
                }
                ctx.later(240, function () {
                    term.error(c.name + ': ' + c.msg, 'GlobalExceptionHandler');
                    var message = c.msg;
                    if (withSup) message += '\\nSuppressed: java.io.IOException: connection reset\\nSuppressed: TimeoutException';
                    stEl.innerHTML = badge(c.status) + ' ' + (c.status === 400 ? 'Bad Request' : 'Internal Server Error');
                    bodyEl.innerHTML = App.hlJson('{\n  "message": "' + message.replace(/\n/g, '\\n') + '"\n}');
                    stackEl.textContent = c.name + ': ' + c.msg + (withSup ? '\n\tSuppressed: java.io.IOException\n\tSuppressed: TimeoutException' : '');
                });
            }
            host.querySelector('[data-send]').addEventListener('click', send);
            host.querySelector('[data-clear]').addEventListener('click', function () { term.clear(); stackEl.textContent = ''; });
        },
        code: [
            { file: 'GlobalExceptionHandler.java', pkg: 'baileyes.eyes.exceptionhandler', src:
                    `package baileyes.eyes.exceptionhandler;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j @RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissing(MissingServletRequestParameterException ex) {
        return build(HttpStatus.BAD_REQUEST, "Missing request parameter: " + ex.getParameterName(), ex);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegal(IllegalArgumentException ex) {
        return build(HttpStatus.BAD_REQUEST, "The provided argument is invalid: " + ex.getMessage(), ex);
    }

    @ExceptionHandler(NullPointerException.class)
    public ResponseEntity<ErrorResponse> handleNpe(NullPointerException ex) {
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error: " + ex.getMessage(), ex);
    }

    @ExceptionHandler(Throwable.class)
    public ResponseEntity<ErrorResponse> handleOther(Throwable ex) {
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error: " + ex.getMessage(), ex);
    }

    private ResponseEntity<ErrorResponse> build(HttpStatus status, String message, Throwable ex) {
        StringBuilder b = new StringBuilder(message);
        for (Throwable sup : ex.getSuppressed()) {
            b.append("\\nSuppressed: ").append(sup);
        }
        return ResponseEntity.status(status).body(new ErrorResponse(b.toString()));
    }
}` }
        ]
    });

    /* ===== 11. LOGGER-STARTER ===== */
    App.registerPattern('logger-starter', {
        title: 'Logger-starter', subtitle: 'AspectLogger логирует вход/выход методов controller и service пакетов', category: 'infrastructure',
        javaClasses: ['AspectLogger', 'LogColor', 'LoggerConfig'],
        essence: '<p><code>AspectLogger</code> объявляет <code>catchController()</code> и <code>catchService()</code>. ' +
            '<code>@Around logExecution(joinPoint)</code> пишет <code>[START]</code>, вызывает <code>proceed()</code>, ' +
            'затем <code>[END]</code> с затраченным временем.</p>',
        diagram: function (host) {
            var u = new Uml(820, 240);
            u.box(20, 20, 250, 'AspectLogger', '@Aspect @Component', ['+ catchController() «@Pointcut»', '+ catchService() «@Pointcut»', '+ logExecution(…) «@Around»'], 'spring');
            u.box(320, 20, 210, 'LogColor', '«enum» ANSI', ['RESET, BLACK, RED, GREEN', 'YELLOW, BLUE, MAGENTA, CYAN'], 'abs');
            u.box(580, 20, 220, 'LoggerConfig', '@Configuration', ['@EnableAspectJAutoProxy'], 'spring');
            u.box(20, 160, 250, 'DemoController', '…controller', ['+ demo()'], 'spring');
            u.box(320, 160, 210, 'DemoService', '…service', ['+ doWork()'], 'spring');
            u.arrow(270, 55, 320, 55, 'dep', '');
            u.arrow(140, 110, 140, 160, 'dep', 'within(controller)');
            u.arrow(230, 110, 400, 160, 'dep', 'within(service)');
            put(host, u, 'Бизнес-код не изменён — перехватываются только классы нужных пакетов.');
        },
        demo: function (host, ctx) {
            host.innerHTML =
                '<div class="log-toggles">' +
                '<label class="switch"><input type="checkbox" id="lgCtrl" checked><span class="track"></span>controller-aspect</label>' +
                '<label class="switch"><input type="checkbox" id="lgSvc" checked><span class="track"></span>service-aspect</label>' +
                '<label class="switch"><input type="checkbox" id="lgColor" checked><span class="track"></span>ANSI-цвета LogColor</label>' +
                '</div>' +
                '<div class="demo-controls">' +
                '<button class="btn primary" data-run>GET /demo</button>' +
                '<button class="btn" data-starter>показать «до/после» подключения</button>' +
                '<button class="btn ghost sm" data-clear>очистить</button>' +
                '</div>' +
                '<div class="call-chain" id="lgChain">' +
                '<span class="cc-node" data-n="ctrl">DemoController</span><span class="cc-arr">→</span>' +
                '<span class="cc-node" data-n="svc">DemoService</span>' +
                '</div>' +
                '<div id="lgTerm"></div>';
            var term = ctx.terminal('AspectLogger · colored console');
            host.querySelector('#lgTerm').appendChild(term.node);
            var colorOn = host.querySelector('#lgColor');
            function colored(text, color) {
                if (!colorOn.checked) return esc(text);
                return '<span class="ansi-' + color + '">' + esc(text) + '</span>';
            }
            function line(color, text) { term.raw('<span class="ts">' + ctx.stamp() + '</span> ' + colored(text, color)); }
            function lit(n, on) { var e = host.querySelector('[data-n="' + n + '"]'); if (e) e.classList.toggle('lit', !!on); }
            function run(starterOff) {
                var ctrlOn = host.querySelector('#lgCtrl').checked && !starterOff;
                var svcOn = host.querySelector('#lgSvc').checked && !starterOff;
                if (starterOff) { line('bright-red', '[STARTER OFF] зависимость удалена из pom.xml'); line('yellow', 'DemoController.demo() — аспектов нет'); return; }
                var t0 = performance.now();
                if (ctrlOn) { lit('ctrl', true); line('bright-cyan', '[START] DemoController.demo() args=[]'); }
                ctx.later(320, function () {
                    if (svcOn) { lit('svc', true); line('bright-green', '[START] DemoService.doWork() args=[]'); }
                    ctx.later(420, function () {
                        var inner = Math.round(performance.now() - t0 - 320);
                        lit('svc', false);
                        if (svcOn) line('green', '[END]   DemoService.doWork() → "result" took ' + inner + 'ms');
                        ctx.later(220, function () {
                            lit('ctrl', false);
                            var total = Math.round(performance.now() - t0);
                            if (ctrlOn) line('cyan', '[END]   DemoController.demo() → 200 OK took ' + total + 'ms');
                        });
                    });
                });
            }
            host.querySelector('[data-run]').addEventListener('click', function () { run(false); });
            host.querySelector('[data-starter]').addEventListener('click', function () {
                term.clear(); run(true);
                ctx.later(900, function () {
                    line('bright-green', '[STARTER ON] <dependency>baileyes:logger-spring-boot-starter</dependency>');
                    run(false);
                });
            });
            host.querySelector('[data-clear]').addEventListener('click', function () { term.clear(); });
            line('bright-blue', 'AspectLogger registered');
        },
        code: [
            { file: 'AspectLogger.java', pkg: 'baileyes.eyes.loggerstarter', src:
                    `package baileyes.eyes.loggerstarter;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Aspect @Component
public class AspectLogger {

    @Pointcut("within(baileyes.eyes..controller..*)") public void catchController() {}
    @Pointcut("within(baileyes.eyes..service..*)") public void catchService() {}

    @Around("catchController() || catchService()")
    public Object logExecution(ProceedingJoinPoint pjp) throws Throwable {
        String sig = pjp.getSignature().getDeclaringType().getSimpleName()
                   + "." + pjp.getSignature().getName() + "()";
        System.out.println(LogColor.BRIGHT_CYAN.getCode()
            + "[START] " + sig + " args=" + Arrays.toString(pjp.getArgs())
            + LogColor.RESET.getCode());
        long start = System.currentTimeMillis();
        try {
            Object r = pjp.proceed();
            System.out.println(LogColor.GREEN.getCode()
                + "[END]   " + sig + " -> " + r + " took " + (System.currentTimeMillis() - start) + "ms"
                + LogColor.RESET.getCode());
            return r;
        } catch (Throwable ex) {
            throw ex;
        }
    }
}` }
        ]
    });

    /* ===== 12. KAFKA-STARTER ===== */
    App.registerPattern('kafka-starter', {
        title: 'Kafka-starter', subtitle: 'sendIdempotentMessage + RetryConfig + KafkaProducerException', category: 'infrastructure',
        javaClasses: ['KafkaProducerServiceImpl', 'KafkaConsumerServiceImpl', 'KafkaProducerConfiguration', 'KafkaConsumerConfiguration', 'KafkaTopicConfig', 'AvroSerializer', 'CustomJsonSerializer', 'RetryConfig', 'KafkaProducerException'],
        essence: '<p><code>KafkaProducerServiceImpl.sendIdempotentMessage(topic, partition, key, message)</code> — идемпотентная отправка. ' +
            '<code>RetryConfig</code> задаёт экспоненциальные повторы, исчерпание — <code>KafkaProducerException</code>.</p>',
        diagram: function (host) {
            var u = new Uml(840, 240);
            u.box(15, 15, 235, 'KafkaProducerServiceImpl<K,V>', '@Service', ['- KafkaTemplate<K,V>', '+ sendIdempotentMessage(…)'], 'spring');
            u.box(280, 15, 235, 'KafkaConsumerServiceImpl', '@Service', ['@KafkaListener consume(record)'], 'spring');
            u.box(550, 15, 275, 'KafkaProducerConfiguration', '@Configuration', ['+ producerFactory()', '+ kafkaTemplate()'], 'spring');
            u.box(15, 145, 235, 'CustomJsonSerializer / AvroSerializer', 'Serializer<K,V>', ['+ serialize(topic, data)'], 'iface');
            u.box(280, 145, 235, 'CustomJsonDeserializer / AvroDeserializer', 'Deserializer<V>', ['+ deserialize(topic, bytes)'], 'iface');
            u.box(550, 145, 275, 'KafkaTopicConfig + RetryConfig', '@Configuration', ['+ NewTopic[]', '+ RetryTemplate'], 'spring');
            u.arrow(250, 55, 280, 55, 'dep', 'topic');
            u.arrow(130, 82, 130, 145, 'impl', '');
            u.arrow(395, 82, 395, 145, 'impl', '');
            put(host, u, 'Продюсер и консьюмер знают только о топике и контракте сериализации.');
        },
        demo: function (host, ctx) {
            host.innerHTML =
                '<div class="demo-controls">' +
                '<div class="field"><span class="lbl">topic</span><select id="kfTopic"><option>agreements-topic</option><option>events-topic</option></select></div>' +
                '<div class="field"><span class="lbl">partition</span><select id="kfPart"><option value="-1">auto</option><option value="0">0</option><option value="1">1</option><option value="2">2</option></select></div>' +
                '<div class="field"><span class="lbl">key</span><input id="kfKey" type="text" value="individual-42" style="width:140px"></div>' +
                '<div class="field"><span class="lbl">value</span><input id="kfVal" type="text" value="{\\"type\\":\\"DMS\\"}" style="width:170px"></div>' +
                '<div class="field"><span class="lbl">serializer</span><select id="kfSer"><option>CustomJsonSerializer</option><option>AvroSerializer</option></select></div>' +
                '</div>' +
                '<div class="demo-controls">' +
                '<button class="btn primary" data-send>sendIdempotentMessage(…)</button>' +
                '<label class="switch"><input type="checkbox" id="kfDown"><span class="track"></span>broker down</label>' +
                '<label class="switch"><input type="checkbox" id="kfIdem" checked><span class="track"></span>idempotence=true</label>' +
                '<button class="btn ghost sm" data-clear>очистить</button>' +
                '</div>' +
                '<div class="panel"><h4>Брокер</h4><div class="broker" id="kfBroker">' +
                '<div class="part" data-p="0"><div class="ph"><span>Partition 0</span><span data-cnt>0</span></div><div data-list></div></div>' +
                '<div class="part" data-p="1"><div class="ph"><span>Partition 1</span><span data-cnt>0</span></div><div data-list></div></div>' +
                '<div class="part" data-p="2"><div class="ph"><span>Partition 2</span><span data-cnt>0</span></div><div data-list></div></div>' +
                '</div></div>' +
                '<div class="two-col" style="margin-top:14px"><div class="panel"><h4>Consumer</h4><div class="data-out" id="kfOut">—</div></div><div id="kfTerm"></div></div>';
            var term = ctx.terminal('KafkaProducerServiceImpl');
            host.querySelector('#kfTerm').appendChild(term.node);
            var out = host.querySelector('#kfOut'), broker = host.querySelector('#kfBroker');
            var counts = [0, 0, 0], sent = {};
            host.querySelector('#kfDown').addEventListener('change', function (e) {
                Array.prototype.forEach.call(broker.querySelectorAll('.part'), function (p) { p.classList.toggle('down', e.target.checked); });
            });
            function send() {
                var topic = host.querySelector('#kfTopic').value;
                var partSel = host.querySelector('#kfPart').value;
                var key = host.querySelector('#kfKey').value || 'null';
                var value = host.querySelector('#kfVal').value;
                var ser = host.querySelector('#kfSer').value;
                var down = host.querySelector('#kfDown').checked;
                var idem = host.querySelector('#kfIdem').checked;
                var partition = partSel === '-1' ? ctx.hashCode(key) % 3 : Number(partSel);
                term.info('Sending message ' + value + ' to topic ' + topic + ' partition ' + partition, 'Producer');
                term.debug('serializer=' + ser + ', enable.idempotence=' + idem, 'ProducerConfig');
                if (down) {
                    var attempts = [1000, 2000, 4000], i = 0;
                    term.warn('RetryConfig: retry template started (max=3, mult=2.0)', 'RetryConfig');
                    (function retry() {
                        ctx.later(attempts[i] / 4, function () {
                            term.warn('retry #' + (i + 1) + ' after ' + attempts[i] + ' ms', 'RetryConfig');
                            i++;
                            if (i < attempts.length) retry();
                            else {
                                term.error('KafkaProducerException: failed to send after 3 retries', 'Producer');
                                out.innerHTML = '<span style="color:var(--err);font-weight:700">KafkaProducerException</span>';
                            }
                        });
                    })();
                    return;
                }
                var dupKey = topic + '|' + partition + '|' + key + '|' + value;
                if (idem && sent[dupKey]) {
                    ctx.later(420, function () {
                        term.warn('duplicate → DISCARDED (ровно-один раз)', 'Producer');
                        addMsg(partition, key, value, true);
                    });
                    return;
                }
                sent[dupKey] = true;
                var chip = document.createElement('div'); chip.className = 'fly-msg';
                chip.textContent = (ser === 'AvroSerializer' ? 'avro:' : 'json:') + value.slice(0, 10);
                document.body.appendChild(chip);
                var target = broker.querySelector('[data-p="' + partition + '"]');
                var from = host.querySelector('[data-send]').getBoundingClientRect();
                var to = target.getBoundingClientRect();
                chip.style.left = from.left + 'px'; chip.style.top = from.top + 'px';
                requestAnimationFrame(function () {
                    chip.style.left = (to.left + to.width / 2) + 'px';
                    chip.style.top = (to.top + 10) + 'px';
                });
                ctx.onLeave(function () { if (chip.parentNode) chip.remove(); });
                ctx.later(880, function () {
                    chip.remove();
                    term.ok('delivered: offset=' + counts[partition] + ', partition=' + partition, 'Producer');
                    addMsg(partition, key, value, false);
                    ctx.later(320, function () {
                        term.info('@KafkaListener received', 'Consumer');
                        out.innerHTML = '<span class="seg b">' + esc(value) + '</span>';
                    });
                });
            }
            function addMsg(p, key, value, dup) {
                var part = broker.querySelector('[data-p="' + p + '"]');
                if (!dup) counts[p]++;
                part.querySelector('[data-cnt]').textContent = counts[p];
                var d = document.createElement('div');
                d.className = 'msg' + (dup ? ' dup' : '');
                d.innerHTML = 'offset ' + (counts[p] - (dup ? 1 : 0)) + ' · ' + esc(key) + ' → ' + esc(value);
                part.querySelector('[data-list]').appendChild(d);
                part.classList.add('lit'); ctx.later(600, function () { part.classList.remove('lit'); });
            }
            host.querySelector('[data-send]').addEventListener('click', send);
            host.querySelector('[data-clear]').addEventListener('click', function () { term.clear(); out.textContent = '—'; counts = [0, 0, 0]; sent = {}; });
        },
        code: [
            { file: 'KafkaProducerServiceImpl.java', pkg: 'baileyes.eyes.kafkastarter', src:
                    `package baileyes.eyes.kafkastarter;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Slf4j @Service @RequiredArgsConstructor
public class KafkaProducerServiceImpl<K, V> {

    private final KafkaTemplate<K, V> kafkaTemplate;

    public void sendIdempotentMessage(String topic, Integer partition, K key, V message) {
        log.info("Sending message {} to topic {} partition {}", message, topic, partition);
        var future = (partition == null)
            ? kafkaTemplate.send(topic, key, message)
            : kafkaTemplate.send(topic, partition, key, message);
        future.whenComplete((res, ex) -> {
            if (ex != null) {
                throw new KafkaProducerException("Failed to send to " + topic + ": " + ex.getMessage(), ex);
            }
            log.info("Delivered: offset={}", res.getRecordMetadata().offset());
        });
    }

    public void sendIdempotentMessage(String topic, K key, V message) {
        sendIdempotentMessage(topic, null, key, message);
    }
}` },
            { file: 'RetryConfig.java', pkg: 'baileyes.eyes.kafkastarter', src:
                    `package baileyes.eyes.kafkastarter;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.retry.backoff.ExponentialBackOffPolicy;
import org.springframework.retry.policy.SimpleRetryPolicy;
import org.springframework.retry.support.RetryTemplate;

@Configuration
public class RetryConfig {
    @Bean
    public RetryTemplate kafkaRetryTemplate() {
        RetryTemplate t = new RetryTemplate();
        ExponentialBackOffPolicy b = new ExponentialBackOffPolicy();
        b.setInitialInterval(1000L); b.setMultiplier(2.0); b.setMaxInterval(4000L);
        t.setBackOffPolicy(b);
        SimpleRetryPolicy p = new SimpleRetryPolicy(); p.setMaxAttempts(3);
        t.setRetryPolicy(p);
        return t;
    }
}` }
        ]
    });

    /* ===== 13. API-COMPOSITION ===== */
    App.registerPattern('api-composition', {
        title: 'api-composition (BFF)', subtitle: 'CompositeController → AgreementFacade: параллельные CompletableFuture', category: 'integration',
        javaClasses: ['CompositeController', 'AgreementFacade', 'ConcurrentAgreementsService', 'DmsAgreementsService', 'PropertyAgreementsService', 'TravelAgreementsService', 'DmsClient', 'PropertyClient', 'TravelClient', 'UserClient', 'CommonDto', 'DmsAgreementDto', 'PropertyAgreementDto', 'TravelAgreementDto', 'PropertyType'],
        essence: '<p>API Composition: <code>GET /api/v1/agg/getAgreementsByIndividualId</code> возвращает ' +
            '<code>CompletableFuture&lt;ResponseEntity&lt;Map&lt;String, List&lt;CommonDto&gt;&gt;&gt;&gt;</code>. ' +
            '<code>AgreementFacade</code> запускает параллельно DMS/Property/Travel/User, результат склеивается в карту по типам. ' +
            'При падении одного источника — partial result.</p>',
        diagram: function (host) {
            var u = new Uml(860, 320);
            u.box(15, 15, 250, 'CompositeController', '@RestController /api/v1/agg', ['+ getAgreementsByIndividualId(UUID)', '→ CompletableFuture<ResponseEntity<…>>'], 'spring');
            u.box(320, 15, 250, 'AgreementFacade', '@Service', ['+ getAgreementsByIndividualId(UUID)', '→ CompletableFuture<Map<String, List<CommonDto>>>'], 'spring');
            u.box(620, 15, 225, 'ConcurrentAgreementsService<T>', '«interface»', ['+ getAgreements(UUID) : CompletableFuture<List<T>>'], 'iface');
            u.box(300, 140, 165, 'DmsAgreementsService', '@Service', ['+ getAgreements(UUID)'], 'spring');
            u.box(480, 140, 175, 'PropertyAgreementsService', '@Service', ['+ getAgreements(UUID)'], 'spring');
            u.box(670, 140, 175, 'TravelAgreementsService', '@Service', ['+ getAgreements(UUID)'], 'spring');
            u.box(300, 230, 165, 'DmsClient', '@FeignClient', []);
            u.box(480, 230, 175, 'PropertyClient', '@FeignClient', []);
            u.box(670, 230, 175, 'TravelClient', '@FeignClient', []);
            u.arrow(265, 55, 320, 55, 'assoc', 'DI');
            u.arrow(385, 140, 420, 92, 'impl', '');
            u.arrow(560, 140, 500, 92, 'impl', '');
            u.arrow(740, 140, 560, 92, 'impl', '');
            put(host, u, 'CompletableFuture.allOf → склейка в Map<String, List<CommonDto>>.');
        },
        demo: function (host, ctx) {
            host.innerHTML =
                '<div class="demo-controls">' +
                '<div class="field" style="flex:1 1 320px"><span class="lbl">individualId</span>' +
                '<div style="display:flex;gap:7px"><input id="acId" type="text" style="flex:1 1 auto">' +
                '<button class="btn sm" data-rand>случайный UUID</button></div></div>' +
                '<button class="btn primary" data-get>GET /api/v1/agg/getAgreementsByIndividualId</button>' +
                '<label class="switch"><input type="checkbox" id="acFail"><span class="track"></span>TravelClient падает</label>' +
                '<button class="btn ghost sm" data-clear>очистить</button>' +
                '</div>' +
                '<div class="panel"><h4>Feign-вызовы (параллельно)</h4><div class="svc-grid" id="acSvc"></div></div>' +
                '<div class="two-col" style="margin-top:14px">' +
                '<div class="panel" style="padding:0"><div style="padding:13px"><h4>Map&lt;String, List&lt;CommonDto&gt;&gt;</h4></div>' +
                '<div class="json-view" id="acJson" style="margin:9px 13px 13px">—</div>' +
                '<div id="acPartial" style="padding:0 13px 13px"></div></div>' +
                '<div id="acTerm"></div></div>';
            var term = ctx.terminal('AgreementFacade');
            host.querySelector('#acTerm').appendChild(term.node);
            var svcGrid = host.querySelector('#acSvc'), jsonEl = host.querySelector('#acJson'), partial = host.querySelector('#acPartial');
            var SERVICES = [
                { id: 'DmsClient', role: 'DmsAgreementsService', base: 620 },
                { id: 'PropertyClient', role: 'PropertyAgreementsService', base: 900 },
                { id: 'TravelClient', role: 'TravelAgreementsService', base: 760 },
                { id: 'UserClient', role: 'DmsServiceClient', base: 410 }
            ];
            function renderSvc() {
                svcGrid.innerHTML = SERVICES.map(function (s) {
                    return '<div class="svc" data-s="' + s.id + '"><div class="nm">' + s.id + '</div>' +
                        '<div class="rl">' + esc(s.role) + '</div><div class="bar"><i></i></div>' +
                        '<div class="stt" data-stt>idle</div></div>';
                }).join('');
            }
            function rnd(min, max) { return min + Math.random() * (max - min); }
            host.querySelector('[data-rand]').addEventListener('click', function () { host.querySelector('#acId').value = ctx.uuid(); });
            if (!host.querySelector('#acId').value) host.querySelector('#acId').value = ctx.uuid();
            host.querySelector('[data-get]').addEventListener('click', function () {
                var individualId = host.querySelector('#acId').value.trim() || ctx.uuid();
                var travelFails = host.querySelector('#acFail').checked;
                renderSvc(); partial.innerHTML = ''; jsonEl.textContent = '…'; term.clear();
                term.info('GET /api/v1/agg/getAgreementsByIndividualId?individualId=' + individualId, 'CompositeController');
                var t0 = performance.now(), results = {}, pending = SERVICES.length;
                SERVICES.forEach(function (s) {
                    var el = svcGrid.querySelector('[data-s="' + s.id + '"]');
                    var bar = el.querySelector('.bar > i'), stt = el.querySelector('[data-stt]');
                    var dur = Math.round(s.base + rnd(-140, 260));
                    var failing = (s.id === 'TravelClient' && travelFails);
                    el.classList.add('busy');
                    stt.innerHTML = '<span class="spinner"></span>Feign… ~' + dur + 'ms';
                    var iv = ctx.every(45, function () {
                        bar.style.width = Math.min(100, (performance.now() - t0) / dur * 100) + '%';
                    });
                    ctx.later(dur, function () {
                        ctx.cancel(iv); bar.style.width = '100%';
                        el.classList.remove('busy');
                        if (failing) { el.classList.add('fail'); stt.textContent = '✖ 503'; term.error('FeignException: 503 → degrading', s.id); results[s.id] = null; }
                        else { el.classList.add('done'); stt.textContent = '✔ ' + Math.round(performance.now() - t0) + 'ms'; term.ok(s.id + ' in ' + Math.round(performance.now() - t0) + 'ms', s.id); results[s.id] = buildData(s.id, individualId); }
                        if (--pending === 0) compose(t0, results, individualId);
                    });
                });
            });
            function buildData(id, individualId) {
                var sid = individualId.slice(0, 8);
                if (id === 'DmsClient') return { section: 'ДМС', items: [{ agreementId: 'DMS-' + sid + '-01', individualId: individualId, type: 'DMS', programName: 'ДМС Стандарт' }] };
                if (id === 'PropertyClient') return { section: 'Имущество', items: [{ agreementId: 'PROP-' + sid, individualId: individualId, propertyType: 'APARTMENT' }] };
                if (id === 'TravelClient') return { section: 'Travel', items: [{ agreementId: 'TRV-' + sid, individualId: individualId, destination: 'Турция' }] };
                return { section: 'User', items: [{ individualId: individualId, lastName: 'Иванов' }] };
            }
            function compose(t0, results, individualId) {
                var total = Math.round(performance.now() - t0);
                term.info('CompletableFuture.allOf().join() → ' + total + ' ms', 'AgreementFacade');
                var map = {};
                var degraded = [];
                if (results.DmsClient) map['ДМС'] = results.DmsClient.items;
                if (results.PropertyClient) map['Имущество'] = results.PropertyClient.items;
                if (results.TravelClient) map['Travel'] = results.TravelClient.items;
                else degraded.push('Travel');
                var response = { individualId: individualId, agreements: map };
                jsonEl.innerHTML = App.hlJson(JSON.stringify(response, null, 2));
                if (degraded.length) {
                    partial.innerHTML = '<div class="partial">⚠ ' + degraded.join(', ') + ' недоступен — partial result (HTTP 200).</div>';
                } else partial.innerHTML = '<div class="note ok" style="margin:0 13px 13px">Все источники ответили.</div>';
                term.ok('ResponseEntity.ok → HTTP 200 · total=' + total + 'ms', 'CompositeController');
            }
            host.querySelector('[data-clear]').addEventListener('click', function () { term.clear(); jsonEl.textContent = '—'; partial.innerHTML = ''; renderSvc(); });
            renderSvc();
        },
        code: [
            { file: 'AgreementFacade.java', pkg: 'baileyes.eyes.apicomposition', src:
                    `package baileyes.eyes.apicomposition;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Slf4j @Service @RequiredArgsConstructor
public class AgreementFacade {

    private final DmsAgreementsService dmsAgreementsService;
    private final PropertyAgreementsService propertyAgreementsService;
    private final TravelAgreementsService travelAgreementsService;

    public CompletableFuture<Map<String, List<CommonDto>>> getAgreementsByIndividualId(UUID individualId) {
        CompletableFuture<List<CommonDto>> dms = dmsAgreementsService.getAgreements(individualId);
        CompletableFuture<List<CommonDto>> property = propertyAgreementsService.getAgreements(individualId);
        CompletableFuture<List<CommonDto>> travel = travelAgreementsService.getAgreements(individualId);

        return CompletableFuture.allOf(dms, property, travel)
            .thenApply(v -> {
                Map<String, List<CommonDto>> result = new HashMap<>();
                result.put("ДМС", safeJoin(dms));
                result.put("Имущество", safeJoin(property));
                result.put("Travel", safeJoin(travel));
                return result;
            });
    }

    private List<CommonDto> safeJoin(CompletableFuture<List<CommonDto>> future) {
        try { return future.join(); }
        catch (Exception e) { log.warn("Degraded: {}", e.getMessage()); return List.of(); }
    }
}` },
            { file: 'CompositeController.java', pkg: 'baileyes.eyes.apicomposition', src:
                    `package baileyes.eyes.apicomposition;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/v1/agg")
@RequiredArgsConstructor
public class CompositeController {

    private final AgreementFacade agreementFacade;

    @GetMapping("/getAgreementsByIndividualId")
    public CompletableFuture<ResponseEntity<Map<String, List<CommonDto>>>> getAgreementsByIndividualId(
            @RequestParam UUID individualId) {
        return agreementFacade.getAgreementsByIndividualId(individualId)
                .thenApply(ResponseEntity::ok);
    }
}` }
        ]
    });

})(window.App);