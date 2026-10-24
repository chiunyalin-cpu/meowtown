// 介面圖示：24×24、線寬 2.5、圓角端點，全站統一
window.ICON = (() => {
  const k = 'fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"';
  const i = d => `<svg viewBox="0 0 24 24" ${k} aria-hidden="true">${d}</svg>`;
  return {
    home: i('<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'),
    map: i('<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>'),
    gacha: i('<circle cx="12" cy="9" r="6"/><path d="M6 15h12l1 6H5z"/><path d="M10 7.5a2 2 0 0 1 2-1.5"/>'),
    game: i('<path d="M6 8h12a4 4 0 0 1 4 4v1a4 4 0 0 1-7 2.6L14 15h-4l-1 .6A4 4 0 0 1 2 13v-1a4 4 0 0 1 4-4z"/><path d="M7 11v3M5.5 12.5h3"/><circle cx="16" cy="11.5" r=".6" fill="currentColor"/><circle cx="18" cy="13.5" r=".6" fill="currentColor"/>'),
    mic: i('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/>'),
    user: i('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
    gear: i('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>'),
    plus: i('<path d="M12 5v14M5 12h14"/>'),
    check: i('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    arrow: i('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    book: i('<path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M8 7h6"/>'),
    head: i('<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>'),
    pen: i('<path d="M4 20l4-1L19 8l-3-3L5 16z"/><path d="M14 7l3 3"/>'),
    repeat: i('<path d="M4 10a6 6 0 0 1 10-4.5L17 8"/><path d="M17 3v5h-5"/><path d="M20 14a6 6 0 0 1-10 4.5L7 16"/><path d="M7 21v-5h5"/>'),
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>',
    lock: i('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
    star: i('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>'),
    trophy: i('<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M9 17h6v4H9z"/>'),
    cloud: i('<path d="M7 18a4 4 0 0 1-.6-8A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9z"/>'),
    logout: i('<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>'),
    x: i('<path d="M6 6l12 12M18 6L6 18"/>'),
    chev: i('<path d="M9 6l6 6-6 6"/>'),
    shirt: i('<path d="M8 4l4 2 4-2 4 3-2 4h-2v9H8v-9H6L4 7z"/>'),
    google: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"/><path fill="#FBBC05" d="M6.4 14a6 6 0 0 1 0-3.9V7.5H3.1a10 10 0 0 0 0 9z"/><path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.5L6.4 10C7.2 7.8 9.4 6 12 6z"/></svg>',
    flame: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-7 1 2 2 3 3 3-1-3 0-6 0-8z" fill="#ee8a2c" stroke="#1f1a17" stroke-width="2" stroke-linejoin="round"/><path d="M12 13c1.5 1.5 3 2.5 3 4.5a3 3 0 0 1-6 0c0-1.5 1-2.5 1.5-3.5.5 1 1 1.5 1.5-1z" fill="#f6c33b"/></svg>',
    can: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="14" height="17" rx="3" fill="#f6c33b" stroke="#1f1a17" stroke-width="2"/><rect x="5" y="9" width="14" height="7" fill="#d2401f" stroke="#1f1a17" stroke-width="2"/><ellipse cx="12" cy="4.5" rx="6.5" ry="2" fill="#fffaf0" stroke="#1f1a17" stroke-width="2"/><path d="M9 12.5h6" stroke="#fffaf0" stroke-width="1.6" stroke-linecap="round"/></svg>'
  };
})();
