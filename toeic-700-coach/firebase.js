// 雲端同步：Google 登入＋Firestore（使用者資料只有本人能讀寫；排行榜只存暱稱與分數）
const cfg = window.FIREBASE_CONFIG;
const Cloud = window.Cloud;
if (cfg && cfg.apiKey) {
  const V = "10.12.2", base = `https://www.gstatic.com/firebasejs/${V}/`;
  try {
    const [{ initializeApp }, A, F] = await Promise.all([import(base + "firebase-app.js"), import(base + "firebase-auth.js"), import(base + "firebase-firestore.js")]);
    const app = initializeApp(cfg), auth = A.getAuth(app), db = F.getFirestore(app);
    const provider = new A.GoogleAuthProvider();
    Object.assign(Cloud, {
      enabled: true,
      async signIn() {
        try { await A.signInWithPopup(auth, provider); }
        catch (e) { if (["auth/popup-blocked", "auth/operation-not-supported-in-this-environment"].includes(e.code)) await A.signInWithRedirect(auth, provider); else throw e; }
      },
      signOut: () => A.signOut(auth),
      async pull() {
        const snap = await F.getDoc(F.doc(db, "users", Cloud.user.uid));
        return snap.exists() ? snap.data() : null;
      },
      async push(state, board) {
        const uid = Cloud.user.uid;
        await F.setDoc(F.doc(db, "users", uid), { data: JSON.stringify(state), updatedAt: state.updatedAt || Date.now() });
        if (board) await F.setDoc(F.doc(db, "leaderboard", uid), { ...board, updatedAt: Date.now() });
      },
      // 好友代碼：codes/{代碼} = { uid }，只能建立自己的那一筆
      async makeCode() {
        const ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        for (let t = 0; t < 6; t++) {
          const code = Array.from({ length: 6 }, () => ABC[Math.floor(Math.random() * ABC.length)]).join(""), ref = F.doc(db, "codes", code);
          if ((await F.getDoc(ref)).exists()) continue;
          await F.setDoc(ref, { uid: Cloud.user.uid });
          return code;
        }
        throw new Error("代碼產生失敗，請重新整理再試一次");
      },
      // 加好友：雙方互加（對方的清單只能新增「自己」那一筆）
      async addFriend(code) {
        const snap = await F.getDoc(F.doc(db, "codes", code));
        if (!snap.exists()) throw new Error("找不到這個代碼，請再確認一次");
        const me = Cloud.user.uid, fid = snap.data().uid, since = Date.now();
        if (fid === me) throw new Error("這是你自己的代碼喔");
        await F.setDoc(F.doc(db, "friends", me, "list", fid), { since });
        try { await F.setDoc(F.doc(db, "friends", fid, "list", me), { since }); } catch (e) { /* 對方早就加過你了 */ }
        return fid;
      },
      // 好友排行榜：只取 leaderboard 公開的欄位
      async friends() {
        const ids = (await F.getDocs(F.collection(db, "friends", Cloud.user.uid, "list"))).docs.map(d => d.id);
        const snaps = await Promise.all(ids.map(id => F.getDoc(F.doc(db, "leaderboard", id))));
        return snaps.filter(d => d.exists()).map(d => { const x = d.data(); return { uid: d.id, name: x.name, lv: x.lv, xp: x.xp, streak: x.streak, week: x.week, title: x.title, weekTasks: x.weekTasks, weekId: x.weekId }; });
      },
      async leaderboard() {
        const q = F.query(F.collection(db, "leaderboard"), F.orderBy("xp", "desc"), F.limit(20));
        return (await F.getDocs(q)).docs.map(d => ({ uid: d.id, ...d.data() }));
      }
    });
    A.getRedirectResult(auth).catch(() => {});
    A.onAuthStateChanged(auth, u => { Cloud.user = u; Cloud.emit(); });
  } catch (e) { Cloud.error = e.message; Cloud.emit(); }
} else Cloud.emit();
