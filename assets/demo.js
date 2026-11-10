// Demonstrações interativas da página inicial (PT e EN).
// 1) Minijogos: ver games.js.
// 2) [data-demo="remote"]: controle remoto que navega numa tela de apps fictícia.
// Tudo roda localmente; nada é enviado.
(function () {
  "use strict";
  var en = (document.documentElement.lang || "").indexOf("en") === 0;
  var T = en
    ? { score: "Stars", opening: "Opening", paused: "Paused", playing: "Playing", muted: "Muted", vol: "Volume", home: "Home", pad: "Controller connected: " }
    : { score: "Estrelas", opening: "Abrindo", paused: "Pausado", playing: "Reproduzindo", muted: "Sem som", vol: "Volume", home: "Início", pad: "Controle conectado: " };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  // ------------------------------------------------------------------ 2. Controle remoto → TV
  function remoteDemo(root) {
    var tiles = Array.prototype.slice.call(root.querySelectorAll(".tile"));
    var openView = root.querySelector(".tv-open");
    var openTitle = root.querySelector(".tv-open strong");
    var openState = root.querySelector(".tv-open span");
    var volBox = root.querySelector(".tv-vol");
    var volBar = root.querySelector(".tv-vol i");
    var volLabel = root.querySelector(".tv-vol span");
    var live = root.querySelector(".remote-live");
    var cols = 3, focus = 0, volume = 40, muted = false, playing = true, volTimer = 0;

    function render() {
      tiles.forEach(function (t, i) { t.classList.toggle("focus", i === focus); });
    }
    function showVol() {
      volBox.hidden = false;
      volBar.style.width = (muted ? 0 : volume) + "%";
      volLabel.textContent = muted ? T.muted : T.vol + " " + volume;
      live.textContent = volLabel.textContent;
      clearTimeout(volTimer);
      volTimer = setTimeout(function () { volBox.hidden = true; }, 1600);
    }
    function open() {
      var name = tiles[focus].textContent.trim();
      openTitle.textContent = T.opening + " " + name + "…";
      playing = true;
      openState.textContent = "▶ " + T.playing;
      openView.hidden = false;
      live.textContent = openTitle.textContent;
    }
    function home() {
      openView.hidden = true;
      live.textContent = T.home;
    }

    var actions = {
      up: function () { if (openView.hidden && focus >= cols) focus -= cols; },
      down: function () { if (openView.hidden && focus + cols < tiles.length) focus += cols; },
      left: function () { if (openView.hidden && focus % cols) focus--; },
      right: function () { if (openView.hidden && focus % cols < cols - 1 && focus + 1 < tiles.length) focus++; },
      ok: function () { if (openView.hidden) open(); },
      back: home,
      home: home,
      menu: function () { live.textContent = "Menu"; },
      volup: function () { muted = false; volume = Math.min(100, volume + 5); showVol(); },
      voldown: function () { muted = false; volume = Math.max(0, volume - 5); showVol(); },
      mute: function () { muted = !muted; showVol(); },
      play: function () {
        if (openView.hidden) return;
        playing = !playing;
        openState.textContent = playing ? "▶ " + T.playing : "❚❚ " + T.paused;
        live.textContent = openState.textContent;
      },
    };

    root.querySelectorAll("[data-key]").forEach(function (b) {
      var hold = 0;
      function run() { actions[b.dataset.key](); render(); }
      b.addEventListener("click", function (e) { if (e.detail === 0) run(); }); // teclado/leitor de tela
      // Segurar repete, como no app.
      b.addEventListener("pointerdown", function (e) {
        stop();
        run();
        hold = setTimeout(function () { hold = setInterval(run, 120); }, 380);
        if (b.setPointerCapture) b.setPointerCapture(e.pointerId);
      });
      function stop() { clearTimeout(hold); clearInterval(hold); hold = 0; }
      b.addEventListener("pointerup", stop);
      b.addEventListener("pointercancel", stop);
      b.addEventListener("pointerleave", stop);
    });

    root.addEventListener("keydown", function (e) {
      var map = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", Escape: "back", Backspace: "back" };
      var k = map[e.key];
      if (!k || e.target.closest("button")) return;
      e.preventDefault();
      actions[k]();
      render();
    });
    render();
  }

  // ------------------------------------------------------------------ 3. Vídeos: botão pausar/tocar
  // Quem pediu menos movimento no sistema recebe os vídeos parados (no pôster) e pode tocá-los pelo botão.
  document.querySelectorAll("[data-video]").forEach(function (btn) {
    var v = document.getElementById(btn.dataset.video);
    if (!v) return;
    var bg = btn.dataset.video === "hero-video";
    var L = en
      ? { pause: bg ? "❚❚ Pause background video" : "❚❚ Pause video", play: bg ? "▶ Play background video" : "▶ Play video" }
      : { pause: bg ? "❚❚ Pausar vídeo de fundo" : "❚❚ Pausar vídeo", play: bg ? "▶ Tocar vídeo de fundo" : "▶ Tocar vídeo" };
    function label() { btn.textContent = v.paused ? L.play : L.pause; }
    if (reduce) { v.removeAttribute("autoplay"); v.pause(); }
    btn.addEventListener("click", function () {
      if (v.paused) { var p = v.play(); if (p && p.catch) p.catch(label); } else v.pause();
    });
    v.addEventListener("play", label);
    v.addEventListener("pause", label);
    label();
  });

  // ------------------------------------------------------------------ 4. Doação: valores, Pix e dólar
  // Cada valor abre a cobrança Pix do Nubank correspondente (página com QR code e copia e cola).
  // O QR code do site leva a esse link: no computador, a pessoa aponta a câmera do celular.
  var DONATE = {
    2: "https://nubank.com.br/cobrar/1k4bz/6af35490-6212-44c7-a0ef-4b4fbcf9821f",
    5: "https://nubank.com.br/cobrar/1k4bz/6af354c3-b715-4eba-8af1-00329c628225",
    10: "https://nubank.com.br/cobrar/1k4bz/6af3550d-ef3e-47c3-aa87-0f9ab0b30e5d",
    50: "https://nubank.com.br/cobrar/1k4bz/6af3552d-7ed3-4758-976c-75d32e21add7",
    100: "https://nubank.com.br/cobrar/1k4bz/6af35553-7b57-4628-97d2-d31eb75d4b07",
  };
  var amount = 5;
  var usdPerBrl = null;

  function brl(v) { return en ? "R$" + v.toFixed(2) : "R$ " + v.toFixed(2).replace(".", ","); }
  function brlShort(v) { return en ? "R$" + v : "R$ " + v; }
  function usd(v) {
    var x = v * usdPerBrl;
    return en ? "≈ US$" + x.toFixed(2) : "≈ US$ " + x.toFixed(2).replace(".", ",");
  }

  function renderDonation() {
    var url = DONATE[amount];
    document.querySelectorAll(".amount").forEach(function (b) {
      b.setAttribute("aria-checked", String(Number(b.dataset.brl) === amount));
    });
    document.querySelectorAll("[data-donate-link]").forEach(function (a) { a.href = url; });
    document.querySelectorAll("[data-donate-amount]").forEach(function (el) { el.textContent = brlShort(amount); });
    document.querySelectorAll("[data-qr-amount]").forEach(function (el) {
      el.textContent = brl(amount) + (usdPerBrl ? "  (" + usd(amount) + ")" : "");
    });
    if (typeof qrcode !== "function") return; // sem a biblioteca: fica só o botão
    var qr = qrcode(0, "M");
    qr.addData(url);
    qr.make();
    document.querySelectorAll("#pix-qr").forEach(function (box) {
      box.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
      box.setAttribute("aria-label", (en ? "QR code with the Pix donation link for " : "QR code com o link de doação Pix de ") + brl(amount));
    });
  }

  document.querySelectorAll(".amount").forEach(function (b) {
    b.addEventListener("click", function () { amount = Number(b.dataset.brl); renderDonation(); });
    b.addEventListener("keydown", function (e) {
      var list = Array.prototype.slice.call(document.querySelectorAll(".amount"));
      var i = list.indexOf(b), d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!d) return;
      e.preventDefault();
      var next = list[(i + d + list.length) % list.length];
      next.focus();
      next.click();
    });
  });

  // Cotação do dólar do dia (serviço público, sem chave). Se falhar, os valores em dólar não aparecem.
  function showRate(rate, when, source) {
    usdPerBrl = rate;
    document.querySelectorAll("[data-usd]").forEach(function (el) { el.textContent = usd(Number(el.dataset.usd)); });
    document.querySelectorAll(".usd-inline").forEach(function (el) { el.textContent = " (" + el.textContent + ")"; });
    var d = when ? new Date(when) : null;
    var day = d && !isNaN(d) ? d.toLocaleDateString(en ? "en-US" : "pt-BR") : "";
    document.querySelectorAll("[data-rate-note]").forEach(function (el) {
      el.textContent = (en ? "Dollar values are estimates: US$1 = R$" : "Valores em dólar aproximados: US$ 1 = R$ ") +
        (1 / rate).toFixed(2).replace(".", en ? "." : ",") + (day ? (en ? " on " : " em ") + day : "") + " (" + source + ").";
    });
    renderDonation();
  }
  if (document.querySelector("[data-usd]") && window.fetch) {
    fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL")
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var bid = parseFloat(j.USDBRL.bid);
        if (!(bid > 0)) throw new Error("cotação inválida");
        showRate(1 / bid, j.USDBRL.create_date.replace(" ", "T"), "AwesomeAPI");
      })
      .catch(function () {
        return fetch("https://open.er-api.com/v6/latest/BRL")
          .then(function (r) { return r.json(); })
          .then(function (j) { if (j.rates && j.rates.USD > 0) showRate(j.rates.USD, j.time_last_update_unix * 1000, "ExchangeRate-API"); });
      })
      .catch(function () { /* sem cotação: só os valores em reais */ });
  }
  renderDonation();

  document.querySelectorAll('[data-demo="remote"]').forEach(remoteDemo);
})();
