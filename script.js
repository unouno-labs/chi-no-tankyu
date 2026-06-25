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
  }

  function drawStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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
