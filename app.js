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

  // Cognito form 202 (v27) puts the price ON the choice options:
  //   Dedication   -> "Sanctuary" carries Price 360000
  //   OtherAmounts -> "$1,800" carries Price 1800, "Other" carries Price 0
  //   OtherAmount  -> currency field, shown only when OtherAmounts = "Other"
  //   Total (Price) = Dedication_Price + OtherAmounts_Price + OtherAmount
  //
  // Dedication labels are bare names now, NOT "Sanctuary - $360,000", so the
  // amount must not be appended or the option will fail to match and nothing
  // preselects. And because a dedication already carries its price, setting an
  // amount alongside it would double the total.
  function cognitoEntry(amount, dedication) {
    var numericAmount = amount ? Number(amount) : 0;
    var presetLabels = { 1800: "$1,800", 5400: "$5,400", 18000: "$18,000", 36000: "$36,000" };
    var commitment = {
      Dedication: dedication || "No dedication, general campaign gift",
    };
    if (!dedication && numericAmount) {
      if (presetLabels[numericAmount]) {
        commitment.OtherAmounts = presetLabels[numericAmount];
      } else {
        commitment.OtherAmounts = "Other";
        commitment.OtherAmount = numericAmount;
      }
    }
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
    // Cognito's iframe.js re-applies scrolling="no" on load. Our injected CSS
    // makes the form taller than Cognito's own height measurement, so the
    // iframe must be able to scroll its own document or the tail of the form
    // (including the submit button) is unreachable.
    cognitoFrame.setAttribute("scrolling", "yes");
    if (cognitoCss) applyCognitoStyles(cognitoCss, 0);
    if (pendingCognitoEntry) prefillCognito(pendingCognitoEntry, 0);
  });

  function loadCognitoEntry(entry) {
    pendingCognitoEntry = entry;
    cognitoFrame.src = cognitoFormUrl + "?entry=" + encodeURIComponent(JSON.stringify(entry));
  }

  function openModal(trigger, amount, dedication) {
    lastTrigger = trigger;
    document.getElementById("pledge-modal-title").textContent = "Make Your Gift";
    modal.hidden = false;
    document.body.classList.add("modal-open");
    closeButton.focus();
    loadCognitoEntry(cognitoEntry(amount, dedication));
  }

  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    if (lastTrigger) lastTrigger.focus();
  }

  document.querySelectorAll("[data-amount]").forEach(function (button) {
    button.addEventListener("click", function () {
      openModal(button, button.dataset.amount, button.dataset.dedication || "");
    });
  });
  document.getElementById("open-pledge").addEventListener("click", function (event) {
    openModal(event.currentTarget, "", "");
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
