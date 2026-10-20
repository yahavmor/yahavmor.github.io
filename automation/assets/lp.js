/* Yahav Mor · automation landing pages: in-browser demo + contact form */
(function () {
  "use strict";
  var HOOK = "https://hook.eu1.make.com/7kpkq1x5l5xpwmmd0ymcvjr8zmjpj9v3";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); };
  var cfg = window.LP || {};

  /* ---------- UTM: remember where the visitor came from ---------- */
  var utm = "";
  try {
    var q = new URLSearchParams(location.search), parts = [];
    ["utm_source", "utm_medium", "utm_campaign"].forEach(function (k) { if (q.get(k)) parts.push(k.replace("utm_", "") + "=" + q.get(k).slice(0, 60)); });
    if (parts.length) { utm = parts.join(", "); sessionStorage.setItem("lp_utm", utm); }
    else utm = sessionStorage.getItem("lp_utm") || "";
  } catch (e) { /* storage blocked: fine */ }

  /* ---------- in-browser demo (nothing is sent) ---------- */
  var demoForm = $("#demoForm");
  if (demoForm) {
    var steps = $$("#demoSteps li"), timers = [];
    var stamp = function () { var d = new Date(); return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); };
    demoForm.addEventListener("submit", function (e) {
      e.preventDefault();
      timers.forEach(clearTimeout); timers = [];
      var name = ($("#demoName").value || "").trim() || "דנה כהן";
      var svc = $("#demoService").value;
      var first = name.split(/\s+/)[0];
      var fill = {
        row: '<div class="mini-row"><span>' + esc(name) + '</span><span><span class="pill">' + esc(svc) + '</span></span><span>' + stamp() + '</span></div>',
        alert: "<b>ליד חדש: " + esc(name) + "</b><br>" + esc(svc) + " · " + esc(cfg.alertSuffix || "מהאתר"),
        mail: "<b>היי " + esc(first) + ",</b> קיבלנו את הפנייה שלך לגבי " + esc(svc) + ". " + esc(cfg.mailLine || "נחזור אליך היום."),
        extra: esc((cfg.extra || "").replace("{service}", svc).replace("{name}", first))
      };
      steps.forEach(function (li) {
        li.classList.remove("on");
        var t = li.querySelector("time"); if (t) t.textContent = "";
        var c = li.querySelector(".card"); if (c && fill[c.dataset.fill]) c.innerHTML = fill[c.dataset.fill];
      });
      var delays = [250, 900, 1500, 2200, 2900], secs = ["0.2", "0.8", "1.4", "2.1", "2.8"];
      steps.forEach(function (li, i) {
        timers.push(setTimeout(function () {
          li.classList.add("on");
          var t = li.querySelector("time"); if (t) t.textContent = "+" + secs[i] + "s";
        }, delays[i]));
      });
      var btn = $("button", demoForm); btn.textContent = "להריץ שוב";
    });
  }

  var t0 = Date.now();

  /* ---------- free template (lead magnet) → Make webhook ---------- */
  var MAGNET_HOOK = "https://hook.eu1.make.com/jl1vqphwvlwut4sj5pafbxele89iojii";
  var mForm = $("#magnetForm");
  if (mForm) {
    var mBtn = $("#magnetBtn"), mStatus = $("#magnetStatus");
    var mShow = function (kind, html) { mStatus.hidden = false; mStatus.className = "status " + kind; mStatus.innerHTML = html; };
    mForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!mForm.checkValidity()) { mForm.reportValidity(); return; }
      var fd = new FormData(mForm);
      if (String(fd.get("website") || "").trim()) return; /* bot */
      var body = new URLSearchParams();
      body.append("name", String(fd.get("name") || "").trim());
      body.append("email", String(fd.get("email") || "").trim());
      body.append("business", String(fd.get("business") || "").trim());
      body.append("consent", fd.get("consent") === "yes" ? "yes" : "no");
      body.append("page", location.href.split("#")[0]);
      body.append("utm", (window.LPM && window.LPM.source ? window.LPM.source : "") + (utm ? " · " + utm : ""));
      body.append("t", String(Date.now() - t0));
      mBtn.disabled = true; mBtn.textContent = "שולח...";
      mShow("wait", "שולח...");
      var ctrl = window.AbortController ? new AbortController() : null;
      var killer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 25000);
      fetch(MAGNET_HOOK, { method: "POST", body: body, signal: ctrl ? ctrl.signal : undefined })
        .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); })
        .then(function () {
          clearTimeout(killer);
          mShow("ok", "<b>נשלח!</b> התבנית בדרך למייל שלך. אם היא לא מגיעה תוך כמה דקות, כדאי לבדוק גם בתיקיית קידומי מכירות או ספאם.");
          mForm.reset(); mBtn.disabled = false; mBtn.textContent = "שלחו לי את התבנית";
        })
        .catch(function () {
          clearTimeout(killer);
          mShow("err", "<b>השליחה לא הצליחה.</b> אפשר לנסות שוב, או לכתוב לי ל-<a href=\"mailto:yahavmor77@gmail.com\">yahavmor77@gmail.com</a> ואשלח את התבנית ידנית.");
          mBtn.disabled = false; mBtn.textContent = "שלחו לי את התבנית";
        });
    });
  }

  /* ---------- contact form → Make webhook ---------- */
  var form = $("#leadForm");
  if (!form) return;
  var btn = $("#leadBtn"), statusEl = $("#leadStatus");
  var show = function (kind, html) { statusEl.hidden = false; statusEl.className = "status " + kind; statusEl.innerHTML = html; };
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    var fd = new FormData(form);
    if (String(fd.get("website") || "").trim()) return; /* bot */
    var msg = String(fd.get("message") || "").trim();
    msg += (msg ? "\n\n" : "") + "[מקור: " + (cfg.source || "דף נחיתה") + (utm ? " · " + utm : "") + "]";
    var body = new URLSearchParams();
    body.append("name", String(fd.get("name") || "").trim());
    body.append("phone", String(fd.get("phone") || "").trim());
    body.append("email", String(fd.get("email") || "").trim());
    body.append("business", String(fd.get("business") || "").trim());
    body.append("type", cfg.type || "דף נחיתה");
    body.append("message", msg);
    body.append("page", location.href.split("#")[0]);
    btn.disabled = true; btn.textContent = "שולח...";
    show("wait", "שולח את הפרטים...");
    var ctrl = window.AbortController ? new AbortController() : null;
    var killer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 25000);
    fetch(HOOK, { method: "POST", body: body, signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); })
      .then(function () {
        clearTimeout(killer);
        show("ok", "<b>תודה, הפרטים התקבלו.</b> אחזור אליך תוך 24 שעות" + (fd.get("email") ? ", ובינתיים נשלח אליך מייל אישור. אגב, הוא נשלח אוטומטית, בדיוק כמו שיקבלו הלקוחות שלך." : "."));
        form.reset(); btn.disabled = false; btn.textContent = "שליחה";
      })
      .catch(function () {
        clearTimeout(killer);
        show("err", "<b>השליחה לא הצליחה.</b> אפשר לנסות שוב, או לכתוב לי ישר <a href=\"https://wa.me/972543441067\">בוואטסאפ</a> או בטלפון <a href=\"tel:+972543441067\">054-3441067</a>.");
        btn.disabled = false; btn.textContent = "שליחה";
      });
  });
})();
