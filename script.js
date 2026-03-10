const $ = id => document.getElementById(id);

/* stars on login */
(function () {
    const c = $('lpStars'); if (!c) return;
    for (let i = 0; i < 22; i++) {
        const s = document.createElement('div'); s.className = 'star';
        const sz = Math.random() * 3 + 1;
        s.style.cssText = `width:${sz}px;height:${sz}px;top:${Math.random() * 100}%;left:${Math.random() * 100}%;animation-delay:${Math.random() * 4}s;animation-duration:${2 + Math.random() * 3}s`;
        c.appendChild(s);
    }
})();

function toast(msg, err = false) {
    const t = $('toast'); $('toastTxt').textContent = msg;
    t.className = 'toast' + (err ? ' terr' : '');
    t.classList.add('show');
    clearTimeout(window._tt); window._tt = setTimeout(() => t.classList.remove('show'), 2600);
}

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    $(id).classList.add('active');
    document.querySelectorAll('.navlink').forEach(l => l.classList.remove('on'));
    const map = { 'page-dashboard': 0, 'page-calendar': 1, 'page-reminders': 2, 'page-syllabus': 3 };
    const nls = document.querySelectorAll('.navlink');
    if (map[id] !== undefined && nls[map[id]]) nls[map[id]].classList.add('on');
    if (id === 'page-dashboard') { updateStats(); buildDate(); }
    if (id === 'page-calendar') { if (calView === 'week') { $('weekView').classList.add('active-view'); $('monthView').style.display = 'none'; renderWeek(); } else { renderCal(); } }
    if (id === 'page-reminders') renderRems();
    if (id === 'page-syllabus') renderSubs();
    window.scrollTo(0, 0);
}

/* AUTH */
let aMode = 'login';
function switchTab(m) {
    aMode = m;
    document.querySelectorAll('.atab').forEach((b, i) => b.classList.toggle('on', (i === 0 && m === 'login') || (i === 1 && m === 'register')));
    $('authBtn').textContent = m === 'login' ? 'Sign In →' : 'Create Account →';
    $('authMsg').className = 'amsg';
}
function handleAuth() {
    const uid = $('userId').value.trim(), pw = $('password').value;
    if (!uid || !pw) { setMsg('Please fill in both fields.', 'err'); return; }
    const us = JSON.parse(localStorage.getItem('se_u') || '{}');
    if (aMode === 'register') {
        if (us[uid]) { setMsg('That User ID is already taken.', 'err'); return; }
        us[uid] = { password: pw }; localStorage.setItem('se_u', JSON.stringify(us));
        setMsg('Account created — signing you in… 🎉', 'ok');
        setTimeout(() => doLogin(uid), 900);
    } else {
        if (!us[uid] || us[uid].password !== pw) { setMsg('Incorrect User ID or password.', 'err'); return; }
        doLogin(uid);
    }
}
function doLogin(uid) {
    localStorage.setItem('se_cu', uid);
    $('greetName').textContent = uid; $('navNm').textContent = uid;
    $('navAv').textContent = uid.charAt(0).toUpperCase();
    showPage('page-dashboard');
}
function setMsg(m, t) { const e = $('authMsg'); e.textContent = m; e.className = 'amsg ' + t; }
function logout() { localStorage.removeItem('se_cu'); $('userId').value = ''; $('password').value = ''; $('authMsg').className = 'amsg'; showPage('page-login'); }
const getU = () => localStorage.getItem('se_cu') || 'anon';

/* DATE WIDGET */
function buildDate() {
    const d = new Date();
    const dys = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const mos = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    $('dateCard').innerHTML = `<div class="date-num">${d.getDate()}</div><div class="date-info">${dys[d.getDay()]}<br>${mos[d.getMonth()]} ${d.getFullYear()}</div>`;
}

/* STATS */
function updateStats() {
    const u = getU();
    const t = JSON.parse(localStorage.getItem(`se_t_${u}`) || '[]');
    const r = JSON.parse(localStorage.getItem(`se_r_${u}`) || '[]');
    const s = JSON.parse(localStorage.getItem(`se_s_${u}`) || '{}');
    const k = Object.keys(s);
    $('stT').textContent = t.length; $('stR').textContent = r.length;
    $('stS').textContent = k.length; $('stN').textContent = k.reduce((a, x) => a + (s[x] || []).length, 0);
}

/* CALENDAR */
let calD = new Date(), calSel = '';
let calView = 'month'; // 'month' | 'week'
let weekStart = new Date(); // Monday of current week

// Always anchor weekStart to Sunday of current week
(function () {
    const d = new Date(); d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay()); // go to Sunday
    weekStart = d;
})();

const tk = () => `se_t_${getU()}`;
const gT = () => JSON.parse(localStorage.getItem(tk()) || '[]');
const sT = t => localStorage.setItem(tk(), JSON.stringify(t));
const sdKey = () => `se_sd_${getU()}`;
const gSD = () => JSON.parse(localStorage.getItem(sdKey()) || '[]');
const sSD = d => localStorage.setItem(sdKey(), JSON.stringify(d));

function fmtDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function todayStr() { return fmtDate(new Date()); }

/* ── VIEW TOGGLE ── */
function switchCalView(v) {
    calView = v;
    $('vtabMonth').classList.toggle('on', v === 'month');
    $('vtabWeek').classList.toggle('on', v === 'week');
    $('monthView').style.display = v === 'month' ? '' : 'none';
    if (v === 'week') {
        $('weekView').classList.add('active-view');
        renderWeek();
    } else {
        $('weekView').classList.remove('active-view');
        renderCal();
    }
}

function calNavPrev() { if (calView === 'month') calPrev(); else weekPrev(); }
function calNavNext() { if (calView === 'month') calNext(); else weekNext(); }

/* ── MONTHLY ── */
function renderCal() {
    const g = $('calGrid'); g.querySelectorAll('.cal-cell').forEach(c => c.remove());
    const yr = calD.getFullYear(), mo = calD.getMonth();
    const mos = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    $('calLbl').innerHTML = `${mos[mo]} <span>${yr}</span>`;
    const fd = new Date(yr, mo, 1).getDay(), dim = new Date(yr, mo + 1, 0).getDate();
    const ts = todayStr();
    const tasks = gT(); let day = 1;
    for (let i = 0; i < 42; i++) {
        const c = document.createElement('div');
        if (i < fd || day > dim) { c.className = 'cal-cell empty'; }
        else {
            const ds = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            c.className = 'cal-cell' + (ds === ts ? ' today' : '');
            c.innerHTML = `<div class="cal-day">${day}</div>`;
            c.onclick = () => openCal(ds);
            tasks.filter(t => t.date === ds).forEach(t => {
                const e = document.createElement('span');
                const ec = { assignment: 'ev-a', test: 'ev-t', deadline: 'ev-d', class: 'ev-c' };
                e.className = 'ev ' + (ec[t.type] || 'ev-a'); e.textContent = t.title; c.appendChild(e);
            });
            day++;
        }
        g.appendChild(c);
    }
}
function calPrev() { calD.setMonth(calD.getMonth() - 1); renderCal(); }
function calNext() { calD.setMonth(calD.getMonth() + 1); renderCal(); }

/* ── WEEKLY ── */
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const typeClass = { assignment: 'wt-assignment', test: 'wt-test', deadline: 'wt-deadline', class: 'wt-class' };
const typeEmoji = { assignment: '📝', test: '📊', deadline: '⏳', class: '📚' };

// Preset swatches [bg, text, dot]
const presetColors = [
    ['#dbeafe', '#1d4ed8', '#3b82f6'], ['#fce7f3', '#9d174d', '#ec4899'],
    ['#fef3c7', '#92400e', '#f59e0b'], ['#d1fae5', '#065f46', '#10b981'],
    ['#ede9fe', '#5b21b6', '#8b5cf6'], ['#fee2e2', '#991b1b', '#ef4444'],
    ['#ffedd5', '#9a3412', '#f97316'], ['#e0f2fe', '#0369a1', '#0ea5e9'],
    ['#fdf4ff', '#701a75', '#d946ef'], ['#f0fdf4', '#14532d', '#22c55e'],
    ['#fff7ed', '#7c2d12', '#ea580c'], ['#f1f5f9', '#334155', '#64748b'],
];

document.addEventListener('click', e => {
    if (!e.target.closest('.color-picker-popup') && !e.target.closest('.wt-color-btn')) {
        document.querySelectorAll('.color-picker-popup.open').forEach(p => p.classList.remove('open'));
    }
});

function applyTaskStyle(chip, t) {
    if (t.customColor) {
        chip.style.background = t.customColor[0];
        chip.style.color = t.customColor[1];
        const dotEl = chip.querySelector('.wt-dot');
        if (dotEl) dotEl.style.background = t.customColor[2];
    }
}

function hexToTaskColors(hex) {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    const bg = `rgb(${Math.round(r * .28 + 255 * .72)},${Math.round(g * .28 + 255 * .72)},${Math.round(b * .28 + 255 * .72)})`;
    const fg = `rgb(${Math.round(r * .5)},${Math.round(g * .5)},${Math.round(b * .5)})`;
    return [bg, fg, hex];
}

function updateCpPreview(popup, bg, fg, dot) {
    const p = popup.querySelector('#cpPreview');
    if (!p) return;
    p.style.background = bg; p.style.color = fg;
    const d = p.querySelector('.cp-preview-dot'); if (d) d.style.background = dot;
}

function openColorPicker(btn, ds, title) {
    document.querySelectorAll('.color-picker-popup.open').forEach(p => p.classList.remove('open'));
    const popup = btn.parentElement.querySelector('.color-picker-popup');
    if (!popup) return;

    const tasks = gT();
    const task = tasks.find(t => t.date === ds && t.title === title);
    const cur = task && task.customColor ? task.customColor : null;
    const curHex = cur ? cur[2] : '#3b82f6';
    const curBg = cur ? cur[0] : '#dbeafe';
    const curFg = cur ? cur[1] : '#1d4ed8';

    const label = title.length > 13 ? title.slice(0, 13) + '…' : title;

    popup.innerHTML = `
      <div class="cp-swatches" id="cpSwatches"></div>
      <div class="custom-color-section">
        <div class="custom-color-label">Custom color</div>
        <div class="hex-row">
          <input type="color" class="native-color-input" id="cpNative" value="${curHex}">
          <input type="text" class="hex-input" id="cpHex" placeholder="#3b82f6" maxlength="7" value="${curHex}">
        </div>
        <div class="cp-preview" id="cpPreview" style="background:${curBg};color:${curFg}">
          <div class="cp-preview-dot" style="background:${curHex}"></div><span>${label}</span>
        </div>
        <button class="cp-apply-btn" id="cpApply">Apply ✓</button>
        <button class="cp-apply-btn" id="cpReset" style="background:var(--muted);margin-top:4px">Reset default</button>
      </div>`;

    // Build swatches
    const swatchesEl = popup.querySelector('#cpSwatches');
    presetColors.forEach(([bg, fg, dot]) => {
        const sw = document.createElement('div');
        sw.className = 'cp-swatch' + (cur && cur[0] === bg ? ' active' : '');
        sw.style.cssText = `background:${bg};border-color:${dot}`;
        sw.onclick = e => { e.stopPropagation(); applyColorToTask(ds, title, [bg, fg, dot]); popup.classList.remove('open'); };
        swatchesEl.appendChild(sw);
    });

    // Wire up native picker
    popup.querySelector('#cpNative').addEventListener('input', function () {
        popup.querySelector('#cpHex').value = this.value;
        const [bg, fg, dot] = hexToTaskColors(this.value);
        updateCpPreview(popup, bg, fg, dot);
    });
    popup.querySelector('#cpHex').addEventListener('input', function () {
        if (/^#[0-9a-fA-F]{6}$/.test(this.value)) {
            popup.querySelector('#cpNative').value = this.value;
            const [bg, fg, dot] = hexToTaskColors(this.value);
            updateCpPreview(popup, bg, fg, dot);
        }
    });
    popup.querySelector('#cpApply').addEventListener('click', e => {
        e.stopPropagation();
        const hex = popup.querySelector('#cpNative').value;
        applyColorToTask(ds, title, hexToTaskColors(hex));
        popup.classList.remove('open');
    });
    popup.querySelector('#cpReset').addEventListener('click', e => {
        e.stopPropagation();
        applyColorToTask(ds, title, null);
        popup.classList.remove('open');
    });

    popup.classList.add('open');
}

function applyColorToTask(ds, title, colors) {
    const tasks = gT();
    const task = tasks.find(t => t.date === ds && t.title === title);
    if (task) { if (colors) task.customColor = colors; else delete task.customColor; sT(tasks); }
    renderWeek();
    toast(colors ? 'Color applied ✓' : 'Color reset ✓');
}

function renderWeek() {
    const g = $('weekGrid'); g.innerHTML = '';
    const ts = todayStr();
    const tasks = gT();
    const mos = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    $('calLbl').innerHTML = `${mos[new Date(weekStart).getMonth()]} <span>${new Date(weekStart).getFullYear()}</span>`;

    for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart); d.setDate(d.getDate() + i);
        const ds = fmtDate(d);
        const isToday = ds === ts;
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;

        const col = document.createElement('div');
        col.className = 'week-col' + (isToday ? ' today-col' : '') + (isWeekend ? ' weekend-col' : '');

        const head = document.createElement('div');
        head.className = 'week-col-head';
        head.innerHTML = `<div class="wday-name">${dayNames[d.getDay()]}</div><div class="wday-num">${d.getDate()}</div>`;
        col.appendChild(head);

        const body = document.createElement('div');
        body.className = 'week-col-body';

        tasks.filter(t => t.date === ds).forEach(t => {
            const chip = document.createElement('div');
            chip.className = `week-task ${typeClass[t.type] || 'wt-assignment'}`;
            const esc = t.title.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
            chip.innerHTML = `<span class="wt-dot"></span><span class="wt-label">${t.title}</span><button class="wt-color-btn" title="Color" onclick="event.stopPropagation();openColorPicker(this,'${ds}','${esc}')">🎨</button><button class="wt-del" onclick="event.stopPropagation();weekDelTask('${ds}','${esc}')">✕</button><div class="color-picker-popup"></div>`;
            applyTaskStyle(chip, t);
            body.appendChild(chip);
        });

        const addRow = document.createElement('div');
        addRow.className = 'week-add-row';
        addRow.innerHTML = `<input class="week-quick-input" type="text" placeholder="+ add task…" onkeydown="if(event.key==='Enter')weekQuickAdd(this,'${ds}')"><select class="week-type-sel" id="wts-${i}"><option value="assignment">📝</option><option value="test">📊</option><option value="deadline">⏳</option><option value="class">📚</option></select><button class="week-add-btn" onclick="weekQuickAddBtn(${i},'${ds}')">+</button>`;
        body.appendChild(addRow);
        col.appendChild(body);
        g.appendChild(col);
    }
    renderSomeday();
}

function weekQuickAdd(input, ds) {
    const val = input.value.trim(); if (!val) return;
    const sel = input.parentElement.querySelector('.week-type-sel');
    const tasks = gT();
    tasks.push({ title: val, type: sel ? sel.value : 'assignment', date: ds, time: '' });
    sT(tasks); input.value = ''; renderWeek(); renderCal(); toast('Task added ✓');
}
function weekQuickAddBtn(colIdx, ds) {
    weekQuickAdd(document.querySelectorAll('.week-quick-input')[colIdx], ds);
}
function weekDelTask(ds, title) {
    const tasks = gT();
    const idx = tasks.findIndex(t => t.date === ds && t.title === title);
    if (idx >= 0) { tasks.splice(idx, 1); sT(tasks); }
    renderWeek(); renderCal(); toast('Task removed');
}


function weekPrev() {
    weekStart = new Date(weekStart);
    weekStart.setDate(weekStart.getDate() - 7);
    renderWeek();
}
function weekNext() {
    weekStart = new Date(weekStart);
    weekStart.setDate(weekStart.getDate() + 7);
    renderWeek();
}
function weekGoToday() {
    const d = new Date(); d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay());
    weekStart = d;
    renderWeek();
}

/* ── SOMEDAY ── */
function renderSomeday() {
    const c = $('somedayTasks'); c.innerHTML = '';
    const items = gSD();
    if (!items.length) {
        c.innerHTML = '<span style="font-size:.78rem;color:var(--faint)">Nothing yet — add ideas for later ✨</span>';
        return;
    }
    items.forEach((item, i) => {
        const chip = document.createElement('div');
        chip.className = `someday-chip wt-${item.type || 'assignment'}`;
        chip.innerHTML = `${typeEmoji[item.type] || '📝'} ${item.title} <button onclick="delSomeday(${i})">✕</button>`;
        c.appendChild(chip);
    });
}
/* ── DARK MODE ── */
function toggleDark() {
    const isDark = document.body.classList.toggle('dark');
    $('dmBtn').textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('se_dm', isDark ? '1' : '0');
}

function addSomedayTask() {
    const inp = $('somedayInp');
    const val = inp.value.trim(); if (!val) return;
    const items = gSD(); items.push({ title: val, type: 'assignment' }); sSD(items);
    inp.value = ''; renderSomeday(); toast('Added to Someday ✓');
}
function delSomeday(i) {
    const items = gSD(); items.splice(i, 1); sSD(items); renderSomeday(); toast('Removed');
}

function openCal(d) {
    calSel = d;
    const [yr, mo, dy] = d.split('-');
    const mos = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    $('calMT').textContent = `📅 ${parseInt(dy)} ${mos[parseInt(mo) - 1]} ${yr}`;
    $('calModal').classList.add('open'); renderTasks();
}
function closeCalModal() { $('calModal').classList.remove('open'); }
function addTask() {
    const ti = $('taskTitle').value.trim(), ty = $('taskType').value, tm = $('taskTime').value;
    if (!ti) { toast('Enter a task name!', true); return; }
    const t = gT(); t.push({ title: ti, type: ty, date: calSel, time: tm }); sT(t);
    $('taskTitle').value = ''; $('taskTime').value = '';
    renderTasks(); renderCal(); toast('Task added ✓');
}
function renderTasks() {
    const l = $('taskList'); l.innerHTML = '';
    const all = gT(), day = all.filter(t => t.date === calSel);
    if (!day.length) { l.innerHTML = '<li style="padding:10px 0;font-size:.83rem;color:var(--faint)">No tasks yet. Add one above! 📝</li>'; return; }
    const ico = { assignment: '📝', test: '📊', deadline: '⏳', class: '📚' };
    day.forEach(t => {
        const ri = all.findIndex(x => x.date === t.date && x.title === t.title && x.time === t.time);
        const li = document.createElement('li'); li.className = 'titem';
        li.innerHTML = `<span>${ico[t.type] || '•'} ${t.title}${t.time ? ' · ' + t.time : ''}</span><button class="tdel" onclick="delTask(${ri})">✕</button>`;
        l.appendChild(li);
    });
}
function delTask(i) { const t = gT(); t.splice(i, 1); sT(t); renderTasks(); renderCal(); toast('Task removed'); }

/* REMINDERS */
const rk = () => `se_r_${getU()}`;
const gR = () => JSON.parse(localStorage.getItem(rk()) || '[]');
const sR = r => localStorage.setItem(rk(), JSON.stringify(r));
function addReminder() {
    const ti = $('remTitle').value.trim(), da = $('remDate').value, tm = $('remTime').value;
    if (!ti || !da || !tm) { toast('Fill in all reminder fields!', true); return; }
    const r = gR(); r.push({ title: ti, date: da, time: tm, src: 'own' }); sR(r);
    $('remTitle').value = ''; $('remDate').value = ''; $('remTime').value = '';
    renderRems(); toast('Reminder set ✓');
}
function delRem(i) { const r = gR(); r.splice(i, 1); sR(r); renderRems(); toast('Reminder deleted'); }
function renderRems() {
    const w = $('remCards'); w.innerHTML = '';
    const own = gR(), cal = gT().filter(t => t.time).map(t => ({ title: t.title, date: t.date, time: t.time, src: 'cal' }));
    const all = [...own.map((r, i) => ({ ...r, oi: i })), ...cal].sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
    if (!all.length) {
        w.innerHTML = `<div class="empty"><div class="empty-icon"><svg viewBox="0 0 32 32" fill="none" width="32" height="32"><path d="M16 4C10.48 4 6 8.48 6 14c0 3.8 2 7 5 8.9L10.5 26h11l-.5-3.1C24 21 26 17.8 26 14c0-5.52-4.48-10-10-10z" stroke="#93c5fd" stroke-width="2" fill="none"/><path d="M10.5 26h11" stroke="#93c5fd" stroke-width="2" stroke-linecap="round"/></svg></div><p>No reminders yet!<br>Add one using the form on the left ✨</p></div>`;
        return;
    }
    all.forEach(r => {
        const d = document.createElement('div'); d.className = 'rcard';
        const del = r.src === 'own' ? `<button class="rdel" onclick="delRem(${r.oi})">✕</button>` : '';
        const badge = r.src === 'cal' ? `<span class="rbadge rb1">from calendar</span>` : `<span class="rbadge rb2">custom</span>`;
        d.innerHTML = `<div class="rcard-left"><div class="rcard-icon"><svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M12 3C8.13 3 5 6.13 5 10c0 2.8 1.6 5.2 4 6.45L8.5 19h7l-.5-2.55C17.4 15.2 19 12.8 19 10c0-3.87-3.13-7-7-7z" stroke="#6366f1" stroke-width="2" fill="none"/><path d="M8.5 19h7" stroke="#6366f1" stroke-width="2" stroke-linecap="round"/></svg></div><div><h4>${r.title}</h4><div class="rcard-meta"><span>📅 ${r.date}</span><span>⏰ ${r.time}</span></div>${badge}</div></div>${del}`;
        w.appendChild(d);
    });
}

/* SYLLABUS */
let selSub = null;
const sk = () => `se_s_${getU()}`;
const gS = () => JSON.parse(localStorage.getItem(sk()) || '{}');
const svS = d => localStorage.setItem(sk(), JSON.stringify(d));
function createSub() {
    const n = $('subInp').value.trim();
    if (!n) { toast('Enter a subject name!', true); return; }
    const s = gS(); if (s[n]) { toast('Already exists!', true); return; }
    s[n] = []; svS(s); $('subInp').value = '';
    renderSubs(); openSub(n); toast('Subject created ✓');
}
function renderSubs() {
    const c = $('subBtns'); c.innerHTML = '';
    const s = gS(), k = Object.keys(s);
    if (!k.length) { c.innerHTML = '<p style="font-size:.78rem;color:var(--faint);padding:4px 0">No subjects yet.</p>'; return; }
    k.forEach(x => {
        const b = document.createElement('button');
        b.className = 'subj-btn' + (x === selSub ? ' on' : '');
        b.innerHTML = `<span class="subj-dot"></span>${x}`;
        b.onclick = () => openSub(x); c.appendChild(b);
    });
}
function openSub(n) { selSub = n; renderSubs(); renderSylMain(); }
function renderSylMain() {
    const m = $('sylMain'); m.innerHTML = '';
    if (!selSub) {
        m.innerHTML = `<div class="syl-ph"><div class="syl-ph-icon"><svg viewBox="0 0 48 48" fill="none" width="42" height="42"><rect x="6" y="6" width="24" height="34" rx="5" stroke="#93c5fd" stroke-width="2.5"/><rect x="18" y="6" width="24" height="34" rx="5" stroke="#93c5fd" stroke-width="2.5" fill="#eff6ff"/><path d="M22 16h12M22 22h12M22 28h8" stroke="#bfdbfe" stroke-width="2" stroke-linecap="round"/></svg></div><h3>No subject selected</h3><p>Pick one from the sidebar ✏️</p></div>`;
        return;
    }
    const notes = (gS()[selSub] || []);
    const f = document.createElement('div'); f.className = 'note-form';
    f.innerHTML = `<h3>New note in <em>${selSub}</em> ✨</h3>
    <input type="text" id="nTitle" placeholder="Note title…">
    <textarea id="nBody" placeholder="Write your notes here…"></textarea>
    <button class="btn-savenote" onclick="saveNote()">Save Note ✓</button>`;
    m.appendChild(f);
    if (notes.length) {
        const nl = document.createElement('div'); nl.className = 'notes-list';
        notes.forEach((n, i) => {
            const c = document.createElement('div'); c.className = 'ncard';
            c.innerHTML = `<button class="ndel" onclick="event.stopPropagation();delNote(${i})">✕</button><h4>${n.title}</h4><p>${n.content.substring(0, 130)}${n.content.length > 130 ? '…' : ''}</p>`;
            c.onclick = () => openNote(n); nl.appendChild(c);
        });
        m.appendChild(nl);
    }
}
function saveNote() {
    const ti = $('nTitle').value.trim(), co = $('nBody').value.trim();
    if (!ti || !co) { toast('Fill in both fields!', true); return; }
    const s = gS(); s[selSub].push({ title: ti, content: co }); svS(s);
    $('nTitle').value = ''; $('nBody').value = '';
    renderSylMain(); toast('Note saved ✓');
}
function delNote(i) { const s = gS(); s[selSub].splice(i, 1); svS(s); renderSylMain(); toast('Note deleted'); }
function openNote(n) { $('nvT').textContent = n.title; $('nvB').textContent = n.content; $('noteModal').classList.add('open'); }

document.querySelectorAll('.veil').forEach(m => m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); }));

/* INIT */
(function () {
    // weekView hidden by CSS default; monthView shown by default
    if (localStorage.getItem('se_dm') === '1') { document.body.classList.add('dark'); if ($('dmBtn')) $('dmBtn').textContent = '☀️'; }
    const u = localStorage.getItem('se_cu');
    if (u) { $('greetName').textContent = u; $('navNm').textContent = u; $('navAv').textContent = u.charAt(0).toUpperCase(); showPage('page-dashboard'); }
    renderCal(); buildDate();
})();
