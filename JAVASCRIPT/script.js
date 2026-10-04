const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Reloj de la barra superior ---------- */
function tickClock() {
    const el = document.getElementById('clock');
    if (el) el.textContent = new Date().toLocaleTimeString('es-AR', { hour12: false });
}
tickClock();
setInterval(tickClock, 1000);

/* ---------- Efecto de tipeo en los roles ---------- */
const typedEl = document.getElementById('typed');
if (typedEl && !reduceMotion) {
    const roles = JSON.parse(typedEl.dataset.roles);
    let role = 0, chars = 0, deleting = false;
    (function step() {
        const text = roles[role];
        chars += deleting ? -1 : 1;
        typedEl.textContent = text.slice(0, chars);
        let delay = deleting ? 40 : 85;
        if (!deleting && chars === text.length) { deleting = true; delay = 1400; }
        else if (deleting && chars === 0) { deleting = false; role = (role + 1) % roles.length; delay = 350; }
        setTimeout(step, delay);
    })();
}

/* ---------- "Decodificado" de texto (scramble) ---------- */
const GLYPHS = '01<>/\\{}[]#$%&*+=?';
function scramble(el, duration = 700) {
    const final = el.textContent;
    const start = performance.now();
    (function frame(now) {
        const t = Math.min((now - start) / duration, 1);
        const fixed = Math.floor(t * final.length);
        let out = final.slice(0, fixed);
        for (let i = fixed; i < final.length; i++) {
            out += final[i] === ' ' ? ' ' : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
        el.textContent = out;
        if (t < 1) requestAnimationFrame(frame);
    })(start);
}
if (!reduceMotion) {
    document.querySelectorAll('.page-title, .hero h1').forEach(el => scramble(el, 900));
    // Tambien al pasar el mouse por el menu
    document.querySelectorAll('#sidebar > ul > li > a').forEach(a => {
        const lbl = a.lastChild;
        if (lbl.nodeType !== Node.TEXT_NODE) return;
        const text = lbl.textContent;
        a.addEventListener('mouseenter', () => {
            const start = performance.now();
            (function frame(now) {
                const t = Math.min((now - start) / 300, 1);
                const fixed = Math.floor(t * text.length);
                lbl.textContent = text.slice(0, fixed) + [...text.slice(fixed)].map(() => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]).join('');
                if (t < 1) requestAnimationFrame(frame); else lbl.textContent = text;
            })(start);
        });
    });
}

/* ---------- Aparicion al hacer scroll ---------- */
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
    }, { threshold: 0.12 });
    reveals.forEach((el, i) => { el.style.transitionDelay = (i % 4) * 70 + 'ms'; io.observe(el); });
} else {
    reveals.forEach(el => el.classList.add('in'));
}

/* ---------- Lluvia de caracteres de fondo (canvas) ---------- */
const canvas = document.getElementById('rain');
if (canvas && !reduceMotion) {
    const ctx = canvas.getContext('2d');
    const chars = '01ABCDEF<>/{}#$%'.split('');
    const size = 15;
    let cols, drops, last = 0;

    function resize() {
        canvas.width = innerWidth;
        canvas.height = innerHeight;
        cols = Math.floor(canvas.width / size);
        drops = Array.from({ length: cols }, () => Math.random() * -50);
    }
    resize();
    addEventListener('resize', resize);

    function draw(now) {
        requestAnimationFrame(draw);
        if (document.hidden || now - last < 70) return;
        last = now;
        ctx.fillStyle = 'rgba(3, 6, 13, 0.14)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = size + 'px Hack, monospace';
        for (let i = 0; i < cols; i++) {
            const y = drops[i] * size;
            ctx.fillStyle = Math.random() > 0.97 ? '#cfe6ff' : '#4da3ff';
            ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * size, y);
            if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
        }
    }
    requestAnimationFrame(draw);
}

/* ---------- Glow que sigue al mouse ---------- */
const glow = document.getElementById('glow');
if (glow && !reduceMotion) {
    addEventListener('mousemove', e => {
        glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    });
}

/* ---------- Terminal interactiva (solo en el home) ---------- */
const term = document.getElementById('term');
if (term) {
    term.hidden = false;
    const out = document.getElementById('term-out');
    const input = document.getElementById('term-input');
    const history = [];
    let hIdx = 0;

    const pages = { whoami: 'about.html', skills: 'skills.html', projects: 'projects/off-mana.html', blog: 'blog/new-1.html', home: 'index.html' };
    const bornAt = Date.now();

    const commands = {
        help:    () => 'comandos: help, whoami, ls, cd <dir>, contact, date, uptime, echo, clear',
        whoami:  () => 'N1D0 — estudiante de Ciencias de la Computación (UNR). Foco: Evaluación y Pruebas de Seguridad.',
        ls:      () => Object.keys(pages).filter(k => k !== 'home').map(k => k + '/').join('  '),
        contact: () => 'github.com/N1D0nt\nlinkedin.com/in/n1d0\nn1do28.sh@gmail.com',
        date:    () => new Date().toString(),
        uptime:  () => 'en esta sesión hace ' + Math.floor((Date.now() - bornAt) / 1000) + ' s',
        echo:    args => args.join(' '),
        sudo:    () => 'n1d0 no está en el archivo sudoers. Este incidente será reportado.',
        clear:   () => { out.textContent = ''; return null; },
        cd: args => {
            const dest = (args[0] || '').replace(/\/$/, '');
            if (!pages[dest]) return `bash: cd: ${args[0] || ''}: no existe el archivo o directorio`;
            setTimeout(() => { location.href = pages[dest]; }, 400);
            return 'entrando a ' + dest + '/ ...';
        }
    };

    function print(text, cls) {
        const d = document.createElement('div');
        if (cls) d.className = cls;
        d.textContent = text;
        out.appendChild(d);
        out.scrollTop = out.scrollHeight;
        return d;
    }

    function run(line) {
        const [cmd, ...args] = line.trim().split(/\s+/);
        const c = print('$ ' + line, 'c');
        if (!cmd) return;
        const fn = commands[cmd];
        const res = fn ? fn(args) : `bash: ${cmd}: comando no encontrado (probá "help")`;
        if (res !== null) print(res);
    }

    print('Bienvenido. Escribí "help" para ver los comandos.', 'c');

    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            const v = input.value;
            if (v.trim()) { history.push(v); hIdx = history.length; }
            run(v);
            input.value = '';
        } else if (e.key === 'ArrowUp' && history.length) {
            hIdx = Math.max(0, hIdx - 1);
            input.value = history[hIdx];
            e.preventDefault();
        } else if (e.key === 'ArrowDown' && history.length) {
            hIdx = Math.min(history.length, hIdx + 1);
            input.value = history[hIdx] || '';
            e.preventDefault();
        }
    });

    term.addEventListener('click', e => {
        const btn = e.target.closest('[data-cmd]');
        if (btn) { run(btn.dataset.cmd); }
        if (!getSelection().toString()) input.focus({ preventScroll: true });
    });
}
