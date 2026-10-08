// الفوتر + زر الشات - بيتحطوا تلقائي في آخر الصفحة
const WA = "966539849430";
const FOOT = `<footer class="ft" id="contact"><div class="c"><div>
<div><a class="logo" href="index.html"><span class="ph"><img src="imges/logo.png" alt="جازانا" loading="lazy"></span><span data-en="Jazana | Jazan">جازانا | جازان</span></a><p data-en="Jazana Food store specializes in producing and supplying natural local sesame oil, with high quality and authentic taste from the heart of Jazan.">متجر جازانا للغذاء متخصص في إنتاج وتوفير زيت السمسم البلدي الطبيعي، بجودة عالية وطعم أصيل من قلب جازان.</p></div>
<div><h3 data-en="Important links">روابط مهمة</h3><ul><li><a href="index.html" data-en="Home">الرئيسية</a></li><li><a href="about.html" data-en="About Us">من نحن</a></li><li><a href="privacy.html" data-en="Usage & Privacy Policy">سياسة الاستخدام والخصوصية</a></li><li><a href="returns.html" data-en="Exchange & Return Policy">سياسة الاستبدال والاسترجاع</a></li><li><a href="factory.html" data-en="About Jazana Food">عن جازانا للغذاء</a></li></ul></div>
<div><h3 data-en="Customer service">خدمة العملاء</h3><p><i class="fa-regular fa-clock"></i><span data-en="Our team is available daily 9am–10pm">فريقنا متواجد لخدمتكم يوميا من الساعة 9 صباحا حتى 10 مساء</span></p><p><i class="fa-solid fa-phone"></i><span dir="ltr">+966 53 984 9430</span></p><p><i class="fa-regular fa-envelope"></i>admin@jazanaa.com</p><p><i class="fa-solid fa-location-dot"></i><span data-en="Jazan, Saudi Arabia">جازان - المملكة العربية السعودية</span></p></div>
<div><h3 data-en="Follow us">تابعنا على المنصات</h3><div class="so"><a href="https://instagram.com/" target="_blank" rel="noopener" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a><a href="https://tiktok.com/" target="_blank" rel="noopener" aria-label="TikTok"><i class="fa-brands fa-tiktok"></i></a><a href="https://snapchat.com/" target="_blank" rel="noopener" aria-label="Snapchat"><i class="fa-brands fa-snapchat"></i></a></div></div></div>
<div class="cp"><span data-en="All rights reserved to Jazana Food © 2025">جميع الحقوق محفوظة لجازانا للغذاء © 2025</span><span class="pm"><span data-en="Cash on delivery">الدفع عند الاستلام</span><span>tabby</span><span>tamara</span></span></div></div></footer>
<nav class="bn"><a class="cur" href="index.html"><i class="fa-solid fa-house"></i><span data-en="Home">الرئيسية</span></a><a href="index.html#shop"><i class="fa-solid fa-store"></i><span data-en="Shop">المتجر</span></a><a href="index.html#faq"><i class="fa-regular fa-circle-question"></i><span data-en="FAQ">الأسئلة</span></a><a href="#contact"><i class="fa-solid fa-phone"></i><span data-en="Contact">تواصل</span></a></nav>`;

document.body.insertAdjacentHTML(
  "beforeend",
  fixPaths(FOOT) +
  `<button id="cb" aria-label="chat" onclick="document.getElementById('cw').classList.toggle('on')"><i class="fa-solid fa-comments"></i></button>
<div id="cw"><header id="cwt"></header><div id="cm"></div><div id="cq"></div><a class="wa" id="cwa" target="_blank" rel="noopener" href="https://wa.me/${WA}"></a></div>`,
);
