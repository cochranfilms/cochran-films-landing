document.documentElement.classList.add("js");
(function () {
  var posts = [{"slug":"why-atlanta-brands-choose-a-full-stack-studio","title":"Why Atlanta Brands Choose a Full Stack Creative Studio","excerpt":"One accountable studio for video, photo, podcast, print, web, and automation beats five freelancers who never share a plan.","category":"Systems and Automation","read":5,"coverAlt":"Cinema camera and reference monitor in a dark Atlanta studio at night"},{"slug":"real-cost-in-house-versus-agency","title":"The Real Cost of Hiring In House Versus Partnering With an Agency","excerpt":"The salary on a job post hides payroll taxes, benefits, gear, software, and months of ramp up that a retainer already covers.","category":"Creator Business","read":5,"coverAlt":"Overhead of a business desk beside a staged cinema camera kit"},{"slug":"on-site-event-printing-brand-ambassadors","title":"How On Site Event Printing Turns Guests Into Brand Ambassadors","excerpt":"A branded print in a guest's hand travels farther than a post that scrolls away, and the studio stack makes that moment fast.","category":"Event Coverage","read":4,"coverAlt":"Guest holding a freshly printed photo at a dim evening event"},{"slug":"podcast-production-atlanta-executive-guide","title":"Podcast Production in Atlanta: What Executives Should Expect","excerpt":"A professional podcast is a set, a sound standard, and a delivery rhythm. Here is what executives should expect before the first record.","category":"Podcasting","read":4,"coverAlt":"Podcast set with two chairs and broadcast microphones under warm light"},{"slug":"corporate-event-videography-field-guide","title":"Corporate Event Videography: A Field Guide for Conference Planners","excerpt":"Keynotes and breakouts need a plan for cameras, sound, color, and delivery. This is the field guide planners can use before they book.","category":"Event Coverage","read":4,"coverAlt":"Keynote stage seen from the back of a full conference room"},{"slug":"building-systems-that-scale","title":"Building Systems That Scale: Why Media Is Only the Beginning","excerpt":"A strong film wins the first yes. Booking flows, portals, and delivery pipelines are what let a small team keep the relationship.","category":"Systems and Automation","read":4,"coverAlt":"Studio monitor showing an operations dashboard in a dark room"},{"slug":"color-grading-explained","title":"Color Grading Explained: What Separates Raw Footage From a Finished Film","excerpt":"Raw, corrected, and graded are three different pictures. Grading every clip is a craft, and the screen shows when it was skipped.","category":"Video Production","read":4,"coverAlt":"Color suite monitor comparing a flat portrait with a finished warm grade"},{"slug":"sony-fx6-fx3-location-setup","title":"The Gear Behind the Work: The Sony FX6 and FX3 on Location","excerpt":"The FX6, the FX3, GODOX light, DJI support, and RODE audio are chosen for reliable pictures and sound when the location will not cooperate.","category":"Video Production","read":4,"coverAlt":"Rigged cinema camera on a tripod in warm outdoor light"},{"slug":"turn-a-camera-into-a-company","title":"How Creators Turn a Camera Into a Company","excerpt":"A camera is a tool. A company is pricing, systems, and a name clients can trust. Here is the path without the myth.","category":"Creator Business","read":4,"coverAlt":"Creator reviewing footage on a laptop beside a cinema camera"},{"slug":"workflow-automation-for-creatives","title":"Workflow Automation for Creative Businesses: Deliver Faster, Stress Less","excerpt":"Automation is not a gadget. It is hours returned at intake, quote, contract, schedule, and delivery so the edit can have your attention.","category":"Systems and Automation","read":4,"coverAlt":"Producer desk with a laptop, a monitor, and drives ready for the next delivery"},{"slug":"cloud-delivery-client-footage","title":"Cloud Delivery Done Right: Moving Client Footage Securely","excerpt":"The way files arrive is part of the film. A secure, branded handoff tells the client the work is finished and safe.","category":"Systems and Automation","read":4,"coverAlt":"Laptop open to a dark library of client video files"},{"slug":"web-development-for-creative-brands","title":"Your Website Is Your Best Salesperson: Web Development for Creative Brands","excerpt":"A fast, clear site keeps selling when the crew is on set. Structure, speed, and a real next step are the job.","category":"Web and SEO","read":4,"coverAlt":"Large studio display showing a dark portfolio website"},{"slug":"cochran-films-brand-storytelling","title":"The Cochran Films Approach to Brand Storytelling","excerpt":"A brand film earns trust when story, light, sound, and pace agree. Here is the practical philosophy behind the work.","category":"Video Production","read":4,"coverAlt":"Cinematic portrait of a founder lit with a warm key light"},{"slug":"douglasville-to-main-stage-lessons","title":"From Douglasville to the Main Stage: Lessons From Big Productions","excerpt":"Large rooms teach the same habits as civic ones. Prepare, carry a backup, and stay calm enough to make the next right picture.","category":"Event Coverage","read":4,"coverAlt":"Concert stage washed in warm light beams and haze"},{"slug":"how-to-choose-a-videographer-atlanta","title":"How to Choose a Videographer in Atlanta: A Checklist for Decision Makers","excerpt":"Use a clear checklist: real portfolio depth, a kit that fits the job, a delivery path, straight communication, and pricing you can explain.","category":"Creator Business","read":4,"coverAlt":"Client and videographer reviewing a shot list at a studio table"}];
  function card(p) {
    return '<article class="post-card reveal is-in" data-category="' + p.category + '">' +
      '<a class="post-card-link" href="/blog/posts/' + p.slug + '.html">' +
      '<div class="post-card-media"><img src="/blog/assets/img/covers/' + p.slug + '.jpg" alt="' + p.coverAlt.replace(/"/g, "&quot;") + '" width="1600" height="900" loading="lazy"></div>' +
      '<div class="post-card-body"><p class="cat-pill">' + p.category + '</p><h2>' + p.title + '</h2>' +
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
    btn.addEventListener("click", function () { apply(btn.getAttribute("data-filter")); });
  });
  var toggle = document.querySelector("[data-nav-toggle]");
  var links = document.querySelector("[data-nav-links]");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }
  var form = document.querySelector("[data-newsletter]");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = form.querySelector("input[type=email]");
      var email = input && input.value.trim();
      var note = form.querySelector("[data-newsletter-note]");
      if (!email) {
        if (note) note.textContent = "Add an email address to join the list.";
        return;
      }
      var body = "Please add " + email + " to the Cochran Films list.";
      window.location.href = "mailto:info@cochranfilms.com?subject=" + encodeURIComponent("Cochran Films list") + "&body=" + encodeURIComponent(body);
      if (note) note.textContent = "Your email app should open so you can send the request.";
    });
  }
  observe();
})();
