/* Joyfone: movimento e interação do site (barra de progresso, cabeçalho, fundo do topo, revelação ao rolar,
   cartões que inclinam com o mouse). Não mexe nos minijogos ([data-games]). Com "reduzir movimento" ligado,
   só a sombra do cabeçalho e a barra de progresso ficam ativas. */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // ---- Barra de progresso da rolagem e sombra do cabeçalho
  var bar = document.createElement("div");
  bar.className = "scroll-progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);
  var head = document.querySelector(".site-head");
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.setProperty("--progress", max > 0 ? Math.min(1, window.scrollY / max).toFixed(4) : 0);
      if (head) head.classList.toggle("scrolled", window.scrollY > 8);
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();

  if (reduce) return;

  // ---- Fundo do topo: orbes coloridos e símbolos de controle subindo
  var hero = document.querySelector(".hero");
  if (hero) {
    var orbs = document.createElement("div");
    orbs.className = "hero-orbs";
    orbs.setAttribute("aria-hidden", "true");
    orbs.innerHTML = "<i></i><i></i><i></i>";
    hero.insertBefore(orbs, hero.firstChild);
    var glyphs = ["A", "B", "X", "Y", "▲", "●", "■", "✚"];
    for (var g = 0; g < 10; g++) {
      var s = document.createElement("span");
      s.className = "hero-spark";
      s.setAttribute("aria-hidden", "true");
      s.textContent = glyphs[g % glyphs.length];
      s.style.left = (4 + Math.random() * 92).toFixed(1) + "%";
      s.style.top = (70 + Math.random() * 40).toFixed(1) + "%";
      s.style.fontSize = (0.8 + Math.random() * 0.9).toFixed(2) + "rem";
      s.style.animationDuration = (9 + Math.random() * 9).toFixed(1) + "s";
      s.style.animationDelay = (-Math.random() * 18).toFixed(1) + "s";
      hero.appendChild(s);
    }
  }

  // ---- Revelação ao rolar: cabeçalhos de seção, cartões, passos e perguntas, em cascata
  if ("IntersectionObserver" in window) {
    var targets = document.querySelectorAll("main section .head, .card, .steps li, .faq details, .faq h2, .prose > *, .qr-card, .note");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    Array.prototype.forEach.call(targets, function (el) {
      if (el.closest("[data-games]") || el.closest(".hero")) return;
      var siblings = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.style.setProperty("--delay", Math.min(siblings, 6) * 0.07 + "s");
      el.classList.add("reveal");
      io.observe(el);
    });
    document.documentElement.classList.add("fx");

    // Segurança: nada fica invisível se o observador não disparar (impressão, captura de tela, navegador antigo).
    function revealPassed(all) {
      Array.prototype.forEach.call(document.querySelectorAll(".reveal:not(.in)"), function (el) {
        if (all || el.getBoundingClientRect().top < window.innerHeight) el.classList.add("in");
      });
    }
    setTimeout(function () { revealPassed(false); }, 2500);
    window.addEventListener("beforeprint", function () { revealPassed(true); });
  }

  // ---- Cartões: inclinação 3D e brilho que segue o mouse (só com mouse, não no toque)
  if (finePointer) {
    Array.prototype.forEach.call(document.querySelectorAll(".card"), function (card) {
      if (card.closest("[data-games]")) return;
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width;
        var y = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
        card.style.setProperty("--my", (y * 100).toFixed(1) + "%");
        card.style.transform = "perspective(800px) rotateX(" + ((0.5 - y) * 7).toFixed(2) + "deg) rotateY(" +
          ((x - 0.5) * 9).toFixed(2) + "deg) translateY(-4px)";
      });
      card.addEventListener("pointerleave", function () { card.style.transform = ""; });
    });

    // Botões principais puxam levemente na direção do mouse (efeito "magnético").
    Array.prototype.forEach.call(document.querySelectorAll(".actions .btn"), function (btn) {
      if (btn.closest("[data-games]")) return;
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        btn.style.translate = (dx * 8).toFixed(1) + "px " + (dy * 6).toFixed(1) + "px";
      });
      btn.addEventListener("pointerleave", function () { btn.style.translate = ""; });
    });
  }
})();
