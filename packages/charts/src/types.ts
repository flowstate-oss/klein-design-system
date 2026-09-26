export type ChartType =
  | "stackedArea"
  | "line"
  | "pie"
  | "stackedBar"
  | "groupedBar"
  | "donut"
  | "heatmap"
  | "table"
  | "waterfall"
  | "scatter"
  | "horizontalBar"
  | "multiLine"
  | "wholeNumber";
export type AnalyticsMetricType =
  | "COST"
  | "FTE"
  | "HEADCOUNT"
  | "AI_COST"
  | "AI_SESSIONS"
  | "AI_FRUSTRATION"
  | "AI_INPUT_QUALITY_AVG"
  | "AI_TOKENS"
  | "AI_REQUESTS"
  | "PR_COUNT"
  | "COST_PER_PR"
  | "LINES_CHANGED"
  | "AI_SPEND"
  | "AI_TOTAL_COST"
  | "METRIC_VALUE";
export type StackedBarLabelFormat = "value" | "percent" | "none";
export type SplitScaleMode = "auto" | "on" | "off";
export const METRIC_LABELS: Record<AnalyticsMetricType, string> = {
  COST: "Cost",
  FTE: "FTE",
  HEADCOUNT: "Headcount",
  AI_COST: "AI Cost",
  AI_SESSIONS: "AI Sessions",
  AI_FRUSTRATION: "AI Frustration",
  AI_INPUT_QUALITY_AVG: "AI Input Quality",
  AI_TOKENS: "AI Tokens",
  AI_REQUESTS: "AI Requests",
  PR_COUNT: "Merged PRs",
  COST_PER_PR: "Cost per PR",
  LINES_CHANGED: "Lines Changed",
  AI_SPEND: "AI Spend",
  AI_TOTAL_COST: "AI Total Cost",
  METRIC_VALUE: "Activity Metric",
};
export interface AnalyticsDataPoint {
  /** Period label (e.g., "Jan 2025", "Q1 2025", "2025") */
  period: string;
  /** Metric value for this period */
  value: number;
}

export interface AnalyticsSeries {
  /** Unique key for the series (e.g., "capex", "team-123") */
  key: string;
  /** Human-readable label for display */
  label: string;
  /** Suggested color for charts */
  color: string | null;
  /** Data points in chronological order */
  dataPoints: AnalyticsDataPoint[];
}
