// Minijogos da página inicial: Nave, Cobrinha e Caverna. Arte original desenhada por código.
// Controles: analógico e botões do celular desenhado, teclado (setas/WASD, Espaço = A, X = B, P = pausa)
// ou um controle de verdade (Gamepad API, inclusive o Joyfone pelo receptor do PC). Nada é enviado.
(function () {
  "use strict";
  var root = document.querySelector("[data-games]");
  if (!root) return;
  var en = (document.documentElement.lang || "").indexOf("en") === 0;
  var T = en ? {
    play: "Press A to play", again: "Press A to play again", paused: "Paused · press A", over: "Game over",
    score: "Score", best: "Best", phase: "Stage", weapon: "Weapon", boss: "BOSS", lives: "Lives",
    names: { ship: "Space rocks", snake: "Snake", cave: "Caveman" },
    help: {
      ship: "Move with the stick, hold A to fire. Grab P to power up your gun; beat the boss at the end of each stage.",
      snake: "Steer with the stick. Eat the fruit to grow; don't hit the walls or yourself.",
      cave: "Move with the stick, A jumps, B throws (spear or arrows) or swings the club. Stomp small dinos.",
    },
    pad: "Controller connected: ",
  } : {
    play: "Aperte A para jogar", again: "Aperte A para jogar de novo", paused: "Pausado · aperte A", over: "Fim de jogo",
    score: "Pontos", best: "Recorde", phase: "Fase", weapon: "Arma", boss: "CHEFÃO", lives: "Vidas",
    names: { ship: "Nave", snake: "Cobrinha", cave: "Caverna" },
    help: {
      ship: "Mova com o analógico e segure A para atirar. Pegue o P para melhorar a arma e vença o chefão no fim de cada fase.",
      snake: "Guie com o analógico. Coma as frutas para crescer; não bata nas paredes nem em você mesma.",
      cave: "Ande com o analógico, A pula, B arremessa (lança ou flecha) ou usa o tacape. Pule em cima dos dinossauros pequenos.",
    },
    pad: "Controle conectado: ",
  };

  var W = 320, H = 180, S = 3;
  var canvas = root.querySelector("canvas");
  canvas.width = W * S;
  canvas.height = H * S;
  var ctx = canvas.getContext("2d");
  var FONT = "'Chakra Petch', 'Segoe UI', sans-serif";
  var TEAL = "#3dd6c6", GOLD = "#ffd36b", CORAL = "#ff8a7a", FG = "#e8eef0", MUTED = "#9fb0bb";

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function hit(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
  function text(s, x, y, size, color, align) {
    ctx.font = "700 " + size + "px " + FONT;
    ctx.textAlign = align || "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.fillText(s, x, y);
  }
  function rect(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
  function circ(x, y, r, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
  function bar(x, y, w, h, frac, c) { rect(x, y, w, h, "rgba(255,255,255,0.15)"); rect(x, y, w * clamp(frac, 0, 1), h, c); }
  function loadBest(k) { try { return Number(localStorage.getItem("joyfone-best-" + k)) || 0; } catch (e) { return 0; } }
  function saveBest(k, v) { try { localStorage.setItem("joyfone-best-" + k, String(v)); } catch (e) { /* sem armazenamento */ } }

  // ================================================================== Nave
  function Ship() {
    var g = { key: "ship" }, s;
    var stars = [];
    for (var i = 0; i < 70; i++) stars.push({ x: rnd(0, W), y: rnd(0, H), v: rnd(8, 45), r: rnd(0.3, 1.1) });
    function need(p) { return 8 + p * 4; }
    function rock(x, y, r) {
      var v = [];
      for (var k = 0; k < 9; k++) v.push(rnd(0.75, 1.1));
      return { x: x, y: y, r: r, hp: r > 9 ? 3 : r > 6 ? 2 : 1, vx: rnd(-15, 15), vy: rnd(22, 40) + s.phase * 5, a: rnd(0, 6), va: rnd(-2, 2), v: v };
    }
    g.reset = function () {
      s = { x: W / 2, y: 150, inv: 0, lives: 3, weapon: 1, phase: 1, killed: 0, fireCd: 0, spawnCd: 1, banner: 2,
            bullets: [], rocks: [], drops: [], eb: [], boss: null, sparks: [] };
      g.score = 0; g.over = false;
    };
    g.reset();
    function boom(x, y, c, n) { for (var k = 0; k < n; k++) s.sparks.push({ x: x, y: y, vx: rnd(-60, 60), vy: rnd(-60, 60), t: rnd(0.2, 0.5), c: c }); }
    function hurt() {
      if (s.inv > 0) return;
      s.lives--; s.weapon = Math.max(1, s.weapon - 1); s.inv = 2; boom(s.x, s.y, CORAL, 14);
      if (s.lives <= 0) g.over = true;
    }
    function fire() {
      var w = s.weapon, b = s.bullets;
      if (w === 1) { b.push({ x: s.x, y: s.y - 8, vx: 0, vy: -220, d: 1 }); s.fireCd = 0.28; }
      else if (w === 2) { b.push({ x: s.x - 4, y: s.y - 6, vx: 0, vy: -230, d: 1 }, { x: s.x + 4, y: s.y - 6, vx: 0, vy: -230, d: 1 }); s.fireCd = 0.24; }
      else if (w === 3) { [-55, 0, 55].forEach(function (vx) { b.push({ x: s.x, y: s.y - 8, vx: vx, vy: -230, d: 1 }); }); s.fireCd = 0.22; }
      else { [-60, -20, 20, 60].forEach(function (vx) { b.push({ x: s.x, y: s.y - 8, vx: vx, vy: -280, d: 2 }); }); s.fireCd = 0.13; }
    }
    g.update = function (dt, inp) {
      s.inv = Math.max(0, s.inv - dt); s.banner = Math.max(0, s.banner - dt);
      s.x = clamp(s.x + inp.x * 130 * dt, 8, W - 8);
      s.y = clamp(s.y + inp.y * 90 * dt, 100, H - 10);
      s.fireCd -= dt;
      if (inp.a && s.fireCd <= 0) fire();
      if (!s.boss) {
        s.spawnCd -= dt;
        if (s.spawnCd <= 0) { s.rocks.push(rock(rnd(12, W - 12), -12, rnd(4, 12))); s.spawnCd = Math.max(0.35, 1.1 - s.phase * 0.1) * rnd(0.6, 1.2); }
        if (s.killed >= need(s.phase)) {
          var hp = 25 + s.phase * 15;
          s.boss = { x: W / 2, y: -30, w: 64, h: 26, hp: hp, max: hp, t: 0, cd: 1.5 };
        }
      }
      s.bullets.forEach(function (b) { b.x += b.vx * dt; b.y += b.vy * dt; });
      s.bullets = s.bullets.filter(function (b) { return b.y > -10 && b.x > -10 && b.x < W + 10 && !b.dead; });
      s.rocks.forEach(function (r) { r.x += r.vx * dt; r.y += r.vy * dt; r.a += r.va * dt; if (r.x < r.r || r.x > W - r.r) r.vx *= -1; });
      s.eb.forEach(function (b) { b.x += b.vx * dt; b.y += b.vy * dt; });
      s.eb = s.eb.filter(function (b) { return b.y < H + 10 && b.y > -20 && b.x > -10 && b.x < W + 10 && !b.dead; });
      s.drops.forEach(function (d) { d.y += 40 * dt; });
      s.sparks.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.t -= dt; });
      s.sparks = s.sparks.filter(function (p) { return p.t > 0; });

      // tiros x pedras
      var born = [];
      s.rocks.forEach(function (r) {
        s.bullets.forEach(function (b) {
          if (b.dead || r.dead) return;
          if (Math.hypot(b.x - r.x, b.y - r.y) < r.r + 2) {
            b.dead = true; r.hp -= b.d;
            if (r.hp <= 0) {
              r.dead = true; s.killed++; g.score += Math.round(r.r) * 10; boom(r.x, r.y, "#c9b79c", 8);
              if (r.r > 9) { born.push(rock(r.x - 4, r.y, r.r * 0.55)); born.push(rock(r.x + 4, r.y, r.r * 0.55)); }
              var roll = Math.random();
              if (roll < 0.14) s.drops.push({ x: r.x, y: r.y, k: "P" });
              else if (roll < 0.18) s.drops.push({ x: r.x, y: r.y, k: "+" });
            }
          }
        });
        if (!r.dead && Math.hypot(s.x - r.x, s.y - r.y) < r.r + 5) { r.dead = true; boom(r.x, r.y, "#c9b79c", 8); hurt(); }
      });
      s.rocks = s.rocks.filter(function (r) { return !r.dead && r.y < H + 20; }).concat(born);

      // chefão
      var bo = s.boss;
      if (bo) {
        bo.t += dt;
        bo.y += (34 - bo.y) * Math.min(1, dt * 1.5);
        bo.x = W / 2 + Math.sin(bo.t * (0.8 + s.phase * 0.12)) * (W / 2 - 40);
        bo.cd -= dt;
        if (bo.cd <= 0 && bo.y > 20) {
          var ang = Math.atan2(s.y - bo.y, s.x - bo.x), sp = 70 + s.phase * 8;
          var spread = s.phase >= 2 ? [-0.3, 0, 0.3] : [0];
          spread.forEach(function (d) { s.eb.push({ x: bo.x, y: bo.y + 10, vx: Math.cos(ang + d) * sp, vy: Math.sin(ang + d) * sp }); });
          bo.cd = Math.max(0.45, 1.2 - s.phase * 0.12);
        }
        s.bullets.forEach(function (b) {
          if (!b.dead && Math.abs(b.x - bo.x) < bo.w / 2 && Math.abs(b.y - bo.y) < bo.h / 2) {
            b.dead = true; bo.hp -= b.d; boom(b.x, b.y, GOLD, 2);
          }
        });
        if (Math.abs(s.x - bo.x) < bo.w / 2 + 4 && Math.abs(s.y - bo.y) < bo.h / 2 + 4) hurt();
        if (bo.hp <= 0) {
          boom(bo.x, bo.y, GOLD, 40); boom(bo.x, bo.y, CORAL, 30);
          g.score += 500 * s.phase; s.phase++; s.killed = 0; s.boss = null; s.banner = 2;
          s.drops.push({ x: bo.x, y: bo.y, k: "P" });
        }
      }
      s.eb.forEach(function (b) { if (Math.hypot(b.x - s.x, b.y - s.y) < 6) { b.dead = true; hurt(); } });
      s.drops.forEach(function (d) {
        if (Math.abs(d.x - s.x) < 10 && Math.abs(d.y - s.y) < 10) {
          d.dead = true;
          if (d.k === "P") s.weapon = Math.min(4, s.weapon + 1); else s.lives = Math.min(5, s.lives + 1);
        }
      });
      s.drops = s.drops.filter(function (d) { return !d.dead && d.y < H + 10; });
    };
    g.draw = function (dt) {
      rect(0, 0, W, H, "#0b1220");
      stars.forEach(function (st) { st.y += st.v * (dt || 0); if (st.y > H) { st.y = 0; st.x = rnd(0, W); } circ(st.x, st.y, st.r, "rgba(255,255,255,0.7)"); });
      s.rocks.forEach(function (r) {
        ctx.fillStyle = r.hp > 1 ? "#8b7d6b" : "#a8977f";
        ctx.beginPath();
        for (var k = 0; k < 9; k++) { var a = r.a + k / 9 * Math.PI * 2, rr = r.r * r.v[k]; ctx.lineTo(r.x + Math.cos(a) * rr, r.y + Math.sin(a) * rr); }
        ctx.fill();
        circ(r.x - r.r * 0.3, r.y - r.r * 0.2, r.r * 0.18, "rgba(0,0,0,0.25)");
      });
      s.drops.forEach(function (d) {
        circ(d.x, d.y, 6, d.k === "P" ? GOLD : CORAL);
        text(d.k, d.x, d.y + 0.5, 8, "#0f1218", "center");
      });
      if (s.boss) {
        var bo = s.boss;
        ctx.fillStyle = "#7a5cff";
        ctx.beginPath(); ctx.ellipse(bo.x, bo.y, bo.w / 2, bo.h / 2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#b9a6ff";
        ctx.beginPath(); ctx.ellipse(bo.x, bo.y - 6, bo.w / 4, bo.h / 3, 0, Math.PI, 0); ctx.fill();
        circ(bo.x - 12, bo.y + 2, 3, CORAL); circ(bo.x + 12, bo.y + 2, 3, CORAL);
        text(T.boss, W / 2, 24, 7, CORAL, "center");
        bar(W / 2 - 60, 29, 120, 4, bo.hp / bo.max, CORAL);
      }
      s.eb.forEach(function (b) { circ(b.x, b.y, 2.5, CORAL); });
      s.bullets.forEach(function (b) { rect(b.x - (b.d > 1 ? 1.5 : 1), b.y - 4, b.d > 1 ? 3 : 2, 7, b.d > 1 ? TEAL : GOLD); });
      if (!(s.inv > 0 && Math.floor(s.inv * 10) % 2)) {
        ctx.fillStyle = TEAL;
        ctx.beginPath(); ctx.moveTo(s.x, s.y - 8); ctx.lineTo(s.x + 7, s.y + 6); ctx.lineTo(s.x, s.y + 3); ctx.lineTo(s.x - 7, s.y + 6); ctx.closePath(); ctx.fill();
        circ(s.x, s.y + 6 + Math.random() * 2, 2, GOLD);
      }
      s.sparks.forEach(function (p) { rect(p.x, p.y, 2, 2, p.c); });
      text(T.score + " " + g.score, 6, 8, 8, FG);
      text(T.phase + " " + s.phase + " · " + T.weapon + " " + "★".repeat(s.weapon), W / 2, 8, 8, GOLD, "center");
      text("♥".repeat(Math.max(0, s.lives)), W - 6, 8, 8, CORAL, "right");
      if (!s.boss) bar(6, 15, 60, 2, s.killed / need(s.phase), TEAL);
      if (s.banner > 0) text(T.phase + " " + s.phase, W / 2, H / 2, 18, FG, "center");
    };
    return g;
  }

  // ================================================================== Cobrinha
  function Snake() {
    var g = { key: "snake" }, s, C = 10, COLS = 32, ROWS = 16, TOP = 20;
    function free() {
      var p;
      do { p = { x: Math.floor(rnd(0, COLS)), y: Math.floor(rnd(0, ROWS)) }; }
      while (s.body.some(function (b) { return b.x === p.x && b.y === p.y; }));
      return p;
    }
    g.reset = function () {
      s = { body: [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }], dir: { x: 1, y: 0 }, next: { x: 1, y: 0 }, step: 0.14, acc: 0 };
      s.food = free(); g.score = 0; g.over = false;
    };
    g.reset();
    g.update = function (dt, inp) {
      var d = null;
      if (Math.abs(inp.x) > 0.45 || Math.abs(inp.y) > 0.45) {
        d = Math.abs(inp.x) > Math.abs(inp.y) ? { x: Math.sign(inp.x), y: 0 } : { x: 0, y: Math.sign(inp.y) };
      }
      if (d && !(d.x === -s.dir.x && d.y === -s.dir.y)) s.next = d;
      s.acc += dt;
      while (s.acc >= s.step && !g.over) {
        s.acc -= s.step;
        s.dir = s.next;
        var h = { x: s.body[0].x + s.dir.x, y: s.body[0].y + s.dir.y };
        if (h.x < 0 || h.y < 0 || h.x >= COLS || h.y >= ROWS || s.body.some(function (b, i) { return i < s.body.length - 1 && b.x === h.x && b.y === h.y; })) { g.over = true; return; }
        s.body.unshift(h);
        if (h.x === s.food.x && h.y === s.food.y) { g.score += 10; s.step = Math.max(0.06, s.step - 0.004); s.food = free(); }
        else s.body.pop();
      }
    };
    g.draw = function () {
      rect(0, 0, W, H, "#0f1d1a");
      for (var y = 0; y < ROWS; y++) for (var x = 0; x < COLS; x++) if ((x + y) % 2 === 0) rect(x * C, TOP + y * C, C, C, "rgba(255,255,255,0.03)");
      ctx.strokeStyle = "rgba(61,214,198,0.5)"; ctx.lineWidth = 1; ctx.strokeRect(0.5, TOP + 0.5, W - 1, ROWS * C - 1);
      var f = s.food;
      circ(f.x * C + 5, TOP + f.y * C + 5.5, 4, CORAL);
      rect(f.x * C + 5, TOP + f.y * C, 1.5, 3, "#5bbf6a");
      s.body.forEach(function (b, i) {
        var k = 1 - i / (s.body.length + 6);
        ctx.fillStyle = "rgba(61,214,198," + (0.45 + 0.55 * k).toFixed(2) + ")";
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(b.x * C + 1, TOP + b.y * C + 1, C - 2, C - 2, 3) : ctx.rect(b.x * C + 1, TOP + b.y * C + 1, C - 2, C - 2); ctx.fill();
      });
      var hd = s.body[0];
      circ(hd.x * C + 5 + s.dir.x * 2 - s.dir.y * 2, TOP + hd.y * C + 5 + s.dir.y * 2 - s.dir.x * 2, 1.2, "#0f1218");
      circ(hd.x * C + 5 + s.dir.x * 2 + s.dir.y * 2, TOP + hd.y * C + 5 + s.dir.y * 2 + s.dir.x * 2, 1.2, "#0f1218");
      text(T.score + " " + g.score, 6, 10, 8, FG);
      text(T.best + " " + Math.max(g.best || 0, g.score), W - 6, 10, 8, GOLD, "right");
    };
    return g;
  }

  // ================================================================== Caverna
  function Cave() {
    var g = { key: "cave" }, s, GROUND = 150, PHASE_LEN = 1400, ARENA = 320;
    g.reset = function () {
      s = { p: { x: 40, y: GROUND - 16, w: 9, h: 16, vx: 0, vy: 0, on: false, face: 1, inv: 0, lives: 3, ammo: null, n: 0, swing: 0, cd: 0, safeX: 40 },
            cam: 0, solids: [{ x: -200, y: GROUND, w: 420, h: 60, ground: true }], genX: 220, items: [], dinos: [], shots: [],
            phase: 1, phaseStart: 0, boss: null, arena: false, banner: 2, kills: 0, sparks: [] };
      g.score = 0; g.over = false;
    };
    g.reset();
    function phaseEnd() { return s.phaseStart + PHASE_LEN; }
    function generate() {
      while (s.genX < s.cam + W + 80) {
        var x = s.genX;
        if (x >= phaseEnd() && x < phaseEnd() + ARENA) {
          s.solids.push({ x: x, y: GROUND, w: ARENA, h: 60, ground: true }); s.genX += ARENA; continue;
        }
        var len = Math.round(rnd(60, 130));
        if (Math.random() < 0.22 && x > 200) { s.genX += Math.round(rnd(22, 36)); continue; } // buraco
        s.solids.push({ x: x, y: GROUND, w: len, h: 60, ground: true });
        if (Math.random() < 0.35 && len > 70) { var bw = Math.round(rnd(12, 18)); s.solids.push({ x: x + len / 2, y: GROUND - bw, w: bw, h: bw, rock: true }); }
        if (Math.random() < 0.2) s.items.push({ x: x + rnd(10, len - 10), y: GROUND - 22, w: 10, h: 10, k: Math.random() < 0.5 ? "spear" : "bow" });
        if (Math.random() < 0.45 && x > 260) {
          var big = Math.random() < 0.3 + s.phase * 0.05;
          s.dinos.push(big ? { x: x + len - 30, y: GROUND - 18, w: 24, h: 18, hp: 3, vx: -14 - s.phase * 2, big: true }
                           : { x: x + len - 20, y: GROUND - 12, w: 14, h: 12, hp: 1, vx: -26 - s.phase * 3 });
        }
        s.genX += len;
      }
    }
    generate();
    function boom(x, y, c) { for (var k = 0; k < 8; k++) s.sparks.push({ x: x, y: y, vx: rnd(-50, 50), vy: rnd(-80, 10), t: rnd(0.2, 0.5), c: c }); }
    function hurt() {
      var p = s.p;
      if (p.inv > 0) return;
      p.lives--; p.inv = 1.8; p.vy = -150; boom(p.x, p.y, CORAL);
      if (p.lives <= 0) g.over = true;
    }
    function moveBody(o, dt, solidsOnly) {
      o.x += o.vx * dt;
      s.solids.forEach(function (b) {
        if (!hit(o, b)) return;
        if (o.vx > 0) o.x = b.x - o.w; else if (o.vx < 0) o.x = b.x + b.w;
        o.bumped = true;
      });
      o.vy += 600 * dt;
      o.y += o.vy * dt;
      o.on = false;
      s.solids.forEach(function (b) {
        if (!hit(o, b)) return;
        if (o.vy > 0) { o.y = b.y - o.h; o.vy = 0; o.on = true; } else if (o.vy < 0) { o.y = b.y + b.h; o.vy = 0; }
      });
    }
    g.update = function (dt, inp) {
      var p = s.p;
      p.inv = Math.max(0, p.inv - dt); p.cd = Math.max(0, p.cd - dt); p.swing = Math.max(0, p.swing - dt); s.banner = Math.max(0, s.banner - dt);
      p.vx = inp.x * 85;
      if (Math.abs(inp.x) > 0.2) p.face = inp.x > 0 ? 1 : -1;
      if (inp.aP && p.on) p.vy = -235;
      if (!inp.a && p.vy < -80) p.vy = -80; // pulo curto se soltar o botão
      if (inp.bP && p.cd <= 0) {
        if (p.ammo && p.n > 0) {
          var spear = p.ammo === "spear";
          s.shots.push({ x: p.x + (p.face > 0 ? p.w : -8), y: p.y + 5, w: 8, h: 2, vx: p.face * (spear ? 170 : 260), vy: spear ? -60 : 0, g: spear ? 220 : 0, d: spear ? 2 : 1, k: p.ammo });
          p.n--; if (p.n <= 0) p.ammo = null; p.cd = spear ? 0.45 : 0.25;
        } else { p.swing = 0.2; p.cd = 0.35; }
      }
      moveBody(p, dt);
      if (s.arena) p.x = clamp(p.x, phaseEndLocked, phaseEndLocked + ARENA - p.w);
      if (p.on) p.safeX = p.x;
      if (p.y > H + 20) { hurt(); if (!g.over) { p.x = p.safeX - 30 * p.face; p.y = GROUND - 40; p.vy = 0; } }
      g.score = Math.max(g.score, Math.floor(p.x / 10) + s.kills * 25 + (s.phase - 1) * 300);

      // câmera e mundo
      if (!s.arena) s.cam = Math.max(s.cam, p.x - W * 0.35);
      generate();
      if (!s.arena && !s.boss && p.x > phaseEnd() + 30 && p.x < phaseEnd() + ARENA) {
        phaseEndLocked = phaseEnd(); s.arena = true; s.cam = phaseEndLocked;
        var hp = 6 + s.phase * 3;
        s.boss = { x: phaseEndLocked + ARENA - 70, y: GROUND - 34, w: 40, h: 34, hp: hp, max: hp, vx: -40 - s.phase * 6, vy: 0, t: 0, boss: true };
        s.dinos = s.dinos.filter(function (d) { return d.x < phaseEndLocked; });
      }

      // itens
      s.items.forEach(function (it) {
        if (hit(p, it)) { it.dead = true; p.ammo = it.k; p.n = it.k === "spear" ? 3 : 6; }
      });
      s.items = s.items.filter(function (it) { return !it.dead && it.x > s.cam - 40; });

      // dinossauros
      var all = s.boss ? s.dinos.concat([s.boss]) : s.dinos;
      all.forEach(function (d) {
        if (d.x > s.cam + W + 40) return; // só age perto da tela
        if (d.boss) {
          d.t += dt;
          d.x += d.vx * dt;
          if (d.x < phaseEndLocked + 10 || d.x > phaseEndLocked + ARENA - d.w - 10) d.vx *= -1;
          if (d.on !== false && Math.random() < dt * 0.6) d.vy = -200;
          d.vy += 600 * dt; d.y += d.vy * dt;
          if (d.y > GROUND - d.h) { d.y = GROUND - d.h; d.vy = 0; }
        } else {
          d.bumped = false;
          moveBody(d, dt);
          if (d.bumped) d.vx *= -1;
          if (d.y > H + 20) d.dead = true;
        }
        if (p.swing > 0 && Math.abs((p.x + p.w / 2 + p.face * 10) - (d.x + d.w / 2)) < d.w / 2 + 8 && Math.abs(p.y - d.y) < 20 && !d.swung) {
          d.hp--; d.swung = true; boom(d.x + d.w / 2, d.y, GOLD);
        }
        if (p.swing <= 0) d.swung = false;
        if (hit(p, d) && !d.dead) {
          var stomp = p.vy > 0 && p.y + p.h - d.y < 8 && !d.big && !d.boss;
          if (stomp) { d.hp = 0; p.vy = -170; } else if (d.boss && p.vy > 0 && p.y + p.h - d.y < 8) { d.hp--; p.vy = -200; boom(p.x, p.y + p.h, GOLD); }
          else hurt();
        }
        if (d.hp <= 0 && !d.dead) { d.dead = true; s.kills++; boom(d.x + d.w / 2, d.y + d.h / 2, "#7bd389"); }
      });
      s.dinos = s.dinos.filter(function (d) { return !d.dead && d.x > s.cam - 60; });
      if (s.boss && s.boss.dead) {
        s.boss = null; s.arena = false; s.phase++; s.banner = 2; g.score += 500;
        s.phaseStart = phaseEndLocked + ARENA;
      }

      // projéteis
      s.shots.forEach(function (sh) {
        sh.vy += sh.g * dt; sh.x += sh.vx * dt; sh.y += sh.vy * dt;
        if (s.solids.some(function (b) { return hit(sh, b); })) sh.dead = true;
        (s.boss ? s.dinos.concat([s.boss]) : s.dinos).forEach(function (d) {
          if (!sh.dead && !d.dead && hit(sh, d)) { sh.dead = true; d.hp -= sh.d; boom(sh.x, sh.y, GOLD); if (d.hp <= 0) { d.dead = true; s.kills++; } }
        });
      });
      s.shots = s.shots.filter(function (sh) { return !sh.dead && sh.x > s.cam - 20 && sh.x < s.cam + W + 20 && sh.y < H; });
      s.solids = s.solids.filter(function (b) { return b.x + b.w > s.cam - 60; });
      s.sparks.forEach(function (q) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 200 * dt; q.t -= dt; });
      s.sparks = s.sparks.filter(function (q) { return q.t > 0; });
    };
    var phaseEndLocked = 0;

    function dino(d) {
      var x = Math.round(d.x - s.cam), y = d.y, dir = d.vx < 0 ? -1 : 1;
      if (d.boss) {
        rect(x + 6, y + 8, 28, 18, "#c0563f");
        rect(x + (dir < 0 ? -4 : 22), y, 22, 14, "#c0563f");
        rect(x + (dir < 0 ? -4 : 30), y + 9, 14, 3, "#f3efe6");
        circ(x + (dir < 0 ? 2 : 38), y + 4, 2, "#0f1218");
        rect(x + (dir < 0 ? 32 : -6), y + 12, 12, 5, "#c0563f");
        rect(x + 10, y + 26, 5, 8, "#9c3f2d"); rect(x + 24, y + 26, 5, 8, "#9c3f2d");
        text(T.boss, W / 2, 24, 7, CORAL, "center");
        bar(W / 2 - 60, 29, 120, 4, d.hp / d.max, CORAL);
      } else if (d.big) {
        rect(x + 2, y + 4, 20, 10, "#8f6bd6");
        rect(x + (dir < 0 ? -4 : 18), y + 2, 10, 9, "#8f6bd6");
        rect(x + (dir < 0 ? -7 : 26), y + 3, 4, 2, "#f3efe6");
        rect(x + (dir < 0 ? 4 : 12), y - 1, 8, 4, "#b39af0");
        rect(x + 4, y + 14, 4, 4, "#6a4cb0"); rect(x + 15, y + 14, 4, 4, "#6a4cb0");
      } else {
        rect(x + 2, y + 3, 9, 6, "#5bbf6a");
        rect(x + (dir < 0 ? -2 : 8), y, 6, 5, "#5bbf6a");
        rect(x + (dir < 0 ? 10 : -3), y + 4, 5, 2, "#5bbf6a");
        circ(x + (dir < 0 ? 0 : 12), y + 2, 1, "#0f1218");
        rect(x + 3, y + 9, 2, 3, "#3f8f4b"); rect(x + 8, y + 9, 2, 3, "#3f8f4b");
      }
    }
    g.draw = function () {
      var sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#1b3a4a"); sky.addColorStop(1, "#e89a6c");
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      var off = -(s.cam * 0.2) % 160;
      ctx.fillStyle = "#3b3048";
      for (var k = -1; k < 4; k++) { var bx = off + k * 160; ctx.beginPath(); ctx.moveTo(bx, GROUND); ctx.lineTo(bx + 60, GROUND - 70); ctx.lineTo(bx + 76, GROUND - 70); ctx.lineTo(bx + 140, GROUND); ctx.fill(); }
      circ(off + 68 + 160, GROUND - 74, 6, "rgba(255,138,122,0.6)");
      s.solids.forEach(function (b) {
        var x = Math.round(b.x - s.cam);
        if (b.ground) { rect(x, b.y, b.w, b.h, "#6b4a2f"); rect(x, b.y, b.w, 4, "#5bbf6a"); }
        else { circ(x + b.w / 2, b.y + b.h / 2 + 1, b.w / 2 + 1, "#8a8f98"); circ(x + b.w / 2 - 3, b.y + b.h / 2 - 2, b.w / 6, "rgba(255,255,255,0.25)"); }
      });
      s.items.forEach(function (it) {
        var x = Math.round(it.x - s.cam), y = it.y + Math.sin(Date.now() / 200 + it.x) * 1.5;
        if (it.k === "spear") { rect(x, y + 4, 10, 1.5, "#c9a26a"); ctx.fillStyle = "#cfd6de"; ctx.beginPath(); ctx.moveTo(x + 10, y + 2); ctx.lineTo(x + 14, y + 4.7); ctx.lineTo(x + 10, y + 7); ctx.fill(); }
        else { ctx.strokeStyle = "#c9a26a"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x + 4, y + 5, 5, -1.3, 1.3); ctx.stroke(); rect(x + 4, y, 0.8, 10, "#e8eef0"); }
      });
      s.dinos.forEach(dino);
      if (s.boss) dino(s.boss);
      s.shots.forEach(function (sh) {
        var x = sh.x - s.cam;
        rect(x, sh.y, 8, 1.5, "#c9a26a"); rect(sh.vx > 0 ? x + 7 : x - 1, sh.y - 1, 2, 3.5, "#cfd6de");
      });
      var p = s.p;
      if (!(p.inv > 0 && Math.floor(p.inv * 10) % 2)) {
        var px = Math.round(p.x - s.cam), py = Math.round(p.y);
        rect(px + 1, py + 6, 7, 7, "#e0893a");             // pele de onça
        rect(px + 2, py + 8, 1.5, 1.5, "#7a4a1c"); rect(px + 5, py + 10, 1.5, 1.5, "#7a4a1c");
        rect(px + 2, py, 6, 6, "#e9b98f");                  // rosto
        rect(px + 1, py - 1, 8, 3, "#4a2c17");              // cabelo
        circ(px + (p.face > 0 ? 6 : 3), py + 3, 0.8, "#0f1218");
        rect(px + 2, py + 13, 2, 3, "#e9b98f"); rect(px + 5, py + 13, 2, 3, "#e9b98f");
        if (p.swing > 0) rect(p.face > 0 ? px + 8 : px - 9, py + 4, 10, 3, "#7a4a1c");          // tacape
        else rect(p.face > 0 ? px + 7 : px - 2, py + 2, 3, 8, "#7a4a1c");
      }
      s.sparks.forEach(function (q) { rect(q.x - s.cam, q.y, 2, 2, q.c); });
      text(T.score + " " + g.score, 6, 8, 8, FG);
      var ammo = p.ammo ? (p.ammo === "spear" ? (en ? "Spear " : "Lança ") : (en ? "Arrows " : "Flechas ")) + p.n : (en ? "Club" : "Tacape");
      text(T.phase + " " + s.phase + " · " + ammo, W / 2, 8, 8, GOLD, "center");
      text("♥".repeat(Math.max(0, p.lives)), W - 6, 8, 8, CORAL, "right");
      if (s.banner > 0) text(T.phase + " " + s.phase, W / 2, 60, 18, FG, "center");
    };
    return g;
  }

  // ================================================================== Entrada
  var stick = { x: 0, y: 0 }, keys = {}, held = {}, prevBtn = { a: false, b: false, y: false };
  var zone = root.querySelector(".stick-zone"), knob = root.querySelector(".stick-knob"), status = root.querySelector(".pad-status");
  var dragging = null;
  function setKnob(x, y) {
    var travel = Math.max(0, (zone.clientWidth - knob.clientWidth) / 2 - 4);
    knob.style.transform = "translate(" + (x * travel).toFixed(1) + "px," + (y * travel).toFixed(1) + "px)";
  }
  function moveStick(e) {
    var r = zone.getBoundingClientRect();
    var dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2), dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    var m = Math.hypot(dx, dy);
    if (m > 1) { dx /= m; dy /= m; }
    stick.x = dx; stick.y = dy; setKnob(dx, dy);
  }
  zone.addEventListener("pointerdown", function (e) { dragging = e.pointerId; zone.setPointerCapture(e.pointerId); moveStick(e); root.focus({ preventScroll: true }); });
  zone.addEventListener("pointermove", function (e) { if (dragging === e.pointerId) moveStick(e); });
  function releaseStick(e) { if (dragging !== e.pointerId) return; dragging = null; stick.x = stick.y = 0; setKnob(0, 0); }
  zone.addEventListener("pointerup", releaseStick);
  zone.addEventListener("pointercancel", releaseStick);

  // Botões do celular desenhado: segurar conta (tiro contínuo, pulo alto). X = B, Y = pausa.
  root.querySelectorAll(".face").forEach(function (b) {
    var name = { a: "a", b: "b", x: "b", y: "y" }[b.dataset.btn];
    function down(e) { held[name] = true; b.classList.add("on"); if (e && e.pointerId != null && b.setPointerCapture) b.setPointerCapture(e.pointerId); }
    function up() { held[name] = false; b.classList.remove("on"); }
    b.addEventListener("pointerdown", function (e) { e.preventDefault(); root.focus({ preventScroll: true }); down(e); });
    b.addEventListener("pointerup", up);
    b.addEventListener("pointercancel", up);
    b.addEventListener("click", function (e) { if (e.detail === 0) { down(); setTimeout(up, 150); } }); // teclado/leitor de tela
  });

  function typing(e) { return /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName); }
  root.addEventListener("keydown", function (e) {
    if (typing(e)) return; // digitando no formulário do ranking: as teclas não vão para o jogo
    if (e.target.closest("button") && (e.key === " " || e.key === "Enter")) return;
    var k = e.key.toLowerCase();
    var handled = ["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", " ", "enter", "z", "j", "x", "k", "p", "escape"];
    if (handled.indexOf(k) >= 0) { keys[k] = true; e.preventDefault(); }
  });
  root.addEventListener("keyup", function (e) { if (!typing(e)) delete keys[e.key.toLowerCase()]; });
  root.addEventListener("focusout", function (e) { if (!root.contains(e.relatedTarget)) keys = {}; });
  canvas.addEventListener("pointerdown", function () { root.focus({ preventScroll: true }); });

  function readInput() {
    var x = stick.x, y = stick.y;
    if (keys.arrowleft || keys.a) x = -1;
    if (keys.arrowright || keys.d) x = 1;
    if (keys.arrowup || keys.w) y = -1;
    if (keys.arrowdown || keys.s) y = 1;
    var a = !!(held.a || keys[" "] || keys.enter || keys.z || keys.j);
    var b = !!(held.b || keys.x || keys.k);
    var yb = !!(held.y || keys.p || keys.escape);
    var pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (var i = 0; i < pads.length; i++) {
      var p = pads[i];
      if (!p) continue;
      if (status.hidden) { status.hidden = false; status.textContent = T.pad + p.id.split("(")[0].trim(); }
      if (Math.abs(p.axes[0]) > 0.2) x = p.axes[0];
      if (Math.abs(p.axes[1]) > 0.2) y = p.axes[1];
      var bt = function (n) { return p.buttons[n] && p.buttons[n].pressed; };
      if (bt(14)) x = -1; if (bt(15)) x = 1; if (bt(12)) y = -1; if (bt(13)) y = 1;
      a = a || bt(0); b = b || bt(1) || bt(2); yb = yb || bt(3) || bt(9);
      break;
    }
    var inp = { x: clamp(x, -1, 1), y: clamp(y, -1, 1), a: a, b: b, y_: yb, aP: a && !prevBtn.a, bP: b && !prevBtn.b, yP: yb && !prevBtn.y };
    prevBtn = { a: a, b: b, y: yb };
    return inp;
  }

  // ================================================================== Console
  var makers = { ship: Ship, snake: Snake, cave: Cave };
  var game, mode = "title", help = root.querySelector("[data-game-help]"), tabs = root.querySelectorAll("[data-game]");
  function select(name) {
    game = makers[name]();
    game.best = loadBest(name);
    mode = "title";
    tabs.forEach(function (t) { var on = t.dataset.game === name; t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1; });
    if (help) help.textContent = T.help[name];
    draw(0);
    root.dispatchEvent(new CustomEvent("joyfone:select", { detail: { game: name } }));
  }
  tabs.forEach(function (t) {
    t.addEventListener("click", function () { select(t.dataset.game); root.focus({ preventScroll: true }); });
    t.addEventListener("keydown", function (e) {
      var list = Array.prototype.slice.call(tabs), i = list.indexOf(t);
      var d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!d) return;
      e.preventDefault(); e.stopPropagation();
      var n = list[(i + d + list.length) % list.length];
      n.focus(); select(n.dataset.game);
    });
  });

  function overlay(title, sub) {
    rect(0, 0, W, H, "rgba(5,8,12,0.55)");
    text(title, W / 2, H / 2 - 12, 18, FG, "center");
    text(sub, W / 2, H / 2 + 12, 9, TEAL, "center");
  }
  function draw(dt) {
    ctx.setTransform(S, 0, 0, S, 0, 0);
    game.draw(mode === "play" ? dt : 0);
    if (mode === "title") overlay(T.names[game.key], T.play + (game.best ? "  ·  " + T.best + " " + game.best : ""));
    else if (mode === "paused") overlay(T.paused, T.score + " " + game.score);
    else if (mode === "over") overlay(T.over, T.score + " " + game.score + "  ·  " + T.best + " " + game.best + "  ·  " + T.again);
  }

  var last = 0, visible = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(root);
  }
  function frame(t) {
    var dt = Math.min(0.05, (t - (last || t)) / 1000);
    last = t;
    if (visible) {
      var inp = readInput();
      if (mode === "title" || mode === "over") {
        if (inp.aP) { game.reset(); mode = "play"; }
      } else if (mode === "paused") {
        if (inp.aP || inp.yP) mode = "play";
      } else {
        if (inp.yP) mode = "paused";
        else {
          game.update(dt, inp);
          if (game.over) {
            mode = "over";
            if (game.score > game.best) { game.best = game.score; saveBest(game.key, game.score); }
            root.dispatchEvent(new CustomEvent("joyfone:gameover", { detail: { game: game.key, score: game.score } }));
          }
        }
      }
      if (mode === "play" && document.activeElement !== root && !root.contains(document.activeElement) && !Object.keys(held).some(function (k) { return held[k]; }) && !dragging) {
        // Sem foco no jogo (o teclado não chega): pausa para não perder a partida sem querer.
        var anyPad = navigator.getGamepads && Array.prototype.some.call(navigator.getGamepads(), function (p) { return p; });
        if (!anyPad) mode = "paused";
      }
      draw(dt);
    }
    requestAnimationFrame(frame);
  }
  select("ship");
  requestAnimationFrame(frame);
})();
