// TOEIC POP! 750 — 純前端，資料存在瀏覽器 localStorage
const KEY = "toeic700";
const $ = (s, el = document) => el.querySelector(s);
const view = $("#view");

// ---------- 狀態 ----------
const defaults = () => ({
  profile: null,
  xp: 0,
  srs: {},           // word -> {due, int, ease, reps, first}
  log: {},           // YYYY-MM-DD -> {vocab, speak, listen, grammar, shadow, game}
  wrong: [],         // [{w, i}] Part 5 錯題
  stickers: {},      // id -> 取得日期
  stats: { p5: { c: 0, t: 0 }, p2: { c: 0, t: 0 }, speak: { sum: 0, n: 0 }, mocks: [] },
  games: { wordle: { date: "", guesses: [], done: false, win: false, plays: 0, wins: 0 }, meteor: { best: 0, plays: 0 }, boss: { wins: 0, plays: 0 } },
  settings: { rate: 0.9, voice: "", apiKey: "", newPerDay: 10, sound: true }
});
let S = load();
function load() {
  const d = defaults();
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s) {
      const out = Object.assign(d, s);
      ["stats", "settings"].forEach(k => out[k] = Object.assign(defaults()[k], s[k]));
      out.games = Object.assign(defaults().games, s.games);
      return out;
    }
  } catch (e) {}
  return d;
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

const dkey = d => d.toLocaleDateString("sv-SE");
const today = () => dkey(new Date());
const blankDay = () => ({ vocab: 0, speak: 0, listen: 0, grammar: 0, shadow: 0, game: 0 });
const dayLog = () => (S.log[today()] = Object.assign(blankDay(), S.log[today()]));
function bump(k, n = 1) { dayLog()[k] += n; save(); renderChips(); checkStickers(); }

function curWeek() {
  if (!S.profile) return 1;
  const days = Math.floor((new Date(today()) - new Date(S.profile.start)) / 864e5);
  return Math.max(1, Math.min(26, Math.floor(days / 7) + 1));
}
const active = k => { const l = S.log[k]; return !!l && Object.values(l).some(v => v > 0); };
// 連勝：每 7 天可以有 1 天休息日，連勝不中斷（降低壓力）
function streak() {
  const d = new Date(); let n = 0, lastSkip = -99;
  if (!active(dkey(d))) d.setDate(d.getDate() - 1);
  for (let i = 0; i < 400; i++) {
    if (active(dkey(d))) n++;
    else {
      const p = new Date(d); p.setDate(p.getDate() - 1);
      if (i - lastSkip >= 7 && active(dkey(p))) lastSkip = i; else break;
    }
    d.setDate(d.getDate() - 1);
  }
  return n;
}

// ---------- 等級 ----------
const RANKS = ["新手探員", "見習英雄", "街頭英雄", "城市守護者", "超級英雄", "傳奇英雄"];
const levelOf = xp => Math.floor(Math.sqrt(xp / 40)) + 1;
const xpFor = lv => 40 * (lv - 1) * (lv - 1);
const rankOf = lv => RANKS[Math.min(RANKS.length - 1, Math.floor((lv - 1) / 4))];
function addXP(n) {
  const before = levelOf(S.xp); S.xp += n; save();
  const after = levelOf(S.xp);
  if (after > before) setTimeout(() => { fx(`LEVEL<br>UP!`, "coral"); sfx("level"); toast(`升到 Lv.${after}「${rankOf(after)}」！`); }, 500);
  renderChips();
}
function renderChips() {
  $("#streak").textContent = "🔥 " + streak();
  $("#lv").textContent = "Lv." + levelOf(S.xp);
}

// ---------- 小工具 ----------
function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("show"); clearTimeout(toast.h); toast.h = setTimeout(() => el.classList.remove("show"), 2300); }
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random() * a.length)];
const W = n => WEEKS.find(x => x.w === n);
const burst = (html, cls = "", style = "") => `<span class="burst ${cls}" style="${style}"><b>${html}</b></span>`;
const sayBtn = t => `<span class="say" onclick='say(${JSON.stringify(t)})'>🔊</span>`;
const PRAISE = ["POW!", "BOOM!", "NICE!", "WOW!", "ZAP!", "YES!"];
function fx(text, cls = "") {
  const el = document.createElement("div"); el.className = "fx"; el.innerHTML = burst(text, cls);
  document.body.appendChild(el); setTimeout(() => el.remove(), 800);
}

// ---------- 音效（WebAudio，免檔案） ----------
let actx;
function sfx(type) {
  if (!S.settings.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const notes = { ok: [660, 880], no: [300, 240], level: [523, 659, 784, 1046], tap: [500] }[type] || [440];
    notes.forEach((f, i) => {
      const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + i * 0.09;
      o.type = type === "no" ? "triangle" : "square"; o.frequency.value = f;
      g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      o.connect(g).connect(actx.destination); o.start(t); o.stop(t + 0.17);
    });
  } catch (e) {}
}

// ---------- 吉祥物 Bubbo（橡皮管卡通風） ----------
function mascot(mood = "happy", size = 110, color = "#ffcd3c") {
  const mouth = {
    happy: `<path d="M45 70 Q60 88 75 70 Z" fill="#16131f"/><path d="M53 78 Q60 84 67 78 Q60 75 53 78Z" fill="#ff6f59"/>`,
    wow: `<ellipse cx="60" cy="77" rx="7" ry="9" fill="#16131f"/>`,
    think: `<path d="M50 77 Q60 72 70 77" stroke="#16131f" stroke-width="4" fill="none" stroke-linecap="round"/>`
  }[mood];
  const extra = mood === "wow" ? `<path d="M14 18 L22 26 M8 34 L18 36 M28 8 L30 18" stroke="#16131f" stroke-width="4" stroke-linecap="round"/>` : "";
  return `<svg width="${size}" height="${size * 1.08}" viewBox="0 0 120 130" aria-hidden="true">
  ${extra}
  <path d="M47 98 L43 118 M73 98 L77 118" stroke="#16131f" stroke-width="5" stroke-linecap="round"/>
  <ellipse cx="39" cy="121" rx="10" ry="6" fill="#ff6f59" stroke="#16131f" stroke-width="3.5"/>
  <ellipse cx="81" cy="121" rx="10" ry="6" fill="#ff6f59" stroke="#16131f" stroke-width="3.5"/>
  <path d="M22 62 Q6 56 8 40" stroke="#16131f" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M98 62 Q114 70 112 84" stroke="#16131f" stroke-width="5" fill="none" stroke-linecap="round"/>
  <circle cx="8" cy="36" r="8" fill="#fff" stroke="#16131f" stroke-width="3.5"/>
  <circle cx="112" cy="88" r="8" fill="#fff" stroke="#16131f" stroke-width="3.5"/>
  <path d="M30 20 H90 A14 14 0 0 1 104 34 V84 A14 14 0 0 1 90 98 H44 L30 108 L32 98 A14 14 0 0 1 16 84 V34 A14 14 0 0 1 30 20Z" fill="${color}" stroke="#16131f" stroke-width="4" stroke-linejoin="round"/>
  <ellipse cx="48" cy="50" rx="7" ry="11" fill="#16131f"/><ellipse cx="72" cy="50" rx="7" ry="11" fill="#16131f"/>
  <ellipse cx="50" cy="45" rx="2.6" ry="3.8" fill="#fff"/><ellipse cx="74" cy="45" rx="2.6" ry="3.8" fill="#fff"/>
  <circle cx="34" cy="68" r="5.5" fill="#ff9ccf"/><circle cx="86" cy="68" r="5.5" fill="#ff9ccf"/>
  ${mouth}
  </svg>`;
}

// ---------- 語音：TTS ----------
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

// ---------- 語音：辨識 ----------
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
function listen() {
  return new Promise((res, rej) => {
    if (!SR) return rej(new Error("nosr"));
    const r = new SR();
    r.lang = "en-US"; r.interimResults = false; r.maxAlternatives = 3;
    let done = false;
    r.onresult = e => { done = true; const a = e.results[0][0]; res({ text: a.transcript, conf: a.confidence || 0 }); };
    r.onerror = e => { if (!done) { done = true; rej(new Error(e.error)); } };
    r.onend = () => { if (!done) rej(new Error("no-speech")); };
    r.start();
  });
}
const micErr = e => toast(e.message === "nosr" ? "這個瀏覽器不支援語音辨識，改用打字也可以喔" : e.message === "not-allowed" ? "請允許麥克風權限" : "沒聽到聲音，再試一次～");

// ---------- 比對評分 ----------
const CONTR = { "i'm": "i am", "it's": "it is", "that's": "that is", "don't": "do not", "doesn't": "does not", "didn't": "did not", "can't": "can not", "cannot": "can not", "won't": "will not", "i'll": "i will", "we'll": "we will", "you're": "you are", "we're": "we are", "they're": "they are", "isn't": "is not", "aren't": "are not", "let's": "let us", "i'd": "i would", "he's": "he is", "she's": "she is", "what's": "what is", "there's": "there is", "haven't": "have not", "hasn't": "has not", "i've": "i have" };
function tokens(s) {
  return s.toLowerCase().replace(/[’]/g, "'").replace(/[^a-z0-9' ]+/g, " ").split(/\s+/).filter(Boolean)
    .flatMap(w => (CONTR[w] || w).split(" "));
}
function lcs(a, b) {
  const m = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    m[i][j] = a[i - 1] === b[j - 1] ? m[i - 1][j - 1] + 1 : Math.max(m[i - 1][j], m[i][j - 1]);
  return m[a.length][b.length];
}
function similarity(said, target) {
  const a = tokens(said), b = tokens(target);
  if (!a.length || !b.length) return 0;
  return (2 * lcs(a, b)) / (a.length + b.length);
}
function best(said, targets) {
  let top = { s: 0, t: targets[0] };
  targets.forEach(t => { const s = similarity(said, t); if (s > top.s) top = { s, t }; });
  return top;
}
function diffHTML(said, target) {
  const got = new Set(tokens(said));
  return target.split(" ").map(w => got.has(tokens(w)[0]) ? `<span class="w-ok">${esc(w)}</span>` : `<span class="w-miss">${esc(w)}</span>`).join(" ");
}
// 參考答案在資料中為小寫、無標點（方便比對），顯示時還原大小寫與標點
const PROPER = { mr: "Mr.", ms: "Ms.", brown: "Brown", kayla: "Kayla", lin: "Lin", amy: "Amy", sarah: "Sarah", hr: "HR", taiwan: "Taiwan", taichung: "Taichung", youtube: "YouTube",
  monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday", friday: "Friday", september: "September", pm: "p.m.", "i": "I" };
const QW = /^(what|when|where|who|why|how|which|is|are|do|does|did|can|could|may|would|will|should|have|has)\b/;
function cap(s) {
  let t = s.split(" ").map(w => { const k = w.toLowerCase(); return PROPER[k] || (/^i'/.test(k) ? "I" + w.slice(1) : w); }).join(" ");
  t = t.charAt(0).toUpperCase() + t.slice(1);
  return /[.?!]$/.test(t) ? t : t + (QW.test(s) ? "?" : ".");
}

// ---------- 題庫 ----------
function unlockedWeeks() { const n = Math.max(2, Math.min(curWeek(), 24)); return WEEKS.filter(w => w.w <= n && !w.review); }
function poolP5(wk) {
  const w = W(wk);
  if (w && !w.review) return w.p5.map((q, i) => ({ q, w: w.w, i }));
  return WEEKS.filter(x => !x.review).flatMap(x => x.p5.map((q, i) => ({ q, w: x.w, i })));
}
function poolP2(wk) {
  const w = W(wk);
  if (w && !w.review) return w.p2.slice();
  return WEEKS.filter(x => !x.review).flatMap(x => x.p2);
}
const parseWord = s => { const [word, pos, zh, ex] = s.split("|"); return { word, pos, zh, ex }; };

// ---------- 貼紙簿 ----------
const totalDone = () => Object.values(S.log).reduce((a, l) => a + Object.values(l).reduce((x, y) => x + y, 0), 0);
const STICKERS = [
  { id: "first", e: "🚀", n: "第一步", d: "完成第一個任務", c: "", ok: () => totalDone() > 0 },
  { id: "s3", e: "🔥", n: "三天熱度", d: "連續學習 3 天", c: "coral", ok: () => streak() >= 3 },
  { id: "s7", e: "⚡", n: "一週不斷電", d: "連續學習 7 天", c: "pink", ok: () => streak() >= 7 },
  { id: "s30", e: "👑", n: "月度英雄", d: "連續學習 30 天", c: "green", ok: () => streak() >= 30 },
  { id: "v50", e: "🧠", n: "字彙小腦袋", d: "學會 50 個單字", c: "blue", ok: () => Object.keys(S.srs).length >= 50 },
  { id: "v150", e: "📚", n: "行走字典", d: "學會 150 個單字", c: "lilac", ok: () => Object.keys(S.srs).length >= 150 },
  { id: "wd", e: "🟩", n: "猜字達人", d: "猜中一次每日猜字", c: "green", ok: () => S.games.wordle.wins >= 1 },
  { id: "wd10", e: "🔤", n: "字母魔法師", d: "猜字累積 10 勝", c: "", ok: () => S.games.wordle.wins >= 10 },
  { id: "met", e: "☄️", n: "隕石獵人", d: "單字隕石拿到 300 分", c: "coral", ok: () => S.games.meteor.best >= 300 },
  { id: "boss", e: "🦸", n: "打倒魔王", d: "第一次打贏文法魔王", c: "pink", ok: () => S.games.boss.wins >= 1 },
  { id: "talk5", e: "🎤", n: "開口王", d: "完成 5 次口說情境", c: "blue", ok: () => S.stats.speak.n >= 5 },
  { id: "mock", e: "📝", n: "實戰演練", d: "完成一次模擬考", c: "lilac", ok: () => S.stats.mocks.length >= 1 },
  { id: "half", e: "🏔️", n: "半山腰", d: "抵達第 13 週", c: "green", ok: () => curWeek() >= 13 },
  { id: "lv10", e: "💎", n: "Lv.10", d: "等級達到 10", c: "blue", ok: () => levelOf(S.xp) >= 10 }
];
function checkStickers() {
  STICKERS.forEach(s => {
    if (!S.stickers[s.id] && s.ok()) {
      S.stickers[s.id] = today(); save();
      setTimeout(() => { fx(s.e, s.c); toast(`🎁 獲得新貼紙「${s.n}」！`); sfx("level"); }, 900);
    }
  });
}

// ---------- 路由 ----------
let cleanup = null;
document.querySelectorAll("#tabbar button").forEach(b => b.onclick = () => { sfx("tap"); go(b.dataset.tab); });
$("#home").onclick = () => go("today");
const TAB_OF = { week: "course", talk: "speak", free: "speak", wordle: "games", meteor: "games", boss: "games", vocab: "today", listen: "today", grammar: "today", shadow: "today", mock: "games" };
function go(t, arg) {
  if (cleanup) { cleanup(); cleanup = null; }
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  const tb = TAB_OF[t] || t;
  document.querySelectorAll("#tabbar button").forEach(b => b.classList.toggle("on", b.dataset.tab === tb));
  window.scrollTo(0, 0);
  if (!S.profile) return renderOnboard();
  (ROUTES[t] || ROUTES.today)(arg);
}
const ROUTES = {
  today: renderToday, course: renderCourse, week: renderWeek, games: renderGames, speak: renderSpeak, talk: renderTalk, free: renderFree,
  vocab: renderVocab, listen: renderListen, grammar: renderGrammar, shadow: renderShadow, mock: renderMock, me: renderMe,
  wordle: renderWordle, meteor: renderMeteor, boss: renderBoss
};
function doneScreen(title, big, note, again) {
  view.innerHTML = `<div class="card yellow center"><div class="mascot bob" style="display:inline-block">${mascot("wow", 110)}</div>
  <div class="big">${big}</div><h3>${title}</h3><p>${note}</p>
  <div class="row" style="justify-content:center"><button class="btn" id="re">再玩一次</button><button class="btn primary" id="hm">回首頁</button></div></div>`;
  $("#re").onclick = again; $("#hm").onclick = () => go("today");
}

// ---------- 首次設定 ----------
function renderOnboard() {
  view.innerHTML = `
  <div class="card yellow">
    <div class="hero"><div class="mascot bob">${mascot("happy", 110, "#ff9ccf")}</div>
    <div class="bubble">HEY！我是 Bubbo 👋<br>接下來 26 週，我陪你一起衝 <b>多益 750</b>！</div></div>
  </div>
  <div class="card">
    <h2>開始你的英雄旅程</h2>
    <p class="muted" style="margin-top:0">每天做 1 個任務就算達標，多做是加分。玩遊戲、跟 AI 聊天、收集貼紙，壓力 OUT，進步 IN。</p>
    <label>怎麼稱呼你？</label><input id="ob-name" placeholder="例如 Kayla" maxlength="16">
    <label>開始日期（第 1 週從這天算起）</label><input id="ob-start" type="date" value="${today()}">
    <p></p><button class="btn primary block" id="ob-go">GO！出發 🚀</button>
  </div>`;
  $("#ob-go").onclick = () => {
    S.profile = { name: $("#ob-name").value.trim() || "英雄", start: $("#ob-start").value || today() };
    save(); sfx("level"); fx("LET'S<br>GO!", "coral"); go("today");
  };
}

// ---------- 首頁 ----------
const GOAL = { vocab: 10, speak: 1, listen: 3, grammar: 5, shadow: 3 };
const TASKS = [
  { key: "vocab", icon: "🃏", bg: "var(--yellow)", name: "單字卡", min: 10, desc: "記憶曲線複習，每天新字 10 個" },
  { key: "speak", icon: "🎙️", bg: "var(--pink)", name: "AI 口說", min: 10, desc: "情境角色扮演，對麥克風說" },
  { key: "listen", icon: "🎧", bg: "var(--blue)", name: "聽力 Part 2", min: 5, desc: "聽問句、選回應" },
  { key: "grammar", icon: "✏️", bg: "var(--green)", name: "文法 Part 5", min: 5, desc: "本週文法＋解析" },
  { key: "shadow", icon: "🔁", bg: "var(--lilac)", name: "跟讀", min: 5, desc: "模仿發音，即時評分" }
];
function renderToday() {
  const wk = curWeek(), w = W(wk), ph = PHASES.find(p => p.id === w.phase);
  const log = dayLog(), lv = levelOf(S.xp);
  const done = TASKS.filter(t => log[t.key] >= GOAL[t.key]).length;
  const any = active(today());
  const lvPct = Math.round(((S.xp - xpFor(lv)) / (xpFor(lv + 1) - xpFor(lv))) * 100);
  const wd = S.games.wordle, wdDone = wd.date === today() && wd.done;
  const greet = any ? (done >= 3 ? "今天超猛！🔥 已經達標，剩下都是加分～" : "今天已經達標 ✅ 想多玩一點也很歡迎！") : "今天做 1 個任務就算達標，挑一個最想做的吧！";
  view.innerHTML = `
  <div class="card yellow">
    <div class="hero"><div class="mascot bob">${mascot(any ? "wow" : "happy", 96)}</div>
    <div style="flex:1"><div class="display" style="font-size:1.5rem">HEY, ${esc(S.profile.name)}!</div>
    <div class="bubble" style="margin-top:8px">${greet}</div></div></div>
  </div>
  <div class="grid4">
    <div class="tile" style="background:var(--coral);color:#fff"><div class="k">🔥 連勝</div><div class="v">${streak()}</div></div>
    <div class="tile" style="background:var(--green)"><div class="k">⭐ 經驗值</div><div class="v">${S.xp}</div></div>
    <div class="tile" style="background:var(--pink)"><div class="k">🃏 待複習</div><div class="v">${dueCards().length + newCards().length}</div></div>
    <div class="tile" style="background:var(--blue);color:#fff"><div class="k">🏆 貼紙</div><div class="v">${Object.keys(S.stickers).length}/${STICKERS.length}</div></div>
  </div><p></p>
  <div class="card">
    <div class="row between"><div><span class="tag y">第 ${wk} / 26 週</span> <span class="tag">${ph.en}・${ph.name}</span></div><span class="tag g">階段目標 ${ph.target}</span></div>
    <h2 style="margin:10px 0 4px">${esc(w.theme)}</h2><div class="muted">本週文法：${esc(w.grammar)}</div>
    <p style="margin:12px 0 4px;font-weight:900">Lv.${lv} ${rankOf(lv)} <span class="muted">→ 下一級還差 ${xpFor(lv + 1) - S.xp} XP</span></p>
    <div class="bar"><i style="width:${lvPct}%"></i></div>
  </div>
  <span class="sec-title">TODAY'S MISSION</span>
  <div>${TASKS.map(t => {
    const ok = log[t.key] >= GOAL[t.key];
    return `<div class="task ${ok ? "done" : ""}" data-go="${t.key}"><div class="ic" style="background:${t.bg}">${t.icon}</div>
      <div class="t"><b>${t.name}</b> <span class="muted">約 ${t.min} 分</span><div class="muted">${t.desc}・${Math.min(log[t.key], GOAL[t.key])}/${GOAL[t.key]}</div></div>
      <div class="chk">${ok ? "✔" : "›"}</div></div>`;
  }).join("")}</div>
  <p></p>
  <div class="card pink game" data-go="wordle"><div class="art">🟩</div>
    <div><h3>每日猜字 WORDLE</h3><div>${wdDone ? (wd.win ? "今天猜中了！明天再來挑戰 🎉" : "今天的字已揭曉，明天換新字！") : "今天的神秘多益單字等你來猜 →"}</div></div></div>
  <div class="card lilac"><div class="hero"><div class="mascot">${mascot("think", 70, "#8ee6c4")}</div>
    <div class="bubble"><b>本週小撇步：</b>${esc(w.tip)}</div></div></div>
  ${[6, 12, 18, 24, 26].includes(wk) ? `<div class="card green"><h3>📝 本週是關卡檢核週</h3><p style="margin-top:0">來一場迷你模擬考，看看自己升級多少！不用緊張，只是看進步。</p><button class="btn primary" data-go="mock">開始模擬考</button></div>` : ""}`;
  view.querySelectorAll("[data-go]").forEach(el => el.onclick = () => {
    sfx("tap");
    const k = el.dataset.go;
    if (k === "speak") go("talk", wk <= 24 ? wk : 1 + Math.floor(Math.random() * 24)); else go(k, wk);
  });
}

// ---------- 課程地圖 ----------
function renderCourse() {
  const wk = curWeek();
  view.innerHTML = `<h2>🗺️ 26 週英雄地圖</h2><p style="margin-top:-6px;font-weight:700">每一週一個主題、一個文法，一步一步升級到 750。</p>` + PHASES.map(p => `
  <div class="card ${p.color}"><div class="row between"><h3 style="margin:0">${p.en} · ${p.name}</h3>${burst(p.target, "", "width:62px;height:62px;font-size:1rem")}</div>
  <p style="margin:4px 0 12px;font-weight:700">第 ${p.weeks} 週｜${p.desc}</p>
  <div class="weeks">${WEEKS.filter(w => w.phase === p.id).map(w => `
    <div class="week ${w.w === wk ? "cur" : w.w < wk ? "past" : ""}" data-w="${w.w}">
    ${w.w === wk ? burst("NOW", "coral", "") .replace('class="burst', 'class="burst now') : ""}
    <div class="n">W${w.w}</div><div style="font-weight:900">${esc(w.theme)}</div><div class="muted">${esc(w.grammar)}</div></div>`).join("")}</div>
  </div>`).join("");
  view.querySelectorAll("[data-w]").forEach(el => el.onclick = () => go("week", +el.dataset.w));
}

function renderWeek(n) {
  const w = W(n);
  view.innerHTML = `<button class="back" id="bk">‹ 英雄地圖</button>
  <div class="card yellow"><span class="tag">WEEK ${w.w}</span><h2 style="margin-top:8px">${esc(w.theme)}</h2>
  <p style="font-weight:900;margin:0 0 6px">文法：${esc(w.grammar)}</p><div class="expl">${esc(w.tip)}</div></div>
  <div class="grid2">
    <button class="btn green" data-a="grammar">✏️ Part 5 文法</button>
    <button class="btn blue" data-a="listen">🎧 Part 2 聽力</button>
    ${w.talk ? `<button class="btn pink" data-a="talk">🎙️ ${esc(w.talk.title)}</button>` : `<button class="btn pink" data-a="mock">📝 模擬考</button>`}
    <button class="btn yellow" data-a="shadow">🔁 跟讀練習</button>
  </div><p></p>
  ${w.words.length ? `<div class="card"><h3>本週單字（${w.words.length}）</h3>
  ${w.words.map(parseWord).map(x => `<div style="padding:9px 0;border-bottom:2px dashed #d8cfe8">
    <b style="font-size:1.08rem">${esc(x.word)}</b> <span class="tag">${esc(x.pos)}</span> ${esc(x.zh)} ${sayBtn(x.word)}
    <div class="muted">${esc(x.ex)} ${sayBtn(x.ex)}</div></div>`).join("")}</div>` : ""}`;
  $("#bk").onclick = () => go("course");
  view.querySelectorAll("[data-a]").forEach(b => b.onclick = () => go(b.dataset.a, n));
}

// ---------- 遊戲大廳 ----------
function renderGames() {
  const g = S.games, wd = g.wordle;
  view.innerHTML = `<h2>🎮 遊戲大廳</h2><p style="margin-top:-6px;font-weight:700">邊玩邊記，玩完就學會了。不扣血、不倒扣，盡量玩！</p>
  <div class="card green game" data-g="wordle"><div class="art">🟩</div><div style="flex:1">
    <h3>每日猜字 WORDLE</h3><div>每天一個多益單字，6 次機會猜出 5 個字母。卡關可以看中文提示。</div>
    <div class="muted" style="margin-top:4px">累積 ${wd.wins} 勝 / ${wd.plays} 場</div></div></div>
  <div class="card blue game" data-g="meteor"><div class="art">☄️</div><div style="flex:1;color:#fff">
    <h3>單字隕石 METEOR</h3><div>英文單字從天而降，60 秒內點出正確中文把它打爆！連擊越多分數越高。</div>
    <div style="margin-top:4px;opacity:.85">最高分 ${g.meteor.best}</div></div></div>
  <div class="card coral game" data-g="boss"><div class="art">👾</div><div style="flex:1;color:#fff">
    <h3>文法魔王 BOSS FIGHT</h3><div>答對 Part 5 文法題就能攻擊魔王，連續答對會放大絕！</div>
    <div style="margin-top:4px;opacity:.85">已打倒魔王 ${g.boss.wins} 次</div></div></div>
  <span class="sec-title">CLASSIC TRAINING</span>
  <div class="grid2">
    <button class="btn yellow" data-g="vocab">🃏 單字卡</button><button class="btn blue" data-g="listen">🎧 聽力 Part 2</button>
    <button class="btn green" data-g="grammar">✏️ 文法 Part 5</button><button class="btn pink" data-g="shadow">🔁 跟讀</button>
    <button class="btn" data-g="mock">📝 迷你模擬考</button><button class="btn" data-g="wrongbook">📕 錯題本（${S.wrong.length}）</button>
  </div>`;
  view.querySelectorAll("[data-g]").forEach(el => el.onclick = () => {
    sfx("tap"); const k = el.dataset.g;
    if (k === "wrongbook") renderGrammar(curWeek(), true); else go(k, curWeek());
  });
}

// ---------- 遊戲 1：每日猜字 ----------
function renderWordle(_, practice) {
  const dayIdx = Math.floor(new Date(today()) / 864e5);
  const entry = practice ? pick(WORDLE_WORDS) : WORDLE_WORDS[dayIdx % WORDLE_WORDS.length];
  const [ANS, ZH] = entry.split("|");
  const st = S.games.wordle;
  if (!practice && st.date !== today()) Object.assign(st, { date: today(), guesses: [], done: false, win: false });
  const guesses = practice ? [] : st.guesses;
  let done = practice ? false : st.done, cur = "", hinted = false;
  const color = g => { // 處理重複字母
    const res = Array(5).fill("x"), left = {};
    for (let i = 0; i < 5; i++) if (g[i] === ANS[i]) res[i] = "g"; else left[ANS[i]] = (left[ANS[i]] || 0) + 1;
    for (let i = 0; i < 5; i++) if (res[i] !== "g" && left[g[i]]) { res[i] = "y"; left[g[i]]--; }
    return res;
  };
  view.innerHTML = `<button class="back" id="bk">‹ 遊戲大廳</button>
  <div class="card green"><div class="row between"><h3 style="margin:0">🟩 ${practice ? "練習模式" : "每日猜字"}</h3>
  <button class="btn small" id="hint">💡 中文提示</button></div>
  <div class="muted" style="color:var(--ink)">猜一個 5 個字母的多益單字。🟩 位置正確、🟨 有這個字母但位置不對。</div><div id="hintTxt" style="font-weight:900"></div></div>
  <div class="wd-grid" id="grid"></div><div id="msg" class="center" style="margin-bottom:12px"></div><div class="kb" id="kb"></div>`;
  $("#bk").onclick = () => go("games");
  $("#hint").onclick = () => { hinted = true; $("#hintTxt").textContent = `提示：${ZH}（開頭是 ${ANS[0]}）`; };
  function draw(shake) {
    $("#grid").innerHTML = Array.from({ length: 6 }, (_, r) => {
      const g = guesses[r], c = g ? color(g) : null, txt = g || (r === guesses.length ? cur : "");
      return `<div class="wd-row ${shake && r === guesses.length ? "shake" : ""}">${Array.from({ length: 5 }, (_, i) =>
        `<div class="wd-cell ${c ? c[i] + " flip" : ""}" style="${c ? `animation-delay:${i * 0.1}s` : ""}">${txt[i] || ""}</div>`).join("")}</div>`;
    }).join("");
    const keyState = {};
    guesses.forEach(g => color(g).forEach((c, i) => { const k = g[i], rank = { g: 3, y: 2, x: 1 }; if (!keyState[k] || rank[c] > rank[keyState[k]]) keyState[k] = c; }));
    $("#kb").innerHTML = ["QWERTYUIOP", "ASDFGHJKL", "+ZXCVBNM-"].map(r => `<div class="r">${r.split("").map(k =>
      k === "+" ? `<button class="wide" data-k="ENTER">ENTER</button>` : k === "-" ? `<button class="wide" data-k="DEL">⌫</button>` :
      `<button class="${keyState[k] || ""}" data-k="${k}">${k}</button>`).join("")}</div>`).join("");
    $("#kb").querySelectorAll("[data-k]").forEach(b => b.onclick = () => press(b.dataset.k));
    if (done) finish();
  }
  function finish() {
    const win = guesses[guesses.length - 1] === ANS;
    $("#msg").innerHTML = `<div class="card ${win ? "yellow" : "lilac"}" style="text-align:left"><div class="hero"><div class="mascot">${mascot(win ? "wow" : "think", 70)}</div>
      <div><div class="display" style="font-size:1.4rem">${win ? pick(PRAISE) : "差一點點！"} ${ANS} ${sayBtn(ANS.toLowerCase())}</div><div style="font-weight:700">${ZH}</div>
      <div class="muted">${win ? `${guesses.length} 次就猜中！` : "沒關係，記住這個字，下次一定猜得到。"}</div></div></div>
      <p></p><button class="btn small" id="prac">再玩練習模式</button></div>`;
    $("#prac").onclick = () => renderWordle(null, true);
  }
  function press(k) {
    if (done) return;
    if (k === "DEL") cur = cur.slice(0, -1);
    else if (k === "ENTER") {
      if (cur.length < 5) { toast("要 5 個字母喔"); return draw(true); }
      guesses.push(cur); cur = "";
      const win = guesses[guesses.length - 1] === ANS;
      if (win || guesses.length === 6) {
        done = true;
        if (!practice) { st.done = true; st.win = win; st.plays++; if (win) st.wins++; }
        if (win) { fx(pick(PRAISE), "green"); sfx("ok"); } else sfx("no");
        addXP(win ? (hinted ? 20 : 30) : 10); bump("game"); speak(ANS.toLowerCase());
      }
      save();
    } else if (/^[A-Z]$/.test(k) && cur.length < 5) cur += k;
    draw();
  }
  const onKey = e => { const k = e.key.toUpperCase(); if (k === "ENTER" || k === "BACKSPACE") { e.preventDefault(); press(k === "ENTER" ? "ENTER" : "DEL"); } else if (/^[A-Z]$/.test(k)) press(k); };
  document.addEventListener("keydown", onKey);
  cleanup = () => document.removeEventListener("keydown", onKey);
  draw();
}

// ---------- 遊戲 2：單字隕石 ----------
function renderMeteor() {
  const bank = unlockedWeeks().flatMap(w => w.words.map(parseWord));
  let score = 0, combo = 0, hits = 0, missed = [], timeLeft = 60, cur = null, raf, last, running = false, timer;
  view.innerHTML = `<button class="back" id="bk">‹ 遊戲大廳</button>
  <div class="arena" id="arena"><div class="hud"><span class="chip">⏱ <span id="tm">60</span></span><span class="chip">⭐ <span id="sc">0</span></span><span class="chip" id="cb">x1</span></div>
    <div class="ground"></div>
    <div id="start" style="position:absolute;inset:0;display:grid;place-items:center;z-index:3">
      <div class="center"><div class="mascot bob" style="display:inline-block">${mascot("wow", 90)}</div><br><button class="btn primary" id="go">START ☄️</button>
      <div style="color:#fff;font-weight:700;margin-top:8px">點下面正確的中文，打爆掉下來的單字！</div></div></div>
  </div>
  <div class="answers" id="ans"></div>`;
  $("#bk").onclick = () => go("games");
  const arena = $("#arena");
  function spawn() {
    const w = pick(bank);
    const opts = shuffle([w, ...shuffle(bank.filter(x => x.zh !== w.zh)).slice(0, 3)]);
    const el = document.createElement("div"); el.className = "meteor"; el.textContent = w.word;
    el.style.left = (20 + Math.random() * 60) + "%"; el.style.top = "56px"; arena.appendChild(el);
    cur = { w, el, y: 56, speed: (arena.clientHeight - 120) / Math.max(3.2, 7 - combo * 0.35) };
    $("#ans").innerHTML = opts.map(o => `<button class="btn" data-zh="${esc(o.zh)}">${esc(o.zh)}</button>`).join("");
    $("#ans").querySelectorAll("button").forEach(b => b.onclick = () => answer(b));
  }
  function answer(b) {
    if (!running || !cur) return;
    if (b.dataset.zh === cur.w.zh) {
      combo++; hits++; const gain = 10 * Math.min(5, 1 + Math.floor(combo / 3)); score += gain;
      sfx("ok"); speak(cur.w.word, 1.1);
      cur.el.textContent = combo >= 3 ? pick(PRAISE) : "+" + gain; cur.el.style.background = "var(--green)";
      const el = cur.el; cur = null; setTimeout(() => el.remove(), 350); setTimeout(() => running && spawn(), 380);
    } else {
      combo = 0; sfx("no"); b.disabled = true; b.style.background = "var(--pink)";
    }
    hud();
  }
  function hud() { $("#sc").textContent = score; $("#cb").textContent = "x" + Math.min(5, 1 + Math.floor(combo / 3)) + (combo ? ` 🔥${combo}` : ""); }
  function loop(t) {
    if (!running) return;
    const dt = last ? (t - last) / 1000 : 0; last = t;
    if (cur) {
      cur.y += cur.speed * dt; cur.el.style.top = cur.y + "px";
      if (cur.y > arena.clientHeight - 62) { // 落地：不扣分，只是重置連擊
        missed.push(cur.w); combo = 0; hud();
        cur.el.textContent = cur.w.zh; cur.el.style.background = "var(--pink)";
        const el = cur.el; cur = null; setTimeout(() => el.remove(), 600); setTimeout(() => running && spawn(), 650);
      }
    }
    raf = requestAnimationFrame(loop);
  }
  function end() {
    running = false; cancelAnimationFrame(raf); clearInterval(timer);
    const g = S.games.meteor; g.plays++; const rec = score > g.best; if (rec) g.best = score; save();
    addXP(Math.max(5, Math.round(score / 10))); bump("game");
    const miss = [...new Map(missed.map(m => [m.word, m])).values()].slice(0, 8);
    doneScreen(rec ? "🎉 新紀錄！" : "隕石雨結束！", score + " 分", `打爆 ${hits} 顆隕石${miss.length ? `<br><br><b>再記一下：</b><br>${miss.map(m => `${esc(m.word)} ＝ ${esc(m.zh)}`).join("<br>")}` : ""}`, () => renderMeteor());
  }
  $("#go").onclick = () => {
    $("#start").remove(); running = true; spawn(); raf = requestAnimationFrame(loop);
    timer = setInterval(() => { timeLeft--; $("#tm").textContent = timeLeft; if (timeLeft <= 0) end(); }, 1000);
  };
  cleanup = () => { running = false; cancelAnimationFrame(raf); clearInterval(timer); };
}

// ---------- 遊戲 3：文法魔王 ----------
const BOSSES = [
  { face: "👾", name: "時態怪 TENSO" }, { face: "🦖", name: "詞性獸 POSZILLA" }, { face: "🐙", name: "子句章魚 CLAUSO" },
  { face: "🤖", name: "文法機器人 DR. GRAMMAR" }, { face: "🐉", name: "終極魔王 THE 750 DRAGON" }
];
function renderBoss() {
  const ph = W(curWeek()).phase, B = BOSSES[ph - 1];
  const qs = shuffle(unlockedWeeks().flatMap(x => x.p5.map((q, i) => ({ q, w: x.w, i })))).slice(0, 10);
  let hp = 100, i = 0, combo = 0, right = 0;
  const L = "ABCD";
  function show() {
    if (hp <= 0 || i >= qs.length) return end();
    const { q, w, i: qi } = qs[i]; const [stem, opts, ans, ex] = q;
    view.innerHTML = `<button class="back" id="bk">‹ 遊戲大廳</button>
    <div class="card coral boss"><div class="row between" style="color:#fff"><b>${B.name}</b><span class="chip" style="color:var(--ink)">回合 ${i + 1}/${qs.length}</span></div>
      <div class="face" id="face">${B.face}</div><div class="hp"><i style="width:${hp}%"></i></div>
      <div style="color:#fff;font-weight:900">HP ${hp}${combo >= 2 ? `　🔥 ${combo} 連擊！` : ""}</div></div>
    <div class="card"><p style="font-size:1.12rem;font-weight:700;margin-top:0">${esc(stem).replace("___", "<b>_______</b>")}</p>
    ${opts.map((o, k) => `<button class="btn opt" data-k="${k}">(${L[k]}) ${esc(o)}</button>`).join("")}<div id="after"></div></div>`;
    $("#bk").onclick = () => go("games");
    view.querySelectorAll("[data-k]").forEach(b => b.onclick = () => {
      const k = +b.dataset.k, ok = k === ans;
      S.stats.p5.t++;
      view.querySelectorAll("[data-k]").forEach(x => { x.disabled = true; const kk = +x.dataset.k; if (kk === ans) x.classList.add("right"); else if (kk === k) x.classList.add("wrong"); });
      if (ok) {
        S.stats.p5.c++; right++; combo++; const dmg = 18 + Math.min(combo - 1, 3) * 6; hp = Math.max(0, hp - dmg);
        $("#face").classList.add("hit"); $(".hp > i").style.width = hp + "%"; fx(combo >= 3 ? "SUPER<br>POW!" : pick(PRAISE), "coral"); sfx("ok");
      } else {
        combo = 0; sfx("no");
        if (!S.wrong.some(x => x.w === w && x.i === qi)) S.wrong.push({ w, i: qi });
      }
      bump("grammar"); save();
      $("#after").innerHTML = `<div class="expl"><b>${ok ? `💥 命中！造成傷害` : `😜 魔王閃開了！正解是 (${L[ans]})`}</b><br>${esc(ex)}</div><p></p>
      <button class="btn primary block" id="nx">${hp <= 0 ? "看結果 🏆" : "下一擊 ⚔️"}</button>`;
      $("#nx").onclick = () => { i++; show(); };
    });
  }
  function end() {
    const win = hp <= 0, g = S.games.boss; g.plays++; if (win) g.wins++; save();
    addXP(win ? 50 : 15 + right * 3); bump("game");
    if (win) { fx("K.O.!", "coral"); sfx("level"); }
    doneScreen(win ? `打倒 ${B.name}！` : `${B.name} 逃走了…下次再戰！`, win ? "K.O.!" : `${right}/${qs.length}`,
      win ? `答對 ${right} 題，帥！答錯的題目已收進錯題本。` : `答對 ${right} 題，已經很不錯了。錯的題目幫你收進錯題本，練熟再來打！`, () => renderBoss());
  }
  show();
}

// ---------- 口說 ----------
function renderSpeak() {
  const wk = curWeek();
  const list = WEEKS.filter(w => w.talk);
  view.innerHTML = `<h2>🎙️ AI 口說教練</h2>
  ${SR ? "" : `<div class="card yellow">⚠️ 這個瀏覽器不支援語音辨識，改用打字也可以。建議用 <b>Chrome</b>（電腦／Android）或 <b>Safari</b>（iPhone／iPad）。</div>`}
  <div class="card pink"><div class="hero"><div class="mascot bob">${mascot("happy", 80, "#6c8cff")}</div><div style="flex:1">
    <h3>💬 AI 自由聊天</h3><div style="font-weight:700">想聊什麼就聊什麼，說錯也沒關係，AI 會用中文溫柔幫你修正。</div>
    <p style="margin:10px 0 0"><button class="btn primary" id="free">開始聊天</button></p></div></div></div>
  <span class="sec-title">ROLE PLAY</span>
  <div class="weeks">${list.map(w => `<div class="week ${w.w === wk ? "cur" : w.w < wk ? "past" : ""}" data-w="${w.w}">
  ${w.w === wk ? burst("NOW", "coral").replace('class="burst', 'class="burst now') : ""}
  <div class="n">W${w.w}</div><div style="font-weight:900">${esc(w.talk.title)}</div><div class="muted">${esc(w.talk.role)}</div></div>`).join("")}</div>`;
  $("#free").onclick = () => go("free");
  view.querySelectorAll("[data-w]").forEach(el => el.onclick = () => go("talk", +el.dataset.w));
}

function chatAdder(chat) {
  return (cls, html) => { const d = document.createElement("div"); d.className = "msg " + cls; d.innerHTML = html; chat.appendChild(d); d.scrollIntoView({ behavior: "smooth", block: "nearest" }); return d; };
}
function renderTalk(n) {
  const w = W(n) && W(n).talk ? W(n) : W(1);
  const T = w.talk; let i = 0, scores = [];
  view.innerHTML = `<button class="back" id="bk">‹ 口說</button>
  <div class="card yellow"><span class="tag">WEEK ${w.w}・${esc(w.theme)}</span><h3 style="margin-top:8px">🎭 ${esc(T.title)}</h3><div style="font-weight:700">情境：${esc(T.role)}</div></div>
  <div class="card"><div class="chat" id="chat"></div></div>
  <div class="card center" id="ctl">
    <div style="font-weight:900" id="hint"></div><p></p>
    <button class="mic" id="mic">🎤</button>
    <div class="row" style="margin-top:14px;justify-content:center">
      <button class="btn small" id="again">🔊 再聽</button><button class="btn small" id="slow">🐢 慢速</button><button class="btn small yellow" id="showA">💡 偷看答案</button>
    </div>
    <div class="row" style="margin-top:12px"><input id="typed" placeholder="或直接打字回答…" style="flex:1;width:auto"><button class="btn small" id="send">送出</button></div>
  </div>`;
  $("#bk").onclick = () => go("speak");
  const add = chatAdder($("#chat"));
  function ask() {
    if (i >= T.turns.length) return finish();
    const [line, , zh] = T.turns[i];
    add("ai", `${esc(line)}${sayBtn(line)}`);
    $("#hint").textContent = "💭 提示：" + zh;
    speak(line);
  }
  function answer(text, conf) {
    const [, ans] = T.turns[i];
    add("me", esc(text));
    const b = best(text, ans), pct = Math.round(b.s * 100), model = cap(b.t);
    const pron = conf ? `・清晰度 ${Math.round(conf * 100)}%` : "";
    if (pct >= 55) {
      scores.push(pct); sfx("ok"); if (pct >= 80) fx(pick(PRAISE), "green");
      add("fb", `<span class="score">${pct >= 80 ? "🌟 超棒！" : "👌 有通！"} ${pct} 分</span><span class="muted">${pron}</span><br>參考說法：${diffHTML(text, model)} ${sayBtn(model)}`);
      i++; setTimeout(ask, 1000);
    } else {
      sfx("no");
      add("fb", `<span class="score">🤔 換個說法試試（${pct} 分）</span><br>可以這樣說：<b>${esc(model)}</b> ${sayBtn(model)}<br><span class="muted">先按 🔊 跟著念一次，再按麥克風～</span>`);
    }
  }
  function finish() {
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : 0;
    S.stats.speak.sum += avg; S.stats.speak.n++; addXP(20); bump("speak");
    fx("GREAT<br>JOB!", "pink"); sfx("level");
    $("#ctl").innerHTML = `<div class="mascot bob" style="display:inline-block">${mascot("wow", 90)}</div><div class="big">${avg} 分</div><p style="font-weight:700">完成「${esc(T.title)}」！+20 XP</p>
    <div class="row" style="justify-content:center"><button class="btn" id="re">再練一次</button><button class="btn primary" id="nx">下一個情境</button></div>`;
    $("#re").onclick = () => renderTalk(w.w);
    $("#nx").onclick = () => renderTalk(w.w >= 24 ? 1 : w.w + 1);
  }
  $("#mic").onclick = async () => {
    const m = $("#mic"); m.classList.add("rec"); speechSynthesis.cancel();
    try { const r = await listen(); answer(r.text, r.conf); } catch (e) { micErr(e); }
    m.classList.remove("rec");
  };
  const sendTyped = () => { const v = $("#typed").value.trim(); if (v && i < T.turns.length) { $("#typed").value = ""; answer(v, 0); } };
  $("#send").onclick = sendTyped; $("#typed").onkeydown = e => e.key === "Enter" && sendTyped();
  $("#again").onclick = () => i < T.turns.length && speak(T.turns[i][0]);
  $("#slow").onclick = () => i < T.turns.length && speak(T.turns[i][0], 0.65);
  $("#showA").onclick = () => i < T.turns.length && add("fb", `參考答案：${T.turns[i][1].map(a => `<div>• ${esc(cap(a))} ${sayBtn(a)}</div>`).join("")}`);
  ask();
}

// ---------- AI 自由對話（使用者自備 Claude API Key） ----------
function renderFree() {
  const w = W(Math.min(curWeek(), 24));
  view.innerHTML = `<button class="back" id="bk">‹ 口說</button>
  <div class="card pink"><h3>💬 AI 自由聊天</h3><div style="font-weight:700">本週話題：${esc(w.theme)}。說英文，AI 會回應並用中文修正你的句子。</div></div>
  ${S.settings.apiKey ? "" : `<div class="card yellow">還沒設定 API Key。請到「我的 › 設定」貼上你自己的 Anthropic API Key（只存在這台裝置）。</div>`}
  <div class="card"><div class="chat" id="chat"></div></div>
  <div class="card center"><button class="mic" id="mic">🎤</button>
  <div class="row" style="margin-top:12px"><input id="typed" placeholder="或打字…" style="flex:1;width:auto"><button class="btn small" id="send">送出</button></div></div>`;
  $("#bk").onclick = () => go("speak");
  const add = chatAdder($("#chat")), hist = [];
  const system = `You are Bubbo, a cheerful, encouraging English speaking buddy (like the Speak app) for a Taiwanese adult learner preparing for the TOEIC exam. Learner level: CEFR A2, aiming for TOEIC 750. Today's topic: "${w.theme}" (business/workplace English).
Rules:
- Keep your English reply short: 1-2 simple sentences, then ask ONE follow-up question to keep the conversation going.
- Use common TOEIC vocabulary, but simple grammar. Be warm and fun; never make the learner feel bad about mistakes.
- After your reply, add a line starting with "修正:" giving brief, friendly feedback in Traditional Chinese on the learner's last message: point out the most important mistake (if any) and give a more natural English version. If it was already good, praise it and offer one more natural alternative.
Format exactly:
<English reply>
修正: <Traditional Chinese feedback with improved English sentence>`;
  async function send(text) {
    add("me", esc(text)); hist.push({ role: "user", content: text });
    if (!S.settings.apiKey) { hist.pop(); return add("fb", "請先到「我的 › 設定」填入 API Key。"); }
    const wait = add("ai", "…");
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": S.settings.apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-haiku-5-5", max_tokens: 400, system, messages: hist })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ? j.error.message : r.status);
      const out = j.content.map(c => c.text || "").join("");
      hist.push({ role: "assistant", content: out });
      const [eng, ...fb] = out.split(/\n?修正[:：]/);
      wait.innerHTML = `${esc(eng.trim())}${sayBtn(eng.trim())}`;
      if (fb.length) add("fb", "✏️ " + esc(fb.join(" ").trim()));
      speak(eng.trim()); addXP(5); bump("speak");
    } catch (e) { wait.remove(); hist.pop(); add("fb", "連線失敗：" + esc(e.message)); }
  }
  $("#mic").onclick = async () => {
    const m = $("#mic"); m.classList.add("rec"); speechSynthesis.cancel();
    try { const r = await listen(); send(r.text); } catch (e) { micErr(e); }
    m.classList.remove("rec");
  };
  const st = () => { const v = $("#typed").value.trim(); if (v) { $("#typed").value = ""; send(v); } };
  $("#send").onclick = st; $("#typed").onkeydown = e => e.key === "Enter" && st();
  const hi = "Hi! I'm Bubbo, your English buddy. How was your day today?";
  add("ai", `${hi}${sayBtn(hi)}`);
  hist.push({ role: "user", content: "(The learner opened the conversation.)" }, { role: "assistant", content: hi });
}

// ---------- 單字 SRS ----------
function allUnlockedWords() { return unlockedWeeks().flatMap(w => w.words.map(s => ({ ...parseWord(s), w: w.w }))); }
function dueCards() { const t = today(); return allUnlockedWords().filter(x => S.srs[x.word] && S.srs[x.word].due <= t); }
function newCards() {
  const learnedToday = Object.values(S.srs).filter(c => c.first === today()).length;
  const left = Math.max(0, S.settings.newPerDay - learnedToday);
  return allUnlockedWords().filter(x => !S.srs[x.word]).slice(0, left);
}
function rateCard(word, q) { // q: 0 again, 1 hard, 2 good, 3 easy
  const c = S.srs[word] || { int: 0, ease: 2.5, reps: 0, first: today() };
  if (q === 0) { c.reps = 0; c.int = 0; c.ease = Math.max(1.3, c.ease - 0.2); }
  else {
    c.reps++;
    c.int = c.reps === 1 ? (q === 3 ? 3 : 1) : c.reps === 2 ? (q === 1 ? 3 : 6) : Math.round(c.int * (q === 1 ? 1.2 : q === 3 ? c.ease * 1.3 : c.ease));
    c.ease = Math.max(1.3, c.ease + (q === 1 ? -0.15 : q === 3 ? 0.15 : 0));
  }
  const d = new Date(); d.setDate(d.getDate() + c.int); c.due = dkey(d);
  S.srs[word] = c; save();
}
function renderVocab() {
  let queue = shuffle([...dueCards(), ...newCards()]), again = [];
  const total = allUnlockedWords().length;
  const head = () => `<div class="row between" style="margin-bottom:12px"><h2 style="margin:0">🃏 單字卡</h2><span class="tag y">剩 ${queue.length} 張</span></div>`;
  function show() {
    if (!queue.length && again.length) { queue = again; again = []; }
    if (!queue.length) {
      const learned = Object.keys(S.srs).length;
      view.innerHTML = head() + `<div class="card green center"><div class="mascot bob" style="display:inline-block">${mascot("wow", 100)}</div>
      <h3>今天的單字全部搞定！</h3><p style="font-weight:700">已學 ${learned}/${total} 個。記憶曲線會在 1、3、6、15…天後提醒你複習。</p>
      <div class="row" style="justify-content:center"><button class="btn" id="extra">再學 10 個新字</button><button class="btn primary" id="met">去玩單字隕石 ☄️</button></div></div>`;
      $("#extra").onclick = () => { S.settings.newPerDay += 10; save(); renderVocab(); };
      $("#met").onclick = () => go("meteor");
      return;
    }
    const c = queue[0];
    view.innerHTML = head() + `<div class="card yellow flash" id="fc"><span class="tag">WEEK ${c.w}</span><div class="word" style="margin:10px 0">${esc(c.word)}</div>
      <div id="back" style="display:none"><p><span class="tag p">${esc(c.pos)}</span> <b style="font-size:1.3rem">${esc(c.zh)}</b></p><p style="font-weight:700">${esc(c.ex)} <span class="say" id="sayex">🔊</span></p></div>
      <div style="font-weight:700" id="tapHint">👆 點卡片翻面</div></div>
      <div class="row" style="justify-content:center;margin-bottom:14px"><button class="btn small" id="sw">🔊 發音</button><button class="btn small" id="pr">🎤 唸唸看</button></div>
      <div class="rate" id="rate" style="display:none">
        <button class="btn pink" data-q="0">😵 忘了</button><button class="btn" data-q="1">😐 有點難</button><button class="btn green" data-q="2">🙂 記得</button><button class="btn blue" data-q="3">😎 太簡單</button>
      </div>`;
    speak(c.word);
    $("#fc").onclick = e => { if (e.target.id === "sayex") return; $("#back").style.display = ""; $("#tapHint").style.display = "none"; $("#rate").style.display = ""; };
    $("#sayex").onclick = () => speak(c.ex);
    $("#sw").onclick = () => speak(c.word);
    $("#pr").onclick = async () => {
      try { const r = await listen(); const ok = tokens(r.text).includes(tokens(c.word)[0]);
        if (ok) { fx(pick(PRAISE), "green"); sfx("ok"); } toast(ok ? `✅ 發音正確！（聽到：${r.text}）` : `聽到的是「${r.text}」，再試一次～`); }
      catch (e) { micErr(e); }
    };
    view.querySelectorAll("[data-q]").forEach(b => b.onclick = () => {
      const q = +b.dataset.q; rateCard(c.word, q); addXP(2); bump("vocab"); sfx(q ? "ok" : "tap");
      queue.shift(); if (q === 0) again.push(c); show();
    });
  }
  show();
}

// ---------- 聽力 Part 2 ----------
function renderListen(n) {
  const wk = n || curWeek();
  const qs = shuffle(poolP2(wk)).slice(0, 5);
  let i = 0, right = 0;
  function show() {
    if (i >= qs.length) return doneScreen("Part 2 練習完成", `${right}/${qs.length}`, "聽力靠多聽，每天一點點就會越來越順！", () => renderListen(wk));
    const [q, opts, ans] = qs[i]; const order = shuffle([0, 1, 2]); const L = "ABC";
    view.innerHTML = `<button class="back" id="bk">‹ 返回</button>
    <div class="card blue"><div class="row between"><h3 style="margin:0">🎧 Part 2 應答問題</h3><span class="chip">${i + 1}/${qs.length}</span></div>
    <p style="color:#fff;font-weight:700">跟正式考試一樣：題目和選項只播放、不顯示。聽完選出最適當的回應。</p>
    <div class="row"><button class="btn yellow" id="play">▶️ 播放</button><button class="btn" id="slow">🐢 慢速</button></div></div>
    <div class="card" id="opts">${order.map((o, k) => `<button class="btn opt" data-o="${o}">(${L[k]})</button>`).join("")}</div>
    <div id="after"></div>`;
    $("#bk").onclick = () => go("today");
    const play = async rate => { await speak(q, rate); for (let k = 0; k < 3; k++) { await new Promise(r => setTimeout(r, 500)); await speak(`${L[k]}. ${opts[order[k]]}`, rate); } };
    $("#play").onclick = () => play(); $("#slow").onclick = () => play(0.7);
    setTimeout(() => play(), 400);
    view.querySelectorAll("[data-o]").forEach(b => b.onclick = () => {
      speechSynthesis.cancel();
      const o = +b.dataset.o, ok = o === ans;
      S.stats.p2.t++; if (ok) { S.stats.p2.c++; right++; fx(pick(PRAISE), "blue"); sfx("ok"); } else sfx("no");
      addXP(ok ? 5 : 2); bump("listen");
      view.querySelectorAll("[data-o]").forEach((x, k) => { const oo = +x.dataset.o; x.disabled = true; x.innerHTML = `(${L[k]}) ${esc(opts[oo])}`; if (oo === ans) x.classList.add("right"); else if (oo === o) x.classList.add("wrong"); });
      $("#after").innerHTML = `<div class="card ${ok ? "green" : "lilac"}"><b>${ok ? "✅ 答對！" : "差一點！看看正確答案 👆"}</b><p>題目：${esc(q)} ${sayBtn(q)}</p>
      <p class="muted" style="color:var(--ink)">💡 抓開頭疑問詞（Who / When / Where / Why / How），避開「發音很像」或「重複題目單字」的陷阱選項。</p>
      <button class="btn primary block" id="nx">下一題</button></div>`;
      $("#nx").onclick = () => { i++; show(); };
    });
  }
  show();
}

// ---------- 文法 Part 5 ----------
function renderGrammar(n, fromWrong) {
  const wk = n || curWeek();
  let qs = fromWrong ? S.wrong.map(x => ({ q: W(x.w).p5[x.i], w: x.w, i: x.i })) : shuffle(poolP5(wk)).slice(0, W(wk) && W(wk).review ? 15 : 5);
  if (!qs.length) { toast("錯題本是空的，太強了！"); return go("games"); }
  qs = shuffle(qs);
  let i = 0, right = 0;
  function show() {
    if (i >= qs.length) return doneScreen(fromWrong ? "錯題本練習完成" : "Part 5 練習完成", `${right}/${qs.length}`, fromWrong ? "答對的題目已經從錯題本移除囉！" : "想更刺激？去遊戲大廳打文法魔王！", () => renderGrammar(wk, fromWrong));
    const { q, w, i: qi } = qs[i]; const [stem, opts, ans, ex] = q; const L = "ABCD";
    const t0 = Date.now();
    view.innerHTML = `<button class="back" id="bk">‹ 返回</button>
    <div class="card"><div class="row between"><h3 style="margin:0">✏️ Part 5 句子填空${fromWrong ? "（錯題本）" : ""}</h3><span class="tag g">${i + 1}/${qs.length}</span></div>
    <p style="font-size:1.12rem;font-weight:700">${esc(stem).replace("___", "<b>_______</b>")}</p>
    ${opts.map((o, k) => `<button class="btn opt" data-k="${k}">(${L[k]}) ${esc(o)}</button>`).join("")}
    <div id="after"></div></div>`;
    $("#bk").onclick = () => go("today");
    view.querySelectorAll("[data-k]").forEach(b => b.onclick = () => {
      const k = +b.dataset.k, ok = k === ans, sec = Math.round((Date.now() - t0) / 1000);
      S.stats.p5.t++; if (ok) { S.stats.p5.c++; right++; fx(pick(PRAISE), "green"); sfx("ok"); } else sfx("no");
      const idx = S.wrong.findIndex(x => x.w === w && x.i === qi);
      if (!ok && idx < 0) S.wrong.push({ w, i: qi });
      if (ok && fromWrong && idx >= 0) S.wrong.splice(idx, 1);
      addXP(ok ? 5 : 2); bump("grammar");
      view.querySelectorAll("[data-k]").forEach(x => { x.disabled = true; const kk = +x.dataset.k; if (kk === ans) x.classList.add("right"); else if (kk === k) x.classList.add("wrong"); });
      const full = stem.replace("___", opts[ans]);
      $("#after").innerHTML = `<div class="expl"><b>${ok ? "✅ 正確" : "正解是 (" + L[ans] + ")"}</b>・${sec} 秒${sec > 30 ? "（熟了之後目標 20 秒內）" : ""}<br>${esc(ex)}<br><span class="muted">${esc(full)}</span> ${sayBtn(full)}</div>
      <p></p><button class="btn primary block" id="nx">下一題</button>`;
      $("#nx").onclick = () => { i++; show(); };
    });
  }
  show();
}

// ---------- 跟讀 ----------
function renderShadow(n) {
  const wk = n || curWeek();
  const w = W(wk);
  const src = w && !w.review ? w.words : unlockedWeeks().flatMap(x => x.words);
  const sents = shuffle(src.map(s => parseWord(s).ex)).slice(0, 5);
  let i = 0, total = 0;
  function show() {
    if (i >= sents.length) return doneScreen("跟讀完成", `${Math.round(total / sents.length)} 分`, "說得越多，口說越自然！", () => renderShadow(wk));
    const s = sents[i];
    view.innerHTML = `<button class="back" id="bk">‹ 返回</button>
    <div class="card lilac"><div class="row between"><h3 style="margin:0">🔁 跟讀 Shadowing</h3><span class="chip">${i + 1}/${sents.length}</span></div>
    <p style="font-weight:700">先聽一次，再模仿語調和連音說出來。</p><p class="display" style="font-size:1.35rem" id="sent">${esc(s)}</p>
    <div class="row"><button class="btn" id="n">🔊 正常</button><button class="btn" id="sl">🐢 慢速</button></div></div>
    <div class="card center"><button class="mic" id="mic">🎤</button><div id="res" style="margin-top:12px"></div>
    <p></p><button class="btn small" id="skip">跳過這句 →</button></div>`;
    $("#bk").onclick = () => go("today");
    $("#n").onclick = () => speak(s); $("#sl").onclick = () => speak(s, 0.6);
    $("#skip").onclick = () => { i++; show(); };
    speak(s);
    $("#mic").onclick = async () => {
      const m = $("#mic"); m.classList.add("rec");
      try {
        const r = await listen();
        const p = Math.round(similarity(r.text, s) * 100);
        if (p >= 80) { fx(pick(PRAISE), "green"); sfx("ok"); }
        $("#sent").innerHTML = diffHTML(r.text, s);
        $("#res").innerHTML = `<div class="score">${p} 分</div><div class="muted">聽到：${esc(r.text)}</div>
        <p class="muted">波浪底線的字沒被聽到，多念幾次就會更清楚。</p>
        <div class="row" style="justify-content:center"><button class="btn small" id="retry">再試</button><button class="btn small primary" id="nx">下一句</button></div>`;
        $("#retry").onclick = () => { $("#sent").textContent = s; $("#res").innerHTML = ""; };
        $("#nx").onclick = () => { total += p; addXP(5); bump("shadow"); i++; show(); };
      } catch (e) { micErr(e); }
      m.classList.remove("rec");
    };
  }
  show();
}

// ---------- 迷你模擬考 ----------
function renderMock() {
  const p5 = shuffle(unlockedWeeks().flatMap(x => x.p5.map((q, i) => ({ q, w: x.w, i })))).slice(0, 20);
  const p2 = shuffle(unlockedWeeks().flatMap(x => x.p2)).slice(0, 10);
  const items = [...p2.map(q => ({ t: "p2", q })), ...p5.map(x => ({ t: "p5", ...x }))];
  let i = 0, cL = 0, cR = 0;
  function show() {
    if (i >= items.length) {
      const l = cL / Math.max(1, p2.length), r = cR / Math.max(1, p5.length);
      const est = x => Math.round((5 + x * 490) / 5) * 5; // 粗估各科 5–495
      const total = est(l) + est(r);
      S.stats.mocks.push({ d: today(), total, l: Math.round(l * 100), r: Math.round(r * 100) }); save(); addXP(40); checkStickers();
      return doneScreen("模擬考結果", `≈ ${total}`, `聽力 ${cL}/${p2.length}・閱讀 ${cR}/${p5.length}<br><span class="muted">依正確率換算的粗估分數（只含 Part 2、Part 5），用來看進步趨勢就好。建議搭配 ETS 官方模擬題本實測。</span>`, () => renderMock());
    }
    const it = items[i];
    if (it.t === "p2") {
      const [q, opts, ans] = it.q; const L = "ABC";
      view.innerHTML = `<div class="card blue"><div class="row between"><h3 style="margin:0">🎧 聽力 Part 2</h3><span class="chip">${i + 1}/${items.length}</span></div><p></p>
      <button class="btn yellow" id="play">▶️ 播放</button></div>
      <div class="card">${L.split("").map((c, k) => `<button class="btn opt" data-k="${k}">(${c})</button>`).join("")}</div>`;
      const play = async () => { await speak(q); for (let k = 0; k < 3; k++) { await new Promise(r => setTimeout(r, 400)); await speak(`${L[k]}. ${opts[k]}`); } };
      $("#play").onclick = play; setTimeout(play, 300);
      view.querySelectorAll("[data-k]").forEach(b => b.onclick = () => { speechSynthesis.cancel(); if (+b.dataset.k === ans) cL++; i++; show(); });
    } else {
      const [stem, opts, ans] = it.q; const L = "ABCD";
      view.innerHTML = `<div class="card"><div class="row between"><h3 style="margin:0">✏️ 閱讀 Part 5</h3><span class="tag g">${i + 1}/${items.length}</span></div>
      <p style="font-size:1.1rem;font-weight:700">${esc(stem).replace("___", "<b>_______</b>")}</p>
      ${opts.map((o, k) => `<button class="btn opt" data-k="${k}">(${L[k]}) ${esc(o)}</button>`).join("")}</div>`;
      view.querySelectorAll("[data-k]").forEach(b => b.onclick = () => {
        if (+b.dataset.k === ans) cR++; else if (!S.wrong.some(x => x.w === it.w && x.i === it.i)) S.wrong.push({ w: it.w, i: it.i });
        i++; show();
      });
    }
  }
  show();
}

// ---------- 我的 ----------
function renderMe() {
  const st = S.stats, lv = levelOf(S.xp);
  const pct = o => o.t ? Math.round((o.c / o.t) * 100) + "%" : "—";
  const days = Object.keys(S.log).filter(active).length;
  view.innerHTML = `
  <div class="card yellow"><div class="hero"><div class="mascot bob">${mascot("happy", 90, "#8ee6c4")}</div>
    <div><div class="display" style="font-size:1.5rem">${esc(S.profile.name)}</div><div style="font-weight:900">Lv.${lv}・${rankOf(lv)}</div><div class="muted" style="color:var(--ink)">⭐ ${S.xp} XP・學習 ${days} 天</div></div></div></div>
  <span class="sec-title">STICKER BOOK</span>
  <div class="card"><div class="stickers">${STICKERS.map(s => {
    const got = S.stickers[s.id];
    return `<div class="sticker ${got ? "" : "locked"}" title="${esc(s.d)}">${burst(got ? s.e : "?", s.c)}<div>${esc(s.n)}</div><div class="muted" style="font-weight:600">${esc(s.d)}</div></div>`;
  }).join("")}</div></div>
  <span class="sec-title">STATS</span>
  <div class="grid4">
    <div class="tile" style="background:var(--green)"><div class="k">已學單字</div><div class="v">${Object.keys(S.srs).length}</div></div>
    <div class="tile" style="background:var(--pink)"><div class="k">Part 5 正確率</div><div class="v">${pct(st.p5)}</div></div>
    <div class="tile" style="background:var(--blue);color:#fff"><div class="k">Part 2 正確率</div><div class="v">${pct(st.p2)}</div></div>
    <div class="tile" style="background:var(--lilac)"><div class="k">口說平均</div><div class="v">${st.speak.n ? Math.round(st.speak.sum / st.speak.n) : "—"}</div></div>
  </div><p></p>
  <div class="card"><h3>📈 模擬考紀錄</h3>${st.mocks.length ? st.mocks.slice(-8).map(m => `<div class="row between" style="border-bottom:2px dashed #d8cfe8;padding:4px 0"><span>${m.d}</span><b>≈ ${m.total}</b></div>`).join("") : `<p class="muted">還沒有紀錄，第 6 週來試試看！</p>`}
  <p></p><div class="row"><button class="btn green" id="mock">📝 做模擬考</button><button class="btn" id="wrong">📕 錯題本（${S.wrong.length}）</button></div></div>
  <div class="card"><h3>⚙️ 設定</h3>
    <label>語速：<span id="rv">${S.settings.rate}</span></label><input type="range" id="rate" min="0.5" max="1.2" step="0.05" value="${S.settings.rate}">
    <label>英文發音人（多益有美／英／澳／加口音，可以換換看）</label><select id="voice"><option value="">自動</option>
      ${voices.map(v => `<option value="${esc(v.voiceURI)}" ${v.voiceURI === S.settings.voice ? "selected" : ""}>${esc(v.name)} (${v.lang})</option>`).join("")}</select>
    <label>每日新單字數</label><input type="number" id="npd" min="5" max="40" value="${S.settings.newPerDay}">
    <label>開始日期</label><input type="date" id="start" value="${S.profile.start}">
    <label><input type="checkbox" id="snd" ${S.settings.sound ? "checked" : ""} style="width:auto;margin-right:6px">遊戲音效</label>
    <label>Anthropic API Key（AI 自由聊天用，選填，只存在本機）</label><input type="password" id="key" value="${esc(S.settings.apiKey)}" placeholder="sk-ant-...">
    <p class="muted">到 console.anthropic.com 申請。費用由你的帳號計費，用 Haiku 模型每次聊天約台幣幾毛錢。</p>
    <button class="btn primary" id="sv">儲存設定</button>
  </div>
  <div class="card"><h3>🔄 跨裝置同步</h3>
    <p class="muted" style="margin-top:0">進度存在各裝置的瀏覽器。換裝置時：在舊裝置按「複製進度碼」，到新裝置貼上並「匯入」。（進度碼不含 API Key）</p>
    <button class="btn yellow" id="exp">📋 複製進度碼</button>
    <textarea id="code" rows="3" placeholder="貼上進度碼…" style="margin-top:10px"></textarea>
    <p></p><div class="row"><button class="btn" id="imp">📥 匯入</button><button class="btn" id="reset" style="color:var(--bad)">重設全部</button></div>
  </div>`;
  $("#mock").onclick = () => go("mock");
  $("#wrong").onclick = () => renderGrammar(curWeek(), true);
  $("#rate").oninput = e => { $("#rv").textContent = e.target.value; };
  $("#sv").onclick = () => {
    Object.assign(S.settings, { rate: +$("#rate").value, voice: $("#voice").value, newPerDay: +$("#npd").value || 10, apiKey: $("#key").value.trim(), sound: $("#snd").checked });
    S.profile.start = $("#start").value || S.profile.start; save(); toast("已儲存 ✅"); speak("Settings saved."); renderChips();
  };
  $("#exp").onclick = async () => {
    const data = { ...S, settings: { ...S.settings, apiKey: "" } };
    const code = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
    $("#code").value = code;
    try { await navigator.clipboard.writeText(code); toast("已複製進度碼"); } catch (e) { $("#code").select(); toast("請手動複製下方文字"); }
  };
  $("#imp").onclick = () => {
    try {
      const d = JSON.parse(decodeURIComponent(escape(atob($("#code").value.trim())))); const key = S.settings.apiKey;
      localStorage.setItem(KEY, JSON.stringify(d)); S = load(); S.settings.apiKey = key; save(); toast("匯入成功"); go("today");
    } catch (e) { toast("進度碼格式錯誤"); }
  };
  $("#reset").onclick = () => { if (confirm("確定要清除這台裝置上的所有學習紀錄？")) { localStorage.removeItem(KEY); S = defaults(); go("today"); } };
}

// ---------- 啟動 ----------
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
renderChips();
go("today");
