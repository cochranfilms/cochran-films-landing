document.documentElement.classList.add("js");
(function () {
  var posts = [{"slug": "revenue-is-not-profit", "title": "You Made $10,000. Here Is What You Actually Kept.", "excerpt": "Revenue is the number that feels like a win. Profit is what is left after the job, the tax, the gear, and the next month of overhead.", "category": "Creator Business", "read": 7, "coverAlt": "Cody Cochran and JB on Creator Collective discussing profit versus revenue"}, {"slug": "slow-season-is-a-test", "title": "Slow Season Is a Test, Not a Verdict", "excerpt": "A quiet month is not proof the studio failed. It is the window to fix the offer, protect the kit, and be ready when the work returns.", "category": "Creator Business", "read": 7, "coverAlt": "Cody Cochran and JB on Creator Collective discussing a slow season"}, {"slug": "keep-the-clients-you-already-earned", "title": "Stop Chasing New Clients. Keep the Good Ones.", "excerpt": "A new lead is expensive. A client who already trusts the work will hire again if the care does not drop after the first invoice.", "category": "Creator Business", "read": 7, "coverAlt": "Cody Cochran and JB on Creator Collective discussing client retention"}, {"slug": "stop-pouring-into-empty-partnerships", "title": "Stop Pouring Into People Who Will Not Pour Back", "excerpt": "Help is part of the work. A one-way partnership is not. Attention is the inventory, and it belongs on the mission that moves.", "category": "Creator Business", "read": 6, "coverAlt": "Cody Cochran and JB on Creator Collective discussing mutual partnerships"}, {"slug": "you-cannot-want-it-more-than-they-do", "title": "You Cannot Want the Win More Than They Do", "excerpt": "You can open the door, scope the job, and show the path. You cannot care the client, the lead, or the partner across the threshold.", "category": "Creator Business", "read": 6, "coverAlt": "Cody Cochran and JB on Creator Collective discussing effort that has to be mutual"}, {"slug": "how-to-choose-a-videographer-atlanta", "title": "How to Choose a Videographer in Atlanta: A Checklist for Decision Makers", "excerpt": "Use a clear checklist: real portfolio depth, a kit that fits the job, a delivery path, straight communication, and pricing you can explain.", "category": "Creator Business", "read": 4, "coverAlt": "Client and videographer reviewing a shot list at a studio table"}, {"slug": "douglasville-to-main-stage-lessons", "title": "From Douglasville to the Main Stage: Lessons From Big Productions", "excerpt": "Large rooms teach the same habits as civic ones. Prepare, carry a backup, and stay calm enough to make the next right picture.", "category": "Event Coverage", "read": 4, "coverAlt": "Concert stage washed in warm light beams and haze"}, {"slug": "cochran-films-brand-storytelling", "title": "The Cochran Films Approach to Brand Storytelling", "excerpt": "A brand film earns trust when story, light, sound, and pace agree. Here is the practical philosophy behind the work.", "category": "Video Production", "read": 4, "coverAlt": "Cinematic portrait of a founder lit with a warm key light"}, {"slug": "web-development-for-creative-brands", "title": "Your Website Is Your Best Salesperson: Web Development for Creative Brands", "excerpt": "A fast, clear site keeps selling when the crew is on set. Structure, speed, and a real next step are the job.", "category": "Web and SEO", "read": 4, "coverAlt": "Large studio display showing a dark portfolio website"}, {"slug": "cloud-delivery-client-footage", "title": "Cloud Delivery Done Right: Moving Client Footage Securely", "excerpt": "The way files arrive is part of the film. A secure, branded handoff tells the client the work is finished and safe.", "category": "Systems and Automation", "read": 4, "coverAlt": "Laptop open to a dark library of client video files"}, {"slug": "workflow-automation-for-creatives", "title": "Workflow Automation for Creative Businesses: Deliver Faster, Stress Less", "excerpt": "Automation is not a gadget. It is hours returned at intake, quote, contract, schedule, and delivery so the edit can have your attention.", "category": "Systems and Automation", "read": 4, "coverAlt": "Producer desk with a laptop, a monitor, and drives ready for the next delivery"}, {"slug": "turn-a-camera-into-a-company", "title": "How Creators Turn a Camera Into a Company", "excerpt": "A camera is a tool. A company is pricing, systems, and a name clients can trust. Here is the path without the myth.", "category": "Creator Business", "read": 4, "coverAlt": "Creator reviewing footage on a laptop beside a cinema camera"}, {"slug": "sony-fx6-fx3-location-setup", "title": "The Gear Behind the Work: The Sony FX6 and FX3 on Location", "excerpt": "The FX6, the FX3, GODOX light, DJI support, and RODE audio are chosen for reliable pictures and sound when the location will not cooperate.", "category": "Video Production", "read": 4, "coverAlt": "Rigged cinema camera on a tripod in warm outdoor light"}, {"slug": "color-grading-explained", "title": "Color Grading Explained: What Separates Raw Footage From a Finished Film", "excerpt": "Raw, corrected, and graded are three different pictures. Grading every clip is a craft, and the screen shows when it was skipped.", "category": "Video Production", "read": 4, "coverAlt": "Color suite monitor comparing a flat portrait with a finished warm grade"}, {"slug": "building-systems-that-scale", "title": "Building Systems That Scale: Why Media Is Only the Beginning", "excerpt": "A strong film wins the first yes. Booking flows, portals, and delivery pipelines are what let a small team keep the relationship.", "category": "Systems and Automation", "read": 4, "coverAlt": "Studio monitor showing an operations dashboard in a dark room"}, {"slug": "corporate-event-videography-field-guide", "title": "Corporate Event Videography: A Field Guide for Conference Planners", "excerpt": "Keynotes and breakouts need a plan for cameras, sound, color, and delivery. This is the field guide planners can use before they book.", "category": "Event Coverage", "read": 4, "coverAlt": "Keynote stage seen from the back of a full conference room"}, {"slug": "podcast-production-atlanta-executive-guide", "title": "Podcast Production in Atlanta: What Executives Should Expect", "excerpt": "A professional podcast is a set, a sound standard, and a delivery rhythm. Here is what executives should expect before the first record.", "category": "Podcasting", "read": 4, "coverAlt": "Podcast set with two chairs and broadcast microphones under warm light"}, {"slug": "on-site-event-printing-brand-ambassadors", "title": "How On Site Event Printing Turns Guests Into Brand Ambassadors", "excerpt": "A branded print in a guest's hand travels farther than a post that scrolls away, and the studio stack makes that moment fast.", "category": "Event Coverage", "read": 4, "coverAlt": "Guest holding a freshly printed photo at a dim evening event"}, {"slug": "real-cost-in-house-versus-agency", "title": "The Real Cost of Hiring In House Versus Partnering With an Agency", "excerpt": "The salary on a job post hides payroll taxes, benefits, gear, software, and months of ramp up that a retainer already covers.", "category": "Creator Business", "read": 5, "coverAlt": "Overhead of a business desk beside a staged cinema camera kit"}, {"slug": "why-atlanta-brands-choose-a-full-stack-studio", "title": "Why Atlanta Brands Choose a Full Stack Creative Studio", "excerpt": "One accountable studio for video, photo, podcast, print, web, and automation beats five freelancers who never share a plan.", "category": "Systems and Automation", "read": 5, "coverAlt": "Cinema camera and reference monitor in a dark Atlanta studio at night"}];
  function card(p) {
    return '<article class="post-card reveal is-in" data-category="' + p.category + '">' +
      '<a class="post-card-link" href="/blog/posts/' + p.slug + '.html">' +
      '<div class="post-card-media"><img src="/blog/assets/img/covers/' + p.slug + '.jpg" alt="' + p.coverAlt.replace(/"/g, "&quot;") + '" width="1600" height="900" loading="lazy"></div>' +
      '<div class="post-card-body"><p class="eyebrow">' + p.category + '</p><h2>' + p.title + '</h2>' +
      '<p class="excerpt">' + p.excerpt + '</p><p class="card-meta"><span>' + p.read + ' min read</span><span class="read-arrow">Read</span></p></div></a></article>';
  }
  var grid = document.querySelector("[data-post-grid]");
  var pagination = document.querySelector("[data-pagination]");
  var original = grid ? grid.innerHTML : "";
  var buttons = document.querySelectorAll("[data-filter]");
  function observe() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll(".reveal").forEach(function (n) { n.classList.add("is-in"); });
      return;
    }
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".reveal").forEach(function (n) { n.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal:not(.is-in)").forEach(function (n) { io.observe(n); });
  }
  function apply(filter) {
    buttons.forEach(function (btn) {
      var on = btn.getAttribute("data-filter") === filter;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
    var feature = document.querySelector("[data-feature]");
    if (feature) {
      var featureCat = feature.getAttribute("data-category");
      feature.hidden = !(filter === "All" || filter === featureCat);
    }
    if (!grid) return;
    if (filter === "All") {
      grid.innerHTML = original;
      if (pagination) pagination.hidden = false;
    } else {
      var matches = posts.filter(function (p) { return p.category === filter; });
      grid.innerHTML = matches.length ? matches.map(card).join("") : '<p class="empty">No posts in this category yet.</p>';
      if (pagination) pagination.hidden = true;
    }
    observe();
  }
  buttons.forEach(function (btn) {
    if (btn.tagName === "A") return;
    btn.addEventListener("click", function () { apply(btn.getAttribute("data-filter")); });
  });
  var toggle = document.querySelector(".mobile-menu-toggle");
  var menu = document.querySelector(".nav-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("show");
      document.body.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      var icon = toggle.querySelector("i");
      if (icon) {
        icon.classList.toggle("fa-bars", !open);
        icon.classList.toggle("fa-xmark", open);
      }
    });
    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        menu.classList.remove("show");
        document.body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }
  var form = document.querySelector("[data-newsletter]");
  var formLoadedAt = Date.now();
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = form.querySelector("input[type=email]");
      var email = input && input.value.trim();
      var note = form.querySelector("[data-newsletter-note]");
      var consent = form.querySelector('input[name="consent"]');
      var honey = form.querySelector('input[name="companyWebsite"]');
      var button = form.querySelector('button[type="submit"]');
      if (!email) {
        if (note) note.textContent = "Add an email address to join the list.";
        return;
      }
      if (!consent || !consent.checked) {
        if (note) note.textContent = "Check the box so we know you want the notes.";
        return;
      }
      if (Date.now() - formLoadedAt < 3000) {
        if (note) note.textContent = "Give it a second, then send again.";
        return;
      }
      if (button) button.disabled = true;
      if (note) note.textContent = "Sending…";
      fetch("/api/contact/send-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: "Journal",
          lastName: "List",
          name: "Journal List",
          email: email,
          service: "other",
          message: "Please add " + email + " to the Cochran Films journal list. They agreed to receive a note when a new essay is published and can unsubscribe by reply. Source: journal signup.",
          companyWebsite: honey ? honey.value : "",
          formLoadedAt: formLoadedAt
        })
      }).then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error((data && data.error) || "Could not join");
          if (note) note.textContent = "You're on the list. We'll write when the next essay is up.";
          form.reset();
        });
      }).catch(function () {
        if (note) note.textContent = "We could not reach the list. Email info@cochranfilms.com and we will add you.";
      }).then(function () {
        if (button) button.disabled = false;
      });
    });
  }
  observe();
  mountChrome();
})();

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isJournalIndex() {
  var path = location.pathname.replace(/\/index\.html$/, "");
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path.endsWith("/blog");
}

function mountChrome() {
  var postHero = document.querySelector(".post-hero");
  var hero = document.querySelector(".hero");
  if (hero && !postHero) mountListing(hero);
  if (postHero) {
    mountReading(postHero);
    loadStage().then(function (stage) {
      if (stage) stage.mountGrade(postHero);
    });
  }
  if (isJournalIndex()) mountReticle();
}

function mountListing(hero) {
  var canvas = document.createElement("canvas");
  canvas.className = "viewfinder";
  canvas.setAttribute("data-viewfinder", "");
  canvas.setAttribute("aria-hidden", "true");
  var frame = document.createElement("div");
  frame.className = "vf-frame";
  frame.setAttribute("aria-hidden", "true");
  frame.innerHTML = "<span></span><span></span><span></span><span></span>";
  hero.insertBefore(frame, hero.firstChild);
  hero.insertBefore(canvas, frame);
  if (prefersReducedMotion()) return;
  loadStage().then(function (stage) {
    if (stage) stage.mountViewfinder(canvas, hero);
  });
}

function loadStage() {
  if (prefersReducedMotion()) return Promise.resolve(null);
  return import("/blog/assets/js/stage.js").catch(function () { return null; });
}

function mountReading(postHero) {
  var article = document.querySelector(".article");
  if (!article) return;
  var minutes = 4;
  var byline = postHero.querySelector(".byline");
  if (byline) {
    var match = byline.textContent.match(/(\d+)\s*min/);
    if (match) minutes = parseInt(match[1], 10) || minutes;
  }
  var duration = minutes * 60;
  var bar = document.createElement("div");
  bar.className = "timecode";
  bar.innerHTML = '<div class="timecode-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="Reading progress"><span></span></div><p class="timecode-readout">00:00:00</p>';
  document.body.appendChild(bar);
  var fill = bar.querySelector("span");
  var readout = bar.querySelector(".timecode-readout");
  var progress = bar.querySelector("[role=progressbar]");

  var heads = Array.prototype.slice.call(article.querySelectorAll("h2"));
  var rail = null;
  if (heads.length) {
    rail = document.createElement("nav");
    rail.className = "chapter-rail";
    rail.setAttribute("aria-label", "Chapters");
    heads.forEach(function (head, i) {
      if (!head.id) {
        var slug = head.textContent.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        head.id = slug || ("chapter-" + (i + 1));
      }
      var link = document.createElement("a");
      link.href = "#" + head.id;
      link.textContent = head.textContent;
      rail.appendChild(link);
    });
    postHero.insertAdjacentElement("afterend", rail);
  }

  function pad(n) { return String(n).padStart(2, "0"); }
  function onScroll() {
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var amount = Math.min(1, Math.max(0, window.scrollY / max));
    var elapsed = Math.round(amount * duration);
    var hh = Math.floor(elapsed / 3600);
    var mm = Math.floor((elapsed % 3600) / 60);
    var ss = elapsed % 60;
    fill.style.width = (amount * 100) + "%";
    readout.textContent = pad(hh) + ":" + pad(mm) + ":" + pad(ss);
    progress.setAttribute("aria-valuenow", String(Math.round(amount * 100)));
    if (!rail) return;
    var current = null;
    heads.forEach(function (head) {
      if (head.getBoundingClientRect().top <= 150) current = head;
    });
    Array.prototype.forEach.call(rail.querySelectorAll("a"), function (link) {
      var on = current && link.getAttribute("href") === "#" + current.id;
      if (on) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function mountReticle() {
  if (prefersReducedMotion()) return;
  if (!window.matchMedia("(pointer: fine)").matches) return;
  var reticle = document.createElement("div");
  reticle.className = "reticle";
  reticle.setAttribute("aria-hidden", "true");
  document.body.appendChild(reticle);
  document.body.classList.add("has-reticle");
  var x = 0;
  var y = 0;
  var cx = 0;
  var cy = 0;
  var live = false;
  document.addEventListener("pointermove", function (e) {
    var field = e.target.closest && e.target.closest("input, textarea, select");
    if (field) {
      reticle.classList.remove("is-on");
      live = false;
      return;
    }
    x = e.clientX;
    y = e.clientY;
    if (!live) {
      cx = x;
      cy = y;
    }
    live = true;
    reticle.classList.add("is-on");
    var tight = e.target.closest && e.target.closest(".post-card, .feature-poster, a, button");
    reticle.classList.toggle("is-tight", !!tight);
  });
  document.addEventListener("pointerleave", function () {
    live = false;
    reticle.classList.remove("is-on");
  });
  function tick() {
    if (live) {
      cx += (x - cx) * 0.22;
      cy += (y - cy) * 0.22;
      reticle.style.transform = "translate3d(" + cx + "px," + cy + "px,0)";
    }
    requestAnimationFrame(tick);
  }
  tick();
}
