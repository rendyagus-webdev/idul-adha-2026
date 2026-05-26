(() => {
  "use strict";

  const root = document.documentElement;
  const hero = document.querySelector(".hero");
  const canvas = document.getElementById("particleCanvas");
  const context = canvas.getContext("2d", { alpha: true });
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const pointer = { x: -1000, y: -1000, active: false };
  const particles = [];
  let canvasWidth = 0;
  let canvasHeight = 0;
  let animationFrame = null;
  let lastTrailAt = 0;

  function setCanvasSize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvasWidth = hero.clientWidth;
    canvasHeight = hero.clientHeight;
    canvas.width = Math.floor(canvasWidth * dpr);
    canvas.height = Math.floor(canvasHeight * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    formGreetingParticles();
    if (reducedMotion.matches) paintParticles();
  }

  function formGreetingParticles() {
    const buffer = document.createElement("canvas");
    const bufferContext = buffer.getContext("2d");
    const compactLayout = canvasWidth < 768;
    const sampleGap = compactLayout ? 3 : 4;
    const lineOne = "Selamat Idul Adha";
    const lineTwo = "1447 H";
    const maxLineWidth = canvasWidth < 992 ? canvasWidth - 54 : canvasWidth * 0.58;
    const mainFont = compactLayout ? '"Inter", Arial, sans-serif' : '"Amiri", Georgia, serif';
    let mainSize = Math.min(canvasWidth * (compactLayout ? 0.105 : 0.09), 78);
    const centerX = canvasWidth < 992 ? canvasWidth / 2 : canvasWidth * 0.32;
    const centerY = canvasWidth < 992
      ? Math.min(window.innerHeight * 0.4, canvasHeight * 0.34)
      : canvasHeight * 0.43;

    buffer.width = canvasWidth;
    buffer.height = canvasHeight;
    bufferContext.textAlign = "center";
    bufferContext.textBaseline = "middle";
    bufferContext.fillStyle = "#ffffff";
    bufferContext.font = `700 ${mainSize}px ${mainFont}`;
    const lineWidth = bufferContext.measureText(lineOne).width;
    if (lineWidth > maxLineWidth) {
      mainSize *= maxLineWidth / lineWidth;
      bufferContext.font = `700 ${mainSize}px ${mainFont}`;
    }
    bufferContext.fillText(lineOne, centerX, centerY);
    const subSize = mainSize * (compactLayout ? 0.6 : 0.62);
    bufferContext.font = `${compactLayout ? 700 : 400} ${subSize}px "Inter", Arial, sans-serif`;
    bufferContext.fillText(lineTwo, centerX, centerY + mainSize * 0.88);

    const pixels = bufferContext.getImageData(0, 0, canvasWidth, canvasHeight).data;
    const targets = [];
    for (let y = 0; y < canvasHeight; y += sampleGap) {
      for (let x = 0; x < canvasWidth; x += sampleGap) {
        if (pixels[(y * canvasWidth + x) * 4 + 3] > 120) {
          targets.push({ x, y });
        }
      }
    }

    while (particles.length > targets.length) particles.pop();
    targets.forEach((target, index) => {
      const particle = particles[index] || {
        x: target.x + (Math.random() - 0.5) * 80,
        y: target.y + (Math.random() - 0.5) * 80,
        vx: 0,
        vy: 0,
        radius: Math.random() * 1.25 + 0.75
      };
      particle.homeX = target.x;
      particle.homeY = target.y;
      if (reducedMotion.matches) {
        particle.x = target.x;
        particle.y = target.y;
        particle.vx = 0;
        particle.vy = 0;
      }
      particles[index] = particle;
    });
  }

  function paintParticles() {
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    const repelRadius = canvasWidth < 576 ? 68 : 95;
    const compactLayout = canvasWidth < 768;

    particles.forEach((particle) => {
      const dx = particle.x - pointer.x;
      const dy = particle.y - pointer.y;
      const distance = Math.hypot(dx, dy) || 1;

      if (pointer.active && distance < repelRadius && !reducedMotion.matches) {
        const force = (repelRadius - distance) / repelRadius;
        particle.vx += (dx / distance) * force * 2.7;
        particle.vy += (dy / distance) * force * 2.7;
      }

      particle.vx += (particle.homeX - particle.x) * 0.045;
      particle.vy += (particle.homeY - particle.y) * 0.045;
      particle.vx *= 0.87;
      particle.vy *= 0.87;
      particle.x += particle.vx;
      particle.y += particle.vy;

      context.beginPath();
      context.fillStyle = `rgba(244, 213, 137, ${compactLayout ? 0.9 : 0.57 + particle.radius / 4})`;
      context.shadowBlur = compactLayout ? 5 : 10;
      context.shadowColor = compactLayout
        ? "rgba(234, 178, 70, 0.52)"
        : "rgba(234, 178, 70, 0.72)";
      context.arc(
        particle.x,
        particle.y,
        compactLayout ? Math.min(particle.radius, 1.35) : particle.radius,
        0,
        Math.PI * 2
      );
      context.fill();
    });
  }

  function animate() {
    paintParticles();
    updateFrequencyAnimation();
    animationFrame = window.requestAnimationFrame(animate);
  }

  function startAnimation() {
    cancelAnimationFrame(animationFrame);
    if (reducedMotion.matches) {
      paintParticles();
      updateFrequencyAnimation();
      return;
    }
    animate();
  }

  function setPointerPosition(clientX, clientY) {
    const bounds = hero.getBoundingClientRect();
    pointer.x = clientX - bounds.left;
    pointer.y = clientY - bounds.top;
    pointer.active = pointer.y >= 0 && pointer.y <= bounds.height;
    root.style.setProperty("--pointer-x", ((clientX / window.innerWidth) * 2 - 1).toFixed(3));
    root.style.setProperty("--pointer-y", ((clientY / window.innerHeight) * 2 - 1).toFixed(3));
  }

  function appendCursorTrail(x, y) {
    const now = performance.now();
    if (now - lastTrailAt < 38) return;
    lastTrailAt = now;
    const dot = document.createElement("span");
    dot.className = "cursor-trail";
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;
    document.body.appendChild(dot);
    window.setTimeout(() => dot.remove(), 570);
  }

  if (window.matchMedia("(pointer: fine)").matches && !reducedMotion.matches) {
    document.body.classList.add("cursor-enabled");
    const cursor = document.querySelector(".cursor-core");
    document.addEventListener("mousemove", (event) => {
      cursor.style.setProperty("--cursor-left", `${event.clientX}px`);
      cursor.style.setProperty("--cursor-top", `${event.clientY}px`);
      setPointerPosition(event.clientX, event.clientY);
      appendCursorTrail(event.clientX, event.clientY);
    });
  } else {
    hero.addEventListener("pointermove", (event) => setPointerPosition(event.clientX, event.clientY));
  }

  hero.addEventListener("pointerleave", () => {
    pointer.active = false;
  });
  hero.addEventListener(
    "touchmove",
    (event) => {
      const touch = event.touches[0];
      if (touch) setPointerPosition(touch.clientX, touch.clientY);
    },
    { passive: true }
  );
  window.addEventListener("scroll", () => {
    root.style.setProperty("--scroll-y", String(Math.min(window.scrollY, window.innerHeight)));
  }, { passive: true });
  window.addEventListener("resize", setCanvasSize);
  reducedMotion.addEventListener("change", () => {
    setCanvasSize();
    startAnimation();
  });

  function syncMessageView() {
    document.body.classList.toggle("message-view-open", window.location.hash === "#pesan-keluarga");
  }

  window.addEventListener("hashchange", syncMessageView);
  syncMessageView();

  const themeSwitch = document.getElementById("themeSwitch");
  themeSwitch.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");
    const isLight = document.body.classList.contains("light-mode");
    themeSwitch.querySelector(".theme-icon").textContent = isLight ? "\u2600" : "\u263d";
  });

  const audio = document.getElementById("takbirAudio");
  const audioCard = document.querySelector(".audio-card");
  const audioButton = document.getElementById("audioButton");
  const audioStatus = document.getElementById("audioStatus");
  const assetHint = document.getElementById("assetHint");
  const progressBar = document.getElementById("progressBar");
  const muteButton = document.getElementById("muteButton");
  const bars = [...document.querySelectorAll(".equalizer span")];

  /*
   * AUDIO ASSETS UNTUK DIGANTI:
   * - ./assets/audio/gema-takbir-loop.mp3 : lantunan takbir utama yang diputar berulang.
   * - ./assets/audio/sfx-hover.mp3        : efek hover singkat pada tombol/kartu.
   */
  const hoverSound = new Audio("./assets/audio/sfx-hover.mp3");
  hoverSound.volume = 0.16;
  let soundHasStarted = false;
  let audioContext;
  let analyser;
  let frequencyData;

  function setupAnalyser() {
    if (audioContext) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    audioContext = new AudioContext();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.82;
    const source = audioContext.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    frequencyData = new Uint8Array(analyser.frequencyBinCount);
  }

  async function toggleAudio() {
    setupAnalyser();
    if (audioContext && audioContext.state === "suspended") {
      await audioContext.resume();
    }
    if (audio.paused) {
      try {
        await audio.play();
        soundHasStarted = true;
      } catch (error) {
        assetHint.hidden = false;
        audioStatus.textContent = "File audio belum tersedia";
      }
    } else {
      audio.pause();
    }
  }

  function updateFrequencyAnimation() {
    if (!analyser || audio.paused) {
      root.style.setProperty("--audio-level", "0");
      bars.forEach((bar, index) => {
        bar.style.setProperty("--bar-height", `${12 + ((index * 13) % 24)}%`);
      });
      return;
    }
    analyser.getByteFrequencyData(frequencyData);
    let total = 0;
    bars.forEach((bar, index) => {
      const value = frequencyData[Math.min(index * 2, frequencyData.length - 1)] / 255;
      total += value;
      bar.style.setProperty("--bar-height", `${10 + value * 78}%`);
    });
    root.style.setProperty("--audio-level", (total / bars.length).toFixed(3));
  }

  audioButton.addEventListener("click", toggleAudio);
  audio.addEventListener("play", () => {
    audioCard.classList.add("is-playing");
    audioStatus.textContent = "Gema takbir sedang diputar";
    audioButton.setAttribute("aria-label", "Jeda gema takbir");
    assetHint.hidden = true;
  });
  audio.addEventListener("pause", () => {
    audioCard.classList.remove("is-playing");
    audioStatus.textContent = "Dijeda - sentuh untuk melanjutkan";
    audioButton.setAttribute("aria-label", "Putar gema takbir");
  });
  audio.addEventListener("error", () => {
    assetHint.hidden = false;
    audioStatus.textContent = "Tambahkan file audio untuk memutar";
  });
  audio.addEventListener("timeupdate", () => {
    const progress = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    progressBar.style.width = `${progress}%`;
  });
  muteButton.addEventListener("click", () => {
    audio.muted = !audio.muted;
    muteButton.classList.toggle("muted", audio.muted);
    muteButton.setAttribute("aria-label", audio.muted ? "Aktifkan suara" : "Senyapkan audio");
  });

  document.querySelectorAll("button, .value-card, .scroll-invite, .message-button, .back-button").forEach((element) => {
    element.addEventListener("pointerenter", () => {
      if (!soundHasStarted || audio.muted) return;
      hoverSound.currentTime = 0;
      hoverSound.play().catch(() => {});
    });
  });

  setCanvasSize();
  if (document.fonts) {
    document.fonts.ready.then(setCanvasSize);
  }
  startAnimation();
})();
