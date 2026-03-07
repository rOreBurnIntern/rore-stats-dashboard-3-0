const chartInstances = {
  pie: null,
  bar: null,
  line: null
};

const colors = {
  fireA: "#ff6b00",
  fireB: "#ff3d00",
  panel: "#111111",
  text: "#f4f4f4"
};

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

function setStats(data, timestamp) {
  document.getElementById("motherlode-value").textContent = `${formatNumber(data.stats.motherlode, 1)} rORE`;
  document.getElementById("weth-value").textContent = formatCurrency(data.stats.weth, 2);
  document.getElementById("rore-value").textContent = formatCurrency(data.stats.rore, 4);
  document.getElementById("last-updated").textContent = `Last updated: ${new Date(timestamp).toLocaleString()}`;
}

function sharedOptions() {
  return {
    plugins: {
      legend: {
        labels: { color: colors.text }
      },
      tooltip: {
        backgroundColor: "#1b1b1b",
        borderColor: colors.fireA,
        borderWidth: 1
      }
    },
    scales: {
      x: {
        ticks: { color: colors.text },
        grid: { color: "rgba(255,255,255,0.08)" }
      },
      y: {
        ticks: { color: colors.text },
        grid: { color: "rgba(255,255,255,0.08)" }
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

function renderCharts(data) {
  destroyCharts();

  chartInstances.pie = new Chart(document.getElementById("pie-chart"), {
    type: "pie",
    data: {
      labels: ["Winner Take All", "Split"],
      datasets: [
        {
          data: [data.pie.winnerTakeAll, data.pie.split],
          backgroundColor: [colors.fireA, colors.fireB],
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
      labels: data.bar.map((item) => String(item.block + 1)),
      datasets: [
        {
          label: "Wins",
          data: data.bar.map((item) => item.wins),
          backgroundColor: colors.fireA,
          borderColor: colors.fireB,
          borderWidth: 1
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
          borderColor: colors.fireA,
          backgroundColor: "rgba(255, 107, 0, 0.2)",
          fill: true,
          tension: 0.2,
          pointRadius: 0
        }
      ]
    },
    options: {
      ...sharedOptions(),
      plugins: {
        ...sharedOptions().plugins
      }
    }
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
    if (!payload || !payload.roundsProcessed) {
      setState({ loading: false, error: "", empty: true });
      return;
    }

    setStats(payload, body.lastUpdated);
    renderCharts(payload);
    setState({ loading: false, error: "", empty: false });
  } catch (error) {
    setState({ loading: false, error: error.message || "Unknown error", empty: false });
  }
}

window.addEventListener("load", loadStats);
