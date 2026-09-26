(function () {
  function facade(button) {
    var id = button.getAttribute("data-youtube");
    var title = button.getAttribute("data-title") || "Film";
    var frame = button.parentElement;
    var iframe = document.createElement("iframe");
    iframe.src = "https://www.youtube.com/embed/" + id + "?rel=0&modestbranding=1&playsinline=1&autoplay=1";
    iframe.title = title;
    iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
    iframe.setAttribute("allowfullscreen", "");
    frame.replaceChildren(iframe);
  }

  Array.prototype.forEach.call(document.querySelectorAll(".money-facade"), function (button) {
    button.addEventListener("click", function () { facade(button); });
  });

  Array.prototype.forEach.call(document.querySelectorAll("[data-money-form]"), function (form) {
    var loaded = form.querySelector("[name=formLoadedAt]");
    if (loaded) loaded.value = String(Date.now());
    var last = 0;
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var status = form.querySelector("[data-form-status]");
      var now = Date.now();
      if (now - last < 8000) {
        if (status) status.textContent = "Please wait a moment, then try again.";
        return;
      }
      var data = new FormData(form);
      var source = String(data.get("source") || "");
      var phone = String(data.get("phone") || "").trim();
      var date = String(data.get("eventDate") || "").trim();
      var note = String(data.get("message") || "").trim();
      var message = "Source: " + source + "\n";
      if (phone) message += "Phone: " + phone + "\n";
      if (date) message += "Date: " + date + "\n";
      message += "\n" + note;
      var button = form.querySelector("button[type=submit]");
      if (button) button.disabled = true;
      fetch("/api/contact/send-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(data.get("name") || "").trim(),
          email: String(data.get("email") || "").trim(),
          phone: phone,
          eventDate: date,
          service: source,
          source: source,
          companyWebsite: String(data.get("companyWebsite") || ""),
          formLoadedAt: String(data.get("formLoadedAt") || ""),
          message: message
        })
      }).then(function (res) {
        return res.json().then(function (json) {
          return { ok: res.ok, json: json };
        });
      }).then(function (result) {
        if (!result.ok || !result.json.success) {
          throw new Error((result.json && result.json.error) || "Unable to send right now.");
        }
        last = Date.now();
        form.reset();
        if (loaded) loaded.value = String(Date.now());
        if (status) status.textContent = "Message sent. We respond within 24 hours.";
      }).catch(function (error) {
        if (status) status.textContent = error.message || "Unable to send. Call (470) 420-2169.";
      }).finally(function () {
        if (button) button.disabled = false;
      });
    });
  });
})();
