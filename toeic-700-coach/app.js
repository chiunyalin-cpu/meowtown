// TOEIC 700 Coach — 純前端，資料存在瀏覽器 localStorage
const KEY = "toeic700";
const $ = (s, el = document) => el.querySelector(s);
const view = $("#view");

// ---------- 狀態 ----------
const defaults = () => ({
  profile: null,
  srs: {},           // word -> {due, int, ease, reps}
  log: {},           // YYYY-MM-DD -> {vocab, speak, listen, grammar, shadow}
  wrong: [],         // [{w, i}] Part 5 錯題
  stats: { p5: { c: 0, t: 0 }, p2: { c: 0, t: 0 }, speak: { sum: 0, n: 0 }, mocks: [] },
  settings: { rate: 0.9, voice: "", apiKey: "", newPerDay: 10 }
});
let S = load();
function load() {
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (d) return Object.assign(defaults(), d); } catch (e) {}
  return defaults();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

const today = () => new Date().toLocaleDateString("sv-SE");
const dayLog = () => (S.log[today()] ||= { vocab: 0, speak: 0, listen: 0, grammar: 0, shadow: 0 });
function bump(k, n = 1) { dayLog()[k] += n; save(); renderStreak(); }

function curWeek() {
  if (!S.profile) return 1;
  const days = Math.floor((new Date(today()) - new Date(S.profile.start)) / 864e5);
  return Math.max(1, Math.min(26, Math.floor(days / 7) + 1));
}
function daysLeft() {
  if (!S.profile) return 182;
  const end = new Date(S.profile.start); end.setDate(end.getDate() + 182);
  return Math.max(0, Math.ceil((end - new Date(today())) / 864e5));
}
function streak() {
  let n = 0; const d = new Date();
  const active = k => { const l = S.log[k]; return l && Object.values(l).some(v => v > 0); };
  if (!active(d.toLocaleDateString("sv-SE"))) d.setDate(d.getDate() - 1);
  while (active(d.toLocaleDateString("sv-SE"))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function renderStreak() { $("#streak").textContent = "🔥 " + streak() + " 天"; }

function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("show"); clearTimeout(toast.h); toast.h = setTimeout(() => el.classList.remove("show"), 2200); }
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const W = n => WEEKS.find(x => x.w === n);

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
const scoreClass = p => p >= 80 ? "good" : p >= 55 ? "mid" : "low";
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
function unlockedWeeks() { return WEEKS.filter(w => w.w <= Math.min(curWeek(), 24) && !w.review); }
function poolP5(wk) {
  const w = W(wk);
  if (w && !w.review) return w.p5.map((q, i) => ({ q, w: w.w, i }));
  return WEEKS.filter(x => !x.review).flatMap(x => x.p5.map((q, i) => ({ q, w: x.w, i })));
}
function poolP2(wk) {
  const w = W(wk);
  if (w && !w.review) return w.p2.map(q => q);
  return WEEKS.filter(x => !x.review).flatMap(x => x.p2);
}
const parseWord = s => { const [word, pos, zh, ex] = s.split("|"); return { word, pos, zh, ex }; };

// ---------- 路由 ----------
let tab = "today";
document.querySelectorAll("#tabbar button").forEach(b => b.onclick = () => go(b.dataset.tab));
function go(t, arg) {
  tab = t; speechSynthesis && speechSynthesis.cancel();
  document.querySelectorAll("#tabbar button").forEach(b => b.classList.toggle("on", b.dataset.tab === t));
  window.scrollTo(0, 0);
  (ROUTES[t] || ROUTES.today)(arg);
}
const ROUTES = {
  today: renderToday, course: renderCourse, week: renderWeek, speak: renderSpeak, talk: renderTalk, free: renderFree,
  vocab: renderVocab, listen: renderListen, grammar: renderGrammar, shadow: renderShadow, mock: renderMock, me: renderMe
};

// ---------- 首次設定 ----------
function renderOnboard() {
  view.innerHTML = `
  <div class="card">
    <h2>👋 歡迎！26 週從 400 衝到 700</h2>
    <p class="muted">每天 45–60 分鐘：單字、AI 口說、聽力、文法、跟讀。進度存在這台裝置的瀏覽器，可在「我的」頁匯出到其他裝置。</p>
    <label>怎麼稱呼你？</label><input id="ob-name" placeholder="例如 Kayla">
    <label>開始日期（第 1 週從這天算起）</label><input id="ob-start" type="date" value="${today()}">
    <label>目前程度</label>
    <select id="ob-level"><option value="400">約 400 分</option><option value="300">300 以下</option><option value="500">約 500 分</option></select>
    <p></p><button class="btn primary block" id="ob-go">開始學習</button>
  </div>`;
  $("#ob-go").onclick = () => {
    S.profile = { name: $("#ob-name").value.trim() || "同學", start: $("#ob-start").value || today(), level: +$("#ob-level").value };
    save(); go("today");
  };
}

// ---------- 今日 ----------
function renderToday() {
  if (!S.profile) return renderOnboard();
  const wk = curWeek(), w = W(wk), ph = PHASES.find(p => p.id === w.phase);
  const log = dayLog();
  const goal = { vocab: 10, speak: 1, listen: 3, grammar: 5, shadow: 5 };
  const done = DAILY_PLAN.filter(t => log[t.key] >= goal[t.key]).length;
  const pct = Math.round(((wk - 1) / 26) * 100);
  const due = dueCards().length;
  view.innerHTML = `
  <div class="card">
    <div class="row between"><div><div class="muted">嗨 ${esc(S.profile.name)}，今天是</div><div class="big">第 ${wk} 週</div></div>
    <div style="text-align:right"><span class="pill">${ph.name}・目標 ${ph.target} 分</span><div class="muted" style="margin-top:6px">距離 26 週結束還有 ${daysLeft()} 天</div></div></div>
    <p style="margin:10px 0 6px"><b>本週主題：</b>${esc(w.theme)}　<b>文法：</b>${esc(w.grammar)}</p>
    <div class="bar"><i style="width:${pct}%"></i></div><div class="muted" style="margin-top:4px">課程進度 ${pct}%</div>
  </div>
  <div class="card">
    <div class="row between"><h3>今日任務</h3><span class="muted">${done}/${DAILY_PLAN.length} 完成</span></div>
    ${DAILY_PLAN.map(t => {
      const ok = log[t.key] >= goal[t.key];
      const extra = t.key === "vocab" ? `（待複習 ${due}）` : "";
      return `<div class="task ${ok ? "done" : ""}" data-go="${t.key}"><div class="ic">${t.icon}</div>
      <div class="t"><b>${t.name}</b> <span class="muted">${t.min} 分鐘${extra}</span><div class="muted">${t.desc}・今日 ${log[t.key]}/${goal[t.key]}</div></div>
      <div class="chk">${ok ? "✅" : "›"}</div></div>`;
    }).join("")}
  </div>
  <div class="card"><h3>💡 本週重點</h3><p style="margin:0">${esc(w.tip)}</p></div>
  ${[6, 12, 18, 24, 26].includes(wk) ? `<div class="card"><h3>📝 本週是檢核週</h3><p class="muted">建議做一次迷你模擬考，看看是否達到階段目標。</p><button class="btn primary" data-go="mock">開始模擬考</button></div>` : ""}`;
  view.querySelectorAll("[data-go]").forEach(el => el.onclick = () => {
    const k = el.dataset.go;
    if (k === "speak") go("talk", wk <= 24 ? wk : 1 + Math.floor(Math.random() * 24)); else go(k, wk);
  });
}

// ---------- 課程地圖 ----------
function renderCourse() {
  const wk = curWeek();
  view.innerHTML = `<h2>🗺️ 26 週課程地圖</h2>` + PHASES.map(p => `
  <div class="card"><div class="row between"><h3>${p.name}（第 ${p.weeks} 週）</h3><span class="pill">目標 ${p.target}</span></div>
  <p class="muted" style="margin-top:0">${p.desc}</p>
  ${WEEKS.filter(w => w.phase === p.id).map(w => `
    <div class="week ${w.w === wk ? "cur" : w.w < wk ? "past" : ""}" data-w="${w.w}"><div class="n">${w.w}</div>
    <div><b>${esc(w.theme)}</b><div class="muted">${esc(w.grammar)}</div></div></div>`).join("")}
  </div>`).join("");
  view.querySelectorAll("[data-w]").forEach(el => el.onclick = () => go("week", +el.dataset.w));
}

function renderWeek(n) {
  const w = W(n);
  view.innerHTML = `<button class="back" id="bk">‹ 課程地圖</button>
  <div class="card"><span class="pill">第 ${w.w} 週</span><h2 style="margin-top:8px">${esc(w.theme)}</h2>
  <p><b>文法：</b>${esc(w.grammar)}</p><div class="expl">${esc(w.tip)}</div></div>
  <div class="grid2">
    <button class="btn" data-a="grammar">✏️ Part 5 文法</button>
    <button class="btn" data-a="listen">🎧 Part 2 聽力</button>
    ${w.talk ? `<button class="btn" data-a="talk">🎙️ 口說：${esc(w.talk.title)}</button>` : `<button class="btn" data-a="mock">📝 模擬考</button>`}
    <button class="btn" data-a="shadow">🔁 跟讀練習</button>
  </div><p></p>
  ${w.words.length ? `<div class="card"><h3>本週單字（${w.words.length}）</h3>
  ${w.words.map(parseWord).map(x => `<div style="padding:8px 0;border-bottom:1px solid var(--line)">
    <b>${esc(x.word)}</b> <span class="muted">${esc(x.pos)}</span> ${esc(x.zh)}
    <span class="say" onclick='say(${JSON.stringify(x.word)})'>🔊</span>
    <div class="muted">${esc(x.ex)} <span class="say" onclick='say(${JSON.stringify(x.ex)})'>🔊</span></div></div>`).join("")}</div>` : ""}`;
  $("#bk").onclick = () => go("course");
  view.querySelectorAll("[data-a]").forEach(b => b.onclick = () => go(b.dataset.a, n));
}

// ---------- 口說（Speak 風格角色扮演） ----------
function renderSpeak() {
  const wk = curWeek();
  const list = WEEKS.filter(w => w.talk);
  view.innerHTML = `<h2>🎙️ AI 口說教練</h2>
  ${SR ? "" : `<div class="card" style="border-color:var(--warn)">⚠️ 這個瀏覽器不支援語音辨識，可改用打字回答。建議用 <b>Chrome</b>（電腦／Android）或 <b>Safari</b>（iPhone／iPad）。</div>`}
  <div class="card"><h3>💬 AI 自由對話</h3><p class="muted" style="margin-top:0">像 Speak 一樣跟 AI 家教自由聊天，AI 會用中文幫你修正句子。需要在「我的 › 設定」填入自己的 Anthropic API Key。</p>
  <button class="btn primary" id="free">開始自由對話</button></div>
  <div class="card"><h3>🎭 情境角色扮演</h3><p class="muted" style="margin-top:0">AI 說一句，你對著麥克風回答；系統即時比對、給分並示範更好的說法。</p>
  ${list.map(w => `<div class="week ${w.w === wk ? "cur" : w.w < wk ? "past" : ""}" data-w="${w.w}"><div class="n">${w.w}</div>
  <div><b>${esc(w.talk.title)}</b><div class="muted">${esc(w.talk.role)}</div></div></div>`).join("")}</div>`;
  $("#free").onclick = () => go("free");
  view.querySelectorAll("[data-w]").forEach(el => el.onclick = () => go("talk", +el.dataset.w));
}

function renderTalk(n) {
  const w = W(n) && W(n).talk ? W(n) : W(1);
  const T = w.talk; let i = 0, scores = [];
  view.innerHTML = `<button class="back" id="bk">‹ 口說列表</button>
  <div class="card"><span class="pill">第 ${w.w} 週・${esc(w.theme)}</span><h3 style="margin-top:8px">${esc(T.title)}</h3><div class="muted">情境：${esc(T.role)}</div></div>
  <div class="card"><div class="chat" id="chat"></div></div>
  <div class="card" style="text-align:center" id="ctl">
    <div class="muted" id="hint"></div><p></p>
    <button class="mic" id="mic">🎤</button>
    <div class="row" style="margin-top:12px;justify-content:center">
      <button class="btn small" id="again">🔊 再聽一次</button>
      <button class="btn small" id="slow">🐢 慢速</button>
      <button class="btn small" id="showA">💡 看參考答案</button>
    </div>
    <div class="row" style="margin-top:10px"><input id="typed" placeholder="或直接打字回答…"><button class="btn small" id="send">送出</button></div>
  </div>`;
  $("#bk").onclick = () => go("speak");
  const chat = $("#chat");
  const add = (cls, html) => { const d = document.createElement("div"); d.className = "msg " + cls; d.innerHTML = html; chat.appendChild(d); d.scrollIntoView({ behavior: "smooth", block: "nearest" }); return d; };
  function ask() {
    if (i >= T.turns.length) return finish();
    const [line, , zh] = T.turns[i];
    add("ai", `${esc(line)}<span class="say" onclick='say(${JSON.stringify(line)})'>🔊</span>`);
    $("#hint").textContent = "提示：" + zh;
    speak(line);
  }
  function answer(text, conf) {
    const [, ans] = T.turns[i];
    add("me", esc(text));
    const b = best(text, ans), pct = Math.round(b.s * 100);
    const model = cap(b.t);
    const pron = conf ? `・辨識清晰度 ${Math.round(conf * 100)}%` : "";
    if (pct >= 55) {
      scores.push(pct);
      add("fb", `<span class="score ${scoreClass(pct)}">${pct >= 80 ? "👍 很棒！" : "👌 可以通！"} ${pct} 分</span><span class="muted">${pron}</span><br>
      參考說法：${diffHTML(text, model)} <span class="say" onclick='say(${JSON.stringify(model)})'>🔊</span>`);
      i++; setTimeout(ask, 900);
    } else {
      add("fb", `<span class="score low">🤔 再試一次（${pct} 分）</span><br>可以這樣說：<b>${esc(model)}</b> <span class="say" onclick='say(${JSON.stringify(model)})'>🔊</span><br><span class="muted">先按 🔊 跟著念，再按麥克風說一次。</span>`);
    }
  }
  function finish() {
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : 0;
    S.stats.speak.sum += avg; S.stats.speak.n++; bump("speak");
    $("#ctl").innerHTML = `<div class="big">🎉 ${avg} 分</div><p>完成「${esc(T.title)}」！</p>
    <div class="row" style="justify-content:center"><button class="btn" id="re">再練一次</button><button class="btn primary" id="nx">下一個情境</button></div>`;
    $("#re").onclick = () => renderTalk(w.w);
    $("#nx").onclick = () => renderTalk(w.w >= 24 ? 1 : w.w + 1);
  }
  $("#mic").onclick = async () => {
    const m = $("#mic"); m.classList.add("rec"); speechSynthesis.cancel();
    try { const r = await listen(); answer(r.text, r.conf); }
    catch (e) { toast(e.message === "nosr" ? "此瀏覽器不支援語音辨識，請打字" : e.message === "not-allowed" ? "請允許麥克風權限" : "沒聽到聲音，再試一次"); }
    m.classList.remove("rec");
  };
  const sendTyped = () => { const v = $("#typed").value.trim(); if (v) { $("#typed").value = ""; answer(v, 0); } };
  $("#send").onclick = sendTyped; $("#typed").onkeydown = e => e.key === "Enter" && sendTyped();
  $("#again").onclick = () => i < T.turns.length && speak(T.turns[i][0]);
  $("#slow").onclick = () => i < T.turns.length && speak(T.turns[i][0], 0.65);
  $("#showA").onclick = () => i < T.turns.length && add("fb", `參考答案：${T.turns[i][1].map(a => `<div>• ${esc(cap(a))} <span class="say" onclick='say(${JSON.stringify(a)})'>🔊</span></div>`).join("")}`);
  ask();
}

// ---------- AI 自由對話（使用者自備 Claude API Key） ----------
function renderFree() {
  const w = W(Math.min(curWeek(), 24));
  view.innerHTML = `<button class="back" id="bk">‹ 口說</button>
  <div class="card"><h3>💬 AI 自由對話</h3><div class="muted">話題：${esc(w.theme)}。說英文，AI 會回應並用中文修正你的句子。</div></div>
  ${S.settings.apiKey ? "" : `<div class="card" style="border-color:var(--warn)">尚未設定 API Key。請到「我的 › 設定」貼上你自己的 Anthropic API Key（只存在這台裝置）。</div>`}
  <div class="card"><div class="chat" id="chat"></div></div>
  <div class="card" style="text-align:center"><button class="mic" id="mic">🎤</button>
  <div class="row" style="margin-top:10px"><input id="typed" placeholder="或打字…"><button class="btn small" id="send">送出</button></div></div>`;
  $("#bk").onclick = () => go("speak");
  const chat = $("#chat"), hist = [];
  const add = (cls, html) => { const d = document.createElement("div"); d.className = "msg " + cls; d.innerHTML = html; chat.appendChild(d); d.scrollIntoView({ behavior: "smooth", block: "nearest" }); return d; };
  const system = `You are a friendly English speaking tutor (like the Speak app) for a Taiwanese adult learner preparing for the TOEIC exam. Current level: about TOEIC 400-500 (CEFR A2). Goal: TOEIC 700. Today's topic: "${w.theme}" (business/workplace English).
Rules:
- Keep your English reply short: 1-2 simple sentences, then ask ONE follow-up question to keep the conversation going.
- Use common TOEIC vocabulary, but simple grammar.
- After your reply, add a line starting with "修正:" giving brief feedback in Traditional Chinese on the learner's last message: point out the most important mistake (if any) and give a more natural English version. If it was already good, praise it briefly and offer one more natural alternative.
Format exactly:
<English reply>
修正: <Traditional Chinese feedback with improved English sentence>`;
  async function send(text) {
    add("me", esc(text)); hist.push({ role: "user", content: text });
    if (!S.settings.apiKey) return add("fb", "請先設定 API Key。");
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
      wait.innerHTML = `${esc(eng.trim())}<span class="say" onclick='say(${JSON.stringify(eng.trim())})'>🔊</span>`;
      if (fb.length) add("fb", "✏️ " + esc(fb.join(" ").trim()));
      speak(eng.trim()); bump("speak");
    } catch (e) { wait.remove(); hist.pop(); add("fb", "連線失敗：" + esc(e.message)); }
  }
  $("#mic").onclick = async () => {
    const m = $("#mic"); m.classList.add("rec"); speechSynthesis.cancel();
    try { const r = await listen(); send(r.text); } catch (e) { toast(e.message === "nosr" ? "此瀏覽器不支援語音辨識，請打字" : "沒聽到聲音，再試一次"); }
    m.classList.remove("rec");
  };
  const st = () => { const v = $("#typed").value.trim(); if (v) { $("#typed").value = ""; send(v); } };
  $("#send").onclick = st; $("#typed").onkeydown = e => e.key === "Enter" && st();
  add("ai", `Hi! I'm your English tutor. How was your day today?<span class="say" onclick="say('How was your day today?')">🔊</span>`);
  hist.push({ role: "user", content: "(The learner opened the conversation.)" }, { role: "assistant", content: "Hi! I'm your English tutor. How was your day today?" });
}

// ---------- 單字 SRS ----------
function allUnlockedWords() { return unlockedWeeks().flatMap(w => w.words.map(s => ({ ...parseWord(s), w: w.w }))); }
function dueCards() {
  const t = today();
  return allUnlockedWords().filter(x => S.srs[x.word] && S.srs[x.word].due <= t);
}
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
  const d = new Date(); d.setDate(d.getDate() + c.int); c.due = d.toLocaleDateString("sv-SE");
  S.srs[word] = c; save();
}
function renderVocab() {
  let queue = shuffle([...dueCards(), ...newCards()]);
  const total = allUnlockedWords().length, learned = Object.keys(S.srs).length;
  const mature = Object.values(S.srs).filter(c => c.int >= 21).length;
  let flipped = false, again = [];
  function head() {
    return `<h2>🃏 單字卡</h2><div class="card"><div class="row between"><span>已學 ${learned}/${total}・熟記 ${mature}</span><span class="pill">剩 ${queue.length} 張</span></div></div>`;
  }
  function show() {
    if (!queue.length && again.length) { queue = again; again = []; }
    if (!queue.length) {
      view.innerHTML = head() + `<div class="card" style="text-align:center"><div class="big">🎉</div><p>今天的單字都完成了！明天再來複習。</p>
      <p class="muted">每週會解鎖新單字；學過的字會依記憶曲線在 1、3、6、15…天後再出現。</p>
      <button class="btn" id="extra">加學 10 個新字</button></div>`;
      $("#extra").onclick = () => { S.settings.newPerDay += 10; save(); renderVocab(); };
      return;
    }
    const c = queue[0]; flipped = false;
    view.innerHTML = head() + `<div class="card flash" id="fc"><div class="muted">第 ${c.w} 週</div><div class="word">${esc(c.word)}</div>
      <div id="back" style="display:none"><p><span class="pill">${esc(c.pos)}</span> <b style="font-size:1.2rem">${esc(c.zh)}</b></p><p>${esc(c.ex)} <span class="say" id="sayex">🔊</span></p></div>
      <div class="muted" id="tapHint">點卡片看中文</div></div>
      <div class="row" style="justify-content:center;margin-bottom:12px"><button class="btn small" id="sw">🔊 發音</button><button class="btn small" id="pr">🎤 唸唸看</button></div>
      <div class="rate" id="rate" style="display:none">
        <button class="btn" data-q="0">😵 忘了</button><button class="btn" data-q="1">😐 困難</button><button class="btn" data-q="2">🙂 記得</button><button class="btn primary" data-q="3">😎 簡單</button>
      </div>`;
    speak(c.word);
    $("#fc").onclick = e => { if (e.target.id === "sayex") return; flipped = true; $("#back").style.display = ""; $("#tapHint").style.display = "none"; $("#rate").style.display = ""; };
    $("#sayex").onclick = () => speak(c.ex);
    $("#sw").onclick = () => speak(c.word);
    $("#pr").onclick = async () => {
      try { const r = await listen(); const ok = similarity(r.text, c.word) >= 0.99 || tokens(r.text).includes(tokens(c.word)[0]);
        toast(ok ? `✅ 發音正確！（聽到：${r.text}）` : `❌ 聽到的是「${r.text}」，再試一次`); }
      catch (e) { toast("無法辨識，請確認麥克風權限"); }
    };
    view.querySelectorAll("[data-q]").forEach(b => b.onclick = () => {
      const q = +b.dataset.q; rateCard(c.word, q); bump("vocab");
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
    if (i >= qs.length) {
      view.innerHTML = `<div class="card" style="text-align:center"><div class="big">${right}/${qs.length}</div><p>Part 2 練習完成</p>
      <button class="btn" id="re">再一組</button> <button class="btn primary" id="hm">回今日</button></div>`;
      $("#re").onclick = () => renderListen(wk); $("#hm").onclick = () => go("today"); return;
    }
    const [q, opts, ans] = qs[i]; const order = shuffle([0, 1, 2]); const L = "ABC";
    view.innerHTML = `<button class="back" id="bk">‹ 返回</button>
    <div class="card"><div class="row between"><h3>🎧 Part 2 應答問題</h3><span class="pill">${i + 1}/${qs.length}</span></div>
    <p class="muted">就像正式考試：題目和選項都只播放、不顯示。聽完選出最適當的回應。</p>
    <div class="row"><button class="btn primary" id="play">▶️ 播放題目</button><button class="btn" id="slow">🐢 慢速</button></div></div>
    <div class="card" id="opts">${order.map((o, k) => `<button class="btn opt" data-o="${o}">(${L[k]})</button>`).join("")}</div>
    <div id="after"></div>`;
    $("#bk").onclick = () => go("today");
    const play = async rate => { await speak(q, rate); for (let k = 0; k < 3; k++) { await new Promise(r => setTimeout(r, 500)); await speak(`${L[k]}. ${opts[order[k]]}`, rate); } };
    $("#play").onclick = () => play(); $("#slow").onclick = () => play(0.7);
    setTimeout(() => play(), 400);
    view.querySelectorAll("[data-o]").forEach(b => b.onclick = () => {
      speechSynthesis.cancel();
      const o = +b.dataset.o, ok = o === ans;
      if (ok) right++; S.stats.p2.t++; if (ok) S.stats.p2.c++; bump("listen");
      view.querySelectorAll("[data-o]").forEach((x, k) => { const oo = +x.dataset.o; x.disabled = true; x.innerHTML = `(${L[k]}) ${esc(opts[oo])}`; if (oo === ans) x.classList.add("right"); else if (oo === o) x.classList.add("wrong"); });
      $("#after").innerHTML = `<div class="card"><b>${ok ? "✅ 答對！" : "❌ 答錯了"}</b><p>題目：${esc(q)} <span class="say" onclick='say(${JSON.stringify(q)})'>🔊</span></p>
      <p class="muted">Part 2 技巧：先抓開頭疑問詞（Who/When/Where/Why/How），避開「發音相似」或「重複題目單字」的陷阱選項。</p>
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
  if (!qs.length) { toast("沒有錯題，太棒了！"); return go("me"); }
  qs = shuffle(qs);
  let i = 0, right = 0;
  function show() {
    if (i >= qs.length) {
      view.innerHTML = `<div class="card" style="text-align:center"><div class="big">${right}/${qs.length}</div><p>Part 5 練習完成</p>
      <button class="btn" id="re">再一組</button> <button class="btn primary" id="hm">回今日</button></div>`;
      $("#re").onclick = () => renderGrammar(wk, fromWrong); $("#hm").onclick = () => go("today"); return;
    }
    const { q, w, i: qi } = qs[i]; const [stem, opts, ans, ex] = q; const L = "ABCD";
    const t0 = Date.now();
    view.innerHTML = `<button class="back" id="bk">‹ 返回</button>
    <div class="card"><div class="row between"><h3>✏️ Part 5 句子填空${fromWrong ? "（錯題本）" : ""}</h3><span class="pill">${i + 1}/${qs.length}</span></div>
    <p style="font-size:1.1rem">${esc(stem).replace("___", "<b>_______</b>")}</p>
    ${opts.map((o, k) => `<button class="btn opt" data-k="${k}">(${L[k]}) ${esc(o)}</button>`).join("")}
    <div id="after"></div></div>`;
    $("#bk").onclick = () => go("today");
    view.querySelectorAll("[data-k]").forEach(b => b.onclick = () => {
      const k = +b.dataset.k, ok = k === ans, sec = Math.round((Date.now() - t0) / 1000);
      S.stats.p5.t++; if (ok) { S.stats.p5.c++; right++; }
      const idx = S.wrong.findIndex(x => x.w === w && x.i === qi);
      if (!ok && idx < 0) S.wrong.push({ w, i: qi });
      if (ok && fromWrong && idx >= 0) S.wrong.splice(idx, 1);
      bump("grammar");
      view.querySelectorAll("[data-k]").forEach(x => { x.disabled = true; const kk = +x.dataset.k; if (kk === ans) x.classList.add("right"); else if (kk === k) x.classList.add("wrong"); });
      const full = stem.replace("___", opts[ans]);
      $("#after").innerHTML = `<div class="expl"><b>${ok ? "✅ 正確" : "❌ 正解是 (" + L[ans] + ")"}</b>・用時 ${sec} 秒${sec > 30 ? "（正式考試每題約 20–30 秒）" : ""}<br>${esc(ex)}<br><span class="muted">${esc(full)}</span> <span class="say" onclick='say(${JSON.stringify(full)})'>🔊</span></div>
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
    if (i >= sents.length) {
      view.innerHTML = `<div class="card" style="text-align:center"><div class="big">${Math.round(total / sents.length)} 分</div><p>跟讀完成</p>
      <button class="btn" id="re">再一組</button> <button class="btn primary" id="hm">回今日</button></div>`;
      $("#re").onclick = () => renderShadow(wk); $("#hm").onclick = () => go("today"); return;
    }
    const s = sents[i]; let tries = 0;
    view.innerHTML = `<button class="back" id="bk">‹ 返回</button>
    <div class="card"><div class="row between"><h3>🔁 跟讀 Shadowing</h3><span class="pill">${i + 1}/${sents.length}</span></div>
    <p class="muted">先聽、再模仿語調和連音說一次。</p><p style="font-size:1.3rem;font-weight:700" id="sent">${esc(s)}</p>
    <div class="row"><button class="btn" id="n">🔊 正常</button><button class="btn" id="sl">🐢 慢速</button></div></div>
    <div class="card" style="text-align:center"><button class="mic" id="mic">🎤</button><div id="res" style="margin-top:12px"></div></div>`;
    $("#bk").onclick = () => go("today");
    $("#n").onclick = () => speak(s); $("#sl").onclick = () => speak(s, 0.6);
    speak(s);
    $("#mic").onclick = async () => {
      const m = $("#mic"); m.classList.add("rec");
      try {
        const r = await listen(); tries++;
        const p = Math.round(similarity(r.text, s) * 100);
        $("#sent").innerHTML = diffHTML(r.text, s);
        $("#res").innerHTML = `<div class="score ${scoreClass(p)}">${p} 分</div><div class="muted">聽到：${esc(r.text)}</div>
        <p class="muted">灰色虛線的字代表沒被辨識到，多念幾次。</p>
        <div class="row" style="justify-content:center"><button class="btn small" id="retry">再試</button><button class="btn small primary" id="nx">下一句</button></div>`;
        $("#retry").onclick = () => { $("#sent").textContent = s; $("#res").innerHTML = ""; };
        $("#nx").onclick = () => { total += p; bump("shadow"); i++; show(); };
      } catch (e) { toast(e.message === "nosr" ? "此瀏覽器不支援語音辨識" : "沒聽到聲音，再試一次"); }
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
      S.stats.mocks.push({ d: today(), total, l: Math.round(l * 100), r: Math.round(r * 100) }); save();
      view.innerHTML = `<div class="card" style="text-align:center"><h2>📝 模擬考結果</h2><div class="big">≈ ${total} 分</div>
      <p>聽力 ${cL}/${p2.length}・閱讀 ${cR}/${p5.length}</p>
      <p class="muted">這是依正確率換算的「粗估」分數，題型只含 Part 2 與 Part 5，僅供追蹤進步趨勢。建議每 6 週搭配官方模擬試題（如 ETS 官方題本）實測一次。</p>
      <button class="btn primary" id="hm">回今日</button></div>`;
      $("#hm").onclick = () => go("today"); return;
    }
    const it = items[i];
    if (it.t === "p2") {
      const [q, opts, ans] = it.q; const L = "ABC";
      view.innerHTML = `<div class="card"><div class="row between"><h3>🎧 聽力 Part 2</h3><span class="pill">${i + 1}/${items.length}</span></div>
      <button class="btn primary" id="play">▶️ 播放</button></div>
      <div class="card">${L.split("").map((c, k) => `<button class="btn opt" data-k="${k}">(${c})</button>`).join("")}</div>`;
      const play = async () => { await speak(q); for (let k = 0; k < 3; k++) { await new Promise(r => setTimeout(r, 400)); await speak(`${L[k]}. ${opts[k]}`); } };
      $("#play").onclick = play; setTimeout(play, 300);
      view.querySelectorAll("[data-k]").forEach(b => b.onclick = () => { speechSynthesis.cancel(); if (+b.dataset.k === ans) cL++; i++; show(); });
    } else {
      const [stem, opts, ans] = it.q; const L = "ABCD";
      view.innerHTML = `<div class="card"><div class="row between"><h3>✏️ 閱讀 Part 5</h3><span class="pill">${i + 1}/${items.length}</span></div>
      <p style="font-size:1.1rem">${esc(stem).replace("___", "<b>_______</b>")}</p>
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
  if (!S.profile) return renderOnboard();
  const st = S.stats;
  const pct = o => o.t ? Math.round((o.c / o.t) * 100) + "%" : "—";
  const days = Object.keys(S.log).filter(k => Object.values(S.log[k]).some(v => v)).length;
  view.innerHTML = `<h2>👤 我的學習</h2>
  <div class="card grid2">
    <div><div class="muted">學習天數</div><div class="big">${days}</div></div>
    <div><div class="muted">已學單字</div><div class="big">${Object.keys(S.srs).length}</div></div>
    <div><div class="muted">Part 5 正確率</div><div class="big">${pct(st.p5)}</div></div>
    <div><div class="muted">Part 2 正確率</div><div class="big">${pct(st.p2)}</div></div>
    <div><div class="muted">口說平均</div><div class="big">${st.speak.n ? Math.round(st.speak.sum / st.speak.n) : "—"}</div></div>
    <div><div class="muted">錯題本</div><div class="big">${S.wrong.length}</div></div>
  </div>
  <div class="card"><h3>📈 模擬考紀錄</h3>${st.mocks.length ? st.mocks.slice(-8).map(m => `<div class="row between"><span>${m.d}</span><b>≈ ${m.total}</b></div>`).join("") : `<p class="muted">尚無紀錄</p>`}
  <p></p><div class="row"><button class="btn" id="mock">📝 做模擬考</button><button class="btn" id="wrong">📕 練錯題本</button></div></div>
  <div class="card"><h3>⚙️ 設定</h3>
    <label>語速：<span id="rv">${S.settings.rate}</span></label><input type="range" id="rate" min="0.5" max="1.2" step="0.05" value="${S.settings.rate}">
    <label>英文發音人（TOEIC 有美／英／澳／加口音，建議偶爾換換）</label><select id="voice"><option value="">自動</option>
      ${voices.map(v => `<option value="${esc(v.voiceURI)}" ${v.voiceURI === S.settings.voice ? "selected" : ""}>${esc(v.name)} (${v.lang})</option>`).join("")}</select>
    <label>每日新單字數</label><input type="number" id="npd" min="5" max="40" value="${S.settings.newPerDay}">
    <label>開始日期</label><input type="date" id="start" value="${S.profile.start}">
    <label>Anthropic API Key（AI 自由對話用，選填，只存在本機）</label><input type="password" id="key" value="${esc(S.settings.apiKey)}" placeholder="sk-ant-...">
    <p class="muted">到 console.anthropic.com 申請。費用由你的帳號計費，用 Haiku 模型每次對話約台幣幾毛錢。</p>
    <button class="btn primary" id="sv">儲存設定</button>
  </div>
  <div class="card"><h3>🔄 跨裝置同步</h3>
    <p class="muted" style="margin-top:0">進度存在各裝置的瀏覽器。換裝置時：在舊裝置按「複製進度碼」，到新裝置貼上並「匯入」。（進度碼不含 API Key）</p>
    <div class="row"><button class="btn" id="exp">📋 複製進度碼</button></div>
    <textarea id="code" rows="3" placeholder="貼上進度碼…" style="margin-top:8px"></textarea>
    <p></p><div class="row"><button class="btn" id="imp">📥 匯入</button><button class="btn" id="reset" style="color:var(--bad)">重設全部</button></div>
  </div>`;
  $("#mock").onclick = () => go("mock");
  $("#wrong").onclick = () => renderGrammar(curWeek(), true);
  $("#rate").oninput = e => { $("#rv").textContent = e.target.value; };
  $("#sv").onclick = () => {
    S.settings.rate = +$("#rate").value; S.settings.voice = $("#voice").value; S.settings.newPerDay = +$("#npd").value || 10;
    S.settings.apiKey = $("#key").value.trim(); S.profile.start = $("#start").value || S.profile.start; save(); toast("已儲存"); speak("Settings saved.");
  };
  $("#exp").onclick = async () => {
    const data = { ...S, settings: { ...S.settings, apiKey: "" } };
    const code = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
    $("#code").value = code;
    try { await navigator.clipboard.writeText(code); toast("已複製進度碼"); } catch (e) { $("#code").select(); toast("請手動複製下方文字"); }
  };
  $("#imp").onclick = () => {
    try { const d = JSON.parse(decodeURIComponent(escape(atob($("#code").value.trim())))); const key = S.settings.apiKey;
      S = Object.assign(defaults(), d); S.settings.apiKey = key; save(); toast("匯入成功"); go("today"); }
    catch (e) { toast("進度碼格式錯誤"); }
  };
  $("#reset").onclick = () => { if (confirm("確定要清除這台裝置上的所有學習紀錄？")) { localStorage.removeItem(KEY); S = defaults(); go("today"); } };
}

// ---------- 啟動 ----------
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
renderStreak();
go("today");
