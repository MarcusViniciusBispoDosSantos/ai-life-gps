export type DecisionType =
  | "career"
  | "relocation"
  | "education"
  | "finance"
  | "entrepreneurship"
  | "personal";

export type DimensionId =
  | "career"
  | "finance"
  | "wlb"
  | "happiness"
  | "health"
  | "learning";

export type PathKind = "safe" | "ambitious" | "alt";

export interface DecisionInput {
  /** The user's question, e.g. "Should I quit my job to start a business?" */
  question: string;
  decisionType: DecisionType;
  riskTolerance: "low" | "moderate" | "high";
  /** Dimensions the user cares most about (0-6). */
  priorities: DimensionId[];
  horizonYears: 1 | 2 | 3 | 4 | 5;
}

export interface DimensionScores {
  career: number;
  finance: number;
  wlb: number;
  happiness: number;
  health: number;
  learning: number;
}

export interface Milestone {
  year: number;
  title: string;
  detail: string;
  impact: "positive" | "neutral" | "negative";
}

export interface YearOutcome {
  year: number;
  scores: DimensionScores;
  milestone?: Milestone;
}

export interface ScenarioPath {
  kind: PathKind;
  name: string;
  tagline: string;
  confidence: number; // 0-100
  description: string;
  outcomes: YearOutcome[];
  finalScores: DimensionScores;
  risks: string[];
  opportunities: string[];
  totalRisk: number; // 0-100
  totalReward: number; // 0-100
  recommendation: string;
}

export interface AssumptionNote {
  label: string;
  detail: string;
}

export interface SimulationResult {
  id: string;
  input: DecisionInput;
  paths: ScenarioPath[];
  assumptions: AssumptionNote[];
  generatedAt: number;
  bestFitPath: PathKind;
  bestFitReason: string;
}

export const DIMENSION_META: Record<
  DimensionId,
  { label: string; short: string; description: string }
> = {
  career: {
    label: "Career Growth",
    short: "Career",
    description: "Professional trajectory, seniority, and opportunity",
  },
  finance: {
    label: "Financial Outlook",
    short: "Finance",
    description: "Income, savings, and long-term wealth trajectory",
  },
  wlb: {
    label: "Work-Life Balance",
    short: "Balance",
    description: "Time autonomy and separation between work and life",
  },
  happiness: {
    label: "Personal Happiness",
    short: "Happiness",
    description: "Overall satisfaction and fulfillment",
  },
  health: {
    label: "Health & Stress",
    short: "Health",
    description: "Physical and mental wellbeing, stress levels",
  },
  learning: {
    label: "Learning Opps",
    short: "Learning",
    description: "Skill acquisition and personal growth",
  },
};

export const DIMENSION_ORDER: DimensionId[] = [
  "career",
  "finance",
  "wlb",
  "happiness",
  "health",
  "learning",
];

export const DIMENSION_COLORS: Record<DimensionId, string> = {
  career: "#22d3ee",
  finance: "#4ade80",
  wlb: "#fbbf24",
  happiness: "#f472b6",
  health: "#fb923c",
  learning: "#818cf8",
};

export const PATH_META: Record<
  PathKind,
  { name: string; color: string; glow: string }
> = {
  safe: {
    name: "Steady Path",
    color: "#2dd4bf",
    glow: "rgba(45, 212, 191, 0.35)",
  },
  ambitious: {
    name: "Ambitious Path",
    color: "#fb7185",
    glow: "rgba(251, 113, 133, 0.35)",
  },
  alt: {
    name: "Alternative Path",
    color: "#a78bfa",
    glow: "rgba(167, 139, 250, 0.35)",
  },
};
