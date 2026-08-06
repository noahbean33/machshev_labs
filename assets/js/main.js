/* Kestrel RF — site behaviour: nav, scroll reveal, hero spectrum, contact form */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------- nav ---- */

  var nav = document.querySelector(".nav");
  var toggle = document.querySelector(".nav__toggle");

  if (nav && toggle) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a") && nav.classList.contains("open")) {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-stuck", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------------------------------------------------------- reveal ---- */

  var revealables = document.querySelectorAll(".reveal");
  if (revealables.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealables.forEach(function (el) { el.classList.add("in"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var delay = parseInt(el.dataset.delay || "0", 10);
          setTimeout(function () { el.classList.add("in"); }, delay);
          io.unobserve(el);
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

      revealables.forEach(function (el) { io.observe(el); });
    }
  }

  /* ------------------------------------------------- hero spectrum ------ */

  var canvas = document.querySelector("[data-spectrum]");
  if (canvas && canvas.getContext) {
    initSpectrum(canvas);
  }

  function initSpectrum(cv) {
    var ctx = cv.getContext("2d");
    var W = 0, H = 0, dpr = 1;

    // Carriers rendered on the trace: [centre 0..1, amplitude, width, drift]
    var carriers = [
      { f: 0.155, a: 0.80, w: 0.011, drift: 0.00013, phase: 0.0 },
      { f: 0.300, a: 0.52, w: 0.030, drift: -0.00009, phase: 1.7 },
      { f: 0.470, a: 0.94, w: 0.008, drift: 0.00006, phase: 3.1 },
      { f: 0.505, a: 0.36, w: 0.014, drift: 0.00006, phase: 0.6 },
      { f: 0.690, a: 0.63, w: 0.021, drift: -0.00015, phase: 2.4 },
      { f: 0.855, a: 0.44, w: 0.016, drift: 0.00011, phase: 4.2 }
    ];

    var BINS = 220;
    var peaks = new Float32Array(BINS);
    var history = [];      // waterfall rows, newest last
    var HIST_ROWS = 26;
    var t = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      var rect = cv.getBoundingClientRect();
      W = Math.max(rect.width, 1);
      H = Math.max(rect.height, 1);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function level(x, time) {
      // Sum of gaussian-shaped carriers plus a shaped noise floor.
      var v = 0.045 + 0.028 * Math.sin(x * 9 + time * 0.4);
      for (var i = 0; i < carriers.length; i++) {
        var c = carriers[i];
        var d = (x - c.f) / c.w;
        var breathe = 0.82 + 0.18 * Math.sin(time * 1.3 + c.phase);
        v += c.a * breathe * Math.exp(-d * d * 0.5);
      }
      v += (Math.random() - 0.5) * 0.055;
      return Math.max(0, Math.min(1, v));
    }

    function frame() {
      t += 0.016;

      for (var i = 0; i < carriers.length; i++) {
        var c = carriers[i];
        c.f += c.drift;
        if (c.f < 0.06 || c.f > 0.94) c.drift *= -1;
      }

      var row = new Float32Array(BINS);
      for (var b = 0; b < BINS; b++) {
        row[b] = level(b / (BINS - 1), t);
      }
      history.push(row);
      if (history.length > HIST_ROWS) history.shift();

      for (var p = 0; p < BINS; p++) {
        peaks[p] = Math.max(peaks[p] - 0.0032, row[p]);
      }

      draw(row);
      raf = requestAnimationFrame(frame);
    }

    function draw(row) {
      var waterfallH = Math.round(H * 0.3);
      var traceH = H - waterfallH;

      ctx.clearRect(0, 0, W, H);

      // --- graticule -----------------------------------------------------
      ctx.strokeStyle = "rgba(255,255,255,0.045)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (var gx = 1; gx < 10; gx++) {
        var x = Math.round((W / 10) * gx) + 0.5;
        ctx.moveTo(x, 0); ctx.lineTo(x, traceH);
      }
      for (var gy = 1; gy < 5; gy++) {
        var y = Math.round((traceH / 5) * gy) + 0.5;
        ctx.moveTo(0, y); ctx.lineTo(W, y);
      }
      ctx.stroke();

      var xOf = function (i) { return (i / (BINS - 1)) * W; };
      var yOf = function (v) { return traceH - v * (traceH - 12) - 4; };

      // --- filled live trace ---------------------------------------------
      var fill = ctx.createLinearGradient(0, 0, 0, traceH);
      fill.addColorStop(0, "rgba(46,230,197,0.30)");
      fill.addColorStop(1, "rgba(46,230,197,0.01)");

      ctx.beginPath();
      ctx.moveTo(0, traceH);
      for (var i = 0; i < BINS; i++) ctx.lineTo(xOf(i), yOf(row[i]));
      ctx.lineTo(W, traceH);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      ctx.beginPath();
      for (var j = 0; j < BINS; j++) {
        var px = xOf(j), py = yOf(row[j]);
        if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = "#2ee6c5";
      ctx.lineWidth = 1.4;
      ctx.lineJoin = "round";
      ctx.shadowColor = "rgba(46,230,197,0.55)";
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // --- max-hold ------------------------------------------------------
      ctx.beginPath();
      for (var k = 0; k < BINS; k++) {
        var qx = xOf(k), qy = yOf(peaks[k]);
        if (k === 0) ctx.moveTo(qx, qy); else ctx.lineTo(qx, qy);
      }
      ctx.strokeStyle = "rgba(125,107,255,0.65)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // --- marker on the strongest carrier -------------------------------
      var best = 0;
      for (var m = 0; m < BINS; m++) if (row[m] > row[best]) best = m;
      var mx = xOf(best), my = yOf(row[best]);
      ctx.strokeStyle = "rgba(255,180,84,0.55)";
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(mx, my); ctx.lineTo(mx, traceH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#ffb454";
      ctx.beginPath();
      ctx.arc(mx, my, 2.8, 0, Math.PI * 2);
      ctx.fill();

      // --- waterfall ------------------------------------------------------
      var rowH = waterfallH / HIST_ROWS;
      var cellW = W / BINS;
      for (var r = 0; r < history.length; r++) {
        var data = history[history.length - 1 - r];
        var ry = traceH + r * rowH;
        for (var c2 = 0; c2 < BINS; c2++) {
          var v = data[c2];
          if (v < 0.06) continue;
          ctx.fillStyle = heat(v);
          ctx.fillRect(c2 * cellW, ry, cellW + 0.6, rowH + 0.6);
        }
      }

      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.beginPath();
      ctx.moveTo(0, traceH + 0.5); ctx.lineTo(W, traceH + 0.5);
      ctx.stroke();
    }

    function heat(v) {
      // deep navy -> teal -> violet -> warm white
      var a = Math.min(1, v * 1.15);
      if (a < 0.4) {
        var u = a / 0.4;
        return "rgba(" + Math.round(10 + 20 * u) + "," + Math.round(30 + 90 * u) + "," + Math.round(60 + 60 * u) + "," + (0.25 + 0.4 * u) + ")";
      }
      if (a < 0.75) {
        var w = (a - 0.4) / 0.35;
        return "rgba(" + Math.round(30 + 100 * w) + "," + Math.round(120 + 110 * w) + "," + Math.round(120 + 77 * w) + ",0.8)";
      }
      var z = (a - 0.75) / 0.25;
      return "rgba(" + Math.round(130 + 125 * z) + "," + Math.round(230 - 40 * z) + "," + Math.round(197 + 20 * z) + ",0.95)";
    }

    var raf = null;
    resize();

    if (reduceMotion) {
      var still = new Float32Array(BINS);
      for (var s = 0; s < BINS; s++) still[s] = level(s / (BINS - 1), 0);
      history.push(still);
      draw(still);
    } else {
      raf = requestAnimationFrame(frame);
    }

    window.addEventListener("resize", function () {
      resize();
      if (reduceMotion && history.length) draw(history[history.length - 1]);
    });

    // Pause when scrolled out of view — no reason to burn cycles off-screen.
    if ("IntersectionObserver" in window && !reduceMotion) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && raf === null) {
            raf = requestAnimationFrame(frame);
          } else if (!entry.isIntersecting && raf !== null) {
            cancelAnimationFrame(raf);
            raf = null;
          }
        });
      }, { threshold: 0 }).observe(cv);
    }

    // Live readouts under the scope.
    var cf = document.querySelector("[data-readout='cf']");
    var pk = document.querySelector("[data-readout='peak']");
    if (cf && pk && !reduceMotion) {
      setInterval(function () {
        var strongest = carriers.reduce(function (a, b) { return b.a > a.a ? b : a; });
        cf.textContent = (2.100 + strongest.f * 3.8).toFixed(3) + " GHz";
        pk.textContent = (-21.4 + Math.sin(t * 0.7) * 1.8).toFixed(1) + " dBm";
      }, 420);
    }
  }

  /* ---------------------------------------------------- contact form ---- */

  var form = document.querySelector("[data-contact-form]");
  if (form) {
    var status = form.querySelector(".form-status");

    var setError = function (input, message) {
      var field = input.closest(".field");
      if (!field) return;
      var slot = field.querySelector(".err");
      field.classList.toggle("invalid", Boolean(message));
      if (slot) slot.textContent = message || "";
    };

    var validate = function (input) {
      var value = (input.value || "").trim();
      if (input.required && !value) {
        setError(input, "This field is required.");
        return false;
      }
      if (input.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        setError(input, "Enter a valid work email address.");
        return false;
      }
      setError(input, "");
      return true;
    };

    form.querySelectorAll("input, select, textarea").forEach(function (input) {
      input.addEventListener("blur", function () { validate(input); });
      input.addEventListener("input", function () {
        if (input.closest(".field").classList.contains("invalid")) validate(input);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var inputs = Array.prototype.slice.call(form.querySelectorAll("input, select, textarea"));
      var ok = inputs.map(validate).every(Boolean);

      if (!ok) {
        var first = form.querySelector(".field.invalid input, .field.invalid select, .field.invalid textarea");
        if (first) first.focus();
        return;
      }

      // No backend is wired up in this static build — the submit handler just
      // confirms locally. Point this at your CRM/form endpoint to go live.
      if (status) {
        status.textContent =
          "Thanks — your request is queued. A Kestrel applications engineer will reply within one business day.";
        status.classList.add("show");
        status.setAttribute("role", "status");
      }
      form.reset();
      inputs.forEach(function (input) { setError(input, ""); });
    });
  }

  /* -------------------------------------------------------- footer yr --- */

  var yr = document.querySelector("[data-year]");
  if (yr) yr.textContent = new Date().getFullYear();
})();
