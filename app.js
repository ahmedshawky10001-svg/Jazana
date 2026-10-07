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
    "زيت سمسم بلدي 21 ريال، وعرض العبوتين بـ 38 ريال.",
    "Local sesame oil is 21 SAR; the 2-bottle offer is 38 SAR.",
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
    "نعم، الدفع عند الاستلام متاح، ومعه مدى وفيزا وApple Pay وتابي وتمارا.",
    "Yes, plus mada, Visa, Apple Pay, tabby and tamara.",
  ],
  [
    "كيف أسترجع المنتج؟",
    "How do I return a product?",
    "الاسترجاع خلال 15 يوما من الاستلام، ونتحمل شحن الإرجاع (الضمان الذهبي).",
    "Returns within 15 days; we cover return shipping (Golden Guarantee).",
  ],
  [
    "هل تبيعون جملة؟",
    "Do you sell wholesale?",
    "نعم، لدينا أسعار خاصة للجملة والمطاعم. تواصل معنا لعرض سعر.",
    "Yes, special prices for wholesale and restaurants. Contact us for a quote.",
  ],
];

const PR = {
  bundle: [
    "عبوتان من زيت السمسم البلدي",
    "Local Sesame Oil – 2 bottles",
    "وفّر 4 ر.س عند شراء عبوتين",
    "Save 4 SAR on two bottles",
    38,
    42,
    "هدية",
    "Gift",
    "imges/an offer.webp",
  ],
  oil: [
    "زيت سمسم بلدي",
    "Local Sesame Oil",
    "معصور على البارد من بذور جازان، بدون أي إضافات.",
    "Cold-pressed from Jazan seeds, no additives.",
    21,
    0,
    "",
    "",
    "imges/The Product.webp",
  ],
};
const TABS = [
  ["الأكثر مبيعا", "Best sellers", "oil", "الأكثر مبيعا", "Best seller"],
  ["أحدث المنتجات", "Newest", "oil", "جديد", "New"],
  [
    "زيت السمسم البلدي",
    "Local sesame oil",
    "oil",
    "طبيعي 100%",
    "100% natural",
  ],
  ["باقات الهدايا والتوفير", "Gifts & savings", "bundle", "عرض", "Offer"],
];

function shop(i = 0) {
  const g = $("#tabs");
  if (!g) return;
  g.innerHTML = TABS.map(
    (x, k) =>
      `<button class="${k == i ? "on" : ""}" onclick="shop(${k})">${t(x[0], x[1])}</button>`,
  ).join("");
  const p = PR[TABS[i][2]],
    e = lang == "en";
  $("#pg").innerHTML =
    `<article class="pd"><span class="hrt"><i class="fa-regular fa-heart"></i></span><span class="bdg">${t(TABS[i][3], TABS[i][4])}</span><div class="ph"><img src="${p[8]}" alt="${p[e ? 1 : 0]}" loading="lazy"></div>
<div class="m"><span>${t("الحجم: 500 مل", "Size: 500 ml")}</span><span>${STAR(5)}</span></div><h3>${p[e ? 1 : 0]}</h3><p>${p[e ? 3 : 2]}</p>
<div class="r"><button class="btn b1" onclick="add(${p[4]})"><i class="fa-solid fa-cart-plus"></i> ${t("أضف للسلة", "Add to cart")}</button><span class="pr">${p[5] ? `<s>${p[5]}</s>` : ""}${p[4]} ${t("ر.س", "SAR")}</span></div></article>`;
}
function add(v) {
  cart += v;
  $("#ct").textContent = cart;
  const c = $(".cart");
  c.classList.remove("bump");
  void c.offsetWidth;
  c.classList.add("bump");
}
function setLang(l) {
  lang = l;
  try {
    localStorage.lang = l;
  } catch (e) {}
  document.documentElement.lang = l;
  document.documentElement.dir = l == "ar" ? "rtl" : "ltr";
  document.querySelectorAll("[data-en]").forEach((el) => {
    if (!el.dataset.ar) el.dataset.ar = el.textContent;
    el.textContent = l == "en" ? el.dataset.en : el.dataset.ar;
  });
  document.querySelectorAll("[data-en-ph]").forEach((el) => {
    if (!el.dataset.arPh) el.dataset.arPh = el.placeholder;
    el.placeholder = l == "en" ? el.dataset.enPh : el.dataset.arPh;
  });
  const lg = $("#lg span");
  if (lg) lg.textContent = l == "en" ? "English (SAR)" : "العربية (SAR)";
  const cb = $("#cb");
  if (cb) cb.title = t("مساعد جازانة", "Jazana assistant");
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
}
function chatInit() {
  const cm = $("#cm");
  if (!cm) return;
  cm.innerHTML = "";
  say(
    t(
      "أهلا بك في جازانة! اختر سؤالا من الأسفل:",
      "Welcome to Jazana! Pick a question below:",
    ),
  );
  $("#cq").innerHTML = QA.map(
    (q, i) => `<button onclick="ask(${i})">${t(q[0], q[1])}</button>`,
  ).join("");
  $("#cwt").textContent = t("مساعد جازانة", "Jazana assistant");
  $("#cwa").innerHTML =
    '<i class="fa-brands fa-whatsapp"></i> ' +
    t("تحدث مع خدمة العملاء (واتساب)", "Talk to customer service (WhatsApp)");
}
function ask(i) {
  say(t(QA[i][0], QA[i][1]), "u");
  setTimeout(() => say(t(QA[i][2], QA[i][3])), 300);
}

$("#lg").onclick = () => setLang(lang == "ar" ? "en" : "ar");
chatInit();
shop(0);
if (lang == "en") setLang("en");

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
