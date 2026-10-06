/* ============ CONFIG: edita aquí antes de publicar ============ */
const CONFIG = {
  brand: "OBTURA",                       // nombre de tu marca
  announce: "Envío gratis desde 40 € · 30 días para probarla",
  price: 39.90,                          // precio unitario
  oldPrice: 49.90,                       // precio tachado (null para ocultarlo)
  pack2Discount: 0.10,                   // descuento por 2 unidades
  currency: "€",
  email: "hola@tumarca.com",
  // Enlace de pago. Placeholders: {color} {qty}
  // Ej. Shopify: "https://tutienda.myshopify.com/cart/ID:{qty}"
  // Ej. WhatsApp: "https://wa.me/34600000000?text=Quiero%20{qty}%20X9%20({color})"
  checkoutUrl: "https://wa.me/?text=Quiero%20{qty}%20X9%20({color})",
};
/* =============================================================== */

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const fmt = n => n.toFixed(2).replace(".", ",") + " " + CONFIG.currency;

// Marca, textos y precios
$$("[data-cfg=brand]").forEach(e => e.textContent = CONFIG.brand);
$$("[data-cfg=announce]").forEach(e => e.textContent = CONFIG.announce);
$$("[data-price]").forEach(e => e.textContent = fmt(CONFIG.price));
$$("[data-p1]").forEach(e => e.textContent = fmt(CONFIG.price));
const pack2 = CONFIG.price * 2 * (1 - CONFIG.pack2Discount);
$$("[data-p2]").forEach(e => e.textContent = fmt(pack2));
const old = $("[data-oldprice]"), tag = $("[data-tag]");
if (CONFIG.oldPrice) {
  old.textContent = fmt(CONFIG.oldPrice);
  tag.textContent = "-" + Math.round((1 - CONFIG.price / CONFIG.oldPrice) * 100) + "%";
} else { old.hidden = tag.hidden = true; }
$$("[data-cfg-mail]").forEach(a => a.href = "mailto:" + CONFIG.email);
$("#yr").textContent = new Date().getFullYear();

// Galería
const mainImg = $("#mainImg");
function showImg(src, alt) {
  mainImg.src = src; mainImg.alt = alt;
  $$(".gallery__thumbs button").forEach(b => b.classList.toggle("is-on", b.dataset.img === src));
}
$$(".gallery__thumbs button").forEach(b => b.addEventListener("click", () => showImg(b.dataset.img, b.dataset.alt)));

// Configurador
function state() {
  const color = $("input[name=color]:checked").value;
  const qty = +$("input[name=qty]:checked").value;
  return { color, qty, total: qty === 2 ? pack2 : CONFIG.price };
}
function update() {
  const s = state();
  $("#colorName").textContent = s.color;
  $("#total").textContent = fmt(s.total);
  $("#buyBtn").href = CONFIG.checkoutUrl.replace("{color}", encodeURIComponent(s.color)).replace("{qty}", s.qty);
}
$$("input[name=color]").forEach(i => i.addEventListener("change", () => {
  showImg(i.dataset.img, "X9 acabado " + i.value.toLowerCase());
  update();
}));
$$("input[name=qty]").forEach(i => i.addEventListener("change", update));
update();

// Aparición al scroll
const rm = matchMedia("(prefers-reduced-motion: reduce)").matches;
if ("IntersectionObserver" in window && !rm) {
  document.documentElement.classList.add("js-reveal");
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { threshold: 0.12 });
  $$(".reveal").forEach(el => io.observe(el));
}

// Barra de compra móvil: visible tras el hero y oculta sobre la sección de compra
const sticky = $("#sticky"), hero = $(".hero"), buy = $("#comprar");
let vis = { past: false, onBuy: false };
const paint = () => {
  const show = vis.past && !vis.onBuy;
  sticky.classList.toggle("on", show);
  sticky.setAttribute("aria-hidden", String(!show));
};
if ("IntersectionObserver" in window) {
  new IntersectionObserver(([e]) => { vis.past = !e.isIntersecting && e.boundingClientRect.top < 0; paint(); }).observe(hero);
  new IntersectionObserver(([e]) => { vis.onBuy = e.isIntersecting; paint(); }, { threshold: 0.15 }).observe(buy);
}
