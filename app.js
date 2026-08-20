(function () {
  "use strict";

  var defaults = {
    dataUrl: "",
    fallbackGoal: 2295840,
    fallbackRaised: 620000,
    showVideo: false,
    videoUrl: "",
    showCommittee: true,
  };
  var config = Object.assign({}, defaults, window.CAMPAIGN_CONFIG || {});
  var modal = document.getElementById("pledge-modal");
  var panel = modal.querySelector(".modal-panel");
  var closeButton = modal.querySelector(".modal-close");
  var cognitoHost = document.getElementById("cognito-form");
  var cognitoLoadPromise = null;
  var lastTrigger = null;

  function formatMoney(value) {
    return "$" + Math.round(value).toLocaleString("en-US");
  }

  function formatCompactMoney(value) {
    if (value >= 1000000) {
      return "$" + (value / 1000000).toFixed(2).replace(/\.00$/, "").replace(/0$/, "") + "M";
    }
    if (value >= 1000) return "$" + Math.round(value / 1000).toLocaleString("en-US") + "K";
    return formatMoney(value);
  }

  function parseCampaignCsv(csv) {
    var rows = csv
      .trim()
      .split(/\r?\n/)
      .map(function (row) {
        return row.split(",").map(function (cell) {
          return cell.trim().replace(/^"|"$/g, "");
        });
      });
    var clean = function (value) {
      return Number(String(value == null ? "" : value).replace(/[^\d.]/g, ""));
    };
    var headers = (rows[0] || []).map(function (cell) { return cell.toLowerCase(); });
    var goalIndex = headers.indexOf("goal");
    var raisedIndex = headers.indexOf("raised");
    if (goalIndex >= 0 && raisedIndex >= 0 && rows[1]) {
      return { goal: clean(rows[1][goalIndex]), raised: clean(rows[1][raisedIndex]) };
    }
    var keyed = {};
    rows.forEach(function (row) { keyed[String(row[0] || "").toLowerCase()] = clean(row[1]); });
    return { goal: keyed.goal, raised: keyed.raised };
  }

  function renderCampaignData(goal, raised) {
    var remaining = Math.max(goal - raised, 0);
    var percentage = Math.min(Math.round((raised / goal) * 100), 100);
    document.querySelector("[data-raised]").textContent = formatCompactMoney(raised);
    document.querySelector("[data-goal]").textContent = formatCompactMoney(goal);
    document.querySelector("[data-percentage]").textContent = percentage + "%";
    document.querySelector("[data-remaining-compact]").textContent = formatCompactMoney(remaining);
    document.querySelector("[data-remaining]").textContent = formatMoney(remaining);
    var progress = document.querySelector(".progress-track");
    progress.setAttribute("aria-valuenow", String(percentage));
    progress.querySelector(".progress-fill").style.setProperty("--progress", percentage + "%");
  }

  renderCampaignData(config.fallbackGoal, config.fallbackRaised);
  if (config.dataUrl) {
    fetch(config.dataUrl, { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("Campaign data returned " + response.status);
        return response.text();
      })
      .then(function (csv) {
        var data = parseCampaignCsv(csv);
        if (!(data.goal > 0) || !(data.raised >= 0)) throw new Error("Invalid campaign data");
        renderCampaignData(data.goal, data.raised);
      })
      .catch(function (error) {
        console.warn("Using fallback campaign totals:", error);
      });
  }

  var videoSection = document.getElementById("video");
  if (config.showVideo && config.videoUrl) {
    videoSection.hidden = false;
    videoSection.querySelector("iframe").src = config.videoUrl;
  }
  document.getElementById("committee").hidden = !config.showCommittee;

  function cognitoEntry(amount, dedication, schedule) {
    var numericAmount = amount ? Number(amount) : 0;
    var presets = [1800, 5400, 18000, 36000];
    var commitment = {
      Dedication: dedication
        ? dedication + " - " + formatMoney(numericAmount)
        : "No dedication, general campaign gift",
      HowWouldYouLikeToGive:
        schedule === "now" ? "Give in full today" : "Over " + schedule + " months",
    };
    if (numericAmount) commitment.TotalPledgeAmount = numericAmount;
    if (presets.indexOf(numericAmount) >= 0) commitment.PresetAmount = formatMoney(numericAmount);
    return { YourCommitment: commitment };
  }

  function prefillCognito(entry, attempts) {
    if (window.Cognito && typeof window.Cognito.prefill === "function") {
      window.Cognito.prefill(entry);
      return;
    }
    if (attempts < 100) {
      window.setTimeout(function () { prefillCognito(entry, attempts + 1); }, 50);
    } else {
      console.error("Cognito Forms did not finish loading.");
    }
  }

  function ensureCognito() {
    if (window.Cognito && typeof window.Cognito.prefill === "function") {
      return Promise.resolve();
    }
    if (cognitoLoadPromise) return cognitoLoadPromise;
    cognitoLoadPromise = new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = "https://www.cognitoforms.com/f/seamless.js?cachehash=4949cb7cd3ef4354b05ac16e4d465a70";
      script.setAttribute("data-key", "dRAaFn88o0CEV3wipoVjTA");
      script.setAttribute("data-form", "202");
      script.setAttribute("data-context", "public");
      script.onload = resolve;
      script.onerror = function () {
        cognitoLoadPromise = null;
        cognitoHost.innerHTML = '<p class="cognito-load-error" role="alert">The secure form could not load. Please close this window and try again.</p>';
        reject(new Error("Cognito Forms failed to load"));
      };
      cognitoHost.innerHTML = "";
      cognitoHost.appendChild(script);
    });
    return cognitoLoadPromise;
  }

  function openModal(trigger, amount, dedication, schedule) {
    lastTrigger = trigger;
    document.getElementById("pledge-modal-title").textContent =
      schedule && schedule !== "now" ? "Campaign Pledge" : "Make Your Gift";
    modal.hidden = false;
    document.body.classList.add("modal-open");
    closeButton.focus();
    var entry = cognitoEntry(amount, dedication, schedule || "now");
    ensureCognito()
      .then(function () { prefillCognito(entry, 0); })
      .catch(function (error) { console.error(error); });
  }

  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    if (lastTrigger) lastTrigger.focus();
  }

  document.querySelectorAll("[data-amount]").forEach(function (button) {
    button.addEventListener("click", function () {
      openModal(button, button.dataset.amount, button.dataset.dedication || "", "now");
    });
  });
  document.getElementById("open-pledge").addEventListener("click", function (event) {
    openModal(event.currentTarget, "", "", "now");
  });
  closeButton.addEventListener("click", closeModal);
  modal.addEventListener("mousedown", function (event) {
    if (event.target === modal) closeModal();
  });
  panel.addEventListener("mousedown", function (event) { event.stopPropagation(); });

  document.addEventListener("keydown", function (event) {
    if (modal.hidden) return;
    if (event.key === "Escape") {
      closeModal();
      return;
    }
    if (event.key !== "Tab") return;
    var focusable = Array.prototype.slice.call(
      panel.querySelectorAll('button, iframe, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
    ).filter(function (element) { return !element.disabled; });
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
})();
