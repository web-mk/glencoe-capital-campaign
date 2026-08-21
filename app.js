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
  var cognitoFrame = document.getElementById("cognito-pledge-frame");
  var cognitoFormUrl = cognitoFrame.src.split("?")[0];
  var cognitoCss = "";
  var pendingCognitoEntry = null;
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

  function cleanNumber(value) {
    return Number(String(value == null ? "" : value).replace(/[^\d.]/g, ""));
  }

  // Accepts either the data.webmk.co / Google Sheets v4 shape
  // ({ values: [["Raised","Goal"], ["620000","2295840"]] }) or a plain CSV.
  // Both are reduced to rows and matched by header name rather than column
  // index, so the client can reorder columns in the sheet safely.
  function rowsToTotals(rows) {
    var headers = (rows[0] || []).map(function (cell) {
      return String(cell == null ? "" : cell).trim().toLowerCase();
    });
    var goalIndex = headers.indexOf("goal");
    var raisedIndex = headers.indexOf("raised");
    if (goalIndex >= 0 && raisedIndex >= 0 && rows[1]) {
      return { goal: cleanNumber(rows[1][goalIndex]), raised: cleanNumber(rows[1][raisedIndex]) };
    }
    // Fallback: a two-column "label,value" sheet laid out vertically.
    var keyed = {};
    rows.forEach(function (row) {
      keyed[String(row[0] || "").trim().toLowerCase()] = cleanNumber(row[1]);
    });
    return { goal: keyed.goal, raised: keyed.raised };
  }

  // Quote-aware split: a naive row.split(",") corrupts cells like "2,295,840".
  function splitCsvRow(row) {
    var cells = [];
    var current = "";
    var inQuotes = false;
    for (var i = 0; i < row.length; i += 1) {
      var char = row.charAt(i);
      if (char === '"') {
        if (inQuotes && row.charAt(i + 1) === '"') { current += '"'; i += 1; }
        else inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        cells.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current.trim());
    return cells;
  }

  function parseCampaignData(text) {
    var trimmed = text.trim();
    if (trimmed.charAt(0) === "{" || trimmed.charAt(0) === "[") {
      var payload = JSON.parse(trimmed);
      var values = Array.isArray(payload) ? payload : payload.values;
      if (!Array.isArray(values)) throw new Error("Campaign data JSON has no values array");
      return rowsToTotals(values);
    }
    return rowsToTotals(trimmed.split(/\r?\n/).map(splitCsvRow));
  }

  function renderCampaignData(goal, raised) {
    var remaining = Math.max(goal - raised, 0);
    var percentage = Math.min(Math.round((raised / goal) * 100), 100);
    document.querySelector("[data-raised]").textContent = formatCompactMoney(raised);
    document.querySelector("[data-goal]").textContent = formatCompactMoney(goal);
    var exactGoal = document.querySelector("[data-goal-exact]");
    if (exactGoal) exactGoal.textContent = formatMoney(goal);
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
      .then(function (text) {
        var data = parseCampaignData(text);
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
    if (typeof window.Cognito === "function") {
      window.Cognito("#cognito-pledge-frame").prefill(entry);
      return;
    }
    if (attempts < 100) {
      window.setTimeout(function () { prefillCognito(entry, attempts + 1); }, 50);
    } else {
      console.error("Cognito Forms did not finish loading.");
    }
  }

  function applyCognitoStyles(css, attempts) {
    if (typeof window.Cognito === "function") {
      window.Cognito("#cognito-pledge-frame").setCss(css.replace(/\s+/g, " "));
      return;
    }
    if (attempts < 100) {
      window.setTimeout(function () { applyCognitoStyles(css, attempts + 1); }, 50);
    } else {
      console.error("Cognito Forms styling API did not finish loading.");
    }
  }

  fetch("cognito-form.css", { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) throw new Error("Cognito stylesheet returned " + response.status);
      return response.text();
    })
    .then(function (css) {
      cognitoCss = css;
      applyCognitoStyles(css, 0);
    })
    .catch(function (error) { console.error("Could not style Cognito form:", error); });

  cognitoFrame.addEventListener("load", function () {
    if (cognitoCss) applyCognitoStyles(cognitoCss, 0);
    if (pendingCognitoEntry) prefillCognito(pendingCognitoEntry, 0);
  });

  function loadCognitoEntry(entry) {
    pendingCognitoEntry = entry;
    cognitoFrame.src = cognitoFormUrl + "?entry=" + encodeURIComponent(JSON.stringify(entry));
  }

  function openModal(trigger, amount, dedication, schedule) {
    lastTrigger = trigger;
    document.getElementById("pledge-modal-title").textContent =
      schedule && schedule !== "now" ? "Campaign Pledge" : "Make Your Gift";
    modal.hidden = false;
    document.body.classList.add("modal-open");
    closeButton.focus();
    var entry = cognitoEntry(amount, dedication, schedule || "now");
    loadCognitoEntry(entry);
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

  if (new URLSearchParams(window.location.search).get("previewForm") === "1") {
    document.getElementById("open-pledge").click();
  }
})();
