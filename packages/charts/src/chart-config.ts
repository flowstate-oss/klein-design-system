import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
  TimeSeriesScale,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import "chartjs-adapter-date-fns";
import { enUS } from "date-fns/locale";
import { CHART_PALETTE_LIGHT, CHART_PALETTE_DARK } from "./chart-palette.js";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
  TimeSeriesScale,
  ChartDataLabels,
);

// Global defaults
ChartJS.defaults.font.family = "Inter, sans-serif";
ChartJS.defaults.color = "hsl(240 4% 46%)"; // muted-foreground
ChartJS.defaults.scale.grid.color = "hsl(240 6% 90%)"; // border
ChartJS.defaults.plugins.tooltip.backgroundColor = "hsl(240 6% 10%)"; // primary
ChartJS.defaults.plugins.tooltip.titleColor = "hsl(0 0% 100%)"; // primary-foreground
ChartJS.defaults.plugins.tooltip.bodyColor = "hsl(0 0% 100%)"; // primary-foreground
ChartJS.defaults.plugins.tooltip.padding = 10;
ChartJS.defaults.plugins.tooltip.cornerRadius = 8;
ChartJS.defaults.plugins.tooltip.displayColors = true;

// Helper to resolve CSS variables to hex/rgb for Canvas
export function resolveColor(variable: string): string {
  if (typeof window === "undefined") return "#000000";

  // Create a temporary element to resolve the variable
  const el = document.createElement("div");
  el.style.color = variable;
  document.body.appendChild(el);
  const color = getComputedStyle(el).color;
  document.body.removeChild(el);
  return color;
}

// Chart color palette (matching Tailwind config)
export const CHART_COLORS = CHART_PALETTE_LIGHT;

export const CHART_COLORS_DARK = CHART_PALETTE_DARK;

export function getChartColor(index: number, isDark = false): string {
  const palette = isDark ? CHART_COLORS_DARK : CHART_COLORS;
  return palette[index % palette.length];
}

export function resolveSeriesColor(
  color: string | null | undefined,
  isDark: boolean,
  index: number,
): string {
  const palette = isDark ? CHART_COLORS_DARK : CHART_COLORS;

  if (color) {
    if (color === "unknown" || color === "other") {
      return isDark ? "#57534e" : "#d6d3d1"; // stone-600 : stone-300
    }

    // Handle 1-based index from server (1-12)
    const colorIndex = parseInt(color, 10);
    if (!isNaN(colorIndex) && colorIndex >= 1 && colorIndex <= 12) {
      return palette[colorIndex - 1];
    }

    // Fallback for direct hex/rgb
    if (color.startsWith("#") || color.startsWith("rgb")) {
      return color;
    }
  }

  return palette[index % palette.length];
}

export const COMMON_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom" as const,
      labels: {
        usePointStyle: true,
        padding: 20,
      },
    },
    tooltip: {},
    datalabels: {
      display: false, // Default to hidden
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
    },
    y: {
      border: {
        display: false,
      },
    },
  },
};
