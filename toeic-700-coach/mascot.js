// 主角「餅乾」v6：為介面設計的簡潔吉祥物
// 規則：約 2.5 頭身、外框 5px／內線 3px、光源左上、陰影只有一階（右下）、機器人元素只留「額頭護目鏡＋胸前星章」
// 用法：mascot({ expr: "normal|happy|wow|think", pose: "idle|wave|cheer", sticker: true, head: true, gear: { head, back, lens } })
(function () {
  const INK = "#1f1a17", W = "#fffaf0", WS = "#e3e6ee", BLUE = "#2f62c9", BLUE_S = "#1f469a",
    RED = "#d2401f", Y = "#f6c33b", PINK = "#f28bb0", OR = "#ee8a2c", LENS = "#62bfe9", MOUTH = "#8f2a1c";

  // 動畫樣式只注入一次
  if (!document.getElementById("mascot-css")) {
    const st = document.createElement("style"); st.id = "mascot-css";
    st.textContent = `
      .m-svg { overflow: visible; display: block; }
      .m-svg.m-head { overflow: hidden; }
      .m-svg .m-breathe { animation: m-breathe 3s ease-in-out infinite; transform-origin: 120px 240px; }
      .m-svg .m-tail { animation: m-tail 2.4s ease-in-out infinite; transform-origin: 158px 212px; }
      .m-svg .m-wave { animation: m-wave 1.4s ease-in-out infinite; transform-origin: 88px 164px; }
      .m-svg .m-blink { animation: m-blink 4.5s infinite; transform-box: fill-box; transform-origin: center; }
      .m-svg .m-flame { animation: m-flame .3s ease-in-out infinite alternate; transform-origin: 120px 206px; }
      .m-svg.m-still * { animation: none !important; }
      @keyframes m-flame { to { transform: scaleY(1.25); } }
      @keyframes m-breathe { 50% { transform: scale(1.012, .988); } }
      @keyframes m-tail { 50% { transform: rotate(8deg); } }
      @keyframes m-wave { 50% { transform: rotate(-14deg); } }
      @keyframes m-blink { 0%, 94%, 100% { transform: scaleY(1); } 97% { transform: scaleY(.12); } }`;
    document.head.appendChild(st);
  }

  const path = (d, fill, sw = 5, extra = "") => `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round" ${extra}/>`;
  const line = (d, sw = 3, c = INK) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const limb = (d) => line(d, 19) + line(d, 11, BLUE);
  const paw = (x, y, r = 12) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${W}" stroke="${INK}" stroke-width="4.5"/>` + line(`M${x - r * .45} ${y + r * .1} v${r * .45} M${x + r * .1} ${y + r * .25} v${r * .45}`, 2.2);

  const HEAD = "M120 30 C170 30 200 58 200 96 C200 106 206 112 212 116 L200 121 C194 147 162 160 120 160 C78 160 46 147 40 121 L28 116 C34 112 40 106 40 96 C40 58 70 30 120 30 Z";

  let uid = 0;
  window.mascot = function ({ expr = "normal", pose = "idle", sticker = false, still = false, head = false, gear = {} } = {}) {
    const lens = { lens_gold: Y, lens_pink: PINK }[gear.lens] || LENS;
    const id = "m" + (++uid);
    let s = `<defs>
      <clipPath id="${id}h"><path d="${HEAD}"/></clipPath>
      <filter id="${id}st" x="-10%" y="-10%" width="120%" height="120%"><feMorphology in="SourceAlpha" operator="dilate" radius="5" result="d"/><feFlood flood-color="#fffaf0"/><feComposite in2="d" operator="in" result="w"/><feMerge><feMergeNode in="w"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>`;
    // 地面影子（永遠不被擋住）
    s += `<ellipse cx="120" cy="246" rx="62" ry="9" fill="${INK}" opacity=".18"/>`;
    let c = "";
    // 背部裝備（畫在身體後面）
    if (gear.back === "back_cape") c += path("M86 150 Q120 140 154 150 L180 236 Q120 250 60 236 Z", RED) + `<path d="M150 152 L180 236 Q170 240 158 242 Z" fill="#a8301a"/>`;
    if (gear.back === "back_rocket") c += `<g class="m-flame">${path("M60 206 q8 22 16 0 Z", OR, 3)}${path("M164 206 q8 22 16 0 Z", OR, 3)}</g>` + path("M58 156 h22 v52 h-22 Z", "#d9dde6") + path("M162 156 h22 v52 h-22 Z", "#d9dde6") + path("M58 158 q11 -22 22 0 Z", RED) + path("M162 158 q11 -22 22 0 Z", RED);
    // 尾巴
    c += `<g class="m-tail">${line("M156 212 C196 214 214 184 204 158 C198 144 186 148 190 160", 17)}${line("M156 212 C196 214 214 184 204 158 C198 144 186 148 190 160", 9, W)}${line("M204 158 C198 144 186 148 190 160", 9, OR)}</g>`;
    // 腿與腳
    c += path("M90 204 h26 v24 a8 8 0 0 1 -8 8 h-10 a8 8 0 0 1 -8 -8 Z", BLUE) + path("M124 204 h26 v24 a8 8 0 0 1 -8 8 h-10 a8 8 0 0 1 -8 -8 Z", BLUE);
    c += path("M84 236 a17 10 0 1 0 34 0 a17 10 0 1 0 -34 0", W, 4.5) + path("M122 236 a17 10 0 1 0 34 0 a17 10 0 1 0 -34 0", W, 4.5);
    // 身體
    c += path("M86 150 Q120 138 154 150 Q170 184 162 212 Q120 224 78 212 Q70 184 86 150 Z", BLUE);
    c += `<path d="M142 148 Q168 184 160 211 Q150 215 140 216 Q158 184 142 148 Z" fill="${BLUE_S}"/>`;
    c += path("M80 200 Q120 210 160 200 L161 210 Q120 220 79 210 Z", Y, 3);
    c += path("M120 162 m-14 0 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0", RED, 4);
    c += `<path d="M120 153 l3 6 6.5 .8 -4.8 4.4 1.3 6.4 -6 -3.2 -6 3.2 1.3 -6.4 -4.8 -4.4 6.5 -.8 Z" fill="${Y}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round" transform="translate(0 2)"/>`;
    // 手臂
    const armL = { idle: ["M88 164 Q70 176 70 196", [70, 202]], wave: ["M88 164 Q64 150 60 122", [60, 114]], cheer: ["M88 164 Q64 148 58 118", [58, 110]] }[pose] || ["M88 164 Q70 176 70 196", [70, 202]];
    const armR = pose === "cheer" ? ["M152 164 Q176 148 182 118", [182, 110]] : ["M152 164 Q170 176 170 196", [170, 202]];
    const armRsvg = `<g>${limb(armR[0])}${paw(...armR[1])}</g>`;
    if (pose !== "cheer") c += armRsvg;
    const armLsvg = limb(armL[0]) + paw(...armL[1]) + (pose === "wave" ? line("M40 100 q-6 8 0 16 M30 96 q-8 12 0 24", 3) : "");
    // 耳朵（在頭後面）
    c += path("M52 72 L46 18 Q48 10 56 14 L100 42 Z", W) + path("M188 72 L194 18 Q192 10 184 14 L140 42 Z", W);
    c += `<path d="M59 58 L56 27 L86 45 Z M181 58 L184 27 L154 45 Z" fill="${PINK}"/>`;
    // 頭
    c += path(HEAD, W);
    c += `<g clip-path="url(#${id}h)">
      <path d="M190 56 C216 100 200 152 136 164 L216 172 L216 50 Z" fill="${WS}"/>
      <path d="M144 34 C170 30 192 44 198 66 C180 74 160 64 150 50 Z" fill="${OR}"/>
      <rect x="30" y="50" width="180" height="11" fill="${INK}"/>
    </g>`;
    c += path(HEAD, "none");
    // 額頭護目鏡
    c += `<rect x="112" y="48" width="16" height="9" rx="3" fill="${INK}"/>`;
    c += path("M98 52 m-17 0 a17 17 0 1 0 34 0 a17 17 0 1 0 -34 0", lens, 5) + path("M142 52 m-17 0 a17 17 0 1 0 34 0 a17 17 0 1 0 -34 0", lens, 5);
    c += line("M89 46 q5 -6 12 -6", 3.5, W) + line("M133 46 q5 -6 12 -6", 3.5, W);
    // 頭部裝備
    if (gear.head === "hat_sailor") c += `<g transform="rotate(-10 120 30)">${path("M84 34 Q120 -6 156 34 Z", W)}${path("M84 26 h72 v8 h-72 Z", BLUE, 3)}${path("M74 36 Q120 24 166 36 Q120 46 74 36 Z", W)}</g>`;
    if (gear.head === "hat_crown") c += path("M88 34 L92 6 L108 22 L120 0 L132 22 L148 6 L152 34 Z", Y) + `<circle cx="120" cy="24" r="4" fill="${RED}" stroke="${INK}" stroke-width="2"/><circle cx="102" cy="28" r="3" fill="${LENS}"/><circle cx="138" cy="28" r="3" fill="${LENS}"/>`;
    if (gear.head === "hat_beret") c += `<g transform="rotate(-12 120 30)">${path("M76 32 Q78 8 120 8 Q162 8 160 32 Q120 42 76 32 Z", RED)}${line("M120 8 v-8", 5)}</g>`;
    // 臉
    const eyes = {
      normal: `<g class="m-blink"><ellipse cx="100" cy="104" rx="9" ry="12" fill="${INK}"/><ellipse cx="140" cy="104" rx="9" ry="12" fill="${INK}"/></g><circle cx="103" cy="99" r="3.6" fill="${W}"/><circle cx="143" cy="99" r="3.6" fill="${W}"/>`,
      happy: line("M90 108 Q100 94 110 108", 6) + line("M130 108 Q140 94 150 108", 6),
      wow: `<ellipse cx="100" cy="103" rx="11" ry="15" fill="${INK}"/><ellipse cx="140" cy="103" rx="11" ry="15" fill="${INK}"/><circle cx="104" cy="97" r="4.5" fill="${W}"/><circle cx="144" cy="97" r="4.5" fill="${W}"/><circle cx="97" cy="110" r="2" fill="${W}"/><circle cx="137" cy="110" r="2" fill="${W}"/>`,
      think: `<ellipse cx="102" cy="101" rx="8" ry="11" fill="${INK}"/><ellipse cx="142" cy="101" rx="8" ry="11" fill="${INK}"/><circle cx="104" cy="96" r="3.2" fill="${W}"/><circle cx="144" cy="96" r="3.2" fill="${W}"/>` + path("M176 76 q6 10 0 14 q-6 -4 0 -14 Z", LENS, 2.5)
    }[expr];
    c += eyes;
    c += `<ellipse cx="78" cy="124" rx="10" ry="6" fill="${PINK}"/><ellipse cx="162" cy="124" rx="10" ry="6" fill="${PINK}"/>`;
    c += path("M115 117 H125 L120 123 Z", PINK, 2.5);
    c += {
      normal: line("M108 128 Q114 136 120 128 Q126 136 132 128", 3.5),
      happy: path("M106 127 Q120 147 134 127 Q120 132 106 127 Z", MOUTH, 3.5) + `<path d="M113 136 Q120 142 127 136 Q120 133 113 136 Z" fill="${PINK}"/>`,
      wow: path("M120 136 m-7 0 a7 9 0 1 0 14 0 a7 9 0 1 0 -14 0", MOUTH, 3.5),
      think: line("M110 134 Q120 130 130 134", 3.5)
    }[expr];
    c += line("M62 116 L34 110 M62 124 L34 130 M178 116 L206 110 M178 124 L206 130", 2.5);
    // 舉起的手（畫在頭的前面）
    if (pose === "cheer") c += armRsvg;
    c += pose === "idle" ? `<g>${armLsvg}</g>` : `<g class="${pose === "wave" ? "m-wave" : ""}">${armLsvg}</g>`;

    s += `<g class="m-breathe"${sticker ? ` filter="url(#${id}st)"` : ""}>${c}</g>`;
    return `<svg class="m-svg${still ? " m-still" : ""}${head ? " m-head" : ""}" viewBox="${head ? "22 4 196 168" : "0 0 240 260"}" aria-hidden="true">${s}</svg>`;
  };
})();
