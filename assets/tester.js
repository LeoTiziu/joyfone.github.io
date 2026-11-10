// Testador de controle: lê a Gamepad API do navegador e mostra botões, analógicos e gatilhos ao vivo.
// Nada é enviado: tudo roda nesta página.
(function () {
  "use strict";
  var en = (document.documentElement.lang || "").indexOf("en") === 0;
  var T = en
    ? { left: "Left stick", right: "Right stick", lt: "Left trigger", rt: "Right trigger", buttons: "Buttons",
        standard: "standard mapping", nonstandard: "non-standard mapping: button names may not match",
        unsupported: "This browser does not support the Gamepad API. Try a recent Chrome, Edge or Firefox." }
    : { left: "Analógico esquerdo", right: "Analógico direito", lt: "Gatilho esquerdo", rt: "Gatilho direito", buttons: "Botões",
        standard: "mapeamento padrão", nonstandard: "mapeamento não padrão: os nomes dos botões podem não corresponder",
        unsupported: "Este navegador não tem a Gamepad API. Tente um Chrome, Edge ou Firefox recente." };
  // Nomes no mapeamento padrão da W3C (posição física, rótulos estilo Xbox).
  var NAMES = ["A", "B", "X", "Y", "LB", "RB", "LT", "RT", "View", "Menu", "L3", "R3", "↑", "↓", "←", "→", "Guide"];

  var list = document.getElementById("pads");
  var empty = document.getElementById("empty");
  var cards = {};

  if (!("getGamepads" in navigator)) {
    empty.textContent = T.unsupported;
    return;
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function stick(label) {
    var s = el("div", "stick");
    s.setAttribute("role", "img");
    s.setAttribute("aria-label", label);
    s.appendChild(el("i"));
    s.appendChild(el("span", null, label));
    return s;
  }

  function trigger(label) {
    var w = el("div", "trig");
    var l = el("span", "lbl", label + ": 0%");
    var b = el("div", "bar");
    b.appendChild(el("i"));
    w.appendChild(l);
    w.appendChild(b);
    return w;
  }

  function build(pad) {
    var c = el("article", "pad-card");
    c.appendChild(el("h3", null, "#" + pad.index + " · " + pad.id));
    c.appendChild(el("span", "lbl", pad.mapping === "standard" ? T.standard : T.nonstandard));
    var row = el("div", "pad-row");
    var ls = stick(T.left), rs = stick(T.right), lt = trigger(T.lt), rt = trigger(T.rt);
    row.appendChild(ls); row.appendChild(rs); row.appendChild(lt); row.appendChild(rt);
    c.appendChild(row);
    c.appendChild(el("span", "lbl", T.buttons));
    var btns = el("div", "btns");
    var bEls = [];
    for (var i = 0; i < pad.buttons.length; i++) {
      var b = el("b", null, pad.mapping === "standard" && NAMES[i] ? NAMES[i] : "B" + i);
      btns.appendChild(b);
      bEls.push(b);
    }
    c.appendChild(btns);
    var axes = el("span", "lbl", "");
    c.appendChild(axes);
    list.appendChild(c);
    return { root: c, ls: ls.firstChild, rs: rs.firstChild, lt: lt, rt: rt, buttons: bEls, axes: axes };
  }

  function place(dot, x, y) {
    // 44 px = centro do círculo de 110 px menos metade do ponto de 22 px; 44 px de curso para cada lado.
    dot.style.transform = "translate(" + (x * 44).toFixed(1) + "px," + (y * 44).toFixed(1) + "px)";
  }

  function setTrigger(t, v) {
    t.firstChild.textContent = t.firstChild.textContent.replace(/\d+%$/, Math.round(v * 100) + "%");
    t.lastChild.firstChild.style.width = (v * 100).toFixed(0) + "%";
  }

  function frame() {
    var pads = navigator.getGamepads ? navigator.getGamepads() : [];
    var seen = {};
    for (var i = 0; i < pads.length; i++) {
      var p = pads[i];
      if (!p) continue;
      seen[p.index] = true;
      var c = cards[p.index] || (cards[p.index] = build(p));
      var a = p.axes;
      place(c.ls, a[0] || 0, a[1] || 0);
      place(c.rs, a[2] || 0, a[3] || 0);
      var b = p.buttons;
      if (p.mapping === "standard") {
        setTrigger(c.lt, b[6] ? b[6].value : 0);
        setTrigger(c.rt, b[7] ? b[7].value : 0);
      }
      for (var k = 0; k < c.buttons.length && k < b.length; k++) c.buttons[k].classList.toggle("on", b[k].pressed);
      c.axes.textContent = a.map(function (v, n) { return "a" + n + " " + (v >= 0 ? "+" : "") + v.toFixed(2); }).join("   ");
    }
    for (var key in cards) {
      if (!seen[key]) { cards[key].root.remove(); delete cards[key]; }
    }
    empty.hidden = Object.keys(cards).length > 0;
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
