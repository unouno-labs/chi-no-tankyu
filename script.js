/* ============================================================
   知の探究ラボ ─ PREMIUM EDITION 動き（JavaScript）
   ------------------------------------------------------------
   入っている機能：
     1. ローディング画面を消す
     2. 背景の星空・星雲・星座の線を描く（パララックス対応）
     3. マウス追従の光（PCのみ）
     4. ヘッダーのスクロール変化
     5. スマホメニューの開閉
     6. ヒーローの文字を1字ずつ表示
     7. スクロールでふわっと表示
   ※ 外部ライブラリは使っていません（フォントのみ外部読込）
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {

  // 「動きを減らす」設定の人には、重い演出を控える
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ==========================================================
     1. ローディング画面を消す
     ========================================================== */
  const loader = document.getElementById("loader");
  window.addEventListener("load", function () {
    setTimeout(function () { loader.classList.add("is-hidden"); }, 600);
  });
  // 万一 load が来なくても消えるよう保険
  setTimeout(function () { loader.classList.add("is-hidden"); }, 2500);


  /* ==========================================================
     2. 背景の星空・星雲・星座の線
     ----------------------------------------------------------
     ・小さな星をたくさん描く
     ・近い星どうしを細い線で結び「星座」のように見せる
     ・スクロールやマウスで少し動く（パララックス＝奥行き感）
     ========================================================== */
  const canvas = document.getElementById("starfield");
  const ctx = canvas.getContext("2d");
  let stars = [];
  let parallaxX = 0, parallaxY = 0; // 視差のずれ量
  let shootingStars = [];           // 流れ星
  let nextShootAt = 0;              // 次の流れ星が出る時刻

  let nebulae = []; // 背景にゆっくり漂う星雲の光

  // 星雲（金・紫・深青の淡い光）をいくつか用意する
  function setupNebulae() {
    const palette = [
      [201, 168, 106], // 金
      [150, 110, 215], // 紫
      [70, 110, 200]   // 深青
    ];
    const short = Math.min(canvas.width, canvas.height);
    nebulae = [];
    for (let i = 0; i < 3; i++) {
      nebulae.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: short * (0.38 + Math.random() * 0.22),
        color: palette[i % palette.length],
        baseAlpha: 0.05 + Math.random() * 0.02,
        vx: (Math.random() - 0.5) * 0.14, // ごく遅い漂い
        vy: (Math.random() - 0.5) * 0.14,
        phase: Math.random() * Math.PI * 2,
        pulse: 0.0015 + Math.random() * 0.001
      });
    }
  }

  // 星雲を描く（星より奥なので、星の前に呼ぶ）
  function drawNebulae() {
    for (const n of nebulae) {
      // 「動きを減らす」設定でなければ、ゆっくり漂わせる
      if (!reduceMotion) {
        n.x += n.vx;
        n.y += n.vy;
        n.phase += n.pulse;
        if (n.x < -n.r) n.x = canvas.width + n.r;
        if (n.x > canvas.width + n.r) n.x = -n.r;
        if (n.y < -n.r) n.y = canvas.height + n.r;
        if (n.y > canvas.height + n.r) n.y = -n.r;
      }

      const alpha = Math.max(0, n.baseAlpha + Math.sin(n.phase) * 0.02);
      const cx = n.x + parallaxX * 0.15; // 視差にもわずかに反応
      const cy = n.y + parallaxY * 0.15;
      const col = n.color[0] + "," + n.color[1] + "," + n.color[2];

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, n.r);
      grad.addColorStop(0, "rgba(" + col + "," + alpha + ")");
      grad.addColorStop(1, "rgba(" + col + ",0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  // 流れ星を1つ生む（画面上部からななめ下へ流れる）
  function spawnShootingStar() {
    const startX = Math.random() * canvas.width * 0.9;
    const startY = Math.random() * canvas.height * 0.35;
    const angle = Math.PI * (0.16 + Math.random() * 0.12); // ほぼ右下方向
    const speed = 7 + Math.random() * 4;
    shootingStars.push({
      x: startX, y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      len: 120 + Math.random() * 140,   // 尾の長さ
      life: 1,                          // 1→0 で消える
      decay: 0.010 + Math.random() * 0.008
    });
  }

  function setupStars() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // 画面が広いほど星を多く（ただし上限で重くならないように）
    let count = Math.floor((canvas.width * canvas.height) / 8000);
    count = Math.min(count, 260);

    stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.4 + 0.3,
        baseAlpha: Math.random() * 0.5 + 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.004,
        phase: Math.random() * Math.PI * 2,
        depth: Math.random() * 0.6 + 0.2 // 奥行き（小さいほど遠く、動きが小さい）
      });
    }

    setupNebulae(); // 星雲も画面サイズに合わせて作り直す
  }

  function drawStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- 星雲の光（星より奥に描く）---
    drawNebulae();

    // --- 星どうしを結ぶ線（星座風）---
    for (let i = 0; i < stars.length; i++) {
      const a = stars[i];
      const ax = a.x + parallaxX * a.depth;
      const ay = a.y + parallaxY * a.depth;

      for (let j = i + 1; j < stars.length; j++) {
        const b = stars[j];
        const bx = b.x + parallaxX * b.depth;
        const by = b.y + parallaxY * b.depth;
        const dist = Math.hypot(ax - bx, ay - by);

        // 近い星だけ線で結ぶ（120px以内）
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          // 近いほど濃く
          ctx.strokeStyle = "rgba(201,168,106," + (0.10 * (1 - dist / 120)) + ")";
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    // --- 星本体 ---
    for (const s of stars) {
      s.phase += s.twinkleSpeed;
      const alpha = s.baseAlpha + Math.sin(s.phase) * 0.25;
      const x = s.x + parallaxX * s.depth;
      const y = s.y + parallaxY * s.depth;

      ctx.beginPath();
      ctx.arc(x, y, s.radius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(232, 226, 200, " + Math.max(0, alpha) + ")";
      ctx.fill();
    }

    // --- 流れ星（「動きを減らす」設定の人には出さない）---
    if (!reduceMotion) {
      const now = performance.now();
      if (now > nextShootAt) {
        spawnShootingStar();
        // 次は 5〜13秒後（控えめな頻度）
        nextShootAt = now + 5000 + Math.random() * 8000;
      }

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const sh = shootingStars[i];
        sh.x += sh.vx;
        sh.y += sh.vy;
        sh.life -= sh.decay;

        // 寿命切れ・画面外になったら消す
        if (sh.life <= 0 || sh.x > canvas.width + 120 || sh.y > canvas.height + 120) {
          shootingStars.splice(i, 1);
          continue;
        }

        const norm = Math.hypot(sh.vx, sh.vy);
        const tailX = sh.x - (sh.vx / norm) * sh.len;
        const tailY = sh.y - (sh.vy / norm) * sh.len;

        // 尾：白金色 → 金 → 透明のグラデーション
        const grad = ctx.createLinearGradient(sh.x, sh.y, tailX, tailY);
        grad.addColorStop(0, "rgba(255, 245, 214, " + (0.9 * sh.life) + ")");
        grad.addColorStop(0.35, "rgba(201, 168, 106, " + (0.45 * sh.life) + ")");
        grad.addColorStop(1, "rgba(201, 168, 106, 0)");

        ctx.beginPath();
        ctx.moveTo(sh.x, sh.y);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.stroke();

        // 先頭の小さな光
        ctx.beginPath();
        ctx.arc(sh.x, sh.y, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 245, 214, " + sh.life + ")";
        ctx.fill();
      }
    }

    requestAnimationFrame(drawStars);
  }

  setupStars();
  drawStars();
  window.addEventListener("resize", setupStars);

  // スクロール量に応じて星をゆっくり動かす（奥行き感）
  window.addEventListener("scroll", function () {
    parallaxY = -(window.scrollY * 0.05);
  });


  /* ==========================================================
     3. マウス追従の光（PCのみ）＋ 星の視差
     ========================================================== */
  const cursorGlow = document.getElementById("cursorGlow");
  // 細い指（タッチ端末）では光を出さない
  const isTouch = window.matchMedia("(pointer: coarse)").matches;

  if (!isTouch) {
    window.addEventListener("mousemove", function (e) {
      cursorGlow.style.opacity = "1";
      cursorGlow.style.transform = "translate(" + e.clientX + "px, " + e.clientY + "px)";

      // マウス位置で星をわずかに視差移動
      parallaxX = (e.clientX - window.innerWidth / 2) * 0.02;
    });
  }


  /* ==========================================================
     4. ヘッダーのスクロール変化
     ========================================================== */
  const header = document.getElementById("header");
  window.addEventListener("scroll", function () {
    if (window.scrollY > 40) {
      header.classList.add("is-scrolled");
    } else {
      header.classList.remove("is-scrolled");
    }
  });


  /* ==========================================================
     5. スマホメニューの開閉
     ========================================================== */
  const navToggle = document.getElementById("navToggle");
  const nav = document.getElementById("nav");

  navToggle.addEventListener("click", function () {
    nav.classList.toggle("is-open");
    navToggle.classList.toggle("is-active");
  });
  nav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      nav.classList.remove("is-open");
      navToggle.classList.remove("is-active");
    });
  });


  /* ==========================================================
     6. ヒーローの文字を1字ずつ表示
     ----------------------------------------------------------
     data-split が付いた行の文字を1文字ずつ <span> に分け、
     順番にふわっと浮かび上がらせます。
     ========================================================== */
  const splitLines = document.querySelectorAll("[data-split]");
  let charIndex = 0;

  splitLines.forEach(function (line) {
    const text = line.textContent;
    line.textContent = ""; // 一度空にして

    for (const ch of text) {
      const span = document.createElement("span");
      span.className = "char";
      // 半角スペースが消えないように
      span.textContent = ch === " " ? " " : ch;

      // reduceMotionなら遅延なしで即表示、通常は順番に遅らせる
      if (!reduceMotion) {
        span.style.transitionDelay = (0.4 + charIndex * 0.04) + "s";
      }
      line.appendChild(span);
      charIndex++;
    }
  });

  // 少し待ってから表示を開始（ローディングと重ならないように）
  setTimeout(function () {
    document.querySelectorAll(".char").forEach(function (c) {
      c.classList.add("is-in");
    });
  }, 300);


  /* ==========================================================
     7. スクロールでふわっと表示
     ========================================================== */
  const targets = document.querySelectorAll(
    ".section__label, .section__title, .section__lead, " +
    ".worldview__lead, .bridge, .feature, " +
    ".about, .pillar, .card, .article, .profile, .contact"
  );
  targets.forEach(function (el) { el.classList.add("reveal"); });

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  targets.forEach(function (el) { observer.observe(el); });

});
