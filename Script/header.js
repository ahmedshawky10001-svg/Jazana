var ROOT = location.pathname.indexOf("/pages/") > -1 ? "../" : "";
var fixPaths = (s) =>
  s
    .replace(/href="index\.html/g, 'href="' + ROOT + "index.html")
    .replace(
      /href="(about|privacy|returns|factory)\.html/g,
      'href="' + ROOT + "pages/$1.html",
    )
    .replace(/src="imges\//g, 'src="' + ROOT + "imges/");
// الهيدر - بيتحط تلقائي في أول الصفحة
const HEAD = `<div class="top"><div class="c"><span><b data-en="Jazana Food">جازانا للغذاء</b> | <i class="fa-solid fa-phone"></i> <a href="tel:+966539849430" dir="ltr">+966 53 984 9430</a></span>
<span><i class="fa-solid fa-leaf"></i> <span data-en="Free shipping on orders over 200 SAR | Natural sesame oil">شحن مجاني للطلبات فوق 200 ريال | زيت سمسم بلدي طبيعي</span></span>
<button id="lg" aria-label="language"><i class="fa-solid fa-globe"></i> <span>العربية (SAR)</span></button></div></div>
<div class="hd"><div class="c"><button class="mb" id="mb" aria-label="menu"><i class="fa-solid fa-bars"></i></button><a class="logo" href="index.html"><span class="ph"><img src="imges/logo.png" alt="جازانا"></span><span data-en="Jazana">جازانا</span></a>
<form class="sr" onsubmit="return false"><input data-en-ph="Search Jazana sesame oil, packages, offers…" placeholder="ابحث في منتجات جازانا (زيت سمسم بلدي، باقات، عروض)…"><button aria-label="search"><i class="fa-solid fa-magnifying-glass"></i></button></form>
<div class="ac"><span class="it"><i class="fa-regular fa-heart"></i><span class="t" data-en="Wishlist">المفضلة</span></span><span class="it"><i class="fa-regular fa-user"></i><span class="t" data-en="Account">حسابي</span></span><span class="cart"><i class="fa-solid fa-bag-shopping"></i><span class="t" data-en="Cart">السلة</span> <b id="ct">0</b> <span class="t" data-en="SAR">ر.س</span></span></div></div>
<nav class="nav"><div class="c"><button class="x" id="nx" aria-label="close"><i class="fa-solid fa-xmark"></i></button>
<a class="cur" href="index.html"><i class="fa-solid fa-house"></i><span data-en="Home">الرئيسية</span></a><a href="index.html#shop"><i class="fa-solid fa-store"></i><span data-en="Shop">متجر المنتجات</span></a><a href="index.html#story"><i class="fa-solid fa-book-open"></i><span data-en="Our Story">قصة جازانا</span></a><a href="index.html#certs"><i class="fa-solid fa-certificate"></i><span data-en="Lab Tests & Certificates">التحاليل والشهادات</span></a><a href="index.html#faq"><i class="fa-regular fa-circle-question"></i><span data-en="FAQ">الأسئلة الشائعة</span></a><a href="#contact"><i class="fa-solid fa-phone"></i><span data-en="Contact Us">تواصل معنا</span></a>
<small data-en="The press is currently running | Fast shipping across the Kingdom">المعصرة تعمل حاليا | شحن فوري لجميع المناطق</small></div></nav></div>`;

document.body.insertAdjacentHTML(
  "afterbegin",
  fixPaths('<div id="h">' + HEAD + "</div>"),
);
