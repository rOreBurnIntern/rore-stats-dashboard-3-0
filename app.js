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

const pieDepthPlugin = {
  id: "pieDepthPlugin",
  beforeDatasetDraw(chart, args, pluginOptions) {
    if (args.index !== 0 || chart.config.type !== "doughnut") {
      return;
    }

    const opts = pluginOptions || {};
    const ctx = chart.ctx;
    ctx.save();
    ctx.shadowColor = opts.shadowColor || "rgba(8, 20, 36, 0.2)";
    ctx.shadowBlur = opts.shadowBlur ?? 16;
    ctx.shadowOffsetX = opts.shadowOffsetX ?? 0;
    ctx.shadowOffsetY = opts.shadowOffsetY ?? 8;
  },
  afterDatasetDraw(chart, args) {
    if (args.index !== 0 || chart.config.type !== "doughnut") {
      return;
    }
    chart.ctx.restore();
  }
};

const piePercentageLabelsPlugin = {
  id: "piePercentageLabelsPlugin",
  afterDatasetsDraw(chart, _args, pluginOptions) {
    if (chart.config.type !== "doughnut") {
      return;
    }

    const dataset = chart.data.datasets[0];
    if (!dataset || !Array.isArray(dataset.data)) {
      return;
    }

    const values = dataset.data.map((value) => Number(value) || 0);
    const total = values.reduce((sum, value) => sum + value, 0);
    if (!total) {
      return;
    }

    const opts = pluginOptions || {};
    const meta = chart.getDatasetMeta(0);
    const ctx = chart.ctx;

    ctx.save();
    ctx.fillStyle = opts.color || "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = opts.font || "700 12px 'Avenir Next', 'Segoe UI', sans-serif";

    meta.data.forEach((element, index) => {
      const value = values[index];
      if (!value) {
        return;
      }
      const percentage = (value / total) * 100;
      if (percentage < (opts.minPercentage ?? 4)) {
        return;
      }

      const position = element.tooltipPosition();
      ctx.fillText(`${Math.round(percentage)}%`, position.x, position.y);
    });

    ctx.restore();
  }
};

function createPieGradients(chart) {
  const { ctx, chartArea } = chart;
  if (!chartArea) {
    return null;
  }

  const winnerGradient = ctx.createLinearGradient(
    chartArea.left,
    chartArea.top,
    chartArea.right,
    chartArea.bottom
  );
  winnerGradient.addColorStop(0, "#5ab0ff");
  winnerGradient.addColorStop(1, "#2e6ef0");

  const splitGradient = ctx.createLinearGradient(
    chartArea.right,
    chartArea.top,
    chartArea.left,
    chartArea.bottom
  );
  splitGradient.addColorStop(0, "#5ce3c6");
  splitGradient.addColorStop(1, "#169b85");

  return [winnerGradient, splitGradient];
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
    type: "doughnut",
    data: {
      labels: ["Winner Take All", "Split"],
      datasets: [
        {
          data: [data.pie.winnerTakeAll, data.pie.split],
          backgroundColor(context) {
            return createPieGradients(context.chart) || [colors.accent, colors.accentStrong];
          },
          borderColor: colors.panel,
          borderWidth: 3,
          hoverBorderWidth: 4,
          spacing: 2,
          hoverOffset: 10
        }
      ]
    },
    options: {
      cutout: "64%",
      animation: {
        animateRotate: true,
        duration: 850,
        easing: "easeOutCubic"
      },
      plugins: {
        legend: {
          position: "bottom",
          align: "center",
          labels: {
            color: colors.text,
            usePointStyle: true,
            pointStyle: "circle",
            boxWidth: 12,
            boxHeight: 12,
            padding: 18,
            font: {
              size: 13,
              weight: "600"
            }
          }
        },
        tooltip: {
          enabled: true,
          backgroundColor: colors.tooltipBg,
          titleColor: colors.tooltipText,
          bodyColor: colors.tooltipText,
          borderColor: colors.accent,
          borderWidth: 1,
          callbacks: {
            label(context) {
              const value = Number(context.raw) || 0;
              const values = (context.dataset.data || []).map((item) => Number(item) || 0);
              const total = values.reduce((sum, item) => sum + item, 0);
              const pct = total ? ((value / total) * 100).toFixed(1) : "0.0";
              return `${context.label}: ${value} (${pct}%)`;
            }
          }
        },
        pieDepthPlugin: {
          shadowColor: "rgba(7, 18, 34, 0.22)",
          shadowBlur: 18,
          shadowOffsetY: 8
        },
        piePercentageLabelsPlugin: {
          color: "#ffffff",
          minPercentage: 4
        }
      },
      layout: {
        padding: {
          top: 4,
          bottom: 8
        }
      }
    },
    plugins: [pieDepthPlugin, piePercentageLabelsPlugin]
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
