const $ = (s) => document.querySelector(s);
let lang = (() => {
    try {
      return localStorage.lang || "ar";
    } catch (e) {
      return "ar";
    }
  })(),
  cart = 0;
const t = (a, e) => (lang == "en" ? e : a);

const STAR = (n) => '<i class="fa-solid fa-star"></i>'.repeat(n);

const QA = [
  [
    "كم سعر الزيت؟",
    "What is the price?",
    "زيت سمسم بلدي: عبوة 250 مل بـ 21 ريال، وعبوة 500 مل بـ 33 ريال. وعرض العبوتين (250 مل) بـ 38 ريال، ومع كل 3 عبوات 500 مل تحصل على عبوة 250 مل هدية.",
    "Local sesame oil: 250 ml is 21 SAR and 500 ml is 33 SAR. The 2-bottle (250 ml) offer is 38 SAR, and buying 3 bottles of 500 ml gets you a free 250 ml bottle.",
  ],
  [
    "كم مدة التوصيل؟",
    "How long is delivery?",
    "التوصيل القياسي خلال 2-4 أيام لجميع مناطق المملكة، والشحن مجاني فوق 200 ريال.",
    "Standard delivery takes 2–4 days across the Kingdom; free over 200 SAR.",
  ],
  [
    "هل الدفع عند الاستلام متاح؟",
    "Is cash on delivery available?",
    "نعم، الدفع عند الاستلام متاح، بالإضافة إلى التقسيط عبر تابي وتمارا.",
    "Yes, cash on delivery is available, plus installments via tabby and tamara.",
  ],
  [
    "كيف أسترجع المنتج؟",
    "How do I return a product?",
    "الاسترجاع خلال 15 يوما من الاستلام، ونتحمل شحن الإرجاع (الضمان الذهبي، ولا يشمل الكسر).",
    "Returns within 15 days; we cover return shipping (Golden Guarantee, which does not cover breakage).",
  ],
  [
    "هل تبيعون جملة؟",
    "Do you sell wholesale?",
    "نعم، لدينا أسعار خاصة للجملة والمطاعم. تواصل معنا لعرض سعر.",
    "Yes, special prices for wholesale and restaurants. Contact us for a quote.",
  ],
];

// المنتجات بتيجي من الـ API (Script/api.js). أي تعديل من لوحة الأدمن بيظهر هنا فورًا.
let PRODUCTS = [],
  PSTATE = "loading"; // loading | ok | error
// التبويبات: [الاسم عربي, الاسم إنجليزي, فلتر المنتجات, شارة عربي, شارة إنجليزي]
const TABS = [
  ["زيت السمسم البلدي", "Local sesame oil", (p) => p.category == "oil", "طبيعي 100%", "100% natural"],
  ["الأكثر مبيعا", "Best sellers", (p) => p.is_best, "الأكثر مبيعا", "Best seller"],
  ["أحدث المنتجات", "Newest", (p) => p.is_new, "جديد", "New"],
  ["باقات الهدايا والتوفير", "Gifts & savings", (p) => p.category == "bundle", "عرض", "Offer"],
];
const pimg = (s) => (/^https?:\/\//i.test(s) ? s : ROOT + s);
const curTab = () => {
  const b = $("#tabs") ? [...$("#tabs").children].findIndex((x) => x.classList.contains("on")) : 0;
  return b < 0 ? 0 : b;
};
// البحث: بيستخدم نفس قائمة PRODUCTS ونفس شبكة العرض (#pg)
let sq = "";
const srInput = () => document.querySelector(".sr input");
function clearSearch() {
  sq = "";
  const i = srInput();
  if (i) i.value = "";
}
function runSearch(q) {
  q = (q == null ? (srInput() || {}).value || "" : q).trim();
  if (!$("#pg")) {
    // صفحة فرعية (about/privacy...) نروح للرئيسية ونبحث هناك
    if (q) location.href = ROOT + "index.html?q=" + encodeURIComponent(q) + "#shop";
    return false;
  }
  sq = q;
  refreshShop();
  const sh = $("#shop");
  if (sh && q) sh.scrollIntoView({ behavior: "smooth", block: "start" });
  return false;
}
function refreshShop() {
  shop(curTab());
}
async function loadProducts() {
  if (!$("#tabs")) return; // الصفحات اللي مفيهاش قسم المنتجات (about, privacy...) مش محتاجة طلب API
  PSTATE = "loading";
  if (window.JZ) refreshShop();
  const wake = setTimeout(() => {
    const m = PSTATE == "loading" && $("#pg p");
    if (m) m.textContent = t("الخادم بيتم تشغيله، ممكن ياخد حوالي دقيقة...", "The server is waking up, this may take up to a minute...");
  }, 6000);
  try {
    if (!window.JZ) await new Promise((r) => window.addEventListener("load", r, { once: true })); // لو api.js لسه ماتحمّلش
    PRODUCTS = (await JZ.api("/api/products")).products;
    PSTATE = "ok";
  } catch (e) {
    PSTATE = "error";
  }
  clearTimeout(wake);
  refreshShop();
}

function shop(i = 0, fromTab) {
  const g = $("#tabs");
  if (!g) return;
  if (fromTab) clearSearch(); // الضغط على تبويب يلغي نتائج البحث
  g.innerHTML = TABS.map(
    (x, k) =>
      `<button class="${k == i ? "on" : ""}" onclick="shop(${k},1)">${t(x[0], x[1])}</button>`,
  ).join("");
  const e = lang == "en",
    box = $("#pg"),
    msg = 'style="grid-column:1/-1;text-align:center;color:#8a7a66;padding:30px 0"';
  if (PSTATE == "loading") {
    box.innerHTML = `<p ${msg}>${t("جاري تحميل المنتجات...", "Loading products...")}</p>`;
    return;
  }
  if (PSTATE == "error") {
    box.innerHTML = `<p ${msg}>${t("تعذّر تحميل المنتجات حاليًا. تأكد من اتصالك بالإنترنت ثم أعد المحاولة.", "Could not load products. Check your connection and try again.")}<br><br><button class="btn b1" onclick="loadProducts()">${t("إعادة المحاولة", "Retry")}</button></p>`;
    return;
  }
  const nq = norm(sq);
  const list = nq
    ? PRODUCTS.filter((p) =>
        norm([p.name_ar, p.name_en, p.desc_ar, p.desc_en, p.size_ar, p.size_en].filter(Boolean).join(" ")).includes(nq),
      )
    : PRODUCTS.filter(TABS[i][2]);
  const clr = `<button class="btn b2" onclick="clearSearch();shop(0)">${t("عرض كل المنتجات", "Show all products")}</button>`;
  if (nq) {
    g.querySelectorAll("button").forEach((b) => b.classList.remove("on"));
    if (!list.length) {
      box.innerHTML = `<p ${msg}>${t("لا توجد نتائج لـ", "No results for")} «${JZ.esc(sq)}»<br><br>${clr}</p>`;
      return;
    }
  } else if (!list.length) {
    box.innerHTML = `<p ${msg}>${t("لا توجد منتجات في هذا القسم حاليًا.", "No products in this section right now.")}</p>`;
    return;
  }
  const head = nq
    ? `<p ${msg}>${t("نتائج البحث عن", "Search results for")} «${JZ.esc(sq)}» (${list.length})<br><br>${clr}</p>`
    : "";
  box.innerHTML = head + list
    .map((p) => {
      const name = e ? p.name_en || p.name_ar : p.name_ar,
        desc = e ? p.desc_en || p.desc_ar : p.desc_ar,
        size = e ? p.size_en || p.size_ar : p.size_ar,
        fav = JZ.isFav(p.id);
      return `<article class="pd"><span class="hrt${fav ? " on" : ""}" role="button" tabindex="0" aria-label="${t("المفضلة", "Wishlist")}" onclick="JZ.toggleFav(${p.id})"><i class="fa-${fav ? "solid" : "regular"} fa-heart"></i></span><span class="bdg">${nq ? (p.category == "bundle" ? t(TABS[3][3], TABS[3][4]) : t(TABS[0][3], TABS[0][4])) : t(TABS[i][3], TABS[i][4])}</span><div class="ph"><img src="${JZ.esc(pimg(p.image))}" alt="${JZ.esc(name)}" loading="lazy"></div>
<div class="m"><span>${t("الحجم: ", "Size: ")}${JZ.esc(size)}</span><span>${STAR(5)}</span></div><h3>${JZ.esc(name)}</h3><p>${JZ.esc(desc)}</p>
<div class="r"><button class="btn b1" ${p.is_available ? `onclick="JZ.addToCart(${p.id})"` : "disabled"}>${p.is_available ? `<i class="fa-solid fa-cart-plus"></i> ${t("أضف للسلة", "Add to cart")}` : t("غير متاح", "Unavailable")}</button><span class="pr">${p.old_price ? `<s>${p.old_price}</s>` : ""}${p.price} ${t("ر.س", "SAR")}</span></div></article>`;
    })
    .join("");
}
function setLang(l) {
  lang = l;
  try {
    localStorage.lang = l;
  } catch (e) {}
  document.documentElement.lang = l;
  document.documentElement.dir = l == "ar" ? "rtl" : "ltr";
  document.querySelectorAll("[data-en]").forEach((el) => {
    if (!el.dataset.ar) el.dataset.ar = el.innerHTML;
    el.innerHTML = l == "en" ? el.dataset.en : el.dataset.ar;
  });
  document.querySelectorAll("[data-en-ph]").forEach((el) => {
    if (!el.dataset.arPh) el.dataset.arPh = el.placeholder;
    el.placeholder = l == "en" ? el.dataset.enPh : el.dataset.arPh;
  });
  const lg = $("#lg span");
  if (lg) lg.textContent = l == "en" ? "English (SAR)" : "العربية (SAR)";
  const cb = $("#cb");
  if (cb) cb.title = t("مساعد جازانا", "Jazana assistant");
  chatInit();
  shop(
    +($("#tabs .on")
      ? [...$("#tabs").children].findIndex((b) => b.classList.contains("on"))
      : 0),
  );
}
function say(m, c) {
  const d = document.createElement("div");
  d.className = c || "";
  d.textContent = m;
  $("#cm").append(d);
  $("#cm").scrollTop = 1e9;
  return d;
}
function chatInit() {
  const cm = $("#cm");
  if (!cm) return;
  cm.innerHTML = "";
  hist = [];
  say(
    t(
      "أهلا بك في جازانا! اسألني عن أي شيء:",
      "Welcome to Jazana! Ask me anything:",
    ),
  );
  $("#ci").placeholder = t("اكتب سؤالك هنا...", "Type your question...");
  $("#cwt").textContent = t("مساعد جازانا", "Jazana assistant");
  $("#cwa").innerHTML =
    '<i class="fa-brands fa-whatsapp"></i> ' +
    t("تحدث مع خدمة العملاء (واتساب)", "Talk to customer service (WhatsApp)");
}
function ask(i) {
  say(t(QA[i][0], QA[i][1]), "u");
  setTimeout(() => say(t(QA[i][2], QA[i][3])), 300);
  // نسجل السؤال والرد في تاريخ المحادثة عشان الـ AI يفهم الأسئلة اللي بعدهم
  hist.push({ role: "user", content: t(QA[i][0], QA[i][1]) });
  hist.push({ role: "assistant", content: t(QA[i][2], QA[i][3]) });
  hist = hist.slice(-6);
}

/* ===== مساعد جازانا الذكي (Cloudflare Workers AI) ===== */
// بعد ما تنشر الـ Worker حط رابطه هنا
const AI_URL = "https://jazana-chat.ahmedshawky10001.workers.dev/";
let hist = [],
  busy = false;
const norm = (s) =>
  s
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي");
// كلمات تطلع رابط الواتساب مباشرة من غير ما نستهلك الـ AI
const WA_RE =
  /خدمه العملاء|موظف|مسوول|مندوب|شكوي|اشتكي|تتبع|طلبي|واتس|وتس|اكلم|اتكلم|اتواصل|رقم الجوال|رقم الهاتف|رقمكم|رقم التواصل|whatsapp|human|agent|support|customer service|complain|track|talk to|phone number/;
function waLink() {
  return (
    "https://wa.me/" +
    WA +
    "?text=" +
    encodeURIComponent(
      t("السلام عليكم، أحتاج مساعدة بخصوص جازانا للغذاء", "Hello, I need help with Jazana Food"),
    )
  );
}
function sayWA(m) {
  const d = document.createElement("div");
  d.append(m);
  const a = document.createElement("a");
  a.className = "wl";
  a.href = waLink();
  a.target = "_blank";
  a.rel = "noopener";
  a.innerHTML = '<i class="fa-brands fa-whatsapp"></i> ' + t("تواصل عبر واتساب", "Chat on WhatsApp");
  d.append(document.createElement("br"), a);
  $("#cm").append(d);
  $("#cm").scrollTop = 1e9;
}
// خدمة العملاء مفتوحة؟ (9 ص - 10 م بتوقيت السعودية) - بنستخدمها بس لو الـ AI وقع
function csOpenNow() {
  const h = parseInt(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Riyadh", hour: "2-digit", hourCycle: "h23" }).format(new Date()),
    10,
  );
  return h >= 9 && h < 22;
}
function csFallbackMsg() {
  return csOpenNow()
    ? t(
        "بكل سرور! فريق خدمة العملاء متواجد يوميا من 9 صباحا حتى 10 مساء.",
        "Of course! Our customer service team is available daily from 9 AM to 10 PM.",
      )
    : t(
        "فريق خدمة العملاء مغلق حاليا، ويعمل يوميا من 9 صباحا حتى 10 مساء بتوقيت السعودية. تقدر تبعت رسالتك على واتساب.",
        "Customer service is closed right now. It works daily from 9 AM to 10 PM Saudi time. You can still send your message on WhatsApp.",
      );
}
async function submitChat() {
  const inp = $("#ci");
  const txt = inp.value.trim().slice(0, 300);
  if (!txt || busy) return;
  inp.value = "";
  say(txt, "u");
  if (AI_URL.startsWith("PUT_")) {
    sayWA(t("تواصل معنا مباشرة على واتساب.", "Please contact us directly on WhatsApp."));
    return;
  }
  busy = true;
  $("#csd").disabled = true;
  const tp = say(t("جاري الكتابة...", "Typing..."), "tp");
  hist.push({ role: "user", content: txt });
  hist = hist.slice(-6);
  const ctl = new AbortController();
  const to = setTimeout(() => ctl.abort(), 20000);
  try {
    const r = await fetch(AI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: hist, lang }),
      signal: ctl.signal,
    });
    if (!r.ok) throw new Error("bad");
    const j = await r.json();
    if (!j.reply) throw new Error("empty");
    tp.remove();
    hist.push({ role: "assistant", content: j.reply });
    hist = hist.slice(-6);
    if (j.wa) sayWA(j.reply);
    else say(j.reply);
  } catch (e) {
    tp.remove();
    hist.pop();
    if (WA_RE.test(norm(txt))) {
      sayWA(csFallbackMsg());
    } else {
      sayWA(
        t(
          "عذرا، المساعد غير متاح حاليا. تواصل معنا على واتساب.",
          "Sorry, the assistant is unavailable right now. Please chat with us on WhatsApp.",
        ),
      );
    }
  } finally {
    clearTimeout(to);
    busy = false;
    $("#csd").disabled = false;
    inp.focus();
  }
}

$("#lg").onclick = () => setLang(lang == "ar" ? "en" : "ar");
$("#csd").onclick = submitChat;
$("#ci").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.isComposing) {
    e.preventDefault();
    submitChat();
  }
});
chatInit();
loadProducts();
if (lang == "en") setLang("en");

/* ===== ربط البحث ===== */
(() => {
  const f = document.querySelector("form.sr");
  if (!f) return;
  f.addEventListener("submit", (e) => {
    e.preventDefault();
    runSearch();
    const i = srInput();
    if (i) i.blur(); // يقفل الكيبورد على الموبايل عشان النتائج تبان
  });
  srInput().addEventListener("input", (e) => {
    if (!e.target.value.trim() && sq) {
      sq = "";
      refreshShop();
    }
  });
  const q0 = new URLSearchParams(location.search).get("q");
  if (q0 && $("#pg")) {
    srInput().value = q0;
    sq = q0.trim();
    refreshShop();
  }
})();

/* ===== إصلاحات القائمة الجانبية في الموبايل ===== */
function openNav() {
  $(".nav").classList.add("on");
  document.body.style.overflow = "hidden";
  $("#mb").setAttribute("aria-expanded", "true");
}
function closeNav() {
  $(".nav").classList.remove("on");
  document.body.style.overflow = "";
  $("#mb").setAttribute("aria-expanded", "false");
}
$("#mb").onclick = openNav;
$("#nx").onclick = closeNav;
document
  .querySelectorAll(".nav a")
  .forEach((a) => a.addEventListener("click", closeNav));
/* إغلاق بالضغط خارج القائمة أو بزر Escape */
document.addEventListener("click", (e) => {
  const nv = $(".nav");
  if (
    nv.classList.contains("on") &&
    !nv.contains(e.target) &&
    !e.target.closest("#mb")
  )
    closeNav();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeNav();
    const cw = $("#cw");
    if (cw) cw.classList.remove("on");
  }
});
if (/(about|privacy|returns|factory)\.html/.test(location.pathname))
  document.querySelectorAll(".cur").forEach((e) => e.classList.remove("cur"));

(() => {
  const els = document.querySelectorAll(
    ".fs>div,.st,.wb,.ab .c>*,.rv>div,.fq>*,.page>*",
  );
  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }),
    { threshold: 0.12 },
  );
  els.forEach((el, i) => {
    el.classList.add("rvl");
    el.style.transitionDelay = (i % 4) * 70 + "ms";
    io.observe(el);
  });
})();

/* لو الشاشة كبرت (تدوير/تغيير حجم) والقائمة مفتوحة - اقفلها وفك قفل السكرول */
window.matchMedia("(min-width:701px)").addEventListener("change", (m) => {
  if (m.matches) closeNav();
});

/* ===== عرض صور المعرض كاملة عند الضغط عليها ===== */
(() => {
  const imgs = [...document.querySelectorAll(".mg .mp img")];
  if (!imgs.length) return;
  const lb = document.createElement("div");
  lb.id = "lb";
  lb.setAttribute("role", "dialog");
  lb.setAttribute("aria-modal", "true");
  lb.innerHTML =
    '<button class="lx" aria-label="close"><i class="fa-solid fa-xmark"></i></button>' +
    '<button class="lp" aria-label="previous"><i class="fa-solid fa-chevron-left"></i></button>' +
    '<img alt=""><button class="ln" aria-label="next"><i class="fa-solid fa-chevron-right"></i></button>';
  document.body.append(lb);
  const big = lb.querySelector("img");
  let cur = 0;
  const show = (i) => {
    cur = (i + imgs.length) % imgs.length;
    big.src = imgs[cur].currentSrc || imgs[cur].src;
    big.alt = imgs[cur].alt;
  };
  const open = (i) => {
    show(i);
    lb.classList.add("on");
    document.body.style.overflow = "hidden";
  };
  const close = () => {
    lb.classList.remove("on");
    document.body.style.overflow = "";
  };
  imgs.forEach((im, i) => im.addEventListener("click", () => open(i)));
  lb.addEventListener("click", (e) => {
    if (e.target === lb) close();
  });
  lb.querySelector(".lx").onclick = close;
  lb.querySelector(".lp").onclick = () => show(cur - 1);
  lb.querySelector(".ln").onclick = () => show(cur + 1);
  document.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("on")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(cur - 1);
    if (e.key === "ArrowRight") show(cur + 1);
  });
})();

/* ===== كنترول الفيديو المخصص (بديل الشكل التقليدي) ===== */
document.querySelectorAll(".mv video").forEach((v) => {
  const box = v.parentElement;
  v.controls = false;
  const fmt = (s) => {
    s = Math.max(0, Math.floor(s || 0));
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  };
  const vc = document.createElement("div");
  vc.className = "vc";
  vc.innerHTML =
    '<button class="vbig" aria-label="play"><i class="fa-solid fa-play"></i></button>' +
    '<div class="vbar"><button class="vp" aria-label="play/pause"><i class="fa-solid fa-play"></i></button>' +
    '<span class="vt">0:00</span><div class="vs"><div class="vf"></div></div><span class="vd">0:00</span>' +
    '<button class="vm" aria-label="mute"><i class="fa-solid fa-volume-high"></i></button>' +
    '<button class="vfs" aria-label="fullscreen"><i class="fa-solid fa-expand"></i></button></div>';
  box.append(vc);
  const q = (s) => vc.querySelector(s);
  const vp = q(".vp i"), vm = q(".vm i"), vf = q(".vf"), vs = q(".vs");
  let timer;
  const wake = () => {
    box.classList.remove("idle");
    clearTimeout(timer);
    timer = setTimeout(() => box.classList.add("idle"), 2500);
  };
  const toggle = () => (v.paused ? v.play() : v.pause());
  v.addEventListener("play", () => {
    box.classList.add("playing");
    vp.className = "fa-solid fa-pause";
    wake();
  });
  v.addEventListener("pause", () => {
    box.classList.remove("playing", "idle");
    vp.className = "fa-solid fa-play";
  });
  v.addEventListener("ended", () => {
    v.currentTime = 0;
  });
  v.addEventListener("loadedmetadata", () => (q(".vd").textContent = fmt(v.duration)));
  v.addEventListener("timeupdate", () => {
    q(".vt").textContent = fmt(v.currentTime);
    vf.style.width = (v.duration ? (v.currentTime / v.duration) * 100 : 0) + "%";
  });
  v.addEventListener("click", toggle);
  q(".vbig").onclick = toggle;
  q(".vp").onclick = toggle;
  q(".vm").onclick = () => {
    v.muted = !v.muted;
    vm.className = v.muted ? "fa-solid fa-volume-xmark" : "fa-solid fa-volume-high";
  };
  q(".vfs").onclick = () => {
    const fs = document.fullscreenElement || document.webkitFullscreenElement;
    if (fs) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else if (box.requestFullscreen) box.requestFullscreen();
    else if (box.webkitRequestFullscreen) box.webkitRequestFullscreen();
    else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
  };
  const seek = (e) => {
    const r = vs.getBoundingClientRect();
    if (v.duration) v.currentTime = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * v.duration;
  };
  vs.addEventListener("pointerdown", (e) => {
    vs.setPointerCapture(e.pointerId);
    vs.classList.add("drag");
    seek(e);
  });
  vs.addEventListener("pointermove", (e) => vs.classList.contains("drag") && seek(e));
  vs.addEventListener("pointerup", () => vs.classList.remove("drag"));
  box.addEventListener("mousemove", wake);
  box.addEventListener("touchstart", wake, { passive: true });
});

/* ===== الشات على الموبايل: يتظبط مع المساحة المرئية فوق الكيبورد ===== */
(() => {
  const vv = window.visualViewport,
    cw = $("#cw");
  if (!vv || !cw) return;
  const fit = () => {
    // الكيبورد مفتوح = المساحة المرئية أقصر بوضوح من ارتفاع الصفحة (على الموبايل بس)
    const kb = cw.classList.contains("on") && window.innerWidth <= 700 && window.innerHeight - vv.height > 120;
    cw.classList.toggle("kb", kb);
    if (kb) {
      cw.style.setProperty("--kbt", Math.round(vv.offsetTop + 8) + "px");
      cw.style.setProperty("--kbh", Math.round(vv.height - 16) + "px");
      const cm = $("#cm");
      if (cm) cm.scrollTop = cm.scrollHeight;
    } else {
      cw.style.removeProperty("--kbt");
      cw.style.removeProperty("--kbh");
    }
  };
  vv.addEventListener("resize", fit);
  vv.addEventListener("scroll", fit);
  window.addEventListener("orientationchange", () => setTimeout(fit, 300));
  // لما الشات يتفتح/يتقفل
  new MutationObserver(fit).observe(cw, { attributes: true, attributeFilter: ["class"] });
})();