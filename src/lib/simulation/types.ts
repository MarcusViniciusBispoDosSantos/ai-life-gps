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

export type PathKind = "safe" | "ambitious" | "alt" | "bold";

export interface DecisionInput {
  /** The user's question, e.g. "Should I quit my job to start a business?" */
  question: string;
  decisionType: DecisionType;
  riskTolerance: "low" | "moderate" | "high";
  /** Dimensions the user cares most about (0-6). */
  priorities: DimensionId[];
  horizonYears: number;
  /** Number of scenario paths to generate (2-4). */
  numPaths: 2 | 3 | 4;
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

/* ─── Score interpretations ─── */

export interface ScoreExplanation {
  band: "Excellent" | "Good" | "Moderate" | "Below Average" | "Weak";
  description: string;
  outlook: string;
}

export function getScoreExplanation(dimension: DimensionId, score: number): ScoreExplanation {
  const band: ScoreExplanation["band"] =
    score >= 80 ? "Excellent"
    : score >= 65 ? "Good"
    : score >= 50 ? "Moderate"
    : score >= 35 ? "Below Average"
    : "Weak";

  const interpretations: Record<DimensionId, Record<ScoreExplanation["band"], { description: string; outlook: string }>> = {
    career: {
      Excellent: { description: "Rapid career advancement with strong leadership opportunities and high demand for your skills.", outlook: "You'll likely become a top performer in your field with multiple advancement options." },
      Good: { description: "Solid career progression with steady growth in responsibility and marketability.", outlook: "Your career is on a strong upward trajectory with good advancement prospects." },
      Moderate: { description: "Stable career with regular growth but no major breakthroughs expected.", outlook: "You'll advance steadily but may need to seek new challenges to accelerate growth." },
      "Below Average": { description: "Limited career growth — you may feel underutilized or in a stagnant role.", outlook: "Consider upskilling, networking, or exploring adjacent fields to improve trajectory." },
      Weak: { description: "Significant career stagnation — few opportunities for growth or advancement.", outlook: "A major career change or intensive reskilling may be needed to turn this around." },
    },
    finance: {
      Excellent: { description: "Strong financial trajectory with high income growth, robust savings, and wealth-building opportunities.", outlook: "You'll achieve financial goals ahead of schedule with comfortable margins." },
      Good: { description: "Healthy financial outlook with consistent income growth and manageable expenses.", outlook: "You'll build wealth steadily and hit major milestones on time." },
      Moderate: { description: "Financially stable but unremarkable — income covers needs with modest savings.", outlook: "You'll be comfortable but may need to make deliberate choices for major purchases." },
      "Below Average": { description: "Tight finances — income may struggle to keep pace with expenses or goals.", outlook: "Budget discipline and additional income streams would significantly improve this picture." },
      Weak: { description: "Concerning financial situation with high pressure and limited savings buffer.", outlook: "Immediate focus on cost reduction and income generation is critical before making big moves." },
    },
    wlb: {
      Excellent: { description: "Exceptional work-life balance — you control your schedule and have plenty of personal time.", outlook: "Sustainable long-term with low burnout risk and high life satisfaction." },
      Good: { description: "Good balance with reasonable working hours and adequate personal time.", outlook: "Maintainable rhythm with occasional busy periods that don't overwhelm." },
      Moderate: { description: "Reasonable balance but work often bleeds into personal time.", outlook: "Workable but set boundaries to prevent gradual erosion of personal time." },
      "Below Average": { description: "Work frequently dominates — long hours and difficulty disconnecting.", outlook: "Unsustainable long-term — prioritize boundaries or consider restructuring commitments." },
      Weak: { description: "Severe imbalance — work consumes most of your waking hours.", outlook: "High burnout risk. Immediate changes to workload or schedule are strongly advised." },
    },
    happiness: {
      Excellent: { description: "High life satisfaction — your daily activities and choices align with your values.", outlook: "This path brings genuine fulfillment and a strong sense of purpose." },
      Good: { description: "Generally happy with occasional low points — overall positive life experience.", outlook: "Positive trajectory with room for even more fulfillment as you settle in." },
      Moderate: { description: "Mixed feelings — some days are great, others feel flat or disappointing.", outlook: "Acceptable but watch for patterns — small adjustments could lift this significantly." },
      "Below Average": { description: "Frequent dissatisfaction — the path may not align with what truly matters to you.", outlook: "Worth examining whether this is a rough patch or a fundamental mismatch." },
      Weak: { description: "Persistent unhappiness — this path likely conflicts with your core values.", outlook: "Strong signal this isn't the right direction. Re-evaluate priorities and alternatives." },
    },
    health: {
      Excellent: { description: "Optimal health outlook with low stress and strong physical/mental wellbeing.", outlook: "Sustainable energy levels and resilience — you'll handle challenges well." },
      Good: { description: "Good health with manageable stress. You have healthy routines in place.", outlook: "Continue current habits — you're well-positioned to maintain this balance." },
      Moderate: { description: "Average health — some stress and minor health concerns to watch.", outlook: "Manageable but proactive self-care will prevent gradual decline." },
      "Below Average": { description: "Elevated stress with noticeable impacts on sleep, energy, or mood.", outlook: "This path demands attention to health — build recovery periods into your schedule." },
      Weak: { description: "High stress and poor health indicators — significant risk of burnout or illness.", outlook: "Warning level. This path's demands may exceed healthy capacity without major changes." },
    },
    learning: {
      Excellent: { description: "Rapid skill acquisition and constant exposure to new ideas and challenges.", outlook: "You'll grow faster than peers and build a versatile, future-proof skill set." },
      Good: { description: "Steady learning with good opportunities for growth and development.", outlook: "Strong skill-building trajectory — you'll stay relevant and engaged." },
      Moderate: { description: "Some learning opportunities but growth may plateau without extra effort.", outlook: "Seek out stretch assignments or side projects to supplement your development." },
      "Below Average": { description: "Limited learning — you may feel your skills are stagnating.", outlook: "Consider mentorship, courses, or job rotation to inject growth into this path." },
      Weak: { description: "Very few learning opportunities — skills may atrophy over time.", outlook: "This path risks career obsolescence. Prioritize upskilling or a more dynamic environment." },
    },
  };

  const explanation = interpretations[dimension][band];
  return { band, description: explanation.description, outlook: explanation.outlook };
}

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
  bold: {
    name: "Bold Path",
    color: "#f59e0b",
    glow: "rgba(245, 158, 11, 0.35)",
  },
};
