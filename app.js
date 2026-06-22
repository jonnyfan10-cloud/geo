const root = document.documentElement;
const body = document.body;
const progressFill = document.querySelector(".progress span");
const cursor = document.querySelector(".cursor");
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function updateScrollState() {
  const maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
  const progress = window.scrollY / maxScroll;
  root.style.setProperty("--progress", progress.toFixed(4));
  root.style.setProperty("--scroll", clamp(window.scrollY / window.innerHeight, 0, 1).toFixed(4));
  if (progressFill) progressFill.style.width = `${progress * 100}%`;
}

updateScrollState();
window.addEventListener("scroll", updateScrollState, { passive: true });
window.addEventListener("resize", updateScrollState);

document.querySelectorAll("[data-mode-button]").forEach((button) => {
  button.addEventListener("click", () => {
    const mode = button.dataset.modeButton;
    body.dataset.mode = mode;
    document.querySelectorAll("[data-mode-button]").forEach((item) => {
      item.classList.toggle("is-active", item === button);
    });
  });
});

document.querySelector("[data-jump-video]")?.addEventListener("click", () => {
  document.querySelector("#films")?.scrollIntoView({ behavior: "smooth" });
});

document.querySelectorAll("[data-plan]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-plan]").forEach((item) => item.classList.remove("is-selected"));
    button.classList.add("is-selected");
    const output = document.querySelector(".pledge-output");
    if (output) output.textContent = button.dataset.plan || "";
  });
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16, rootMargin: "0px 0px -6% 0px" },
);

document.querySelectorAll(".reveal").forEach((item) => revealObserver.observe(item));

if (!prefersReduced && cursor) {
  let cx = 0;
  let cy = 0;
  let tx = 0;
  let ty = 0;

  window.addEventListener("pointermove", (event) => {
    tx = event.clientX;
    ty = event.clientY;
    cursor.classList.add("is-visible");
  });

  window.addEventListener("pointerover", (event) => {
    const target = event.target;
    if (target instanceof Element && target.closest("a, button")) {
      cursor.classList.add("is-hovering");
    }
  });

  window.addEventListener("pointerout", (event) => {
    const target = event.target;
    if (target instanceof Element && target.closest("a, button")) {
      cursor.classList.remove("is-hovering");
    }
  });

  const tickCursor = () => {
    cx += (tx - cx) * 0.18;
    cy += (ty - cy) * 0.18;
    cursor.style.left = `${cx}px`;
    cursor.style.top = `${cy}px`;
    requestAnimationFrame(tickCursor);
  };
  tickCursor();
}

const atmosphere = document.querySelector("#atmosphere");

if (!prefersReduced && atmosphere instanceof HTMLCanvasElement) {
  const ctx = atmosphere.getContext("2d");
  const drops = [];
  const foodSpecks = [];
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resizeAtmosphere() {
    atmosphere.width = Math.floor(window.innerWidth * dpr);
    atmosphere.height = Math.floor(window.innerHeight * dpr);
    atmosphere.style.width = `${window.innerWidth}px`;
    atmosphere.style.height = `${window.innerHeight}px`;
    drops.length = 0;
    foodSpecks.length = 0;
    const count = Math.floor(clamp(window.innerWidth / 11, 42, 130));
    for (let i = 0; i < count; i += 1) {
      drops.push({
        x: Math.random() * atmosphere.width,
        y: Math.random() * atmosphere.height,
        speed: (0.65 + Math.random() * 1.8) * dpr,
        length: (10 + Math.random() * 24) * dpr,
        alpha: 0.12 + Math.random() * 0.22,
      });
    }
    for (let i = 0; i < 22; i += 1) {
      foodSpecks.push({
        x: Math.random() * atmosphere.width,
        y: Math.random() * atmosphere.height,
        r: (1.5 + Math.random() * 3.8) * dpr,
        drift: (0.15 + Math.random() * 0.42) * dpr,
        color: i % 3 === 0 ? "#e7b55a" : i % 3 === 1 ? "#d54258" : "#42a66d",
      });
    }
  }

  function drawAtmosphere(time) {
    if (!ctx) return;
    ctx.clearRect(0, 0, atmosphere.width, atmosphere.height);
    ctx.lineWidth = 1 * dpr;
    drops.forEach((drop) => {
      drop.y += drop.speed;
      drop.x += Math.sin((time + drop.y) * 0.001) * 0.35 * dpr;
      if (drop.y > atmosphere.height + drop.length) {
        drop.y = -drop.length;
        drop.x = Math.random() * atmosphere.width;
      }
      ctx.strokeStyle = `rgba(142, 198, 197, ${drop.alpha})`;
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x - drop.length * 0.18, drop.y + drop.length);
      ctx.stroke();
    });

    foodSpecks.forEach((speck, index) => {
      speck.y -= speck.drift;
      speck.x += Math.sin(time * 0.0007 + index) * 0.18 * dpr;
      if (speck.y < -20 * dpr) speck.y = atmosphere.height + 20 * dpr;
      ctx.fillStyle = speck.color;
      ctx.globalAlpha = 0.18;
      ctx.beginPath();
      ctx.arc(speck.x, speck.y, speck.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    requestAnimationFrame(drawAtmosphere);
  }

  resizeAtmosphere();
  window.addEventListener("resize", resizeAtmosphere);
  requestAnimationFrame(drawAtmosphere);
}

function setupMiniFilm(canvas) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const scene = canvas.dataset.scene || "food";
  const width = canvas.width;
  const height = canvas.height;

  function drawForestBase(t) {
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#123628");
    sky.addColorStop(0.45, "#0c1d13");
    sky.addColorStop(1, "#061008");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    for (let layer = 0; layer < 4; layer += 1) {
      const yBase = height * (0.32 + layer * 0.13);
      ctx.fillStyle = `rgba(${20 + layer * 10}, ${72 + layer * 18}, ${43 + layer * 8}, ${0.34 + layer * 0.13})`;
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = -40; x <= width + 40; x += 38) {
        const y = yBase + Math.sin(x * 0.036 + t * 0.0008 + layer) * 24;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawFood(t) {
    drawForestBase(t);
    const cycle = (t * 0.001) % (Math.PI * 2);
    ctx.strokeStyle = "rgba(231, 181, 90, 0.7)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i += 1) {
      const y = 92 + i * 58;
      ctx.beginPath();
      for (let x = 0; x <= width; x += 18) {
        const wave = Math.sin(x * 0.022 + cycle + i) * 18;
        if (x === 0) ctx.moveTo(x, y + wave);
        else ctx.lineTo(x, y + wave);
      }
      ctx.stroke();
    }

    const crops = [
      ["#b65334", 92, 262, 24],
      ["#d54258", 210, 330, 13],
      ["#e7b55a", 338, 252, 20],
      ["#b8d969", 482, 318, 26],
    ];
    crops.forEach(([color, x, y, r], index) => {
      const pulse = Math.sin(cycle * 2 + index) * 4;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(Number(x), Number(y), Number(r) + pulse, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawThreat(t) {
    drawForestBase(t);
    const sweep = ((t * 0.065) % (width + 160)) - 160;
    ctx.fillStyle = "rgba(182, 83, 52, 0.3)";
    ctx.fillRect(0, height * 0.58, width, height * 0.42);

    ctx.fillStyle = "#3b2415";
    for (let x = 0; x < width; x += 34) {
      ctx.fillRect(x, height * 0.7 + Math.sin(x) * 10, 24, 58);
    }

    ctx.fillStyle = "rgba(231, 181, 90, 0.26)";
    ctx.fillRect(sweep, 0, 160, height);

    ctx.strokeStyle = "rgba(213, 66, 88, 0.68)";
    ctx.lineWidth = 4;
    for (let i = 0; i < 5; i += 1) {
      const y = 80 + i * 54;
      ctx.beginPath();
      for (let x = 0; x <= width; x += 20) {
        const crack = y + Math.sin(x * 0.06 + t * 0.002 + i) * 12;
        if (x === 0) ctx.moveTo(x, crack);
        else ctx.lineTo(x, crack);
      }
      ctx.stroke();
    }
  }

  function drawFuture(t) {
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, "#092015");
    bg.addColorStop(0.5, "#174c31");
    bg.addColorStop(1, "#0b1a12");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(184, 217, 105, 0.72)";
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i += 1) {
      const x = 42 + i * 78;
      const sway = Math.sin(t * 0.001 + i) * 10;
      ctx.beginPath();
      ctx.moveTo(x, height);
      ctx.quadraticCurveTo(x + sway, height * 0.55, x + sway * 0.5, 80);
      ctx.stroke();
      ctx.fillStyle = i % 2 ? "#42a66d" : "#b8d969";
      ctx.beginPath();
      ctx.ellipse(x + sway, 110, 52, 24, Math.sin(i) * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 9; col += 1) {
        const x = 58 + col * 64 + Math.sin(t * 0.001 + row) * 4;
        const y = height - 48 - row * 44;
        ctx.fillStyle = row === 0 ? "#d54258" : row === 1 ? "#e7b55a" : "#8ec6c5";
        ctx.beginPath();
        ctx.arc(x, y, 8 + Math.sin(t * 0.003 + col) * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.strokeStyle = "rgba(248, 241, 223, 0.38)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 0; x <= width; x += 20) {
      const y = height * 0.56 + Math.sin(x * 0.018 + t * 0.0012) * 26;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  function render(t) {
    if (scene === "food") drawFood(t);
    else if (scene === "threat") drawThreat(t);
    else drawFuture(t);
  }

  if (prefersReduced) {
    render(0);
    return;
  }

  let isRunning = false;
  let frameId = 0;

  function animate(t) {
    render(t);
    if (isRunning) frameId = requestAnimationFrame(animate);
  }

  function start() {
    if (isRunning) return;
    isRunning = true;
    frameId = requestAnimationFrame(animate);
  }

  function stop() {
    isRunning = false;
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
  }

  render(0);

  const filmObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) start();
        else stop();
      });
    },
    { rootMargin: "220px 0px", threshold: 0.05 },
  );

  filmObserver.observe(canvas);
}

document.querySelectorAll(".mini-film").forEach((canvas) => {
  if (canvas instanceof HTMLCanvasElement) setupMiniFilm(canvas);
});
