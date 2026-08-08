/* CEM LLC — site behaviour: nav, scroll reveal, emissions scan, calculators, form */
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

  /* ================================================== FCC emissions ===== */
  /* A radiated-emissions pre-scan against the FCC Part 15 Class B limit.
     The 5th harmonic of a 48 MHz clock lands at 240 MHz on a cable resonance
     and busts the 216–960 MHz limit — the case study on the resources page. */

  var F_MIN = 30e6, F_MAX = 1e9;
  var CLASS_B_3M = [
    { upto: 88e6,  dbuv: 40.0 },
    { upto: 216e6, dbuv: 43.5 },
    { upto: 960e6, dbuv: 46.0 },
    { upto: Infinity, dbuv: 54.0 }
  ];

  function limitAt(hz) {
    for (var i = 0; i < CLASS_B_3M.length; i++) {
      if (hz < CLASS_B_3M[i].upto) return CLASS_B_3M[i].dbuv;
    }
    return 54.0;
  }

  var scanCanvas = document.querySelector("[data-emissions]");
  if (scanCanvas && scanCanvas.getContext) initEmissions(scanCanvas);

  function initEmissions(cv) {
    var ctx = cv.getContext("2d");
    var W = 0, H = 0, dpr = 1;
    var PAD_L = 34, PAD_R = 10, PAD_T = 12, PAD_B = 22;

    var BINS = 260;
    var CLOCK = 48e6;
    var sweep = 0;          // 0..1 leading edge of the scan
    var t = 0;
    var peakHold = new Float32Array(BINS);

    var logMin = Math.log10(F_MIN), logMax = Math.log10(F_MAX);
    var freqOf = function (i) {
      return Math.pow(10, logMin + (i / (BINS - 1)) * (logMax - logMin));
    };

    // Peak level of the nth clock harmonic. Tuned so the 5th (240 MHz) lands
    // at 52.1 dBµV/m — 6.1 dB over the 46.0 Class B limit — which is the case
    // study quoted across the site.
    function harmonicPeak(fh) {
      var n = fh / CLOCK;
      var resonance = 25.8 * Math.exp(-Math.pow((fh - 240e6) / 62e6, 2));
      return 34 - 11 * Math.log10(n) + resonance;
    }

    function emission(hz, time) {
      // Broadband floor that rolls off with frequency.
      var floor = 20 - 8 * (Math.log10(hz) - logMin) / (logMax - logMin);
      var v = floor + Math.sin(hz / 7e6 + time) * 0.9 + (Math.random() - 0.5) * 1.4;

      var n = Math.round(hz / CLOCK);
      if (n < 1) return v;

      var fh = n * CLOCK;
      var binHz = hz * (Math.pow(10, (logMax - logMin) / (BINS - 1)) - 1);

      // A bin containing a harmonic reports its full peak — otherwise the
      // log-spaced bins sample the skirt and the comb reads far too low.
      if (Math.abs(hz - fh) <= binHz * 0.5) return Math.max(v, harmonicPeak(fh));

      var df = Math.abs(hz - fh) / Math.max(fh * 0.006 + 1.2e6, binHz);
      return Math.max(v, floor + (harmonicPeak(fh) - floor) * Math.exp(-df * df * 0.5));
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      var rect = cv.getBoundingClientRect();
      W = Math.max(rect.width, 1);
      H = Math.max(rect.height, 1);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      var x0 = PAD_L, x1 = W - PAD_R, y0 = PAD_T, y1 = H - PAD_B;
      var plotW = x1 - x0, plotH = y1 - y0;
      var yMin = 10, yMax = 66;

      var xOf = function (hz) {
        return x0 + ((Math.log10(hz) - logMin) / (logMax - logMin)) * plotW;
      };
      var yOf = function (db) {
        return y1 - ((db - yMin) / (yMax - yMin)) * plotH;
      };

      ctx.clearRect(0, 0, W, H);

      // --- decade + step gridlines ---------------------------------------
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      [30e6, 50e6, 88e6, 100e6, 216e6, 300e6, 500e6, 960e6].forEach(function (f) {
        var gx = Math.round(xOf(f)) + 0.5;
        ctx.moveTo(gx, y0); ctx.lineTo(gx, y1);
      });
      [20, 30, 40, 50, 60].forEach(function (d) {
        var gy = Math.round(yOf(d)) + 0.5;
        ctx.moveTo(x0, gy); ctx.lineTo(x1, gy);
      });
      ctx.stroke();

      // --- axis labels -----------------------------------------------------
      ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillStyle = "#6f7c93";
      ctx.textAlign = "right";
      [20, 40, 60].forEach(function (d) { ctx.fillText(String(d), x0 - 6, yOf(d) + 3); });
      ctx.textAlign = "center";
      [[30e6, "30M"], [88e6, "88M"], [216e6, "216M"], [500e6, "500M"], [1e9, "1G"]]
        .forEach(function (pair) {
          ctx.fillText(pair[1], Math.min(xOf(pair[0]), x1 - 10), y1 + 14);
        });
      ctx.textAlign = "left";

      // --- FCC Class B limit line -----------------------------------------
      // Horizontal runs joined by vertical risers at each step boundary.
      ctx.beginPath();
      var fStart = F_MIN;
      for (var s = 0; s < CLASS_B_3M.length && fStart < F_MAX; s++) {
        var fEnd = Math.min(CLASS_B_3M[s].upto, F_MAX);
        var ly = yOf(CLASS_B_3M[s].dbuv);
        if (s === 0) ctx.moveTo(xOf(fStart), ly);
        else ctx.lineTo(xOf(fStart), ly);
        ctx.lineTo(xOf(fEnd), ly);
        fStart = fEnd;
      }
      ctx.strokeStyle = "rgba(255,180,84,0.85)";
      ctx.lineWidth = 1.3;
      ctx.setLineDash([5, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "rgba(255,180,84,0.8)";
      ctx.fillText("FCC 15B · 3 m", x0 + 6, yOf(40) - 6);

      // --- swept trace ------------------------------------------------------
      var visible = Math.max(2, Math.floor(BINS * sweep));
      var pts = [];
      for (var i = 0; i < visible; i++) {
        var hz = freqOf(i);
        var db = emission(hz, t);
        peakHold[i] = Math.max(peakHold[i] || 0, db);
        pts.push([xOf(hz), yOf(db), db, hz]);
      }

      if (pts.length > 1) {
        var grad = ctx.createLinearGradient(0, y0, 0, y1);
        grad.addColorStop(0, "rgba(46,230,197,0.26)");
        grad.addColorStop(1, "rgba(46,230,197,0.01)");
        ctx.beginPath();
        ctx.moveTo(pts[0][0], y1);
        pts.forEach(function (p) { ctx.lineTo(p[0], p[1]); });
        ctx.lineTo(pts[pts.length - 1][0], y1);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // Trace, recoloured red wherever it exceeds the limit.
        for (var k = 1; k < pts.length; k++) {
          var a = pts[k - 1], b = pts[k];
          var over = b[2] > limitAt(b[3]);
          ctx.beginPath();
          ctx.moveTo(a[0], a[1]);
          ctx.lineTo(b[0], b[1]);
          ctx.strokeStyle = over ? "#ff6b81" : "#2ee6c5";
          ctx.lineWidth = over ? 2 : 1.3;
          ctx.shadowColor = over ? "rgba(255,107,129,0.7)" : "rgba(46,230,197,0.45)";
          ctx.shadowBlur = over ? 9 : 5;
          ctx.stroke();
        }
        ctx.shadowBlur = 0;

        // Leading edge of the sweep.
        var head = pts[pts.length - 1];
        if (sweep < 1) {
          ctx.strokeStyle = "rgba(46,230,197,0.35)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(head[0], y0); ctx.lineTo(head[0], y1);
          ctx.stroke();
        }
      }

      // --- worst-case marker ------------------------------------------------
      var worst = null;
      for (var m = 0; m < visible; m++) {
        var f = freqOf(m);
        var margin = peakHold[m] - limitAt(f);
        if (!worst || margin > worst.margin) worst = { margin: margin, db: peakHold[m], hz: f };
      }
      if (worst && worst.margin > 0) {
        var wx = xOf(worst.hz), wy = yOf(worst.db);
        ctx.fillStyle = "#ff6b81";
        ctx.beginPath();
        ctx.arc(wx, wy, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
        // Report the harmonic's true frequency, not the log-bin centre.
        var markHz = Math.round(worst.hz / CLOCK) * CLOCK;
        var label = "+" + worst.margin.toFixed(1) + " dB over @ " + Math.round(markHz / 1e6) + " MHz";
        ctx.textAlign = wx > W * 0.6 ? "right" : "left";
        ctx.fillText(label, wx + (wx > W * 0.6 ? -8 : 8), wy - 7);
        ctx.textAlign = "left";

        var verdict = document.querySelector("[data-readout='verdict']");
        var margEl = document.querySelector("[data-readout='margin']");
        if (margEl) margEl.textContent = "+" + worst.margin.toFixed(1) + " dB";
        if (verdict && !verdict.dataset.locked) {
          verdict.textContent = "FAIL";
          verdict.style.color = "var(--fail)";
        }
      }
    }

    function frame() {
      t += 0.016;
      sweep += 0.006;
      if (sweep > 1.28) { sweep = 0; peakHold = new Float32Array(BINS); }
      draw();
      raf = requestAnimationFrame(frame);
    }

    var raf = null;
    resize();

    if (reduceMotion) {
      sweep = 1;
      for (var i = 0; i < BINS; i++) peakHold[i] = emission(freqOf(i), 0);
      draw();
    } else {
      raf = requestAnimationFrame(frame);
    }

    window.addEventListener("resize", function () { resize(); draw(); });

    if ("IntersectionObserver" in window && !reduceMotion) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && raf === null) raf = requestAnimationFrame(frame);
          else if (!entry.isIntersecting && raf !== null) { cancelAnimationFrame(raf); raf = null; }
        });
      }, { threshold: 0 }).observe(cv);
    }
  }

  /* ==================================================== calculators ===== */
  /* First-order closed-form estimates — the free lead-magnet tools. Every
     formula used is named in the note under each calculator. */

  var C0 = 299.792458e6;                       // m/s

  // FCC Part 15 Subpart B radiated limits (quasi-peak), at their reference
  // distances. Declared before the wiring below so the initial run can see it.
  var FCC = {
    B: { dist: 3,  steps: [[88e6, 40.0], [216e6, 43.5], [960e6, 46.0], [Infinity, 54.0]] },
    A: { dist: 10, steps: [[88e6, 39.1], [216e6, 43.5], [960e6, 46.4], [Infinity, 49.5]] }
  };

  // Sensible default geometry per stripline/microstrip, in mil.
  var H_DEFAULT = { microstrip: 4, stripline: 20 };

  var num = function (el) { return parseFloat(el.value); };
  var set = function (root, key, text) {
    var el = root.querySelector("[data-out='" + key + "']");
    if (el) el.textContent = text;
  };
  var ok = function () {
    return Array.prototype.every.call(arguments, function (v) {
      return typeof v === "number" && isFinite(v) && v > 0;
    });
  };

  document.querySelectorAll("[data-calc]").forEach(function (root) {
    var kind = root.dataset.calc;
    var compute = { impedance: impedanceCalc, resonance: resonanceCalc, fcc: fccCalc }[kind];
    if (!compute) return;

    var run = function () { compute(root); };
    root.querySelectorAll("input, select").forEach(function (input) {
      input.addEventListener("input", run);
      input.addEventListener("change", run);
    });
    run();
  });

  /* --- trace impedance (IPC-2141A) --------------------------------------- */
  function impedanceCalc(root) {
    var typeEl = root.querySelector("[name='type']");
    var hEl = root.querySelector("[name='h']");
    var type = typeEl.value;

    // The h field means different things per geometry — relabel it, and carry
    // the value across only if it is still the other mode's untouched default.
    var last = root.dataset.lastType;
    if (last && last !== type && num(hEl) === H_DEFAULT[last]) {
      hEl.value = H_DEFAULT[type];
    }
    root.dataset.lastType = type;

    var hLabel = root.querySelector("label[for='" + hEl.id + "']");
    if (hLabel) {
      hLabel.textContent = type === "stripline"
        ? "Plane-to-plane spacing b (mil)"
        : "Dielectric height h (mil)";
    }

    var w  = num(root.querySelector("[name='w']"));       // mil
    var h  = num(hEl);                                    // mil
    var er = num(root.querySelector("[name='er']"));
    var t  = num(root.querySelector("[name='t']"));       // mil (copper)
    var warn = root.querySelector("[data-warn]");

    var showWarn = function (message) {
      if (!warn) return;
      warn.textContent = message || "";
      warn.style.display = message ? "block" : "none";
    };

    if (!ok(w, h, er, t)) {
      set(root, "z0", "—"); set(root, "tpd", "—");
      showWarn("");
      return;
    }

    var z0, tpd;
    if (type === "stripline") {
      z0 = (60 / Math.sqrt(er)) * Math.log((4 * h) / (0.67 * Math.PI * (0.8 * w + t)));
      tpd = 85 * Math.sqrt(er);
    } else {
      z0 = (87 / Math.sqrt(er + 1.41)) * Math.log((5.98 * h) / (0.8 * w + t));
      tpd = 85 * Math.sqrt(0.475 * er + 0.67);
    }

    set(root, "tpd", tpd.toFixed(0));

    if (!(z0 > 0)) {
      // The log argument went below 1 — the trace is too wide for the spacing.
      set(root, "z0", "—");
      showWarn(type === "stripline"
        ? "Plane-to-plane spacing is too small for a " + w + " mil trace — b needs to be roughly 4× the trace width before this formula is meaningful."
        : "Dielectric height is too small for a " + w + " mil trace for this approximation to hold.");
      return;
    }

    set(root, "z0", z0.toFixed(1));

    // IPC-2141A is only fitted over a limited geometry range.
    var ratio = w / h;
    showWarn(type === "microstrip" && (ratio < 0.1 || ratio > 3.0)
      ? "w/h = " + ratio.toFixed(2) + " is outside the 0.1–3.0 range this approximation was fitted over — treat the number as indicative only."
      : "");
  }

  /* --- power-plane cavity resonance -------------------------------------- */
  function resonanceCalc(root) {
    var a  = num(root.querySelector("[name='a']")) / 1000;   // mm -> m
    var b  = num(root.querySelector("[name='b']")) / 1000;
    var er = num(root.querySelector("[name='er']"));
    var h  = num(root.querySelector("[name='h']"));          // mm, plane separation

    if (!ok(a, b, er, h)) {
      ["f10", "f01", "f11", "cplane"].forEach(function (k) { set(root, k, "—"); });
      return;
    }

    var k = C0 / (2 * Math.sqrt(er));
    var f = function (m, n) {
      return k * Math.sqrt(Math.pow(m / a, 2) + Math.pow(n / b, 2)) / 1e6; // MHz
    };

    var fmt = function (mhz) {
      return mhz >= 1000 ? (mhz / 1000).toFixed(2) + " GHz" : mhz.toFixed(0) + " MHz";
    };

    set(root, "f10", fmt(f(1, 0)));
    set(root, "f01", fmt(f(0, 1)));
    set(root, "f11", fmt(f(1, 1)));

    // Parallel-plate capacitance of the plane pair.
    var cap = (8.854e-12 * er * a * b) / (h / 1000);  // farads
    set(root, "cplane", (cap * 1e9).toFixed(2) + " nF");
  }

  /* --- FCC Part 15 radiated limit ---------------------------------------- */
  function fccCalc(root) {
    var mhz  = num(root.querySelector("[name='freq']"));
    var cls  = root.querySelector("[name='class']").value;
    var dist = num(root.querySelector("[name='dist']"));
    var meas = parseFloat(root.querySelector("[name='meas']").value);

    if (!ok(mhz, dist) || !isFinite(meas)) {
      ["limit", "uvm", "margin", "verdict"].forEach(function (k) { set(root, k, "—"); });
      return;
    }

    var spec = FCC[cls];
    var hz = mhz * 1e6;
    var base = spec.steps.find(function (s) { return hz < s[0]; })[1];

    // Far-field extrapolation: field falls as 1/d, i.e. 20 dB per decade.
    var limit = base + 20 * Math.log10(spec.dist / dist);
    var margin = limit - meas;

    set(root, "limit", limit.toFixed(1) + " dBµV/m");
    set(root, "uvm", Math.pow(10, limit / 20).toFixed(0) + " µV/m");

    // Standard convention: positive margin is headroom under the limit.
    var colour = margin < 0 ? "var(--fail)" : margin < 6 ? "var(--risk)" : "var(--pass)";
    set(root, "margin", (margin >= 0 ? "+" : "−") + Math.abs(margin).toFixed(1) + " dB");
    var marginEl = root.querySelector("[data-out='margin']");
    if (marginEl) marginEl.style.color = colour;

    var el = root.querySelector("[data-out='verdict']");
    if (el) {
      el.textContent = margin < 0 ? "FAIL" : margin < 6 ? "RISK" : "PASS";
      el.style.color = colour;
    }

    var warn = root.querySelector("[data-warn]");
    if (warn) {
      var nearField = dist < 47.7 / mhz;   // λ/2π boundary
      warn.textContent = nearField
        ? "At " + dist + " m and " + mhz + " MHz you are inside the λ/2π near-field boundary — the 20 dB/decade extrapolation does not hold here."
        : "";
      warn.style.display = nearField ? "block" : "none";
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
        setError(input, "Enter a valid email address.");
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
      var valid = inputs.map(validate).every(Boolean);

      if (!valid) {
        var first = form.querySelector(".field.invalid input, .field.invalid select, .field.invalid textarea");
        if (first) first.focus();
        return;
      }

      // No backend is wired up in this static build — the handler confirms
      // locally. Point this at your form endpoint or inbox to go live.
      if (status) {
        status.textContent =
          "Thanks — that's in. You'll get a scoped reply with a fixed price and a start date within one business day.";
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
