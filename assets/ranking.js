// Ranking dos minijogos (planilha Google via Apps Script; instalação em docs/RANKING.md).
// O ranking público mostra só apelidos. O e-mail é opcional, liberado só com "18+" e aceite de novidades,
// e vai para uma aba privada da planilha. Sem URL configurada, o ranking fica escondido.
(function () {
  "use strict";
  // URL do app da Web do Apps Script (termina em /exec). Vazio = ranking desligado.
  var ENDPOINT = window.JOYFONE_RANKING_URL || "";

  var panel = document.querySelector("[data-ranking]");
  var games = document.querySelector("[data-games]");
  if (!panel || !games || !ENDPOINT || !window.fetch) return;
  panel.hidden = false;

  var en = (document.documentElement.lang || "").indexOf("en") === 0;
  var T = en
    ? { title: "Top 10", empty: "No scores yet. Be the first!", loading: "Loading…", error: "Ranking unavailable right now.",
        your: "Your score: ", saving: "Saving…", saved: "Saved! You're in the ranking.", savedMail: "Saved! Your e-mail was recorded with your consent.",
        nick: "Choose a nickname with 2 to 16 characters.", mail: "Check the e-mail address.", fail: "Could not save. Try again in a moment.",
        names: { ship: "Space rocks", snake: "Snake", cave: "Caveman" } }
    : { title: "Top 10", empty: "Ainda sem pontuações. Seja o primeiro!", loading: "Carregando…", error: "Ranking indisponível agora.",
        your: "Sua pontuação: ", saving: "Salvando…", saved: "Salvo! Você está no ranking.", savedMail: "Salvo! Seu e-mail foi registrado com o seu consentimento.",
        nick: "Escolha um apelido de 2 a 16 caracteres.", mail: "Confira o endereço de e-mail.", fail: "Não deu para salvar. Tente de novo daqui a pouco.",
        names: { ship: "Nave", snake: "Cobrinha", cave: "Caverna" } };

  var list = panel.querySelector("[data-rank-list]");
  var title = panel.querySelector("[data-rank-title]");
  var form = panel.querySelector("[data-rank-form]");
  var scoreEl = form.querySelector("[data-rank-score]");
  var msg = form.querySelector("[data-rank-msg]");
  var nick = form.querySelector("#rank-nick");
  var adult = form.querySelector("#rank-adult");
  var consent = form.querySelector("#rank-consent");
  var email = form.querySelector("#rank-email");
  var supporter = form.querySelector("#rank-supporter");
  var supBox = panel.querySelector("[data-supporters]");
  var supCount = panel.querySelector("[data-sup-count]");
  var supNames = panel.querySelector("[data-sup-names]");
  var ticker = document.querySelector("[data-phone-ticker]");
  var tickerLines = [], tickerIdx = 0;
  var honey = form.querySelector("[name=website]");
  var current = "ship", pending = null, cache = {};

  try { nick.value = localStorage.getItem("joyfone-nick") || ""; } catch (e) { /* sem armazenamento */ }

  function render(game, top) {
    title.textContent = T.title + " · " + T.names[game];
    list.textContent = "";
    if (!top.length) { var li = document.createElement("li"); li.className = "rank-empty"; li.textContent = T.empty; list.appendChild(li); return; }
    top.forEach(function (r, i) {
      var li = document.createElement("li");
      var n = document.createElement("span"); n.className = "rank-nick"; n.textContent = (i + 1) + ". " + r.nick;
      var s = document.createElement("span"); s.className = "rank-pts"; s.textContent = Number(r.score).toLocaleString(en ? "en-US" : "pt-BR");
      li.appendChild(n); li.appendChild(s); list.appendChild(li);
    });
  }
  // Apoiadores: o total de quem aceitou receber novidades e os apelidos de quem escolheu aparecer.
  function renderSupporters(sup) {
    if (!sup || !(sup.count > 0)) { supBox.hidden = true; return; }
    supBox.hidden = false;
    supCount.textContent = en
      ? sup.count + (sup.count === 1 ? " player already gets Joyfone news." : " players already get Joyfone news.")
      : sup.count + (sup.count === 1 ? " jogador já recebe as novidades do Joyfone." : " jogadores já recebem as novidades do Joyfone.");
    supNames.textContent = "";
    (sup.names || []).forEach(function (n) { var li = document.createElement("li"); li.textContent = n; supNames.appendChild(li); });
  }

  // Tela do celular desenhado: alterna o top 3 do jogo e os apoiadores.
  function setTicker(game, top, sup) {
    var lines = top.slice(0, 3).map(function (r, i) { return "🏆 " + (i + 1) + "º " + r.nick + " · " + r.score; });
    if (sup && sup.names && sup.names.length) {
      lines.push((en ? "💚 Thanks, " : "💚 Valeu, ") + sup.names.slice(0, 3).join(", ") + "!");
    }
    if (sup && sup.count > 0) lines.push("💚 " + sup.count + (en ? " supporters" : " apoiadores"));
    tickerLines = lines;
    tickerIdx = 0;
    if (ticker && lines.length) ticker.textContent = lines[0];
  }
  if (ticker) setInterval(function () {
    if (tickerLines.length < 2) return;
    tickerIdx = (tickerIdx + 1) % tickerLines.length;
    ticker.textContent = tickerLines[tickerIdx];
  }, 2600);

  function show(game, j) {
    cache[game] = j;
    if (current !== game) return;
    render(game, j.top);
    renderSupporters(j.supporters);
    setTicker(game, j.top, j.supporters);
  }

  function load(game) {
    current = game;
    if (cache[game]) show(game, cache[game]);
    else { title.textContent = T.title + " · " + T.names[game]; list.innerHTML = '<li class="rank-empty">' + T.loading + "</li>"; }
    fetch(ENDPOINT + "?game=" + encodeURIComponent(game))
      .then(function (r) { return r.json(); })
      .then(function (j) { if (!j.ok) throw new Error(j.error); show(game, j); })
      .catch(function () { if (current === game && !cache[game]) list.innerHTML = '<li class="rank-empty">' + T.error + "</li>"; });
  }

  // O e-mail só fica disponível com as duas confirmações marcadas.
  function syncEmail() {
    var ok = adult.checked && consent.checked;
    email.disabled = !ok;
    supporter.disabled = !ok;
    if (!ok) { email.value = ""; supporter.checked = false; }
  }
  adult.addEventListener("change", syncEmail);
  consent.addEventListener("change", syncEmail);
  syncEmail();

  games.addEventListener("joyfone:select", function (e) { form.hidden = true; pending = null; load(e.detail.game); });
  games.addEventListener("joyfone:gameover", function (e) {
    if (!(e.detail.score > 0)) return;
    pending = { game: e.detail.game, score: e.detail.score };
    scoreEl.textContent = T.your + Number(pending.score).toLocaleString(en ? "en-US" : "pt-BR") + " · " + T.names[pending.game];
    msg.textContent = "";
    form.hidden = false;
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!pending) return;
    var n = nick.value.trim();
    if (n.length < 2 || n.length > 16) { msg.textContent = T.nick; nick.focus(); return; }
    var mail = email.disabled ? "" : email.value.trim();
    if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) { msg.textContent = T.mail; email.focus(); return; }
    try { localStorage.setItem("joyfone-nick", n); } catch (err) { /* sem armazenamento */ }
    var body = { game: pending.game, score: pending.score, nick: n, email: mail, adult: adult.checked, consent: consent.checked,
                 showSupporter: !!mail && supporter.checked, lang: en ? "en" : "pt", website: honey.value };
    var btn = form.querySelector("button[type=submit]");
    btn.disabled = true;
    msg.textContent = T.saving;
    // text/plain: requisição simples, sem pré-verificação de CORS (o Apps Script não responde OPTIONS).
    fetch(ENDPOINT, { method: "POST", body: JSON.stringify(body) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j.ok) throw new Error(j.error);
        msg.textContent = mail ? T.savedMail : T.saved;
        show(body.game, j);
        pending = null;
        setTimeout(function () { form.hidden = true; }, 2500);
      })
      .catch(function () { msg.textContent = T.fail; })
      .then(function () { btn.disabled = false; });
  });

  load(current);
})();
