const chartInstances = {
  pie: null,
  bar: null,
  line: null
};

const RANGE_MS = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  all: null
};

const THEME_STORAGE_KEY = "rore-theme";

let currentRange = "24h";
let allRounds = [];
let hasLoadedData = false;

function formatNumber(value, fractionDigits = 2) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "--";
  }
  return value.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  });
}

function formatCurrency(value, fractionDigits = 2) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "--";
  }
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  });
}

function toTimestampMs(value) {
  if (!value) {
    return null;
  }
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    if (numeric > 1e12) {
      return Math.trunc(numeric);
    }
    if (numeric > 1e9) {
      return Math.trunc(numeric * 1000);
    }
  }

  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function setState({ loading, error, empty }) {
  document.getElementById("loading").classList.toggle("hidden", !loading);
  const errorNode = document.getElementById("error");
  if (error) {
    errorNode.textContent = error;
    errorNode.classList.remove("hidden");
  } else {
    errorNode.classList.add("hidden");
  }
  document.getElementById("empty").classList.toggle("hidden", !empty);
  document.getElementById("charts").classList.toggle("hidden", loading || Boolean(error) || empty);
}

function setStats(data, timestamp, source) {
  document.getElementById("motherlode-value").textContent = `${formatNumber(data.stats.motherlode, 1)} rORE`;
  document.getElementById("weth-value").textContent = formatCurrency(data.stats.weth, 2);
  document.getElementById("rore-value").textContent = formatCurrency(data.stats.rore, 4);
  document.getElementById("last-updated").textContent = `Last updated: ${new Date(timestamp).toLocaleString()}`;
  document.getElementById("source-label").textContent = `Source: ${source}`;
}

function readThemeColors() {
  const css = getComputedStyle(document.documentElement);
  return {
    text: css.getPropertyValue("--text").trim(),
    panel: css.getPropertyValue("--panel").trim(),
    accent: css.getPropertyValue("--accent").trim(),
    accentStrong: css.getPropertyValue("--accent-strong").trim(),
    grid: css.getPropertyValue("--chart-grid").trim(),
    tooltipBg: css.getPropertyValue("--tooltip-bg").trim(),
    tooltipText: css.getPropertyValue("--tooltip-text").trim()
  };
}

function sharedOptions() {
  const colors = readThemeColors();
  return {
    plugins: {
      legend: {
        labels: { color: colors.text }
      },
      tooltip: {
        backgroundColor: colors.tooltipBg,
        titleColor: colors.tooltipText,
        bodyColor: colors.tooltipText,
        borderColor: colors.accent,
        borderWidth: 1
      }
    },
    scales: {
      x: {
        ticks: { color: colors.text },
        grid: { color: colors.grid }
      },
      y: {
        ticks: { color: colors.text },
        grid: { color: colors.grid }
      }
    }
  };
}

function destroyCharts() {
  Object.keys(chartInstances).forEach((key) => {
    if (chartInstances[key]) {
      chartInstances[key].destroy();
      chartInstances[key] = null;
    }
  });
}

function buildDerivedData(rounds) {
  const pie = { winnerTakeAll: 0, split: 0 };
  const bar = Array.from({ length: 26 }, (_, block) => ({ block, wins: 0 }));

  const sortedRounds = rounds.slice().sort((a, b) => {
    const aMs = toTimestampMs(a.endTimestamp);
    const bMs = toTimestampMs(b.endTimestamp);
    if (aMs !== null && bMs !== null && aMs !== bMs) {
      return aMs - bMs;
    }
    return String(a.id).localeCompare(String(b.id), "en", { numeric: true });
  });

  for (const round of sortedRounds) {
    if (round.winnerTakeAll) {
      pie.winnerTakeAll += 1;
    } else {
      pie.split += 1;
    }

    if (Number.isInteger(round.winnerBlock) && round.winnerBlock >= 0 && round.winnerBlock < 26) {
      bar[round.winnerBlock].wins += 1;
    }
  }

  let roundsSinceHit = 0;
  const line = sortedRounds.map((round) => {
    if (round.motherlodeHit) {
      roundsSinceHit = 0;
    } else {
      roundsSinceHit += 1;
    }

    return {
      x: round.id,
      motherlodeValue: Number((roundsSinceHit * 0.2).toFixed(1))
    };
  });

  return { pie, bar, line };
}

function filterRounds(rounds, range) {
  if (range === "all") {
    return rounds;
  }

  const windowMs = RANGE_MS[range];
  if (!windowMs) {
    return rounds;
  }

  const cutoff = Date.now() - windowMs;
  return rounds.filter((round) => {
    const endMs = toTimestampMs(round.endTimestamp);
    return endMs !== null && endMs >= cutoff;
  });
}

function renderCharts(data) {
  destroyCharts();
  const colors = readThemeColors();

  chartInstances.pie = new Chart(document.getElementById("pie-chart"), {
    type: "pie",
    data: {
      labels: ["Winner Take All", "Split"],
      datasets: [
        {
          data: [data.pie.winnerTakeAll, data.pie.split],
          backgroundColor: [colors.accent, colors.accentStrong],
          borderColor: colors.panel,
          borderWidth: 2
        }
      ]
    },
    options: {
      plugins: {
        legend: { labels: { color: colors.text } },
        tooltip: { enabled: true }
      }
    }
  });

  chartInstances.bar = new Chart(document.getElementById("bar-chart"), {
    type: "bar",
    data: {
      labels: data.bar.map((item) => String(item.block)),
      datasets: [
        {
          label: "Wins",
          data: data.bar.map((item) => item.wins),
          backgroundColor: colors.accent,
          borderColor: colors.accentStrong,
          borderWidth: 1,
          borderRadius: 6
        }
      ]
    },
    options: {
      ...sharedOptions(),
      plugins: {
        ...sharedOptions().plugins,
        legend: { display: false }
      }
    }
  });

  chartInstances.line = new Chart(document.getElementById("line-chart"), {
    type: "line",
    data: {
      labels: data.line.map((point) => String(point.x)),
      datasets: [
        {
          label: "Motherlode Running Value",
          data: data.line.map((point) => point.motherlodeValue),
          borderColor: colors.accent,
          backgroundColor: `${colors.accent}33`,
          fill: true,
          tension: 0.22,
          pointRadius: 0
        }
      ]
    },
    options: {
      ...sharedOptions()
    }
  });
}

function updateRangeButtons(activeRange) {
  document.querySelectorAll(".filter-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.range === activeRange);
  });
}

function renderCurrentRange() {
  const filtered = filterRounds(allRounds, currentRange);
  updateRangeButtons(currentRange);

  if (!filtered.length) {
    destroyCharts();
    setState({ loading: false, error: "", empty: true });
    return;
  }

  renderCharts(buildDerivedData(filtered));
  setState({ loading: false, error: "", empty: false });
}

function getPreferredTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "dark" || saved === "light") {
      return saved;
    }
  } catch {
    // Ignore localStorage read errors.
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const toggle = document.getElementById("theme-toggle");
  if (toggle) {
    toggle.textContent = theme === "dark" ? "Light mode" : "Dark mode";
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore localStorage write errors.
  }
}

function setupThemeToggle() {
  applyTheme(getPreferredTheme());

  const toggle = document.getElementById("theme-toggle");
  if (!toggle) {
    return;
  }

  toggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    if (hasLoadedData) {
      renderCurrentRange();
    }
  });
}

function setupRangeFilters() {
  document.querySelectorAll(".filter-btn").forEach((button) => {
    button.addEventListener("click", () => {
      currentRange = button.dataset.range;
      if (hasLoadedData) {
        renderCurrentRange();
      }
    });
  });
}

async function loadStats() {
  try {
    setState({ loading: true, error: "", empty: false });
    const response = await fetch("/api/stats");
    const body = await response.json();
    if (!response.ok || !body.ok) {
      throw new Error(body.error || "Failed to load stats");
    }

    const payload = body.data;
    allRounds = Array.isArray(payload.rounds) ? payload.rounds : [];

    setStats(payload, body.lastUpdated || Date.now(), body.source || "unknown");

    hasLoadedData = true;
    renderCurrentRange();
  } catch (error) {
    hasLoadedData = false;
    setState({ loading: false, error: error.message || "Unknown error", empty: false });
  }
}

window.addEventListener("load", () => {
  setupThemeToggle();
  setupRangeFilters();
  loadStats();
});
