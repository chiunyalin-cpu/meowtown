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
      async leaderboard() {
        const q = F.query(F.collection(db, "leaderboard"), F.orderBy("xp", "desc"), F.limit(20));
        return (await F.getDocs(q)).docs.map(d => ({ uid: d.id, ...d.data() }));
      }
    });
    A.getRedirectResult(auth).catch(() => {});
    A.onAuthStateChanged(auth, u => { Cloud.user = u; Cloud.emit(); });
  } catch (e) { Cloud.error = e.message; Cloud.emit(); }
} else Cloud.emit();
