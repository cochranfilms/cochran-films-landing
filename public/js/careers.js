(function () {
  var BLUEPRINT_BASE = "https://community.cochranfilms.studio/";
  var BLUEPRINT_PATHS = {
    craft: "",
    kit: "",
    portfolio: "",
    setup: "",
    pricing: "",
    outreach: "",
    delivery: "",
    rebooking: ""
  };
  var PRODUCT_URLS = {
    creatorcollective: "https://www.creatorcollective.media/",
    creatorcollectiveSignup: "https://www.creatorcollective.media/signup",
    creatorcollectiveBoard: "https://www.creatorcollective.media/opportunities",
    bizzi: "https://www.bizzicloud.io/",
    blueprint: BLUEPRINT_BASE
  };
  var STORAGE_KEY = "cfCareersPath";
  var Q1 = { shoot: "media", build: "development", run: "creator" };
  var Q2 = { learning: "craft", skills: "portfolio", paid: "pricing", booked: "rebooking" };
  var Q3 = { gear: "kit", setup: "setup", pricing: "pricing", clients: "outreach", delivery: "delivery" };
  var LANE_LABEL = { media: "Media", development: "Development", creator: "Creator Business" };
  var STAGE_LABEL = {
    craft: "Craft",
    kit: "Kit",
    portfolio: "Portfolio",
    setup: "Business Setup",
    pricing: "Pricing",
    outreach: "Outreach",
    delivery: "Delivery",
    rebooking: "Rebooking"
  };

  function withUtm(url, campaign) {
    var parsed = new URL(url);
    parsed.searchParams.set("utm_source", "cochranfilms");
    parsed.searchParams.set("utm_medium", "careers");
    parsed.searchParams.set("utm_campaign", campaign);
    return parsed.toString();
  }

  function blueprintUrl(stage, campaign) {
    var path = String(BLUEPRINT_PATHS[stage] || "").replace(/^\/+|\/+$/g, "");
    var base = BLUEPRINT_BASE.replace(/\/$/, "");
    var url = path ? base + "/" + path : base + "/";
    return withUtm(url, campaign);
  }

  function applyTracking() {
    document.querySelectorAll("[data-track]").forEach(function (link) {
      var product = link.getAttribute("data-track");
      var campaign = link.getAttribute("data-campaign") || "page";
      var stage = link.getAttribute("data-stage");
      if (product === "blueprint") {
        link.href = blueprintUrl(stage || "", campaign);
        return;
      }
      var base = PRODUCT_URLS[product];
      if (base) link.href = withUtm(base, campaign);
    });
  }

  function minimumDayRate(expenses, income, percent, days) {
    var exp = Number(expenses);
    var goal = Number(income);
    var pct = Number(percent);
    var billable = Number(days);
    if (!Number.isFinite(exp) || !Number.isFinite(goal) || exp < 0 || goal < 0) return null;
    if (!Number.isFinite(pct) || pct < 0 || pct > 90) return null;
    if (!Number.isFinite(billable) || billable < 1) return null;
    var decimal = pct / 100;
    var divisor = 1 - decimal;
    if (divisor <= 0) return null;
    return (exp + goal) / divisor / billable;
  }

  function money(value) {
    return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  }

  function readPath() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function writePath(value) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch (error) {}
  }

  function selected(form, name) {
    var field = form.querySelector('input[name="' + name + '"]:checked');
    return field ? field.value : "";
  }

  function routePath(answers) {
    var lane = Q1[answers.q1] || "";
    var stage = Q3[answers.q3] || Q2[answers.q2] || "";
    return { q1: answers.q1, q2: answers.q2, q3: answers.q3, lane: lane, stage: stage };
  }

  function paintPath(path) {
    document.querySelectorAll("[data-lane]").forEach(function (node) {
      node.classList.toggle("is-yours", Boolean(path.lane) && node.getAttribute("data-lane") === path.lane);
    });
    document.querySelectorAll("[data-stage]").forEach(function (node) {
      node.classList.toggle("is-yours", Boolean(path.stage) && node.getAttribute("data-stage") === path.stage);
    });
    var result = document.querySelector("[data-path-result]");
    if (!result) return;
    if (!path.lane && !path.stage) {
      result.hidden = true;
      return;
    }
    var copy = result.querySelector("[data-path-copy]");
    var cta = result.querySelector("[data-path-cta]");
    var parts = [];
    if (path.lane) parts.push("Your lane is " + LANE_LABEL[path.lane] + ".");
    if (path.stage) parts.push("Start at " + STAGE_LABEL[path.stage] + ".");
    copy.textContent = parts.join(" ");
    if (path.stage && cta) {
      cta.hidden = false;
      cta.href = blueprintUrl(path.stage, "path-finder-" + path.stage);
      cta.textContent = "Go deeper in Backend Blueprint";
    } else if (cta) {
      cta.hidden = true;
    }
    result.hidden = false;
  }

  function initPathFinder() {
    var form = document.querySelector("[data-path-finder]");
    if (!form) return;
    var saved = readPath();
    if (saved) {
      ["q1", "q2", "q3"].forEach(function (name) {
        if (!saved[name]) return;
        var input = form.querySelector('input[name="' + name + '"][value="' + saved[name] + '"]');
        if (input) input.checked = true;
      });
      paintPath(saved);
    }
    form.addEventListener("change", function () {
      var next = routePath({
        q1: selected(form, "q1"),
        q2: selected(form, "q2"),
        q3: selected(form, "q3")
      });
      writePath(next);
      paintPath(next);
    });
  }

  function initCalculator() {
    var form = document.querySelector("[data-rate-form]");
    if (!form) return;
    var out = form.querySelector("[data-rate-out]");
    var note = form.querySelector("[data-rate-note]");
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var rate = minimumDayRate(
        form.expenses.value,
        form.income.value,
        form.setAside.value,
        form.days.value
      );
      if (rate == null) {
        out.textContent = "Check the numbers.";
        note.textContent = "Set aside must be from 0 to 90. Billable days must be 1 or more.";
        return;
      }
      out.textContent = money(rate);
      note.textContent = "This is your minimum day rate. Revenue is not profit.";
    });
  }

  function paintOpportunities(list, status, jobs) {
    list.replaceChildren();
    if (!jobs.length) {
      status.textContent = "The board is the live list. Open Creator Collective to see what is posted today.";
      return;
    }
    status.textContent = "";
    jobs.forEach(function (job) {
      if (!job || !job.href || !job.title) return;
      var card = document.createElement("a");
      card.className = "cr-opp";
      card.href = withUtm(job.href, "studio-opportunity");
      card.target = "_blank";
      card.rel = "noopener noreferrer";
      var top = document.createElement("span");
      top.className = "cr-opp-top";
      if (job.type) {
        var type = document.createElement("span");
        type.className = "cr-opp-type";
        type.textContent = job.type;
        top.appendChild(type);
      }
      if (job.postedLabel) {
        var when = document.createElement("span");
        when.className = "cr-opp-when";
        when.textContent = job.postedLabel;
        top.appendChild(when);
      }
      var title = document.createElement("strong");
      title.textContent = job.title;
      card.appendChild(top);
      card.appendChild(title);
      if (job.location) {
        var where = document.createElement("span");
        where.className = "cr-opp-where";
        where.textContent = job.location;
        card.appendChild(where);
      }
      var foot = document.createElement("span");
      foot.className = "cr-opp-foot";
      if (job.pay) {
        var pay = document.createElement("span");
        pay.className = job.pay.indexOf(" to ") === -1 ? "cr-opp-pay" : "cr-opp-pay is-range";
        pay.textContent = job.pay;
        foot.appendChild(pay);
      }
      var go = document.createElement("span");
      go.className = "cr-opp-go";
      go.textContent = "View role";
      foot.appendChild(go);
      card.appendChild(foot);
      list.appendChild(card);
    });
    if (!list.childElementCount) {
      status.textContent = "The board is the live list. Open Creator Collective to see what is posted today.";
    }
  }

  function initOpportunities() {
    var root = document.querySelector("[data-opportunities]");
    if (!root) return;
    var list = root.querySelector("[data-opportunities-list]");
    var status = root.querySelector("[data-opportunities-status]");
    if (!list || !status) return;

    function show(body) {
      paintOpportunities(list, status, body && Array.isArray(body.jobs) ? body.jobs : []);
    }

    fetch("/api/opportunities/preview", { headers: { Accept: "application/json" } })
      .then(function (response) {
        if (!response.ok) throw new Error("preview");
        return response.json();
      })
      .then(show)
      .catch(function () {
        // The live board is served by /api/opportunities/preview on Vercel.
        // A local static server cannot run that function, so the preview file is only a stand-in.
        var local = location.hostname === "127.0.0.1" || location.hostname === "localhost";
        if (!local) {
          status.textContent = "The board is the live list. Open Creator Collective to see what is posted today.";
          return;
        }
        fetch("/assets/careers/opportunities-preview.json")
          .then(function (response) {
            if (!response.ok) throw new Error("snapshot");
            return response.json();
          })
          .then(show)
          .catch(function () {
            status.textContent = "The board is the live list. Open Creator Collective to see what is posted today.";
          });
      });
  }

  function initRoster() {
    var form = document.querySelector("[data-roster-form]");
    if (!form) return;
    var panel = form.closest(".cr-roster-panel");
    var intro = panel ? panel.querySelector("[data-roster-intro]") : null;
    var done = panel ? panel.querySelector("[data-roster-done]") : null;
    var loaded = form.querySelector('input[name="formLoadedAt"]');
    var status = form.querySelector("[data-roster-status]");
    var button = form.querySelector('button[type="submit"]');
    var buttonLabel = button ? button.textContent : "Join the roster";
    var lastSubmit = 0;
    if (loaded) loaded.value = String(Date.now());
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var now = Date.now();
      if (now - lastSubmit < 8000) {
        status.textContent = "Please wait a moment before sending again.";
        return;
      }
      var data = new FormData(form);
      if (String(data.get("cf_roster_trap") || "").trim()) {
        if (intro) intro.hidden = true;
        form.hidden = true;
        if (done) done.hidden = false;
        return;
      }
      lastSubmit = now;
      status.textContent = "";
      if (button) {
        button.disabled = true;
        button.textContent = "Sending...";
      }
      fetch("/api/contact/send-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(data.get("name") || "").trim(),
          email: String(data.get("email") || "").trim(),
          city: String(data.get("city") || "").trim(),
          role: String(data.get("role") || "").trim(),
          portfolioUrl: String(data.get("portfolioUrl") || "").trim(),
          availability: String(data.get("availability") || "").trim(),
          source: "careers-roster",
          companyWebsite: "",
          formLoadedAt: data.get("formLoadedAt")
        })
      }).then(function (response) {
        return response.text().then(function (text) {
          var body = {};
          try { body = JSON.parse(text); } catch (parseError) { body = {}; }
          return { ok: response.ok && body.success === true, body: body };
        });
      }).then(function (result) {
        if (!result.ok) throw new Error((result.body && result.body.error) || "Unable to send. Email info@cochranfilms.com.");
        if (intro) intro.hidden = true;
        form.hidden = true;
        if (done) done.hidden = false;
      }).catch(function (error) {
        if (button) {
          button.disabled = false;
          button.textContent = buttonLabel;
        }
        status.textContent = (error && error.message) || "Unable to send. Email info@cochranfilms.com.";
      });
    });
  }

  function initHero() {
    var root = document.querySelector("[data-careers-hero]");
    if (!root) return;
    var slides = Array.prototype.slice.call(root.querySelectorAll("[data-slide]"));
    var dots = Array.prototype.slice.call(root.querySelectorAll("[data-dot]"));
    var index = 0;
    var timer = null;
    var inView = true;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function sourceFor(slide) {
      var video = slide.querySelector("video");
      if (!video || reduce || video.querySelector("source")) return;
      ["mp4", "webm"].forEach(function (kind) {
        var file = slide.getAttribute("data-" + kind);
        if (!file) return;
        var source = document.createElement("source");
        source.src = file;
        source.type = kind === "mp4" ? "video/mp4" : "video/webm";
        video.appendChild(source);
      });
      video.load();
    }

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        var on = i === index;
        slide.classList.toggle("is-active", on);
        var video = slide.querySelector("video");
        if (!on && video && !reduce) {
          video.pause();
        }
      });
      dots.forEach(function (dot, i) {
        var on = i === index;
        dot.classList.toggle("is-active", on);
        dot.setAttribute("aria-selected", on ? "true" : "false");
      });
      sourceFor(slides[index]);
      if (slides[index + 1]) sourceFor(slides[index + 1]);
      var activeVideo = slides[index].querySelector("video");
      if (activeVideo && !reduce) {
        var playPromise = activeVideo.play();
        if (playPromise && playPromise.catch) playPromise.catch(function () {});
      }
      if (index >= slides.length - 1) stop();
    }

    function stop() {
      if (timer) clearInterval(timer);
      timer = null;
    }

    function start() {
      stop();
      if (reduce || index >= slides.length - 1) return;
      timer = setInterval(function () { show(index + 1); }, 14000);
    }

    root.querySelector("[data-hero-next]").addEventListener("click", function () {
      show(index + 1);
      start();
    });
    root.querySelector("[data-hero-prev]").addEventListener("click", function () {
      show(index - 1);
      start();
    });
    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.getAttribute("data-dot")));
        start();
      });
    });
    var touchX = 0;
    root.addEventListener("touchstart", function (event) {
      touchX = event.changedTouches[0].screenX;
    }, { passive: true });
    root.addEventListener("touchend", function (event) {
      var endX = event.changedTouches[0].screenX;
      if (endX < touchX - 50) show(index + 1);
      if (endX > touchX + 50) show(index - 1);
      start();
    }, { passive: true });

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        inView = entries.some(function (entry) { return entry.isIntersecting; });
      }, { threshold: 0.4 });
      observer.observe(root);
    }

    document.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      var active = document.activeElement;
      var typing = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.tagName === "SELECT" || active.isContentEditable);
      var player = document.querySelector("[data-cca-advice]");
      if (typing || !inView || (player && player.contains(active))) return;
      event.preventDefault();
      show(index + (event.key === "ArrowRight" ? 1 : -1));
      start();
    });

    show(0);
    start();
  }

  function initFilms() {
    var root = document.querySelector("[data-cca-advice]");
    if (!root) return;
    var films = [
      { id: "F_8V9yxLK90", title: "All in One Creator Platform" },
      { id: "T--3T0a5D7E", title: "You Made $10,000. But How Much Did You Actually Profit?" },
      { id: "8E-ktIySIdY", title: "Slow Season Is Testing Your Creative Business" },
      { id: "A39qIgHyTUc", title: "Stop Chasing New Clients: How to Keep the Good Ones" },
      { id: "JDlSEVn7l7c", title: "Stop Pouring Into People Who Will Not Pour Back" },
      { id: "8HZxdpqRtFE", title: "You Cannot Want Success More Than They Do" },
      { id: "5nqf9OfDCyQ", title: "You Are the Reason Your Success Is Delayed" },
      { id: "dV3Te18vA5U", title: "Why Consistency Is the Cheat Code for Creators" },
      { id: "hVc2YjEinXs", title: "Why Creators Struggle to Grow Alone" },
      { id: "ACg_YaGmJQI", title: "What Makes Creator Collective Different?" }
    ];
    var index = 0;
    var frame = root.querySelector("[data-cca-frame]");
    var title = root.querySelector("[data-cca-film]");

    function mountPlayer(film) {
      var iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube.com/embed/" + film.id + "?rel=0&modestbranding=1&playsinline=1&autoplay=1";
      iframe.title = film.title;
      iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
      iframe.setAttribute("allowfullscreen", "");
      frame.replaceChildren(iframe);
    }

    function render() {
      var film = films[index];
      frame.replaceChildren();
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cr-film-facade";
      btn.setAttribute("aria-label", "Play " + film.title);
      var img = document.createElement("img");
      img.src = "https://i.ytimg.com/vi/" + film.id + "/hqdefault.jpg";
      img.alt = "";
      var play = document.createElement("span");
      play.className = "cr-film-play";
      play.textContent = "Play";
      btn.appendChild(img);
      btn.appendChild(play);
      btn.addEventListener("click", function () { mountPlayer(film); });
      frame.appendChild(btn);
      title.textContent = film.title;
    }

    function step(delta) {
      index = (index + delta + films.length) % films.length;
      render();
    }

    root.querySelector("[data-cca-next]").addEventListener("click", function () { step(1); });
    root.querySelector("[data-cca-prev]").addEventListener("click", function () { step(-1); });
    root.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      event.stopPropagation();
      step(event.key === "ArrowRight" ? 1 : -1);
    });
    render();
  }

  function initReveal() {
    var nodes = document.querySelectorAll(".cr-stage, .cr-raise-tile");
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return;
    document.documentElement.classList.add("cr-motion");
    if (nodes.length) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.22 });
      Array.prototype.forEach.call(nodes, function (node) { observer.observe(node); });
    }
    var road = document.querySelector(".cr-roadmap");
    if (!road) return;
    var line = document.createElement("div");
    line.className = "cr-playhead";
    road.appendChild(line);
    var frame = 0;
    function paint() {
      frame = 0;
      var rect = road.getBoundingClientRect();
      var traveled = window.innerHeight * 0.42 - rect.top;
      var progress = traveled / Math.max(rect.height, 1);
      line.style.transform = "scaleY(" + Math.max(0, Math.min(1, progress)) + ")";
    }
    window.addEventListener("scroll", function () {
      if (frame) return;
      frame = window.requestAnimationFrame(paint);
    }, { passive: true });
    paint();
  }

  applyTracking();
  initPathFinder();
  initCalculator();
  initOpportunities();
  initReveal();
  initRoster();
  initHero();
  initFilms();

  window.cfCareersMinimumDayRate = minimumDayRate;
})();
