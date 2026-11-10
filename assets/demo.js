// Demonstrações interativas da página inicial (PT e EN).
// 1) [data-demo="pad"]: analógico arrastável + A/B/X/Y movem um personagem na "TV"; aceita teclado e Gamepad API.
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

  // ------------------------------------------------------------------ 1. Controle → TV
  function padDemo(root) {
    var arena = root.querySelector(".arena");
    var player = root.querySelector(".player");
    var star = root.querySelector(".star");
    var hud = root.querySelector(".tv-hud");
    var zone = root.querySelector(".stick-zone");
    var knob = root.querySelector(".stick-knob");
    var status = root.querySelector(".pad-status");
    var colors = { b: "#ff8a7a", x: "#7aa8ff", y: "#ffd36b", a: "#3dd6c6" };
    var pos = { x: 30, y: 55 }, starPos = { x: 72, y: 35 };
    var stick = { x: 0, y: 0 }, keys = {}, boostUntil = 0, score = 0, dragging = null, last = 0;

    function placeStar() {
      starPos.x = 8 + Math.random() * 84;
      starPos.y = 12 + Math.random() * 76;
      star.style.left = starPos.x + "%";
      star.style.top = starPos.y + "%";
    }
    function setKnob(x, y) {
      // Curso = raio da base menos o do pino: acompanha o tamanho do analógico em cada tela.
      var travel = Math.max(0, (zone.clientWidth - knob.clientWidth) / 2 - 4);
      knob.style.transform = "translate(" + (x * travel).toFixed(1) + "px," + (y * travel).toFixed(1) + "px)";
    }
    function press(btn) {
      if (btn === "a") boostUntil = performance.now() + 450;
      player.style.background = colors[btn];
      root.querySelectorAll(".face").forEach(function (b) { b.classList.toggle("on", b.dataset.btn === btn); });
      setTimeout(function () { root.querySelectorAll(".face").forEach(function (b) { b.classList.remove("on"); }); }, 160);
    }

    // Arrastar o analógico (mouse, toque ou caneta).
    zone.addEventListener("pointerdown", function (e) {
      dragging = e.pointerId;
      zone.setPointerCapture(e.pointerId);
      move(e);
    });
    zone.addEventListener("pointermove", function (e) { if (dragging === e.pointerId) move(e); });
    function release(e) {
      if (dragging !== e.pointerId) return;
      dragging = null;
      stick.x = stick.y = 0;
      setKnob(0, 0);
    }
    zone.addEventListener("pointerup", release);
    zone.addEventListener("pointercancel", release);
    function move(e) {
      var r = zone.getBoundingClientRect();
      var dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      var dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      var m = Math.hypot(dx, dy);
      if (m > 1) { dx /= m; dy /= m; }
      stick.x = dx; stick.y = dy;
      setKnob(dx, dy);
    }

    root.querySelectorAll(".face").forEach(function (b) {
      b.addEventListener("click", function () { press(b.dataset.btn); });
    });

    // Teclado: setas/WASD movem; espaço ou Enter = A.
    root.addEventListener("keydown", function (e) {
      var k = e.key.toLowerCase();
      var map = { arrowup: 1, arrowdown: 1, arrowleft: 1, arrowright: 1, w: 1, a: 1, s: 1, d: 1 };
      if (map[k]) { keys[k] = true; e.preventDefault(); }
      if (k === " " || k === "enter") { if (e.target === root) { press("a"); e.preventDefault(); } }
    });
    root.addEventListener("keyup", function (e) { delete keys[e.key.toLowerCase()]; });
    root.addEventListener("blur", function () { keys = {}; }, true);

    var lastPadButtons = [];
    function frame(t) {
      var dt = Math.min(0.05, (t - (last || t)) / 1000);
      last = t;
      var ix = stick.x, iy = stick.y;
      if (keys.arrowleft || keys.a) ix = -1;
      if (keys.arrowright || keys.d) ix = 1;
      if (keys.arrowup || keys.w) iy = -1;
      if (keys.arrowdown || keys.s) iy = 1;

      // Controle de verdade (inclusive o Joyfone pelo receptor do PC).
      var pads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (var i = 0; i < pads.length; i++) {
        var p = pads[i];
        if (!p) continue;
        if (status.hidden) { status.hidden = false; status.textContent = T.pad + p.id.split("(")[0].trim(); }
        if (Math.abs(p.axes[0]) > 0.15) ix = p.axes[0];
        if (Math.abs(p.axes[1]) > 0.15) iy = p.axes[1];
        ["a", "b", "x", "y"].forEach(function (name, n) {
          var down = p.buttons[n] && p.buttons[n].pressed;
          if (down && !lastPadButtons[n]) press(name);
          lastPadButtons[n] = down;
        });
        break;
      }

      var speed = (performance.now() < boostUntil ? 95 : 45) * dt;
      var aspect = arena.clientWidth / Math.max(1, arena.clientHeight);
      pos.x = clamp(pos.x + ix * speed, 3, 97);
      pos.y = clamp(pos.y + iy * speed * aspect, 5, 95);
      player.style.left = pos.x + "%";
      player.style.top = pos.y + "%";
      var dx = (pos.x - starPos.x) * aspect, dy = pos.y - starPos.y;
      if (Math.hypot(dx, dy) < 7) {
        score++;
        hud.textContent = T.score + ": " + score;
        if (!reduce) { star.classList.remove("pop"); void star.offsetWidth; star.classList.add("pop"); }
        placeStar();
      }
      requestAnimationFrame(frame);
    }
    hud.textContent = T.score + ": 0";
    requestAnimationFrame(frame);
  }

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

  document.querySelectorAll('[data-demo="pad"]').forEach(padDemo);
  document.querySelectorAll('[data-demo="remote"]').forEach(remoteDemo);
})();
