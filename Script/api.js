/* جازانا — الربط مع الباك إند: API + تسجيل الدخول بجوجل + السلة + الحساب + المفضلة.
   بيتحمّل تلقائي من header.js (من غير تعديل أي HTML). الواجهات الجديدة بتتحقن من هنا بنفس ألوان الموقع. */
(function () {
  "use strict";
  // ⚠️ غيّر الرابط ده لرابط الباك إند بتاعك على Render بعد الرفع
  const API = "https://lyiu3gv1e7hu-production-9hwsgsbl.us-central1.suga.run";
  const TK = "jz_token";
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const getTok = () => { try { return localStorage.getItem(TK); } catch (e) { return null; } };
  const setTok = (v) => { try { v ? localStorage.setItem(TK, v) : localStorage.removeItem(TK); } catch (e) {} };
  const money = (n) => Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 }) + " ر.س";
  const fdate = (s) => new Date(s).toLocaleDateString("en-GB");
  const imgUrl = (s) => (/^https?:\/\//i.test(s) ? s : (window.ROOT || "") + s);
  const EMPTY_CART = { items: [], subtotal: 0, shipping_fee: 0, total: 0, count: 0 };
  const S = { user: null, cfg: null, cart: EMPTY_CART, favs: new Set(), tab: "orders" };

  /* ---------- API client ---------- */
  async function api(path, o) {
    o = o || {};
    const ctl = new AbortController();
    const to = setTimeout(() => ctl.abort(), o.timeout || 90000); // Render المجاني بينام بعد 15 دقيقة خمول وأول طلب بعدها ممكن ياخد حوالي دقيقة
    let r;
    try {
      r = await fetch(API + path, {
        method: o.method || "GET",
        headers: Object.assign({}, o.body ? { "Content-Type": "application/json" } : {}, getTok() ? { Authorization: "Bearer " + getTok() } : {}),
        body: o.body ? JSON.stringify(o.body) : undefined,
        signal: ctl.signal,
      });
    } catch (e) {
      throw new Error("تعذّر الاتصال بالخادم. تأكد من الإنترنت وحاول مرة أخرى.");
    } finally {
      clearTimeout(to);
    }
    let d = null;
    try { d = await r.json(); } catch (e) {}
    if (!r.ok) {
      if (r.status === 401 && getTok()) { resetSession(); toast("انتهت الجلسة، سجّل الدخول من جديد", true); }
      throw new Error((d && d.message) || "حدث خطأ، حاول مرة أخرى");
    }
    return d;
  }

  function resetSession() {
    setTok(null);
    S.user = null; S.cart = EMPTY_CART; S.favs = new Set();
    paintHeader(); paintCart(); refresh();
  }
  const refresh = () => window.refreshShop && window.refreshShop();

  /* ---------- UI helpers ---------- */
  let tt;
  function toast(msg, bad) {
    let el = $("#jz-t");
    if (!el) { el = document.createElement("div"); el.id = "jz-t"; document.body.append(el); }
    el.textContent = msg;
    el.className = "on" + (bad ? " bad" : "");
    clearTimeout(tt);
    tt = setTimeout(() => (el.className = ""), 3200);
  }
  function modal(html, wide) {
    closeM();
    const o = document.createElement("div");
    o.className = "jzo";
    o.innerHTML = `<div class="jzp${wide ? " wide" : ""}" role="dialog" aria-modal="true"><button class="jzx" data-a="close" aria-label="إغلاق">×</button><div id="jz-b">${html}</div></div>`;
    o.addEventListener("click", (e) => { if (e.target === o) return closeM(); onAct(e); });
    o.addEventListener("submit", onSubmit);
    document.body.append(o);
    document.body.style.overflow = "hidden";
  }
  const setBody = (h) => { const b = $("#jz-b"); if (b) b.innerHTML = h; };
  function closeM() { const o = $(".jzo"); if (o) { o.remove(); document.body.style.overflow = ""; } }
  document.addEventListener("keydown", (e) => e.key === "Escape" && closeM());
  const fld = (label, name, val, type, extra) => `<label>${label}<input name="${name}" type="${type || "text"}" value="${esc(val)}" ${extra || ""}></label>`;
  const stLabel = (k) => ((S.cfg && S.cfg.orderStatuses.find((s) => s.key === k)) || {}).label || k;

  function paintHeader() {
    const its = $$(".ac .it");
    if (its[1]) its[1].classList.toggle("jz-in", !!S.user);
  }
  function paintCart(bump) {
    const ct = $("#ct");
    if (ct) ct.textContent = S.cart.subtotal;
    const c = $(".cart");
    if (c && bump) { c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump"); }
  }

  /* ---------- Session ---------- */
  async function ensureCfg() { if (!S.cfg) S.cfg = await api("/api/config"); return S.cfg; }
  async function loadCart() { S.cart = await api("/api/cart"); paintCart(); }
  async function loadFavs() { S.favs = new Set((await api("/api/favorites")).products.map((p) => p.id)); }
  async function restore() {
    if (!getTok()) return;
    try {
      S.user = (await api("/api/auth/me")).user;
      await Promise.all([loadCart(), loadFavs()]);
    } catch (e) {}
    paintHeader(); refresh();
  }

  /* ---------- Login (Google Identity Services) ---------- */
  let gsiP;
  const loadGsi = () => gsiP || (gsiP = new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client"; s.async = true;
    s.onload = res; s.onerror = () => { gsiP = null; rej(); };
    document.head.append(s);
  }));

  async function openLogin(msg) {
    modal(`<h3>تسجيل الدخول</h3><p class="jzm">${esc(msg || "سجّل دخولك بحساب جوجل لمتابعة طلباتك وحفظ مفضلتك.")}</p><div id="jz-g"></div><p class="jze" id="jz-ge"></p>`);
    try {
      await ensureCfg();
      await loadGsi();
      google.accounts.id.initialize({ client_id: S.cfg.googleClientId, callback: onCred });
      google.accounts.id.renderButton($("#jz-g"), { theme: "outline", size: "large", text: "signin_with", locale: "ar", width: 260 });
    } catch (e) {
      const m = $("#jz-ge");
      if (m) m.textContent = "تعذّر تحميل تسجيل الدخول بجوجل. تأكد من الاتصال وحاول مرة أخرى.";
    }
  }
  async function onCred(resp) {
    try {
      const r = await api("/api/auth/google", { method: "POST", body: { credential: resp.credential } });
      setTok(r.token); S.user = r.user;
      await Promise.all([loadCart(), loadFavs()]);
      paintHeader(); refresh(); closeM();
      toast("أهلًا " + r.user.name);
    } catch (e) {
      const m = $("#jz-ge");
      if (m) m.textContent = e.message;
    }
  }
  function logout() { resetSession(); closeM(); toast("تم تسجيل الخروج"); }

  /* ---------- Cart ---------- */
  async function addToCart(id) {
    if (!S.user) return openLogin("سجّل دخولك بحساب جوجل علشان تضيف المنتجات للسلة.");
    try {
      S.cart = await api("/api/cart/items", { method: "POST", body: { product_id: id, quantity: 1 } });
      paintCart(true); toast("تمت إضافة المنتج للسلة");
    } catch (e) { toast(e.message, true); }
  }
  async function toggleFav(id) {
    if (!S.user) return openLogin("سجّل دخولك بحساب جوجل علشان تحفظ المنتجات في المفضلة.");
    try {
      if (S.favs.has(id)) { await api("/api/favorites/" + id, { method: "DELETE" }); S.favs.delete(id); }
      else { await api("/api/favorites/" + id, { method: "POST" }); S.favs.add(id); }
      refresh();
    } catch (e) { toast(e.message, true); }
  }
  async function openCart() {
    if (!S.user) return openLogin("سجّل دخولك بحساب جوجل علشان تشوف سلتك وتكمّل الطلب.");
    try { await ensureCfg(); await loadCart(); } catch (e) { return toast(e.message, true); }
    modal(viewCart());
  }
  function viewCart() {
    const c = S.cart, u = S.user;
    if (!c.items.length) return `<h3>سلة المشتريات</h3><p class="jzm">سلتك فاضية حاليًا. أضف منتجات من المتجر وارجع هنا لإتمام الطلب.</p>`;
    return `<h3>سلة المشتريات</h3>
    <div class="jzl">${c.items.map((i) => `<div class="jzi"><img src="${esc(imgUrl(i.image))}" alt=""><div class="jzn"><b>${esc(i.name_ar)}</b><small>${esc(i.size_ar)}${i.is_available ? "" : " — غير متاح حاليًا"}</small><span>${money(i.unit_price)}</span></div>
      <div class="jzq"><button data-a="qty" data-id="${i.product_id}" data-d="-1" aria-label="تقليل الكمية">−</button><b>${i.quantity}</b><button data-a="qty" data-id="${i.product_id}" data-d="1" aria-label="زيادة الكمية">+</button></div>
      <button class="jzr" data-a="rm" data-id="${i.product_id}" aria-label="حذف من السلة"><i class="fa-solid fa-trash"></i></button></div>`).join("")}</div>
    <div class="jzt"><div><span>المجموع</span><b>${money(c.subtotal)}</b></div><div><span>الشحن</span><b>${c.shipping_fee ? money(c.shipping_fee) : "مجاني"}</b></div><div class="g"><span>الإجمالي</span><b>${money(c.total)}</b></div></div>
    <p class="jzm">الدفع عند الاستلام فقط.</p>
    <form data-f="order">${fld("الاسم", "name", u.name, "text", "required minlength=2 maxlength=80")}${fld("رقم الجوال", "phone", u.phone, "tel", 'required inputmode="tel" dir="ltr"')}${fld("المدينة", "city", u.city, "text", "required maxlength=60")}${fld("العنوان بالتفصيل", "address", u.address, "text", "required minlength=5 maxlength=300")}
    <label>ملاحظات (اختياري)<textarea name="notes" maxlength="500"></textarea></label>
    <label class="jzc"><input type="checkbox" name="save" checked> احفظ هذه البيانات في حسابي</label>
    <p class="jze" id="jz-e"></p><button class="btn b1" type="submit">تأكيد الطلب</button></form>`;
  }
  async function cartOp(fn) {
    try { S.cart = await fn(); paintCart(); setBody(viewCart()); } catch (e) { toast(e.message, true); }
  }
  async function submitOrder(f) {
    const d = Object.fromEntries(new FormData(f));
    const body = { name: d.name, phone: d.phone, city: d.city, address: d.address, notes: d.notes || "", save_to_profile: !!d.save };
    const btn = $("button[type=submit]", f); btn.disabled = true;
    try {
      const r = await api("/api/orders", { method: "POST", body });
      if (body.save_to_profile) Object.assign(S.user, { name: body.name, phone: body.phone, city: body.city, address: body.address });
      S.cart = EMPTY_CART; paintCart(true);
      setBody(`<h3><i class="fa-solid fa-circle-check" style="color:var(--gr)"></i> تم استلام طلبك</h3><p>رقم الطلب: <b>${esc(r.order.order_number)}</b></p><p>الإجمالي: <b>${money(r.order.total)}</b> (الدفع عند الاستلام)</p><p class="jzm">تقدر تتابع حالة الطلب من «طلباتي» في حسابك.</p><button class="btn b1" data-a="acct">طلباتي</button>`);
    } catch (e) { $("#jz-e").textContent = e.message; btn.disabled = false; }
  }

  /* ---------- Account ---------- */
  async function openAccount(tab) {
    if (!S.user) return openLogin();
    try { await ensureCfg(); } catch (e) { return toast(e.message, true); }
    S.tab = tab || "orders";
    const tabs = [["orders", "طلباتي"], ["profile", "بياناتي"], ["favs", "المفضلة"], ["wholesale", "عرض سعر جملة"]];
    modal(`<h3>حسابي</h3><p class="jzm">${esc(S.user.name)} · ${esc(S.user.email)}</p>
      <div class="jzs">${tabs.map(([k, l]) => `<button data-a="tab" data-t="${k}" class="${S.tab === k ? "on" : ""}">${l}</button>`).join("")}</div><div id="jz-tab"></div>
      <div class="jzf">${S.user.role === "admin" ? `<a href="${API}/admin/" target="_blank" rel="noopener">لوحة التحكم</a>` : "<span></span>"}<button data-a="logout">تسجيل الخروج</button></div>`, true);
    loadTab();
  }
  async function loadTab() {
    const box = $("#jz-tab"); if (!box) return;
    box.innerHTML = '<p class="jzm">جاري التحميل...</p>';
    try {
      const html = await ({ orders: tabOrders, profile: tabProfile, favs: tabFavs, wholesale: tabWholesale })[S.tab]();
      if ($("#jz-tab")) $("#jz-tab").innerHTML = html;
    } catch (e) { if ($("#jz-tab")) $("#jz-tab").innerHTML = `<p class="jze">${esc(e.message)}</p>`; }
  }
  async function tabOrders() {
    const { orders } = await api("/api/orders");
    if (!orders.length) return '<p class="jzm">لا توجد طلبات سابقة بعد.</p>';
    return orders.map((o) => `<div class="jzo2"><div class="h"><b>${esc(o.order_number)}</b><span class="bg s-${esc(o.status)}">${esc(stLabel(o.status))}</span></div>
      <small>${fdate(o.created_at)} · ${esc(o.city)}</small><ul>${o.items.map((i) => `<li>${esc(i.name)} ${esc(i.size)} × ${i.quantity}</li>`).join("")}</ul><b>${money(o.total)}</b></div>`).join("");
  }
  async function tabProfile() {
    const u = S.user;
    return `<form data-f="profile">${fld("الاسم", "name", u.name, "text", "required minlength=2 maxlength=80")}${fld("رقم الجوال", "phone", u.phone, "tel", 'inputmode="tel" dir="ltr"')}${fld("المدينة", "city", u.city, "text", "maxlength=60")}${fld("العنوان", "address", u.address, "text", "maxlength=300")}<p class="jze" id="jz-e"></p><button class="btn b1" type="submit">حفظ البيانات</button></form>`;
  }
  async function tabFavs() {
    const { products } = await api("/api/favorites");
    S.favs = new Set(products.map((p) => p.id));
    if (!products.length) return '<p class="jzm">لم تضف أي منتج للمفضلة بعد.</p>';
    return products.map((p) => `<div class="jzi"><img src="${esc(imgUrl(p.image))}" alt=""><div class="jzn"><b>${esc(p.name_ar)}</b><small>${esc(p.size_ar)}</small><span>${money(p.price)}</span></div>
      ${p.is_available ? `<button class="btn b1 sm" data-a="favcart" data-id="${p.id}">للسلة</button>` : "<small>غير متاح</small>"}<button class="jzr" data-a="favrm" data-id="${p.id}" aria-label="إزالة من المفضلة"><i class="fa-solid fa-trash"></i></button></div>`).join("");
  }
  async function tabWholesale() {
    const u = S.user;
    return `<p class="jzm">للمطاعم والشركات والكميات الكبيرة. أرسل طلبك وسيتم التواصل معك بعرض السعر.</p><form data-f="wholesale">${fld("الاسم", "name", u.name, "text", "required minlength=2 maxlength=80")}${fld("رقم الجوال", "phone", u.phone, "tel", 'required inputmode="tel" dir="ltr"')}${fld("اسم المطعم أو الشركة", "business_name", "", "text", "required maxlength=120")}${fld("الكمية المطلوبة (عدد العبوات)", "quantity", "", "number", "required min=1 max=1000000")}<label>ملاحظات (اختياري)<textarea name="notes" maxlength="1000"></textarea></label><p class="jze" id="jz-e"></p><button class="btn b1" type="submit">إرسال طلب عرض السعر</button></form>`;
  }

  /* ---------- Events (delegation داخل النافذة) ---------- */
  function onAct(e) {
    const b = e.target.closest("[data-a]"); if (!b) return;
    const a = b.dataset.a, id = +b.dataset.id;
    if (a === "close") closeM();
    else if (a === "logout") logout();
    else if (a === "acct") openAccount("orders");
    else if (a === "tab") { S.tab = b.dataset.t; $$(".jzs button").forEach((x) => x.classList.toggle("on", x === b)); loadTab(); }
    else if (a === "qty") { const it = S.cart.items.find((i) => i.product_id === id); const q = it.quantity + +b.dataset.d; cartOp(() => api("/api/cart/items/" + id, { method: "PUT", body: { quantity: q } })); }
    else if (a === "rm") cartOp(() => api("/api/cart/items/" + id, { method: "DELETE" }));
    else if (a === "favrm") toggleFav(id).then(loadTab);
    else if (a === "favcart") addToCart(id);
  }
  async function onSubmit(e) {
    e.preventDefault();
    const f = e.target, kind = f.dataset.f;
    if (kind === "order") return submitOrder(f);
    const d = Object.fromEntries(new FormData(f)), err = $("#jz-e"), btn = $("button[type=submit]", f);
    btn.disabled = true; err.textContent = "";
    try {
      if (kind === "profile") {
        S.user = Object.assign({}, S.user, (await api("/api/profile", { method: "PUT", body: { name: d.name, phone: d.phone, city: d.city, address: d.address } })).user);
        toast("تم حفظ بياناتك");
      } else if (kind === "wholesale") {
        await api("/api/wholesale", { method: "POST", body: { name: d.name, phone: d.phone, business_name: d.business_name, quantity: Number(d.quantity), notes: d.notes || "" } });
        toast("تم إرسال طلب عرض السعر بنجاح"); f.reset();
      }
    } catch (er) { err.textContent = er.message; }
    btn.disabled = false;
  }

  /* ---------- Styles (بنفس ألوان وخطوط الموقع) ---------- */
  function injectCss() {
    const s = document.createElement("style");
    s.textContent = `
.ac .it,.cart{cursor:pointer}.ac .it.jz-in:after{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--gr);margin-inline-start:4px}
.hrt{cursor:pointer}.hrt.on i{color:#c0392b}
.pd .btn[disabled]{opacity:.5;cursor:not-allowed}
.jzo{position:fixed;inset:0;z-index:10000;background:#2a1c0acc;display:flex;align-items:center;justify-content:center;padding:14px}
.jzp{background:#fff;border-radius:14px;width:100%;max-width:440px;max-height:calc(100vh - 28px);max-height:calc(100dvh - 28px);overflow:auto;padding:22px;position:relative;direction:rtl;text-align:right;color:var(--tx);font:14px/1.7 "IBM Plex Sans Arabic",sans-serif;box-shadow:0 20px 50px #0004}
.jzp.wide{max-width:560px}.jzp h3{font-size:20px;margin-bottom:6px;color:var(--br)}
.jzx{position:absolute;top:8px;inset-inline-start:12px;font-size:26px;color:var(--mt);line-height:1}
.jzm{color:var(--mt);font-size:13px;margin:4px 0 12px}.jze{color:#b3412f;font-size:13px;min-height:1px}
#jz-g{display:flex;justify-content:center;min-height:44px;margin:8px 0}
.jzp form{display:flex;flex-direction:column;gap:10px;margin-top:10px}
.jzp label{display:flex;flex-direction:column;gap:2px;font-size:12px;color:var(--mt)}
.jzp input:not([type=checkbox]),.jzp textarea{border:1px solid var(--bd);border-radius:8px;padding:8px 12px;font:inherit;font-size:16px;color:var(--tx);background:#fffdfb}
.jzp input:focus,.jzp textarea:focus{outline:none;border-color:var(--gd);box-shadow:0 0 0 2px #c9a24a44}
.jzp label.jzc{flex-direction:row;align-items:center;gap:6px;color:var(--tx)}
.jzp .btn.sm{padding:4px 14px}
.jzl{display:flex;flex-direction:column;gap:10px;margin:10px 0}
.jzi{display:flex;align-items:center;gap:10px;border:1px solid var(--bd);border-radius:10px;padding:8px;margin-bottom:8px}
.jzl .jzi{margin:0}.jzi img{width:54px;height:54px;object-fit:cover;border-radius:8px;background:#eee;flex:none}
.jzn{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.4}.jzn small{color:var(--mt)}.jzn span{color:var(--br);font-weight:700}
.jzq{display:flex;align-items:center;gap:8px}.jzq button{width:28px;height:28px;border-radius:50%;border:1px solid var(--bd);background:#fff;color:var(--br);font-size:16px}
.jzr{color:#b3412f;padding:6px}
.jzt{border-top:1px solid var(--bd);padding-top:8px}.jzt div{display:flex;justify-content:space-between;padding:2px 0}.jzt .g{font-weight:700;color:var(--br);font-size:16px}
.jzs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}.jzs button{border:1px solid var(--bd);border-radius:20px;padding:4px 14px;color:var(--br);font-weight:700;font-size:13px}.jzs button.on{background:var(--br);color:#fff}
.jzo2{border:1px solid var(--bd);border-radius:10px;padding:10px 12px;margin-bottom:10px}.jzo2 .h{display:flex;justify-content:space-between;align-items:center}
.jzo2 ul{margin:4px 0;padding-inline-start:18px;font-size:13px}.jzo2 small{color:var(--mt)}
.jzo2 .bg{background:#f3e3cc;color:var(--br);border-radius:20px;padding:0 12px;font-size:12px;font-weight:700}
.jzo2 .bg.s-delivered{background:#dff3e8;color:#17794a}.jzo2 .bg.s-cancelled{background:#f0e1e0;color:#b3412f}
.jzf{display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding-top:10px;border-top:1px solid var(--bd);font-size:13px}.jzf a{color:var(--br);font-weight:700}.jzf button{color:#b3412f}
#jz-t{position:fixed;bottom:84px;left:50%;transform:translate(-50%,10px);background:var(--br);color:#fff;padding:9px 18px;border-radius:24px;opacity:0;pointer-events:none;transition:.25s;z-index:10001;font-size:14px;max-width:90vw;text-align:center}
#jz-t.on{opacity:1;transform:translate(-50%,0)}#jz-t.bad{background:#b3412f}
@media(prefers-reduced-motion:reduce){#jz-t{transition:none}}`;
    document.head.append(s);
  }

  function wire() {
    const its = $$(".ac .it"), cart = $(".cart");
    if (its[0]) its[0].onclick = () => openAccount("favs");
    if (its[1]) its[1].onclick = () => openAccount("orders");
    if (cart) cart.onclick = openCart;
  }

  async function init() {
    injectCss(); wire();
    ensureCfg().catch(() => {});
    await restore();
  }
  window.JZ = { api, esc, isFav: (id) => S.favs.has(id), addToCart, toggleFav, openCart, openAccount, openLogin };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", init) : init();
})();
