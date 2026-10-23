// 喵町英語社 — 主程式（純前端；可選 Firebase 雲端同步）
const KEY = "toeic700";
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const view = $("#view");

// ================= 狀態 =================
const defaults = () => ({
  profile: null, xp: 0, coins: 60, updatedAt: 0,
  srs: {}, log: {}, wrong: [], stickers: {}, claimed: {},
  inv: {}, equip: { head: null, back: null, lens: null, title: null },
  stats: { p5: { c: 0, t: 0 }, p2: { c: 0, t: 0 }, speak: { sum: 0, n: 0 }, mocks: [], pulls: 0 },
  games: { wordle: { date: "", guesses: [], done: false, win: false, plays: 0, wins: 0 }, meteor: { best: 0, plays: 0 }, boss: { wins: 0, plays: 0 } },
  settings: { rate: 0.9, voice: "", apiKey: "", newPerDay: 10, sound: true }
});
function hydrate(s) {
  const d = defaults(); if (!s) return d;
  const out = Object.assign(d, s);
  ["stats", "settings", "equip"].forEach(k => out[k] = Object.assign(defaults()[k], s[k]));
  out.games = Object.assign(defaults().games, s.games);
  if (typeof out.coins !== "number") out.coins = 60;
  return out;
}
let S = (() => { try { return hydrate(JSON.parse(localStorage.getItem(KEY))); } catch (e) { return defaults(); } })();
let pushTimer;
function save() {
  S.updatedAt = Date.now();
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
  if (Cloud.user) { clearTimeout(pushTimer); pushTimer = setTimeout(cloudPush, 2500); }
}

const dkey = d => d.toLocaleDateString("sv-SE");
const today = () => dkey(new Date());
const blankDay = () => ({ vocab: 0, speak: 0, listen: 0, grammar: 0, shadow: 0, game: 0 });
const dayLog = () => (S.log[today()] = Object.assign(blankDay(), S.log[today()]));
const active = k => { const l = S.log[k]; return !!l && Object.values(l).some(v => v > 0); };
function curWeek() {
  if (!S.profile) return 1;
  const days = Math.floor((new Date(today()) - new Date(S.profile.start)) / 864e5);
  return Math.max(1, Math.min(26, Math.floor(days / 7) + 1));
}
// 連勝：每 7 天可休息 1 天不中斷
function streak() {
  const d = new Date(); let n = 0, lastSkip = -99;
  if (!active(dkey(d))) d.setDate(d.getDate() - 1);
  for (let i = 0; i < 400; i++) {
    if (active(dkey(d))) n++;
    else { const p = new Date(d); p.setDate(p.getDate() - 1); if (i - lastSkip >= 7 && active(dkey(p))) lastSkip = i; else break; }
    d.setDate(d.getDate() - 1);
  }
  return n;
}

// ================= 等級、獎勵 =================
const RANKS = ["見習社員", "正式社員", "資深社員", "社團幹部", "副社長", "社長"];
const levelOf = xp => Math.floor(Math.sqrt(xp / 40)) + 1;
const xpFor = lv => 40 * (lv - 1) * (lv - 1);
const rankOf = lv => RANKS[Math.min(RANKS.length - 1, Math.floor((lv - 1) / 4))];
const GOAL = { vocab: 10, speak: 1, listen: 3, grammar: 5, shadow: 3 };
const TASKS = [
  { key: "vocab", icon: "book", color: "var(--c-vocab)", name: "單字卡", desc: "記憶曲線複習", reward: 10 },
  { key: "speak", icon: "mic", color: "var(--c-speak)", name: "AI 口說", desc: "情境角色扮演", reward: 15 },
  { key: "listen", icon: "head", color: "var(--c-listen)", name: "聽力 Part 2", desc: "聽問句選回應", reward: 10 },
  { key: "grammar", icon: "pen", color: "var(--c-grammar)", name: "文法 Part 5", desc: "本週文法", reward: 10 },
  { key: "shadow", icon: "repeat", color: "var(--c-shadow)", name: "跟讀", desc: "模仿發音", reward: 10 }
];
function gain({ xp = 0, coins = 0, from = null } = {}) {
  const before = levelOf(S.xp);
  S.xp += xp;
  if (coins) { if (from) flyCans(from, coins); else { S.coins += coins; renderHud(true); } }
  save(); renderHud();
  if (levelOf(S.xp) > before) setTimeout(() => levelUp(levelOf(S.xp)), 700);
}
function bump(k, n = 1) {
  const l = dayLog(); l[k] += n;
  const c = (S.claimed[today()] ||= {});
  const t = TASKS.find(t => t.key === k);
  if (t && !c[k] && l[k] >= GOAL[k]) {
    c[k] = true; S.coins += t.reward; save(); renderHud(true);
    toast(`任務完成：${t.name}　+${t.reward} 罐罐`); sfx("level");
  } else save();
  renderHud(); checkStickers();
}

// ================= 小工具 =================
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random() * a.length)];
const pad = n => String(n).padStart(2, "0");
const W = n => WEEKS.find(x => x.w === n);
const vib = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };
const playBtn = t => `<button class="play" title="播放" onclick='say(${JSON.stringify(t)})'>${ICON.play}</button>`;
function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("show"); clearTimeout(toast.h); toast.h = setTimeout(() => el.classList.remove("show"), 2400); }
let actx;
function sfx(type) {
  if (!S.settings.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const notes = { ok: [660, 880], no: [320, 260], level: [523, 659, 784, 1046], tap: [520], coin: [988, 1319] }[type] || [440];
    notes.forEach((f, i) => {
      const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + i * 0.08;
      o.type = type === "no" ? "triangle" : "square"; o.frequency.value = f;
      g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      o.connect(g).connect(actx.destination); o.start(t); o.stop(t + 0.16);
    });
  } catch (e) {}
}
const gearOf = () => ({ head: S.equip.head, back: S.equip.back, lens: S.equip.lens });
const cat = (o = {}) => mascot({ gear: gearOf(), ...o });

// 罐罐飛進狀態列
function flyCans(fromEl, amount) {
  const a = fromEl.getBoundingClientRect(), b = $("#canIco").getBoundingClientRect();
  const p = document.createElement("div"); p.className = "plus"; p.textContent = "+" + amount;
  p.style.left = (a.left + a.width / 2 - 24) + "px"; p.style.top = (a.top - 8) + "px"; document.body.appendChild(p); setTimeout(() => p.remove(), 700);
  for (let i = 0; i < 5; i++) {
    const f = document.createElement("div"); f.className = "fly"; f.innerHTML = ICON.can;
    f.style.left = (a.left + a.width / 2 - 14) + "px"; f.style.top = (a.top + a.height / 2 - 14) + "px"; document.body.appendChild(f);
    setTimeout(() => { f.style.transform = `translate(${b.left - a.left - a.width / 2 + 14}px, ${b.top - a.top - a.height / 2 + 14}px) scale(.8)`; f.style.opacity = ".2"; }, 30 + i * 70);
    setTimeout(() => f.remove(), 700 + i * 70);
  }
  setTimeout(() => { S.coins += amount; save(); renderHud(true); sfx("coin"); }, 650);
}
function modal(html) {
  const m = $("#modal"); m.innerHTML = `<div class="card">${html}</div>`; m.classList.add("show");
  return new Promise(res => { $$("[data-close]", m).forEach(b => b.onclick = () => { m.classList.remove("show"); res(b.dataset.close); }); });
}
function levelUp(lv) {
  sfx("level"); vib([20, 40, 20]);
  modal(`<span class="t-label muted">Level Up</span><div class="glow">${cat({ expr: "wow", pose: "cheer", still: true })}</div>
    <h2 class="t-h2">升到 LV.${lv}！</h2><p class="t-small">現在的職稱是「${rankOf(lv)}」</p><button class="btn btn-primary btn-block" data-close="ok">太棒了</button>`);
}

// ================= 語音 =================
let voices = [];
function loadVoices() { voices = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang)); }
if ("speechSynthesis" in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
function speak(text, rate) {
  return new Promise(res => {
    if (!("speechSynthesis" in window)) return res();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US"; u.rate = rate || S.settings.rate;
    const v = voices.find(v => v.voiceURI === S.settings.voice) || voices.find(v => v.lang === "en-US") || voices[0];
    if (v) { u.voice = v; u.lang = v.lang; }
    u.onend = u.onerror = () => res();
    speechSynthesis.speak(u);
  });
}
window.say = t => speak(t);
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
function listen() {
  return new Promise((res, rej) => {
    if (!SR) return rej(new Error("nosr"));
    const r = new SR(); r.lang = "en-US"; r.interimResults = false; r.maxAlternatives = 3;
    let done = false;
    r.onresult = e => { done = true; const a = e.results[0][0]; res({ text: a.transcript, conf: a.confidence || 0 }); };
    r.onerror = e => { if (!done) { done = true; rej(new Error(e.error)); } };
    r.onend = () => { if (!done) rej(new Error("no-speech")); };
    r.start();
  });
}
const micErr = e => toast(e.message === "nosr" ? "這個瀏覽器不支援語音辨識，可以改用打字" : e.message === "not-allowed" ? "請允許麥克風權限" : "沒聽到聲音，再試一次");

// ================= 比對評分 =================
const CONTR = { "i'm": "i am", "it's": "it is", "that's": "that is", "don't": "do not", "doesn't": "does not", "didn't": "did not", "can't": "can not", "cannot": "can not", "won't": "will not", "i'll": "i will", "we'll": "we will", "you're": "you are", "we're": "we are", "they're": "they are", "isn't": "is not", "aren't": "are not", "let's": "let us", "i'd": "i would", "he's": "he is", "she's": "she is", "what's": "what is", "there's": "there is", "haven't": "have not", "hasn't": "has not", "i've": "i have" };
const tokens = s => s.toLowerCase().replace(/[’]/g, "'").replace(/[^a-z0-9' ]+/g, " ").split(/\s+/).filter(Boolean).flatMap(w => (CONTR[w] || w).split(" "));
function lcs(a, b) {
  const m = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) m[i][j] = a[i - 1] === b[j - 1] ? m[i - 1][j - 1] + 1 : Math.max(m[i - 1][j], m[i][j - 1]);
  return m[a.length][b.length];
}
const similarity = (said, target) => { const a = tokens(said), b = tokens(target); return a.length && b.length ? (2 * lcs(a, b)) / (a.length + b.length) : 0; };
function best(said, targets) { let top = { s: 0, t: targets[0] }; targets.forEach(t => { const s = similarity(said, t); if (s > top.s) top = { s, t }; }); return top; }
function diffHTML(said, target) { const got = new Set(tokens(said)); return target.split(" ").map(w => got.has(tokens(w)[0]) ? `<span class="w-ok">${esc(w)}</span>` : `<span class="w-miss">${esc(w)}</span>`).join(" "); }
const PROPER = { mr: "Mr.", ms: "Ms.", brown: "Brown", kayla: "Kayla", lin: "Lin", amy: "Amy", sarah: "Sarah", hr: "HR", taiwan: "Taiwan", taichung: "Taichung", youtube: "YouTube", monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday", friday: "Friday", september: "September", pm: "p.m.", "i": "I" };
const QW = /^(what|when|where|who|why|how|which|is|are|do|does|did|can|could|may|would|will|should|have|has)\b/;
function cap(s) {
  let t = s.split(" ").map(w => { const k = w.toLowerCase(); return PROPER[k] || (/^i'/.test(k) ? "I" + w.slice(1) : w); }).join(" ");
  t = t.charAt(0).toUpperCase() + t.slice(1);
  return /[.?!]$/.test(t) ? t : t + (QW.test(s) ? "?" : ".");
}

// ================= 題庫 =================
const unlockedWeeks = () => { const n = Math.max(2, Math.min(curWeek(), 24)); return WEEKS.filter(w => w.w <= n && !w.review); };
const parseWord = s => { const [word, pos, zh, ex] = s.split("|"); return { word, pos, zh, ex }; };
function poolP5(wk) { const w = W(wk); if (w && !w.review) return w.p5.map((q, i) => ({ q, w: w.w, i })); return WEEKS.filter(x => !x.review).flatMap(x => x.p5.map((q, i) => ({ q, w: x.w, i }))); }
function poolP2(wk) { const w = W(wk); if (w && !w.review) return w.p2.slice(); return WEEKS.filter(x => !x.review).flatMap(x => x.p2); }
const dailyWord = () => WORDLE_WORDS[Math.floor(new Date(today()) / 864e5) % WORDLE_WORDS.length].split("|");

// ================= 成就 =================
const totalDone = () => Object.values(S.log).reduce((a, l) => a + Object.values(l).reduce((x, y) => x + y, 0), 0);
const STICKERS = [
  { id: "first", t: "GO!", n: "第一步", d: "完成第一個任務", ok: () => totalDone() > 0 },
  { id: "s3", t: "3天", n: "三天熱度", d: "連續學習 3 天", ok: () => streak() >= 3 },
  { id: "s7", t: "7天", n: "一週不斷電", d: "連續學習 7 天", ok: () => streak() >= 7 },
  { id: "s30", t: "30天", n: "月度社員", d: "連續學習 30 天", ok: () => streak() >= 30 },
  { id: "v50", t: "50字", n: "字彙小腦袋", d: "學會 50 個單字", ok: () => Object.keys(S.srs).length >= 50 },
  { id: "v150", t: "150字", n: "行走字典", d: "學會 150 個單字", ok: () => Object.keys(S.srs).length >= 150 },
  { id: "wd", t: "WIN", n: "猜字達人", d: "猜中一次每日猜字", ok: () => S.games.wordle.wins >= 1 },
  { id: "wd10", t: "×10", n: "字母魔法師", d: "猜字累積 10 勝", ok: () => S.games.wordle.wins >= 10 },
  { id: "met", t: "300", n: "隕石獵人", d: "單字隕石拿到 300 分", ok: () => S.games.meteor.best >= 300 },
  { id: "boss", t: "K.O.", n: "打倒魔王", d: "第一次打贏文法魔王", ok: () => S.games.boss.wins >= 1 },
  { id: "talk5", t: "TALK", n: "開口王", d: "完成 5 次口說情境", ok: () => S.stats.speak.n >= 5 },
  { id: "mock", t: "TEST", n: "實戰演練", d: "完成一次模擬考", ok: () => S.stats.mocks.length >= 1 },
  { id: "gacha", t: "GET", n: "扭蛋初體驗", d: "轉第一次扭蛋", ok: () => S.stats.pulls >= 1 },
  { id: "half", t: "13週", n: "半山腰", d: "抵達第 13 週", ok: () => curWeek() >= 13 },
  { id: "lv10", t: "LV10", n: "社團幹部", d: "等級達到 10", ok: () => levelOf(S.xp) >= 10 }
];
function checkStickers() {
  STICKERS.forEach(s => {
    if (!S.stickers[s.id] && s.ok()) {
      S.stickers[s.id] = today(); S.coins += 20; save(); renderHud(true);
      setTimeout(() => { toast(`獲得成就「${s.n}」　+20 罐罐`); sfx("level"); }, 600);
    }
  });
}

// ================= 狀態列、導覽 =================
const NAV = [["lobby", "home", "大廳"], ["map", "map", "地圖"], ["gacha", "gacha", "扭蛋"], ["games", "game", "遊戲"], ["speak", "mic", "口說"], ["me", "user", "我的"]];
const TAB_OF = { week: "map", talk: "speak", free: "speak", wordle: "games", meteor: "games", boss: "games", vocab: "lobby", listen: "lobby", grammar: "lobby", shadow: "lobby", mock: "games" };
function renderNav() {
  const html = list => list.map(([r, ic, t]) => `<button class="navbtn" data-r="${r}">${ICON[ic]}${t}<span class="dot" data-dot="${r}" hidden></span></button>`).join("");
  $("#rail").innerHTML = html(NAV);
  $("#tabbar").innerHTML = html(NAV.filter(([r]) => r !== "speak"));
  $$(".navbtn").forEach(b => b.onclick = () => { sfx("tap"); go(b.dataset.r); });
}
function renderHud(bumpCoins) {
  if (!S.profile) return;
  const lv = levelOf(S.xp), pct = Math.round(((S.xp - xpFor(lv)) / (xpFor(lv + 1) - xpFor(lv))) * 100);
  $("#avatar").innerHTML = cat({ expr: "happy", head: true, still: true });
  $("#hudName").textContent = S.profile.name;
  $("#hudLv").textContent = "LV." + lv;
  $("#xpbar").style.width = pct + "%";
  $("#streakNum").textContent = streak();
  $("#coins").textContent = S.coins;
  if (bumpCoins) { const p = $("#canPill"); p.classList.remove("bump"); void p.offsetWidth; p.classList.add("bump"); }
  const wd = S.games.wordle;
  $$('[data-dot="gacha"]').forEach(d => d.hidden = S.coins < 30);
  $$('[data-dot="games"]').forEach(d => d.hidden = wd.date === today() && wd.done);
}
function setActive(r) { const t = TAB_OF[r] || r; $$(".navbtn").forEach(b => b.classList.toggle("on", b.dataset.r === t)); }

// ================= 路由 =================
let cleanup = null;
function go(r, arg) {
  if (cleanup) { cleanup(); cleanup = null; }
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  if (!S.profile) return renderOnboard();
  setActive(r); view.scrollTo(0, 0); window.scrollTo(0, 0);
  (ROUTES[r] || ROUTES.lobby)(arg);
}
const page = (html, cls = "page") => { view.innerHTML = `<div class="${cls}">${html}</div>`; };
const backBtn = (label, r, arg) => `<button class="back" data-back="${r}" data-arg="${arg ?? ""}">${ICON.arrow}${label}</button>`;
function wireBack() { $$("[data-back]").forEach(b => b.onclick = () => go(b.dataset.back, b.dataset.arg ? +b.dataset.arg : undefined)); }
function doneCard(title, big, note, again, expr = "happy") {
  page(`<div class="card" style="text-align:center;max-width:520px;margin:0 auto">
    <div style="width:160px;margin:0 auto">${cat({ expr, pose: "cheer" })}</div>
    <div class="t-num" style="font-size:40px;margin:var(--s3) 0 var(--s2)">${big}</div>
    <h2 class="t-h2">${title}</h2><p class="t-small">${note}</p>
    <div class="row" style="justify-content:center;margin-top:var(--s4)"><button class="btn" id="re">再一次</button><button class="btn btn-primary" id="hm">回大廳</button></div></div>`);
  $("#re").onclick = again; $("#hm").onclick = () => go("lobby");
}

// ================= 首次設定 =================
function renderOnboard() {
  $("#hudWrap").hidden = true;
  view.innerHTML = `<div class="page" style="max-width:560px">
    <div class="stage" style="min-height:0">
      <div class="rays"></div><div class="dots"></div>
      <div class="stage-top" style="text-align:center"><span class="chip">社員募集中！每天一點點・26 週衝 750</span><div class="stage-title">喵町英語社<small>★</small></div></div>
      <div class="stage-mid" style="flex-direction:column;align-items:center;padding-top:var(--s3)">
        <div class="say" style="position:relative;left:auto;top:auto;max-width:90%;text-align:center;margin-bottom:14px">嗨！我是社長貓<b>「餅乾」</b>，<br>接下來 26 週陪你衝多益 750 喵！</div>
        <div class="cat" style="width:200px">${cat({ expr: "happy", pose: "wave", sticker: true })}</div>
      </div>
      <div class="stage-bot" style="flex-direction:column;align-items:stretch">
        <div><span class="t-label muted">Sign up · 入社登記</span>
        <label for="ob-name" style="margin-top:var(--s2)">社員暱稱</label><input id="ob-name" maxlength="16" placeholder="例如 Kayla">
        <label for="ob-start">開始日期（第 1 週從這天算起）</label><input id="ob-start" type="date" value="${today()}"></div>
        <button class="btn btn-primary btn-lg btn-block" id="ob-go" style="margin-top:var(--s4)">加入社團</button>
        ${Cloud.enabled ? `<button class="btn btn-block" id="ob-google" style="margin-top:var(--s3)">${ICON.google}用 Google 登入（已有帳號可接續進度）</button>` : ""}
      </div>
    </div></div>`;
  $("#ob-go").onclick = () => {
    S.profile = { name: $("#ob-name").value.trim() || "社員", start: $("#ob-start").value || today() };
    save(); sfx("level"); $("#hudWrap").hidden = false; renderHud(); go("lobby");
  };
  const g = $("#ob-google"); if (g) g.onclick = () => Cloud.signIn().catch(e => toast("登入失敗：" + e.message));
}

// ================= 大廳 =================
const LINES = ["主人，今天只要完成<b> 1 個任務</b>就過關喵！", "做任務可以拿<b>罐罐</b>，去轉扭蛋換裝備喵～", "今天的猜字，你猜得到嗎？", "每週可以休息 1 天，連勝不會斷喵！"];
const MACHINE_MINI = `<svg viewBox="0 0 80 90" aria-hidden="true"><circle cx="40" cy="32" r="26" fill="#eaf6fb" stroke="#1f1a17" stroke-width="3"/><g stroke="#1f1a17" stroke-width="2"><circle cx="30" cy="38" r="7" fill="#f6c33b"/><circle cx="46" cy="42" r="7" fill="#62bfe9"/><circle cx="38" cy="24" r="6.5" fill="#f28bb0"/><circle cx="52" cy="28" r="6" fill="#d2401f"/></g><path d="M22 18 a20 20 0 0 1 14 -8" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M14 56 h52 l4 30 H10 Z" fill="#d2401f" stroke="#1f1a17" stroke-width="3" stroke-linejoin="round"/><rect x="12" y="52" width="56" height="8" rx="3" fill="#f6c33b" stroke="#1f1a17" stroke-width="3"/><circle cx="40" cy="72" r="8" fill="#fffaf0" stroke="#1f1a17" stroke-width="3"/><path d="M33 72 h14" stroke="#1f1a17" stroke-width="3" stroke-linecap="round"/></svg>`;
function renderLobby() {
  const wk = curWeek(), w = W(wk), ph = PHASES.find(p => p.id === w.phase), log = dayLog();
  const done = TASKS.filter(t => log[t.key] >= GOAL[t.key]).length;
  const next = TASKS.find(t => log[t.key] < GOAL[t.key]);
  const wd = S.games.wordle, wdDone = wd.date === today() && wd.done, [ANS] = dailyWord();
  const greet = done === 0 ? LINES[0] : done === 5 ? "今日任務全部完成！<b>你是傳說級社員</b>喵！" : `已經完成 <b>${done}</b> 項，今天過關啦！剩下都是加碼喵～`;
  let track = ""; const start = Math.max(1, Math.min(wk - 2, 20));
  for (let n = start; n < start + 7; n++) { const boss = [6, 12, 18, 24].includes(n); track += `<span class="node ${n === wk ? "cur" : n < wk ? "done" : ""} ${boss ? "boss" : ""}">${boss ? "王" : n}</span>${n < start + 6 ? '<span class="link"></span>' : ""}`; }
  view.innerHTML = `<div class="lobby">
    <section class="stage">
      <div class="rays"></div><div class="dots"></div>
      <div class="stage-top"><span class="chip">社員募集中！每天一點點・26 週衝 750</span><div class="stage-title">喵町英語社<small>★</small></div></div>
      <div class="stage-mid"><div class="say" id="say">${greet}</div><div class="cat" id="cat" title="點我">${cat({ expr: done ? "happy" : "normal", pose: "wave", sticker: true })}</div></div>
      <div class="stage-bot">
        <div class="ep"><span class="t-label">EP.${pad(wk)} · WEEK ${wk} / 26 · ${ph.en}</span><div class="t-h3">${esc(w.theme)}</div><div class="t-small">本週文法：${esc(w.grammar)}</div></div>
        <button class="btn btn-primary btn-lg" id="go">${next ? "開始今日任務" : "去玩小遊戲"}</button>
      </div>
    </section>
    <section class="side">
      <div class="card">
        <div class="sec-hd" style="margin-bottom:var(--s2)"><h2 class="t-h2">今日任務</h2><span class="t-num" style="font-size:18px">${done}/5</span></div>
        <div class="bar" style="margin-bottom:var(--s2)"><i style="width:${done * 20}%"></i></div>
        ${TASKS.map(t => { const ok = log[t.key] >= GOAL[t.key]; return `<div class="task ${ok ? "done" : ""}" data-go="${t.key}">
          <span class="icon-tile" style="background:${t.color}">${ICON[t.icon]}</span>
          <div class="txt"><b>${t.name}</b><span>${t.desc}・今日 ${Math.min(log[t.key], GOAL[t.key])}/${GOAL[t.key]}</span></div>
          <span class="reward">${ok ? "完成" : `<span class="ico">${ICON.can}</span>+${t.reward}`}</span></div>`; }).join("")}
        <div class="hint">完成 1 項就算今日過關，其他都是加碼。</div>
      </div>
      <div class="events">
        <div class="card event" data-go="gacha">${S.coins >= 30 ? '<span class="dot"></span>' : ""}
          <div class="art" style="background:var(--reward-soft)">${MACHINE_MINI}</div>
          <div class="info"><div class="t-h3">昭和扭蛋機</div><p class="t-small">30 罐罐轉一次</p><span class="btn btn-reward btn-sm">去轉蛋</span></div></div>
        <div class="card event" data-go="wordle">${wdDone ? "" : '<span class="dot"></span>'}
          <div class="art" style="background:var(--surface-2)"><div class="mini-tiles">${wdDone ? ANS.slice(0, 2).split("").map(c => `<span class="${wd.win ? "g" : ""}">${c}</span>`).join("") : '<span class="y">?</span><span class="g">?</span>'}</div></div>
          <div class="info"><div class="t-h3">每日猜字</div><p class="t-small">${wdDone ? (wd.win ? "今天猜中了！" : "明天換新字") : "6 次猜出今天的字"}</p><span class="btn btn-sm">${wdDone ? "再看一次" : "開始猜"}</span></div></div>
      </div>
      <div class="card">
        <div class="sec-hd" style="margin-bottom:0"><h2 class="t-h2">冒險地圖 <span class="t-small" style="font-family:var(--f-ui)">第 ${wk} / 26 週</span></h2><button class="btn btn-sm" data-go="map">完整地圖</button></div>
        <div class="track">${track}</div>
      </div>
    </section></div>`;
  $$("[data-go]").forEach(el => el.onclick = () => { sfx("tap"); const k = el.dataset.go; k === "speak" ? go("talk", Math.min(wk, 24)) : go(k, wk); });
  $("#go").onclick = () => { sfx("tap"); if (!next) return go("games"); next.key === "speak" ? go("talk", Math.min(wk, 24)) : go(next.key, wk); };
  let li = 0;
  $("#cat").onclick = () => {
    const c = $("#cat"); c.classList.remove("jump"); void c.offsetWidth; c.classList.add("jump"); vib(15); sfx("tap");
    li = (li + 1) % LINES.length; const e = ["happy", "wow", "think", "normal"][li];
    c.innerHTML = cat({ expr: e, pose: e === "wow" ? "cheer" : "wave", sticker: true });
    const s = $("#say"); s.innerHTML = LINES[li]; s.classList.remove("pop"); void s.offsetWidth; s.classList.add("pop");
  };
}

// ================= 地圖 =================
function renderMap() {
  const wk = curWeek();
  page(`<div class="page-hd"><div><span class="t-label">Adventure Map</span><h1 class="t-h1">26 週冒險地圖</h1></div><span class="chip">目前：第 ${wk} 週</span></div>
  ${PHASES.map(p => `<div class="card phase">
    <div class="phase-hd"><span class="rar ${["n", "r", "sr", "ssr", "ssr"][p.id - 1]}" style="padding:0 10px">${p.en}</span><h2 class="t-h2">${p.name}</h2><span class="t-small">第 ${p.weeks} 週・階段目標 ${p.target} 分</span></div>
    <p class="t-small" style="margin:0">${p.desc}</p>
    <div class="path">${WEEKS.filter(w => w.phase === p.id).map((w, i, arr) => {
      const boss = [6, 12, 18, 24].includes(w.w), st = w.w === wk ? "cur" : w.w < wk ? "done" : "";
      return `<div class="cell"><div class="wk"><div class="node ${st} ${boss ? "boss" : ""}" data-w="${w.w}" title="${esc(w.theme)}">${boss ? "王" : w.w}${w.w < wk ? `<span class="ck">${ICON.check}</span>` : ""}${w.w === wk ? `<span class="me-head">${cat({ expr: "happy", head: true, still: true })}</span>` : ""}</div><div class="week-label">${esc(w.theme)}</div></div>${i < arr.length - 1 ? '<span class="link"></span>' : ""}</div>`;
    }).join("")}</div></div>`).join("")}`);
  $$("[data-w]").forEach(n => n.onclick = () => { sfx("tap"); go("week", +n.dataset.w); });
}
function renderWeek(n) {
  const w = W(n) || W(1);
  page(`${backBtn("冒險地圖", "map")}
  <div class="page-hd"><div><span class="t-label">EP.${pad(w.w)} · WEEK ${w.w} / 26</span><h1 class="t-h1">${esc(w.theme)}</h1></div>${[6, 12, 18, 24].includes(w.w) ? '<span class="chip" style="background:var(--primary);color:#fff">魔王週・建議做模擬考</span>' : ""}</div>
  <div class="card"><h3 class="t-h3">本週文法：${esc(w.grammar)}</h3><div class="tip-box" style="margin-top:var(--s3)">${esc(w.tip)}</div></div>
  <div class="card"><h3 class="t-h3" style="margin-bottom:var(--s2)">本週練習</h3>
    ${[["grammar", "pen", "var(--c-grammar)", "文法 Part 5", "本週文法題＋解析"], ["listen", "head", "var(--c-listen)", "聽力 Part 2", "聽問句選回應"], [w.talk ? "talk" : "mock", "mic", "var(--c-speak)", w.talk ? "口說：" + w.talk.title : "模擬考", w.talk ? w.talk.role : "全範圍檢測"], ["shadow", "repeat", "var(--c-shadow)", "跟讀", "模仿例句發音"]]
      .map(([r, ic, col, t, d]) => `<div class="list-item" data-r="${r}"><span class="icon-tile" style="background:${col}">${ICON[ic]}</span><div class="txt"><b>${esc(t)}</b><span>${esc(d)}</span></div>${ICON.chev}</div>`).join("")}
  </div>
  ${w.words.length ? `<div class="card"><h3 class="t-h3">本週單字（${w.words.length}）</h3>${w.words.map(parseWord).map(x => `<div class="word-row">${playBtn(x.word)}<div class="txt"><b>${esc(x.word)}</b><span class="pos">${esc(x.pos)}</span>${esc(x.zh)}<div class="ex">${esc(x.ex)}</div></div>${playBtn(x.ex)}</div>`).join("")}</div>` : ""}`);
  wireBack();
  $$("[data-r]").forEach(b => b.onclick = () => go(b.dataset.r, w.w));
}

// ================= 扭蛋與衣櫃 =================
const MACHINE_BIG = `<svg class="machine" id="machine" viewBox="0 0 240 300" aria-hidden="true">
  <ellipse cx="120" cy="292" rx="90" ry="7" fill="#1f1a17" opacity=".15"/>
  <g class="globe"><circle cx="120" cy="96" r="84" fill="#eaf6fb" stroke="#1f1a17" stroke-width="5"/>
  <g stroke="#1f1a17" stroke-width="3.5"><circle cx="86" cy="116" r="20" fill="#f6c33b"/><circle cx="132" cy="126" r="20" fill="#62bfe9"/><circle cx="110" cy="76" r="18" fill="#f28bb0"/><circle cx="154" cy="86" r="17" fill="#d2401f"/><circle cx="68" cy="80" r="14" fill="#2f9e8a"/><circle cx="170" cy="124" r="14" fill="#8a63d2"/></g>
  <path d="M60 50 Q80 26 112 22" stroke="#fff" stroke-width="9" fill="none" stroke-linecap="round"/></g>
  <rect x="30" y="170" width="180" height="20" rx="6" fill="#f6c33b" stroke="#1f1a17" stroke-width="5"/>
  <path d="M38 188 h164 l12 96 H26 Z" fill="#d2401f" stroke="#1f1a17" stroke-width="5" stroke-linejoin="round"/>
  <path d="M176 192 l10 88 h14 l-10 -88 Z" fill="#a8301a"/>
  <rect x="150" y="204" width="34" height="12" rx="4" fill="#1f1a17"/>
  <rect x="46" y="236" width="48" height="38" rx="8" fill="#1f1a17"/>
  <g class="knob" id="knob"><circle cx="120" cy="228" r="26" fill="#fffaf0" stroke="#1f1a17" stroke-width="5"/><rect x="92" y="222" width="56" height="12" rx="6" fill="#62bfe9" stroke="#1f1a17" stroke-width="4"/></g>
</svg>`;
function itemPic(it) {
  if (["head", "back", "lens"].includes(it.slot)) return mascot({ gear: { [it.slot]: it.id }, head: it.slot !== "back", still: true, expr: "happy" });
  const col = { title: "#8a63d2", sticker: "#f6c33b" }[it.slot];
  return `<svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="32" fill="${col}" stroke="#1f1a17" stroke-width="4"/><text x="40" y="46" text-anchor="middle" font-family="Chiron GoRound TC, Noto Sans TC" font-weight="900" font-size="${it.slot === "title" ? 15 : 14}" fill="${it.slot === "title" ? "#fff" : "#1f1a17"}">${it.slot === "title" ? "稱號" : esc(it.name.split(" ")[0])}</text></svg>`;
}
function rollItem() {
  const total = Object.values(RARITY_WEIGHT).reduce((a, b) => a + b, 0);
  let r = Math.random() * total, rar = "n";
  for (const [k, v] of Object.entries(RARITY_WEIGHT)) { if ((r -= v) < 0) { rar = k; break; } }
  return pick(ITEMS.filter(i => i.rar === rar));
}
function renderGacha(tab = "machine") {
  const owned = ITEMS.filter(i => S.inv[i.id]).length;
  page(`<div class="page-hd"><div><span class="t-label">Gacha</span><h1 class="t-h1">昭和扭蛋機</h1></div><span class="chip">收集 ${owned} / ${ITEMS.length}</span></div>
  <div class="tabs"><button data-tab="machine" class="${tab === "machine" ? "on" : ""}">扭蛋機</button><button data-tab="closet" class="${tab === "closet" ? "on" : ""}">衣櫃與圖鑑</button></div>
  <div id="gbody"></div>`);
  $$("[data-tab]").forEach(b => b.onclick = () => renderGacha(b.dataset.tab));
  if (tab === "machine") {
    $("#gbody").innerHTML = `<div class="card gacha-hero">${MACHINE_BIG}
      <div><h2 class="t-h2">今天想轉什麼？</h2><p class="t-small">做任務、玩遊戲賺罐罐，30 罐罐轉一次。重複的獎品會退還 10 罐罐。</p>
        <div class="row" style="margin:var(--s4) 0"><span class="pill"><span class="ico">${ICON.can}</span><span class="t-num">${S.coins}</span></span></div>
        <div class="row"><button class="btn btn-primary btn-lg" id="spin" ${S.coins < 30 ? "disabled" : ""}>轉一次（30）</button></div>
        ${S.coins < 30 ? `<p class="t-small" style="margin-top:var(--s3)">罐罐不夠了，去完成今日任務吧！</p>` : ""}
        <p class="t-small" style="margin-top:var(--s4)">機率：<span class="rar n">N</span> 50%　<span class="rar r">R</span> 32%　<span class="rar sr">SR</span> 14%　<span class="rar ssr">SSR</span> 4%</p></div></div>`;
    $("#spin").onclick = spin;
  } else {
    const slots = [["head", "頭部"], ["back", "背部"], ["lens", "鏡片"], ["title", "稱號"], ["sticker", "貼紙"]];
    $("#gbody").innerHTML = `<div class="closet"><div class="card preview" style="text-align:center"><div style="max-width:200px;margin:0 auto">${cat({ expr: "happy", pose: "cheer" })}</div>
      <b>${esc(S.profile.name)}</b><div class="t-small">${S.equip.title ? "「" + esc(ITEMS.find(i => i.id === S.equip.title).name) + "」" : "尚未裝備稱號"}</div></div>
      <div>${slots.map(([slot, label]) => `<h3 class="t-h3" style="margin:0 0 var(--s2)">${label}</h3><div class="items" style="margin-bottom:var(--s5)">${ITEMS.filter(i => i.slot === slot).map(it => {
        const have = S.inv[it.id], on = S.equip[slot] === it.id;
        return `<div class="item ${have ? "" : "lock"} ${on ? "on" : ""}"><div class="pic">${itemPic(it)}</div><b>${have ? esc(it.name) : "？？？"}</b><span class="rar ${it.rar}">${it.rar.toUpperCase()}</span>
          ${have && slot !== "sticker" ? `<button class="btn btn-sm" data-eq="${it.id}">${on ? "卸下" : "裝備"}</button>` : have ? `<div class="t-small">×${have}</div>` : `<div class="t-small">轉扭蛋取得</div>`}</div>`;
      }).join("")}</div>`).join("")}</div></div>`;
    $$("[data-eq]").forEach(b => b.onclick = () => {
      const it = ITEMS.find(i => i.id === b.dataset.eq); S.equip[it.slot] = S.equip[it.slot] === it.id ? null : it.id;
      save(); renderHud(); sfx("ok"); renderGacha("closet");
    });
  }
}
function spin() {
  if (S.coins < 30) return;
  const btn = $("#spin"); btn.disabled = true; btn.innerHTML = '<span class="spin"></span>轉動中';
  S.coins -= 30; S.stats.pulls++; save(); renderHud(true); vib([15, 40, 15]); sfx("tap");
  const m = $("#machine"); m.classList.remove("shake"); void m.getBoundingClientRect(); m.classList.add("shake");
  spin.rot = (spin.rot || 0) + 360; $("#knob").style.transform = `rotate(${spin.rot}deg)`;
  setTimeout(() => {
    const it = rollItem(), dup = !!S.inv[it.id];
    S.inv[it.id] = (S.inv[it.id] || 0) + 1; if (dup) S.coins += 10;
    save(); renderHud(); checkStickers(); sfx(it.rar === "ssr" || it.rar === "sr" ? "level" : "ok"); vib(30);
    modal(`<span class="rar ${it.rar}">${it.rar.toUpperCase()}</span><div class="glow">${itemPic(it)}</div>
      <h2 class="t-h2">${esc(it.name)}</h2><p class="t-small">${esc(it.desc)}${dup ? "<br>已經有了，退還 10 罐罐" : ""}</p>
      <div class="row" style="justify-content:center;margin-top:var(--s4)">${["head", "back", "lens", "title"].includes(it.slot) ? `<button class="btn" data-close="equip">馬上裝備</button>` : ""}<button class="btn btn-primary" data-close="ok">收下</button></div>`)
      .then(r => { if (r === "equip") { S.equip[it.slot] = it.id; save(); renderHud(); renderGacha("closet"); } else renderGacha("machine"); });
  }, 1000);
}

// ================= 遊戲中心 =================
const ART_METEOR = `<svg viewBox="0 0 96 96" aria-hidden="true"><rect width="96" height="96" fill="#243159"/><g fill="#fffaf0"><circle cx="16" cy="18" r="2"/><circle cx="74" cy="14" r="1.6"/><circle cx="82" cy="44" r="2"/></g><path d="M30 10 L44 34 M42 8 L54 30" stroke="#fffaf0" stroke-width="3" stroke-dasharray="4 4"/><rect x="28" y="36" width="52" height="24" rx="6" fill="#f6c33b" stroke="#1f1a17" stroke-width="3"/><text x="54" y="53" text-anchor="middle" font-family="Dela Gothic One" font-size="12" fill="#1f1a17">WORD</text><rect y="78" width="96" height="18" fill="#2f9e8a" stroke="#1f1a17" stroke-width="3"/></svg>`;
const ART_WORDLE = `<svg viewBox="0 0 96 96" aria-hidden="true"><rect width="96" height="96" fill="#f7ecd6"/>${[["W", 12, 12, "#2f8a5b"], ["O", 52, 12, "#f6c33b"], ["R", 12, 52, "#fffaf0"], ["D", 52, 52, "#2f8a5b"]].map(([c, x, y, f]) => `<rect x="${x}" y="${y}" width="32" height="32" rx="6" fill="${f}" stroke="#1f1a17" stroke-width="3"/><text x="${x + 16}" y="${y + 23}" text-anchor="middle" font-family="Dela Gothic One" font-size="16" fill="${f === "#2f8a5b" ? "#fff" : "#1f1a17"}">${c}</text>`).join("")}</svg>`;
function renderGames() {
  const g = S.games, wd = g.wordle, ph = W(curWeek()).phase;
  page(`<div class="page-hd"><div><span class="t-label">Games</span><h1 class="t-h1">遊戲中心</h1></div><span class="t-small">玩遊戲也能拿罐罐，不扣分、不倒扣</span></div>
  <div class="grid2">
    <div class="card game-card" data-g="wordle" style="margin:0">${wd.date === today() && wd.done ? "" : '<span class="dot"></span>'}<div class="art">${ART_WORDLE}</div><div class="info"><h3 class="t-h3">每日猜字</h3><p class="t-small">每天一個多益單字，6 次猜出 5 個字母</p><span class="chip"><span class="t-label">${wd.wins} WINS</span></span></div></div>
    <div class="card game-card" data-g="meteor" style="margin:0"><div class="art">${ART_METEOR}</div><div class="info"><h3 class="t-h3">單字隕石</h3><p class="t-small">60 秒內點出正確中文，連擊越多分越高</p><span class="chip"><span class="t-label">BEST ${g.meteor.best}</span></span></div></div>
    <div class="card game-card" data-g="boss" style="margin:0"><div class="art" style="background:var(--surface-2)">${monster(BOSSES[ph - 1].color)}</div><div class="info"><h3 class="t-h3">文法魔王</h3><p class="t-small">答對 Part 5 就攻擊，連續答對放大絕</p><span class="chip"><span class="t-label">K.O. ×${g.boss.wins}</span></span></div></div>
    <div class="card game-card" data-g="mock" style="margin:0"><div class="art" style="background:var(--reward-soft)"><div style="font:900 26px/1 var(--f-brand)">TEST</div></div><div class="info"><h3 class="t-h3">迷你模擬考</h3><p class="t-small">Part 2 ＋ Part 5，粗估分數看進步</p><span class="chip"><span class="t-label">${S.stats.mocks.length} TIMES</span></span></div></div>
  </div>
  <div class="card" style="margin-top:var(--s4)"><h3 class="t-h3" style="margin-bottom:var(--s2)">經典練習</h3>
    ${[["vocab", "book", "var(--c-vocab)", "單字卡", "記憶曲線複習"], ["listen", "head", "var(--c-listen)", "聽力 Part 2", "聽問句選回應"], ["grammar", "pen", "var(--c-grammar)", "文法 Part 5", "本週文法"], ["shadow", "repeat", "var(--c-shadow)", "跟讀", "模仿發音"], ["wrongbook", "pen", "var(--primary)", "錯題本", `${S.wrong.length} 題待複習`]]
      .map(([r, ic, col, t, d]) => `<div class="list-item" data-g="${r}"><span class="icon-tile" style="background:${col}">${ICON[ic]}</span><div class="txt"><b>${t}</b><span>${d}</span></div>${ICON.chev}</div>`).join("")}</div>`);
  $$("[data-g]").forEach(el => el.onclick = () => { sfx("tap"); const k = el.dataset.g; k === "wrongbook" ? renderGrammar(curWeek(), true) : go(k, curWeek()); });
}

// ================= 遊戲 1：每日猜字 =================
function renderWordle(_, practice) {
  const [ANS, ZH] = practice ? pick(WORDLE_WORDS).split("|") : dailyWord();
  const st = S.games.wordle;
  if (!practice && st.date !== today()) Object.assign(st, { date: today(), guesses: [], done: false, win: false });
  const guesses = practice ? [] : st.guesses;
  let done = practice ? false : st.done, cur = "", hinted = false;
  const color = g => { const res = Array(5).fill("x"), left = {}; for (let i = 0; i < 5; i++) if (g[i] === ANS[i]) res[i] = "g"; else left[ANS[i]] = (left[ANS[i]] || 0) + 1; for (let i = 0; i < 5; i++) if (res[i] !== "g" && left[g[i]]) { res[i] = "y"; left[g[i]]--; } return res; };
  page(`${backBtn("遊戲中心", "games")}
  <div class="page-hd"><div><span class="t-label">${practice ? "Practice" : "Daily"} Wordle</span><h1 class="t-h1">${practice ? "猜字練習" : "每日猜字"}</h1></div><button class="btn btn-sm" id="hint">看中文提示</button></div>
  <p class="t-small" style="margin-top:-12px">猜一個 5 個字母的多益單字。綠色＝位置正確，黃色＝有這個字母但位置不對。</p>
  <div id="hintTxt" class="tip-box" hidden></div>
  <div class="card" style="margin-top:var(--s3)"><div class="wd-grid" id="grid"></div><div id="msg"></div><div class="kb" id="kb"></div></div>`);
  wireBack();
  $("#hint").onclick = () => { hinted = true; const h = $("#hintTxt"); h.hidden = false; h.textContent = `提示：${ZH}（開頭是 ${ANS[0]}）`; };
  function draw(shake) {
    $("#grid").innerHTML = Array.from({ length: 6 }, (_, r) => {
      const g = guesses[r], c = g ? color(g) : null, txt = g || (r === guesses.length ? cur : "");
      return `<div class="wd-row ${shake && r === guesses.length ? "shake" : ""}">${Array.from({ length: 5 }, (_, i) => `<div class="wd-cell ${c ? c[i] + " flip" : ""}" style="${c ? `animation-delay:${i * 0.08}s` : ""}">${txt[i] || ""}</div>`).join("")}</div>`;
    }).join("");
    const ks = {}; guesses.forEach(g => color(g).forEach((c, i) => { const k = g[i], rk = { g: 3, y: 2, x: 1 }; if (!ks[k] || rk[c] > rk[ks[k]]) ks[k] = c; }));
    $("#kb").innerHTML = ["QWERTYUIOP", "ASDFGHJKL", "+ZXCVBNM-"].map(r => `<div class="r">${r.split("").map(k => k === "+" ? `<button class="wide" data-k="ENTER">送出</button>` : k === "-" ? `<button class="wide" data-k="DEL">刪除</button>` : `<button class="${ks[k] || ""}" data-k="${k}">${k}</button>`).join("")}</div>`).join("");
    $$("[data-k]").forEach(b => b.onclick = () => press(b.dataset.k));
    if (done) finish();
  }
  function finish() {
    const win = guesses[guesses.length - 1] === ANS;
    $("#msg").innerHTML = `<div class="feedback ${win ? "good" : ""}" style="display:flex;gap:var(--s3);align-items:center;margin:0 0 var(--s4)"><div style="width:64px;flex-shrink:0">${cat({ expr: win ? "wow" : "think", head: true, still: true })}</div>
      <div style="flex:1"><b>${win ? "猜中了！" : "差一點！"} 答案是 ${ANS}</b>${ZH}　${playBtn(ANS.toLowerCase())}</div><button class="btn btn-sm" id="prac">練習模式</button></div>`;
    $("#prac").onclick = () => renderWordle(null, true);
  }
  function press(k) {
    if (done) return;
    if (k === "DEL") cur = cur.slice(0, -1);
    else if (k === "ENTER") {
      if (cur.length < 5) { toast("要 5 個字母"); return draw(true); }
      guesses.push(cur); cur = "";
      const win = guesses[guesses.length - 1] === ANS;
      if (win || guesses.length === 6) {
        done = true;
        if (!practice) { st.done = true; st.win = win; st.plays++; if (win) st.wins++; }
        if (win) { sfx("level"); vib([20, 30, 20]); } else sfx("no");
        speak(ANS.toLowerCase()); bump("game");
        gain({ xp: win ? (hinted ? 20 : 30) : 10, coins: practice ? 0 : win ? 15 : 5 });
      }
      save();
    } else if (/^[A-Z]$/.test(k) && cur.length < 5) cur += k;
    draw();
  }
  const onKey = e => { if (e.target.tagName === "INPUT") return; const k = e.key.toUpperCase(); if (k === "ENTER" || k === "BACKSPACE") { e.preventDefault(); press(k === "ENTER" ? "ENTER" : "DEL"); } else if (/^[A-Z]$/.test(k)) press(k); };
  document.addEventListener("keydown", onKey); cleanup = () => document.removeEventListener("keydown", onKey);
  draw();
}

// ================= 遊戲 2：單字隕石 =================
function renderMeteor() {
  const bank = unlockedWeeks().flatMap(w => w.words.map(parseWord));
  let score = 0, combo = 0, hits = 0, missed = [], timeLeft = 60, cur = null, raf, last, running = false, timer;
  page(`${backBtn("遊戲中心", "games")}
  <div class="page-hd"><div><span class="t-label">Meteor</span><h1 class="t-h1">單字隕石</h1></div></div>
  <div class="arena" id="arena"><div class="hud-row"><span class="chip"><span class="t-label">TIME</span><span id="tm">60</span></span><span class="chip"><span class="t-label">PTS</span><span id="sc">0</span></span><span class="chip" id="cb">×1</span></div><div class="ground"></div>
    <div id="start" style="position:absolute;inset:0;display:grid;place-items:center;z-index:3"><div style="text-align:center;padding:var(--s4)"><div style="width:120px;margin:0 auto">${cat({ expr: "wow", pose: "cheer", sticker: true })}</div>
    <p style="color:#fff;font-weight:700">點下面正確的中文，打爆掉下來的單字！</p><button class="btn btn-primary btn-lg" id="go">開始</button></div></div></div>
  <div class="answers" id="ans"></div>`);
  wireBack();
  const arena = $("#arena");
  function spawn() {
    const w = pick(bank), opts = shuffle([w, ...shuffle(bank.filter(x => x.zh !== w.zh)).slice(0, 3)]);
    const el = document.createElement("div"); el.className = "meteor"; el.textContent = w.word; el.style.left = (20 + Math.random() * 60) + "%"; el.style.top = "56px"; arena.appendChild(el);
    cur = { w, el, y: 56, speed: (arena.clientHeight - 120) / Math.max(3.2, 7 - combo * 0.35) };
    $("#ans").innerHTML = opts.map(o => `<button class="btn" data-zh="${esc(o.zh)}">${esc(o.zh)}</button>`).join("");
    $$("#ans button").forEach(b => b.onclick = () => answer(b));
  }
  const mult = () => Math.min(5, 1 + Math.floor(combo / 3));
  function hud() { $("#sc").textContent = score; $("#cb").textContent = "×" + mult() + (combo ? `　${combo} 連擊` : ""); }
  function answer(b) {
    if (!running || !cur) return;
    if (b.dataset.zh === cur.w.zh) {
      combo++; hits++; const g = 10 * mult(); score += g; sfx("ok"); speak(cur.w.word, 1.1);
      cur.el.textContent = "+" + g; cur.el.classList.add("hit"); const el = cur.el; cur = null;
      setTimeout(() => el.remove(), 350); setTimeout(() => running && spawn(), 380);
    } else { combo = 0; sfx("no"); b.disabled = true; b.classList.add("wrong"); }
    hud();
  }
  function loop(t) {
    if (!running) return;
    const dt = last ? (t - last) / 1000 : 0; last = t;
    if (cur) {
      cur.y += cur.speed * dt; cur.el.style.top = cur.y + "px";
      if (cur.y > arena.clientHeight - 70) { missed.push(cur.w); combo = 0; hud(); cur.el.textContent = cur.w.zh; cur.el.classList.add("miss"); const el = cur.el; cur = null; setTimeout(() => el.remove(), 600); setTimeout(() => running && spawn(), 650); }
    }
    raf = requestAnimationFrame(loop);
  }
  function end() {
    running = false; cancelAnimationFrame(raf); clearInterval(timer);
    const g = S.games.meteor; g.plays++; const rec = score > g.best; if (rec) g.best = score;
    const coins = 3 + Math.floor(score / 50);
    bump("game"); gain({ xp: Math.max(5, Math.round(score / 10)), coins });
    const miss = [...new Map(missed.map(m => [m.word, m])).values()].slice(0, 6);
    doneCard(rec ? "新紀錄！" : "隕石雨結束", score + " 分", `打爆 ${hits} 顆隕石・獲得 ${coins} 罐罐${miss.length ? `<br><br>再記一下：${miss.map(m => `${esc(m.word)}＝${esc(m.zh)}`).join("、")}` : ""}`, () => renderMeteor(), rec ? "wow" : "happy");
  }
  $("#go").onclick = () => { $("#start").remove(); running = true; spawn(); raf = requestAnimationFrame(loop); timer = setInterval(() => { timeLeft--; $("#tm").textContent = timeLeft; if (timeLeft <= 0) end(); }, 1000); };
  cleanup = () => { running = false; cancelAnimationFrame(raf); clearInterval(timer); };
}

// ================= 遊戲 3：文法魔王 =================
const BOSSES = [{ color: "#2f9e8a", name: "時態怪" }, { color: "#ee8a2c", name: "詞性獸" }, { color: "#2f62c9", name: "子句章魚" }, { color: "#8a63d2", name: "文法博士" }, { color: "#d2401f", name: "七五〇大魔王" }];
function monster(color = "#2f9e8a") {
  const I = "#1f1a17";
  return `<svg viewBox="0 0 160 160" aria-hidden="true" style="width:100%;height:auto">
    <ellipse cx="80" cy="150" rx="48" ry="6" fill="${I}" opacity=".15"/>
    <g stroke="${I}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">
      <path d="M46 46 L36 12 L64 36 Z M114 46 L124 12 L96 36 Z" fill="#fffaf0"/>
      <path d="M80 30 C36 30 22 70 26 104 C30 136 56 146 80 146 C104 146 130 136 134 104 C138 70 124 30 80 30 Z" fill="${color}"/>
      <ellipse cx="60" cy="80" rx="13" ry="15" fill="#fffaf0"/><ellipse cx="100" cy="80" rx="13" ry="15" fill="#fffaf0"/>
      <path d="M44 62 L72 70 M116 62 L88 70" stroke-width="6"/>
      <path d="M52 108 Q80 132 108 108 Z" fill="#8f2a1c"/>
      <path d="M62 110 l6 9 6 -8 6 9 6 -9 6 8 6 -9" fill="none" stroke="#fffaf0" stroke-width="3"/>
    </g>
    <circle cx="63" cy="84" r="6" fill="${I}"/><circle cx="97" cy="84" r="6" fill="${I}"/>
    <path d="M100 42 Q124 60 124 96" stroke="${I}" stroke-opacity=".2" stroke-width="10" fill="none" stroke-linecap="round"/>
  </svg>`;
}
function renderBoss() {
  const B = BOSSES[W(curWeek()).phase - 1];
  const qs = shuffle(unlockedWeeks().flatMap(x => x.p5.map((q, i) => ({ q, w: x.w, i })))).slice(0, 10);
  let hp = 100, i = 0, combo = 0, right = 0;
  function show() {
    if (hp <= 0 || i >= qs.length) return end();
    const { q, w, i: qi } = qs[i]; const [stem, opts, ans, ex] = q; const L = "ABCD";
    page(`${backBtn("遊戲中心", "games")}
    <div class="card boss-card"><div class="sec-hd"><span class="chip">${esc(B.name)}</span><span class="chip"><span class="t-label">ROUND ${i + 1}/${qs.length}</span></span></div>
      <div class="boss-face" id="face">${monster(B.color)}</div><div class="hp"><i style="width:${hp}%"></i></div>
      <div class="t-small">HP ${hp}${combo >= 2 ? `　${combo} 連擊中！` : ""}</div></div>
    <div class="card"><div class="q-stem">${esc(stem).replace("___", "<u>&nbsp;</u>")}</div>
      ${opts.map((o, k) => `<button class="opt" data-k="${k}"><span class="k">${L[k]}</span>${esc(o)}</button>`).join("")}<div id="after"></div></div>`);
    wireBack();
    $$("[data-k]").forEach(b => b.onclick = () => {
      const k = +b.dataset.k, ok = k === ans; S.stats.p5.t++;
      $$("[data-k]").forEach(x => { x.disabled = true; const kk = +x.dataset.k; if (kk === ans) x.classList.add("right"); else if (kk === k) x.classList.add("wrong"); });
      if (ok) { S.stats.p5.c++; right++; combo++; hp = Math.max(0, hp - (18 + Math.min(combo - 1, 3) * 6)); $("#face").classList.add("hit"); $(".hp > i").style.width = hp + "%"; sfx("ok"); vib(20); }
      else { combo = 0; sfx("no"); if (!S.wrong.some(x => x.w === w && x.i === qi)) S.wrong.push({ w, i: qi }); }
      bump("grammar");
      $("#after").innerHTML = `<div class="feedback ${ok ? "good" : "miss"}"><b>${ok ? "命中！" : `魔王閃開了，正解是 (${L[ans]})`}</b>${esc(ex)}</div>
        <button class="btn btn-primary btn-block" id="nx" style="margin-top:var(--s3)">${hp <= 0 ? "看結果" : "下一擊"}</button>`;
      $("#nx").onclick = () => { i++; show(); };
    });
  }
  function end() {
    const win = hp <= 0, g = S.games.boss; g.plays++; if (win) g.wins++;
    bump("game"); gain({ xp: win ? 50 : 15 + right * 3, coins: win ? 20 : 5 });
    doneCard(win ? `打倒${B.name}！` : `${B.name}逃走了`, win ? "K.O.!" : `${right}/${qs.length}`, win ? `答對 ${right} 題，獲得 20 罐罐。答錯的題目已收進錯題本。` : `答對 ${right} 題，獲得 5 罐罐。錯的題目幫你收進錯題本，練熟再來！`, () => renderBoss(), win ? "wow" : "think");
  }
  show();
}

// ================= 口說 =================
function renderSpeak() {
  const wk = curWeek();
  page(`<div class="page-hd"><div><span class="t-label">Speaking Club</span><h1 class="t-h1">口說練習</h1></div></div>
  ${SR ? "" : `<div class="notice-bar">${ICON.mic}<span>這個瀏覽器不支援語音辨識，可以改用打字。建議用電腦或 Android 的 Chrome，或 iPhone 的 Safari。</span></div>`}
  <div class="card" style="display:flex;gap:var(--s4);align-items:center;flex-wrap:wrap">
    <div style="width:110px">${cat({ expr: "happy", pose: "wave" })}</div>
    <div style="flex:1;min-width:220px"><h2 class="t-h2">和餅乾自由聊天</h2><p class="t-small">說錯也沒關係，AI 會用中文溫柔地幫你修正。需要在「我的 › 設定」填入自己的 Anthropic API Key。</p><button class="btn btn-primary" id="free" style="margin-top:var(--s2)">開始聊天</button></div>
  </div>
  <div class="card"><h3 class="t-h3" style="margin-bottom:var(--s2)">情境角色扮演</h3>
    ${WEEKS.filter(w => w.talk).map(w => `<div class="list-item" data-w="${w.w}"><span class="icon-tile" style="background:${w.w === wk ? "var(--reward)" : w.w < wk ? "var(--ok)" : "var(--c-speak)"};color:${w.w === wk ? "var(--ink)" : "#fff"}"><span class="t-label" style="font-size:11px">${pad(w.w)}</span></span><div class="txt"><b>${esc(w.talk.title)}</b><span>${esc(w.talk.role)}</span></div>${ICON.chev}</div>`).join("")}
  </div>`);
  $("#free").onclick = () => go("free");
  $$("[data-w]").forEach(el => el.onclick = () => go("talk", +el.dataset.w));
}
const chatAdd = chat => (cls, html) => { const d = document.createElement("div"); d.className = "msg " + cls; d.innerHTML = html; chat.appendChild(d); d.scrollIntoView({ behavior: "smooth", block: "nearest" }); return d; };
const micBlock = () => `<div class="mic-wrap"><div class="t-small" id="hint"></div><button class="mic" id="mic" aria-label="按下開始說話">${ICON.mic}</button>
  <div class="type-row"><input id="typed" placeholder="或直接打字回答…"><button class="btn" id="send">送出</button></div></div>`;
function wireMic(onSpeech, onTyped) {
  $("#mic").onclick = async () => { const m = $("#mic"); m.classList.add("rec"); speechSynthesis.cancel(); try { onSpeech(await listen()); } catch (e) { micErr(e); } m.classList.remove("rec"); };
  const st = () => { const v = $("#typed").value.trim(); if (v) { $("#typed").value = ""; onTyped(v); } };
  $("#send").onclick = st; $("#typed").onkeydown = e => e.key === "Enter" && st();
}
function renderTalk(n) {
  const w = W(n) && W(n).talk ? W(n) : W(1), T = w.talk; let i = 0, scores = [];
  page(`${backBtn("口說練習", "speak")}
  <div class="page-hd"><div><span class="t-label">EP.${pad(w.w)} · Role Play</span><h1 class="t-h1">${esc(T.title)}</h1><div class="t-small">情境：${esc(T.role)}</div></div></div>
  <div class="card"><div class="chat" id="chat"></div></div>
  <div class="card" id="ctl">${micBlock()}<div class="row" style="justify-content:center;margin-top:var(--s3)"><button class="btn btn-sm" id="again">再聽一次</button><button class="btn btn-sm" id="slow">慢速播放</button><button class="btn btn-sm" id="showA">看參考答案</button></div></div>`);
  wireBack();
  const add = chatAdd($("#chat"));
  function ask() { if (i >= T.turns.length) return finish(); const [line, , zh] = T.turns[i]; add("ai", `${playBtn(line)}<span>${esc(line)}</span>`); $("#hint").textContent = "提示：" + zh; speak(line); }
  function answer(text, conf) {
    add("me", esc(text));
    const b = best(text, T.turns[i][1]), pct = Math.round(b.s * 100), model = cap(b.t);
    if (pct >= 55) { scores.push(pct); sfx("ok"); add("fb", `<span class="score">${pct} 分</span>　${pct >= 80 ? "說得很好！" : "意思有傳達到！"}${conf ? `<span class="t-small">（清晰度 ${Math.round(conf * 100)}%）</span>` : ""}<br>參考說法：${diffHTML(text, model)} ${playBtn(model)}`); i++; setTimeout(ask, 900); }
    else { sfx("no"); add("fb miss", `<span class="score">${pct} 分</span>　換個說法試試看<br>可以這樣說：<b>${esc(model)}</b> ${playBtn(model)}<br><span class="t-small">先按播放跟著念一次，再按麥克風。</span>`); }
  }
  function finish() {
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : 0;
    S.stats.speak.sum += avg; S.stats.speak.n++; bump("speak"); gain({ xp: 20 });
    $("#ctl").innerHTML = `<div style="text-align:center"><div style="width:120px;margin:0 auto">${cat({ expr: "wow", pose: "cheer" })}</div><div class="t-num" style="font-size:36px;margin:var(--s2) 0">${avg} 分</div><p class="t-small">完成「${esc(T.title)}」！</p>
      <div class="row" style="justify-content:center"><button class="btn" id="re">再練一次</button><button class="btn btn-primary" id="nx">下一個情境</button></div></div>`;
    $("#re").onclick = () => renderTalk(w.w); $("#nx").onclick = () => renderTalk(w.w >= 24 ? 1 : w.w + 1);
  }
  wireMic(t => answer(t.text, t.conf), t => i < T.turns.length && answer(t, 0));
  $("#again").onclick = () => i < T.turns.length && speak(T.turns[i][0]);
  $("#slow").onclick = () => i < T.turns.length && speak(T.turns[i][0], 0.65);
  $("#showA").onclick = () => i < T.turns.length && add("fb", `參考答案：${T.turns[i][1].map(a => `<div>${playBtn(a)} ${esc(cap(a))}</div>`).join("")}`);
  ask();
}
function renderFree() {
  const w = W(Math.min(curWeek(), 24));
  page(`${backBtn("口說練習", "speak")}
  <div class="page-hd"><div><span class="t-label">Free Talk</span><h1 class="t-h1">和餅乾自由聊天</h1><div class="t-small">本週話題：${esc(w.theme)}</div></div></div>
  ${S.settings.apiKey ? "" : `<div class="notice-bar">${ICON.gear}<span>還沒設定 API Key。請到「我的 › 設定」貼上你自己的 Anthropic API Key（只存在這台裝置）。</span></div>`}
  <div class="card"><div class="chat" id="chat"></div></div><div class="card">${micBlock()}</div>`);
  wireBack();
  const add = chatAdd($("#chat")), hist = [];
  const system = `You are Biscuit, a cheerful white cartoon cat who is the president of "Meow Town English Club" and an encouraging English speaking buddy (like the Speak app) for a Taiwanese adult learner preparing for the TOEIC exam. Learner level: CEFR A2, aiming for TOEIC 750. Today's topic: "${w.theme}" (business/workplace English).
Rules:
- Keep your English reply short: 1-2 simple sentences, then ask ONE follow-up question.
- Use common TOEIC vocabulary but simple grammar. Be warm; never make the learner feel bad about mistakes.
- After your reply, add a line starting with "修正:" giving brief, friendly feedback in Traditional Chinese on the learner's last message: the most important mistake (if any) and a more natural English version. If it was already good, praise it and offer one alternative.
Format exactly:
<English reply>
修正: <Traditional Chinese feedback with improved English sentence>`;
  async function send(text) {
    add("me", esc(text)); hist.push({ role: "user", content: text });
    if (!S.settings.apiKey) { hist.pop(); return add("fb miss", "請先到「我的 › 設定」填入 API Key。"); }
    const wait = add("ai", "<span>…</span>");
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST",
        headers: { "content-type": "application/json", "x-api-key": S.settings.apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-haiku-5-5", max_tokens: 400, system, messages: hist }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error ? j.error.message : r.status);
      const out = j.content.map(c => c.text || "").join(""); hist.push({ role: "assistant", content: out });
      const [eng, ...fb] = out.split(/\n?修正[:：]/);
      wait.innerHTML = `${playBtn(eng.trim())}<span>${esc(eng.trim())}</span>`;
      if (fb.length) add("fb", esc(fb.join(" ").trim()));
      speak(eng.trim()); gain({ xp: 5 }); bump("speak");
    } catch (e) { wait.remove(); hist.pop(); add("fb miss", "連線失敗：" + esc(e.message)); }
  }
  wireMic(t => send(t.text), send);
  const hi = "Hi! I'm Biscuit, your English buddy. Meow! How was your day today?";
  add("ai", `${playBtn(hi)}<span>${hi}</span>`);
  hist.push({ role: "user", content: "(The learner opened the conversation.)" }, { role: "assistant", content: hi });
}

// ================= 單字卡 =================
const allUnlockedWords = () => unlockedWeeks().flatMap(w => w.words.map(s => ({ ...parseWord(s), w: w.w })));
const dueCards = () => { const t = today(); return allUnlockedWords().filter(x => S.srs[x.word] && S.srs[x.word].due <= t); };
function newCards() { const learned = Object.values(S.srs).filter(c => c.first === today()).length; return allUnlockedWords().filter(x => !S.srs[x.word]).slice(0, Math.max(0, S.settings.newPerDay - learned)); }
function rateCard(word, q) {
  const c = S.srs[word] || { int: 0, ease: 2.5, reps: 0, first: today() };
  if (q === 0) { c.reps = 0; c.int = 0; c.ease = Math.max(1.3, c.ease - 0.2); }
  else { c.reps++; c.int = c.reps === 1 ? (q === 3 ? 3 : 1) : c.reps === 2 ? (q === 1 ? 3 : 6) : Math.round(c.int * (q === 1 ? 1.2 : q === 3 ? c.ease * 1.3 : c.ease)); c.ease = Math.max(1.3, c.ease + (q === 1 ? -0.15 : q === 3 ? 0.15 : 0)); }
  const d = new Date(); d.setDate(d.getDate() + c.int); c.due = dkey(d); S.srs[word] = c; save();
}
function renderVocab() {
  let queue = shuffle([...dueCards(), ...newCards()]), again = [];
  const total0 = queue.length;
  function show() {
    if (!queue.length && again.length) { queue = again; again = []; }
    if (!queue.length) return doneCard("今天的單字都完成了！", `${Object.keys(S.srs).length} 字`, "記憶曲線會在 1、3、6、15… 天後提醒你複習。按「再一次」可以多學 10 個新字。", () => { S.settings.newPerDay += 10; save(); renderVocab(); });
    const c = queue[0];
    page(`${backBtn("大廳", "lobby")}
    <div class="qbar"><div class="bar"><i style="width:${Math.round((1 - queue.length / Math.max(1, total0)) * 100)}%"></i></div><span class="t-label">${queue.length} LEFT</span></div>
    <div class="card flash" id="fc"><span class="chip"><span class="t-label">WEEK ${c.w}</span></span><div class="word">${esc(c.word)}</div>
      <div class="back-side"><p class="t-h3" style="margin:0"><span class="pos">${esc(c.pos)}</span>${esc(c.zh)}</p><p class="t-body" style="margin:var(--s3) 0 0">${esc(c.ex)}</p></div>
      <div class="t-small tap">點卡片看中文</div></div>
    <div class="row" style="justify-content:center;margin-top:var(--s4)"><button class="btn btn-sm" id="sw">${ICON.play}發音</button><button class="btn btn-sm" id="sx">${ICON.play}例句</button><button class="btn btn-sm" id="pr">${ICON.mic}唸唸看</button></div>
    <div class="rate" id="rate" style="visibility:hidden">
      <button class="btn" data-q="0">忘了<small>等等再看</small></button><button class="btn" data-q="1">有點難<small>明天</small></button><button class="btn btn-reward" data-q="2">記得<small>過幾天</small></button><button class="btn" data-q="3">太簡單<small>一週後</small></button></div>`);
    wireBack(); speak(c.word);
    $("#fc").onclick = () => { $("#fc").classList.add("flipped"); $("#rate").style.visibility = "visible"; };
    $("#sw").onclick = () => speak(c.word); $("#sx").onclick = () => speak(c.ex);
    $("#pr").onclick = async () => { try { const r = await listen(); const ok = tokens(r.text).includes(tokens(c.word)[0]); if (ok) sfx("ok"); toast(ok ? `發音正確！（聽到：${r.text}）` : `聽到的是「${r.text}」，再試一次`); } catch (e) { micErr(e); } };
    $$("[data-q]").forEach(b => b.onclick = () => { const q = +b.dataset.q; rateCard(c.word, q); gain({ xp: 2 }); bump("vocab"); sfx(q ? "ok" : "tap"); queue.shift(); if (q === 0) again.push(c); show(); });
  }
  show();
}

// ================= 聽力 Part 2 =================
function renderListen(n) {
  const wk = n || curWeek(), qs = shuffle(poolP2(wk)).slice(0, 5); let i = 0, right = 0;
  function show() {
    if (i >= qs.length) return doneCard("Part 2 練習完成", `${right}/${qs.length}`, "聽力靠多聽，每天一點點就會越來越順。", () => renderListen(wk));
    const [q, opts, ans] = qs[i], order = shuffle([0, 1, 2]), L = "ABC";
    page(`${backBtn("大廳", "lobby")}
    <div class="qbar"><div class="bar"><i style="width:${i / qs.length * 100}%"></i></div><span class="t-label">${i + 1}/${qs.length}</span></div>
    <div class="card"><span class="t-label muted">Listening · Part 2</span><h2 class="t-h2" style="margin:4px 0 var(--s2)">聽問句，選出最適當的回應</h2>
      <p class="t-small">跟正式考試一樣：題目和選項只播放、不顯示。</p>
      <div class="row"><button class="btn btn-primary" id="play">${ICON.play}播放題目</button><button class="btn" id="slow">慢速</button></div></div>
    <div class="card">${order.map((o, k) => `<button class="opt" data-o="${o}"><span class="k">${L[k]}</span><span class="lbl">選項 ${L[k]}</span></button>`).join("")}<div id="after"></div></div>`);
    wireBack();
    const play = async rate => { await speak(q, rate); for (let k = 0; k < 3; k++) { await new Promise(r => setTimeout(r, 500)); await speak(`${L[k]}. ${opts[order[k]]}`, rate); } };
    $("#play").onclick = () => play(); $("#slow").onclick = () => play(0.7); setTimeout(() => play(), 400);
    $$("[data-o]").forEach(b => b.onclick = () => {
      speechSynthesis.cancel(); const o = +b.dataset.o, ok = o === ans;
      S.stats.p2.t++; if (ok) { S.stats.p2.c++; right++; sfx("ok"); } else sfx("no");
      gain({ xp: ok ? 5 : 2 }); bump("listen");
      $$("[data-o]").forEach(x => { const oo = +x.dataset.o; x.disabled = true; $(".lbl", x).textContent = opts[oo]; if (oo === ans) x.classList.add("right"); else if (oo === o) x.classList.add("wrong"); });
      $("#after").innerHTML = `<div class="feedback ${ok ? "good" : "miss"}"><b>${ok ? "答對了！" : "差一點，看看正確答案"}</b>題目：${esc(q)} ${playBtn(q)}<div class="t-small" style="margin-top:6px">小技巧：抓開頭的疑問詞（Who / When / Where / Why / How），避開發音很像或重複題目單字的選項。</div></div>
        <button class="btn btn-primary btn-block" id="nx" style="margin-top:var(--s3)">下一題</button>`;
      $("#nx").onclick = () => { i++; show(); };
    });
  }
  show();
}

// ================= 文法 Part 5 =================
function renderGrammar(n, fromWrong) {
  const wk = n || curWeek();
  let qs = fromWrong ? S.wrong.map(x => ({ q: W(x.w).p5[x.i], w: x.w, i: x.i })) : shuffle(poolP5(wk)).slice(0, W(wk) && W(wk).review ? 15 : 5);
  if (!qs.length) { toast("錯題本是空的，太強了！"); return go("games"); }
  qs = shuffle(qs); let i = 0, right = 0;
  setActive(fromWrong ? "games" : "lobby");
  function show() {
    if (i >= qs.length) return doneCard(fromWrong ? "錯題本練習完成" : "Part 5 練習完成", `${right}/${qs.length}`, fromWrong ? "答對的題目已從錯題本移除。" : "想更刺激？去遊戲中心打文法魔王！", () => renderGrammar(wk, fromWrong));
    const { q, w, i: qi } = qs[i], [stem, opts, ans, ex] = q, L = "ABCD", t0 = Date.now();
    page(`${backBtn(fromWrong ? "遊戲中心" : "大廳", fromWrong ? "games" : "lobby")}
    <div class="qbar"><div class="bar"><i style="width:${i / qs.length * 100}%"></i></div><span class="t-label">${i + 1}/${qs.length}</span></div>
    <div class="card"><span class="t-label muted">${fromWrong ? "Review" : "Reading · Part 5"}</span>
      <div class="q-stem">${esc(stem).replace("___", "<u>&nbsp;</u>")}</div>
      ${opts.map((o, k) => `<button class="opt" data-k="${k}"><span class="k">${L[k]}</span>${esc(o)}</button>`).join("")}<div id="after"></div></div>`);
    wireBack();
    $$("[data-k]").forEach(b => b.onclick = () => {
      const k = +b.dataset.k, ok = k === ans, sec = Math.round((Date.now() - t0) / 1000);
      S.stats.p5.t++; if (ok) { S.stats.p5.c++; right++; sfx("ok"); } else sfx("no");
      const idx = S.wrong.findIndex(x => x.w === w && x.i === qi);
      if (!ok && idx < 0) S.wrong.push({ w, i: qi });
      if (ok && fromWrong && idx >= 0) S.wrong.splice(idx, 1);
      gain({ xp: ok ? 5 : 2 }); bump("grammar");
      $$("[data-k]").forEach(x => { x.disabled = true; const kk = +x.dataset.k; if (kk === ans) x.classList.add("right"); else if (kk === k) x.classList.add("wrong"); });
      const full = stem.replace("___", opts[ans]);
      $("#after").innerHTML = `<div class="feedback ${ok ? "good" : "miss"}"><b>${ok ? "正確" : `正解是 (${L[ans]})`}・用時 ${sec} 秒</b>${esc(ex)}<div class="t-small" style="margin-top:6px">${esc(full)} ${playBtn(full)}</div></div>
        <button class="btn btn-primary btn-block" id="nx" style="margin-top:var(--s3)">下一題</button>`;
      $("#nx").onclick = () => { i++; show(); };
    });
  }
  show();
}

// ================= 跟讀 =================
function renderShadow(n) {
  const wk = n || curWeek(), w = W(wk), src = w && !w.review ? w.words : unlockedWeeks().flatMap(x => x.words);
  const sents = shuffle(src.map(s => parseWord(s).ex)).slice(0, 5); let i = 0, total = 0;
  function show() {
    if (i >= sents.length) return doneCard("跟讀完成", `${Math.round(total / sents.length) || 0} 分`, "說得越多，口說越自然。", () => renderShadow(wk));
    const s = sents[i];
    page(`${backBtn("大廳", "lobby")}
    <div class="qbar"><div class="bar"><i style="width:${i / sents.length * 100}%"></i></div><span class="t-label">${i + 1}/${sents.length}</span></div>
    <div class="card"><span class="t-label muted">Shadowing</span><p class="t-small" style="margin:4px 0 0">先聽一次，再模仿語調和連音說出來。</p>
      <div class="q-stem" id="sent">${esc(s)}</div><div class="row"><button class="btn" id="n">${ICON.play}正常速度</button><button class="btn" id="sl">慢速</button></div></div>
    <div class="card"><div class="mic-wrap"><button class="mic" id="mic" aria-label="按下開始說話">${ICON.mic}</button><div id="res" style="width:100%"></div><button class="link-btn" id="skip">跳過這句 ${ICON.chev}</button></div></div>`);
    wireBack(); speak(s);
    $("#n").onclick = () => speak(s); $("#sl").onclick = () => speak(s, 0.6); $("#skip").onclick = () => { i++; show(); };
    $("#mic").onclick = async () => {
      const m = $("#mic"); m.classList.add("rec");
      try {
        const r = await listen(), p = Math.round(similarity(r.text, s) * 100); if (p >= 80) sfx("ok");
        $("#sent").innerHTML = diffHTML(r.text, s);
        $("#res").innerHTML = `<div class="feedback ${p >= 80 ? "good" : ""}"><b>${p} 分</b>聽到：${esc(r.text)}<div class="t-small">波浪底線的字沒被聽到，多念幾次會更清楚。</div></div>
          <div class="row" style="justify-content:center;margin-top:var(--s3)"><button class="btn btn-sm" id="retry">再試一次</button><button class="btn btn-sm btn-primary" id="nx">下一句</button></div>`;
        $("#retry").onclick = () => { $("#sent").textContent = s; $("#res").innerHTML = ""; };
        $("#nx").onclick = () => { total += p; gain({ xp: 5 }); bump("shadow"); i++; show(); };
      } catch (e) { micErr(e); }
      m.classList.remove("rec");
    };
  }
  show();
}

// ================= 模擬考 =================
function renderMock() {
  const p5 = shuffle(unlockedWeeks().flatMap(x => x.p5.map((q, i) => ({ q, w: x.w, i })))).slice(0, 20);
  const p2 = shuffle(unlockedWeeks().flatMap(x => x.p2)).slice(0, 10);
  const items = [...p2.map(q => ({ t: "p2", q })), ...p5.map(x => ({ t: "p5", ...x }))];
  let i = 0, cL = 0, cR = 0;
  function show() {
    if (i >= items.length) {
      const l = cL / Math.max(1, p2.length), r = cR / Math.max(1, p5.length), est = x => Math.round((5 + x * 490) / 5) * 5, total = est(l) + est(r);
      S.stats.mocks.push({ d: today(), total }); gain({ xp: 40, coins: 20 }); checkStickers();
      return doneCard("模擬考結果", `≈ ${total}`, `聽力 ${cL}/${p2.length}・閱讀 ${cR}/${p5.length}・獲得 20 罐罐<br>依正確率換算的粗估分數（只含 Part 2、Part 5），用來看進步趨勢。建議搭配 ETS 官方題本實測。`, () => renderMock(), "wow");
    }
    const it = items[i], L = it.t === "p2" ? "ABC" : "ABCD";
    page(`${backBtn("遊戲中心", "games")}
    <div class="qbar"><div class="bar"><i style="width:${i / items.length * 100}%"></i></div><span class="t-label">${i + 1}/${items.length}</span></div>
    <div class="card"><span class="t-label muted">${it.t === "p2" ? "Listening · Part 2" : "Reading · Part 5"}</span>
      ${it.t === "p2" ? `<div class="row" style="margin:var(--s3) 0"><button class="btn btn-primary" id="play">${ICON.play}播放題目</button></div>` : `<div class="q-stem">${esc(it.q[0]).replace("___", "<u>&nbsp;</u>")}</div>`}
      ${L.split("").map((c, k) => `<button class="opt" data-k="${k}"><span class="k">${c}</span>${it.t === "p5" ? esc(it.q[1][k]) : "選項 " + c}</button>`).join("")}</div>`);
    wireBack();
    if (it.t === "p2") { const [q, opts] = it.q; const play = async () => { await speak(q); for (let k = 0; k < 3; k++) { await new Promise(r => setTimeout(r, 400)); await speak(`${L[k]}. ${opts[k]}`); } }; $("#play").onclick = play; setTimeout(play, 300); }
    $$("[data-k]").forEach(b => b.onclick = () => {
      speechSynthesis.cancel(); const k = +b.dataset.k;
      if (it.t === "p2") { if (k === it.q[2]) cL++; } else { if (k === it.q[2]) cR++; else if (!S.wrong.some(x => x.w === it.w && x.i === it.i)) S.wrong.push({ w: it.w, i: it.i }); }
      i++; show();
    });
  }
  show();
}

// ================= 我的 =================
function renderMe() {
  const st = S.stats, lv = levelOf(S.xp), pct = o => o.t ? Math.round(o.c / o.t * 100) + "%" : "—";
  const days = Object.keys(S.log).filter(active).length, title = S.equip.title && ITEMS.find(i => i.id === S.equip.title);
  page(`<div class="page-hd"><div><span class="t-label">Member Card</span><h1 class="t-h1">我的社員證</h1></div></div>
  <div class="card" style="display:flex;gap:var(--s5);align-items:center;flex-wrap:wrap;background:var(--reward-soft)">
    <div style="width:130px">${cat({ expr: "happy", pose: "wave" })}</div>
    <div style="flex:1;min-width:200px"><span class="t-label muted">Meow Town English Club</span><h2 class="t-h2">${esc(S.profile.name)}</h2>
      <div class="row" style="margin:var(--s2) 0"><span class="chip"><span class="t-label">LV.${lv}</span>${rankOf(lv)}</span>${title ? `<span class="chip" style="background:var(--c-shadow);color:#fff">${esc(title.name)}</span>` : ""}</div>
      <div class="bar"><i style="width:${Math.round((S.xp - xpFor(lv)) / (xpFor(lv + 1) - xpFor(lv)) * 100)}%"></i></div><div class="t-small" style="margin-top:4px">${S.xp} XP・距離下一級還差 ${xpFor(lv + 1) - S.xp} XP</div></div>
  </div>
  <div class="stats" style="margin-top:var(--s4)">
    ${[["學習天數", days], ["連勝", streak() + " 天"], ["已學單字", Object.keys(S.srs).length], ["罐罐", S.coins], ["Part 5 正確率", pct(st.p5)], ["Part 2 正確率", pct(st.p2)], ["口說平均", st.speak.n ? Math.round(st.speak.sum / st.speak.n) : "—"], ["錯題本", S.wrong.length]].map(([k, v]) => `<div class="card stat" style="margin:0"><span class="t-label">${k}</span><span class="t-num">${v}</span></div>`).join("")}
  </div>
  <div class="card" style="margin-top:var(--s4)"><div class="sec-hd"><h2 class="t-h2">成就</h2><span class="t-small">${Object.keys(S.stickers).length}/${STICKERS.length}・每個 +20 罐罐</span></div>
    <div class="stickers">${STICKERS.map(s => `<div class="sticker ${S.stickers[s.id] ? "" : "lock"}"><div class="badge">${S.stickers[s.id] ? s.t : ICON.lock.replace("<svg ", '<svg width="24" height="24" ')}</div><b>${s.n}</b><span>${s.d}</span></div>`).join("")}</div></div>
  <div class="card" id="cloudCard"></div>
  <div class="card" id="lbCard" hidden></div>
  <div class="card"><h2 class="t-h2" style="margin-bottom:var(--s2)">模擬考紀錄</h2>
    ${st.mocks.length ? st.mocks.slice(-8).reverse().map(m => `<div class="list-item" style="cursor:default"><div class="txt"><b>≈ ${m.total} 分</b><span>${m.d}</span></div></div>`).join("") : `<p class="t-small">還沒有紀錄，第 6 週來試試看吧。</p>`}</div>
  <div class="card" id="settings"><h2 class="t-h2">設定</h2>
    <label>語速：<span id="rv">${S.settings.rate}</span></label><input type="range" id="rate" min="0.5" max="1.2" step="0.05" value="${S.settings.rate}">
    <label for="voice">英文發音人（多益有美、英、澳、加口音，可以換換看）</label><select id="voice"><option value="">自動</option>${voices.map(v => `<option value="${esc(v.voiceURI)}" ${v.voiceURI === S.settings.voice ? "selected" : ""}>${esc(v.name)} (${v.lang})</option>`).join("")}</select>
    <div class="grid2"><div><label for="npd">每日新單字數</label><input type="number" id="npd" min="5" max="40" value="${S.settings.newPerDay}"></div><div><label for="start">開始日期</label><input type="date" id="start" value="${S.profile.start}"></div></div>
    <label for="nm">社員暱稱</label><input id="nm" maxlength="16" value="${esc(S.profile.name)}">
    <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="snd" ${S.settings.sound ? "checked" : ""}>音效</label>
    <label for="key">Anthropic API Key（AI 自由聊天用，選填，只存在這台裝置，不會上傳雲端）</label><input type="password" id="key" value="${esc(S.settings.apiKey)}" placeholder="sk-ant-...">
    <div class="row" style="margin-top:var(--s4)"><button class="btn btn-primary" id="sv">儲存設定</button></div></div>
  <div class="card"><h2 class="t-h2">進度碼（手動搬移）</h2><p class="t-small">沒登入雲端時，可以在舊裝置複製進度碼、到新裝置貼上匯入。進度碼不含 API Key。</p>
    <div class="row"><button class="btn btn-sm" id="exp">複製進度碼</button></div><textarea id="code" placeholder="貼上進度碼…" style="margin-top:var(--s3)"></textarea>
    <div class="row" style="margin-top:var(--s3)"><button class="btn btn-sm" id="imp">匯入</button><button class="btn btn-sm" id="reset" style="color:var(--primary)">重設這台裝置</button></div></div>`);
  renderCloudCard();
  $("#rate").oninput = e => $("#rv").textContent = e.target.value;
  $("#sv").onclick = () => {
    Object.assign(S.settings, { rate: +$("#rate").value, voice: $("#voice").value, newPerDay: +$("#npd").value || 10, apiKey: $("#key").value.trim(), sound: $("#snd").checked });
    S.profile.start = $("#start").value || S.profile.start; S.profile.name = $("#nm").value.trim() || S.profile.name;
    save(); renderHud(); toast("已儲存"); speak("Settings saved.");
  };
  $("#exp").onclick = async () => { const code = btoa(unescape(encodeURIComponent(JSON.stringify({ ...S, settings: { ...S.settings, apiKey: "" } })))); $("#code").value = code; try { await navigator.clipboard.writeText(code); toast("已複製進度碼"); } catch (e) { $("#code").select(); toast("請手動複製下方文字"); } };
  $("#imp").onclick = () => { try { const d = JSON.parse(decodeURIComponent(escape(atob($("#code").value.trim())))), key = S.settings.apiKey; S = hydrate(d); S.settings.apiKey = key; save(); toast("匯入成功"); renderHud(); go("lobby"); } catch (e) { toast("進度碼格式錯誤"); } };
  $("#reset").onclick = () => { if (confirm("確定要清除這台裝置上的所有學習紀錄嗎？（雲端資料不會被刪除）")) { localStorage.removeItem(KEY); S = defaults(); go("lobby"); } };
}
function renderCloudCard() {
  const el = $("#cloudCard"); if (!el) return;
  if (!Cloud.enabled) {
    el.innerHTML = `<div class="sec-hd"><h2 class="t-h2">雲端同步</h2><span class="chip">尚未開啟</span></div><p class="t-small">目前進度只存在這台裝置。網站管理者在 firebase-config.js 填入 Firebase 設定後，這裡就會出現「用 Google 登入」，可以跨裝置同步和看排行榜。${Cloud.error ? "<br>錯誤：" + esc(Cloud.error) : ""}</p>`;
    return;
  }
  if (!Cloud.user) {
    el.innerHTML = `<div class="sec-hd"><h2 class="t-h2">雲端同步</h2><span class="chip">未登入</span></div><p class="t-small">登入後，手機、平板、電腦會自動同步進度，也能和其他社員比排行榜。</p><button class="btn" id="gin">${ICON.google}用 Google 登入</button>`;
    $("#gin").onclick = () => Cloud.signIn().catch(e => toast("登入失敗：" + e.message));
    return;
  }
  el.innerHTML = `<div class="sec-hd"><h2 class="t-h2">雲端同步</h2><span class="chip" style="background:var(--ok-soft)">已同步</span></div>
    <p class="t-small">已用 ${esc(Cloud.user.email || "Google 帳號")} 登入，進度會自動存到雲端。</p>
    <div class="row"><button class="btn btn-sm" id="syncNow">${ICON.cloud}立即同步</button><button class="btn btn-sm" id="gout">${ICON.logout}登出</button></div>`;
  $("#syncNow").onclick = async () => { await cloudPush(); toast("已同步到雲端"); };
  $("#gout").onclick = () => Cloud.signOut().then(() => toast("已登出"));
  renderLeaderboard();
}
async function renderLeaderboard() {
  const el = $("#lbCard"); if (!el || !Cloud.user) return;
  el.hidden = false; el.innerHTML = `<h2 class="t-h2">社員排行榜</h2><p class="t-small">載入中…</p>`;
  try {
    const rows = await Cloud.leaderboard();
    el.innerHTML = `<div class="sec-hd"><h2 class="t-h2">社員排行榜</h2><span class="t-small">依經驗值排序・前 20 名</span></div>` + (rows.length ? rows.map((r, i) => `<div class="lb-row ${r.uid === Cloud.user.uid ? "me-row" : ""}"><span class="rank">${i + 1}</span><span class="nm">${esc(r.name)}${r.title ? `　<span class="t-small">${esc(r.title)}</span>` : ""}</span><span class="t-label">LV.${r.lv}</span><span class="t-num" style="font-size:16px">${r.xp} XP</span></div>`).join("") : `<p class="t-small">還沒有人上榜，你是第一個！</p>`);
  } catch (e) { el.innerHTML = `<h2 class="t-h2">社員排行榜</h2><p class="t-small">讀取失敗：${esc(e.message)}</p>`; }
}

// ================= 雲端同步 =================
async function cloudPush() {
  if (!Cloud.user || !S.profile) return;
  const data = { ...S, settings: { ...S.settings, apiKey: "" } }, title = S.equip.title && ITEMS.find(i => i.id === S.equip.title);
  try { await Cloud.push(data, { name: S.profile.name.slice(0, 16), xp: Math.round(S.xp), lv: levelOf(S.xp), streak: streak(), week: curWeek(), title: title ? title.name : "" }); }
  catch (e) { console.warn("cloud push failed", e); }
}
async function onCloud() {
  if (!Cloud.user) { if (!S.profile && !($("#ob-name") && $("#ob-name").value)) renderOnboard(); else renderCloudCard(); return; }
  try {
    const remote = await Cloud.pull();
    if (remote && remote.data && (!S.profile || (remote.updatedAt || 0) > (S.updatedAt || 0))) {
      const key = S.settings.apiKey; S = hydrate(JSON.parse(remote.data)); S.settings.apiKey = key;
      try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
      $("#hudWrap").hidden = false; renderHud(); toast("已從雲端載入你的進度"); go("lobby");
    } else if (S.profile) { await cloudPush(); toast("已登入，進度已同步到雲端"); renderCloudCard(); }
    else toast("登入成功！填好暱稱就能開始");
  } catch (e) { toast("雲端同步失敗：" + e.message); }
}

// ================= 啟動 =================
const ROUTES = { lobby: renderLobby, map: renderMap, week: renderWeek, gacha: renderGacha, games: renderGames, wordle: renderWordle, meteor: renderMeteor, boss: renderBoss, speak: renderSpeak, talk: renderTalk, free: renderFree, vocab: renderVocab, listen: renderListen, grammar: renderGrammar, shadow: renderShadow, mock: renderMock, me: renderMe };
renderNav();
$("#flame").innerHTML = ICON.flame; $("#canIco").innerHTML = ICON.can; $("#addBtn").innerHTML = ICON.plus; $("#gearBtn").innerHTML = ICON.gear;
$("#addBtn").onclick = () => go("lobby");
$("#gearBtn").onclick = () => { go("me"); setTimeout(() => $("#settings") && $("#settings").scrollIntoView({ behavior: "smooth" }), 60); };
$("#meBtn").onclick = () => go("me");
$("#logoBtn").onclick = () => go("lobby");
Cloud.on(onCloud);
if (S.profile) { $("#hudWrap").hidden = false; renderHud(); }
go("lobby");
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
