import {
  DecisionInput,
  DecisionType,
  DimensionId,
  DimensionScores,
  PathKind,
  ScenarioPath,
  SimulationResult,
  YearOutcome,
  DIMENSION_ORDER,
  AssumptionNote,
} from "./types";

/* ─── Deterministic pseudo-random from string seed ─── */
function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return () => {
    h = (h ^ (h >>> 16)) * 0x45d9f3b;
    h = (h ^ (h >>> 16)) * 0x45d9f3b;
    h = h ^ (h >>> 16);
    return (h >>> 0) / 0x100000000;
  };
}

function clamp(v: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, Math.round(v)));
}

function pick<T>(list: T[], rand: () => number): T {
  return list[Math.floor(rand() * list.length)];
}

/* ─── Templates for decision types ─── */
const SCENARIO_TEMPLATES: Record<DecisionType, Record<PathKind, {
  description: string;
  baseScores: Partial<DimensionScores>;
  annualGrowth: number[];
  riskThemes: string[];
  oppThemes: string[];
  milestones: string[];
}>> = {
  career: {
    safe: {
      description: "Stay in your current field with calculated moves. You take on gradual challenges — a certification, a new role at the same company, a lateral transfer. The growth is steady and predictable.",
      baseScores: { career: 45, finance: 55, wlb: 70, happiness: 55, health: 65, learning: 40 },
      annualGrowth: [8, 12, 10, 8, 8],
      riskThemes: ["Feeling of stagnation by year 3-4", "Inflation eroding salary gains", "Complacency risk"],
      oppThemes: ["Build deep expertise in niche area", "Strong network within industry", "Predictable career progression"],
      milestones: ["Earn a promotion or senior title", "Complete professional certification", "Lead a major project"],
    },
    ambitious: {
      description: "A bold career leap — switching industries, taking a startup role, or launching a side business. The upside is high, but so is the variability. You'll learn fast and earn potentially more, with less stability.",
      baseScores: { career: 35, finance: 40, wlb: 30, happiness: 45, health: 35, learning: 65 },
      annualGrowth: [25, 20, 15, 10, 8],
      riskThemes: ["Burnout from long hours", "Financial instability in year 1-2", "Imposter syndrome in new domain"],
      oppThemes: ["Exponential career growth if bet pays off", "Develop T-shaped skills fast", "Higher income ceiling"],
      milestones: ["Land first major win or client", "Achieve industry recognition", "Build a high-growth network"],
    },
    alt: {
      description: "A hybrid approach — negotiate a reduced-hours arrangement, freelance, or build a portfolio career. Moderate risk with lifestyle flexibility.",
      baseScores: { career: 30, finance: 45, wlb: 65, happiness: 60, health: 55, learning: 45 },
      annualGrowth: [15, 12, 10, 12, 10],
      riskThemes: ["Irregular income streams", "Less structured career path", "Fewer traditional benefits"],
      oppThemes: ["Control over your schedule", "Diversified income sources", "Work on what you love"],
      milestones: ["Secure first three freelance clients", "Build a personal brand", "Attain income floor"],
    },
    bold: {
      description: "A calculated career acceleration — pursue a high-growth role, lead a major initiative, or switch to a fast-moving industry. You take deliberate risks with a clear exit plan.",
      baseScores: { career: 50, finance: 50, wlb: 40, happiness: 50, health: 45, learning: 55 },
      annualGrowth: [20, 18, 14, 12, 10],
      riskThemes: ["Higher expectations and scrutiny", "Imposter syndrome in elevated role", "Less work-life separation"],
      oppThemes: ["Rapid skill and reputation growth", "High visibility leadership experience", "Significant salary jumps"],
      milestones: ["Land a high-impact role or promotion", "Deliver a flagship project", "Build a standout professional brand"],
    },
  },
  relocation: {
    safe: {
      description: "A carefully planned move to a familiar destination. You research thoroughly, visit beforehand, secure employment before relocating.",
      baseScores: { career: 40, finance: 50, wlb: 60, happiness: 55, health: 60, learning: 50 },
      annualGrowth: [10, 10, 8, 12, 10],
      riskThemes: ["Culture shock may be underestimated", "Separation from support network", "Unexpected living costs"],
      oppThemes: ["Exposure to new culture and people", "Career growth in new market", "Personal reinvention"],
      milestones: ["Secure housing and establish routine", "Build first local friendships", "Achieve financial stability"],
    },
    ambitious: {
      description: "A bold move with high uncertainty — different country, no job lined up, new language. Maximum growth potential, maximum risk.",
      baseScores: { career: 30, finance: 25, wlb: 35, happiness: 40, health: 30, learning: 70 },
      annualGrowth: [25, 30, 10, 15, 5, 15],
      riskThemes: ["Visa or legal complications", "Financial strain before income starts", "Severe loneliness phase"],
      oppThemes: ["Resilience and adaptability skills", "Global network", "Life-changing perspective shift"],
      milestones: ["Get first local job or income stream", "Achieve basic fluency in local language", "Establish community"],
    },
    alt: {
      description: "A phased relocation — move to a nearby city first, or do a test period (3-6 months) before committing fully.",
      baseScores: { career: 35, finance: 45, wlb: 50, happiness: 50, health: 45, learning: 55 },
      annualGrowth: [12, 12, 10, 12, 10, 12],
      riskThemes: ["Extended transition period", "Split focus/loyalty between locations", "Double expenses during transition"],
      oppThemes: ["Lower commitment risk", "Refine goals based on real experience", "Build optionality"],
      milestones: ["Complete test period successfully", "Make final commitment decision", "Establish dual-location setup"],
    },
    bold: {
      description: "A strategic relocation to a major hub for your industry — move to a city known for your field, with a job offer in hand but embracing a completely new environment.",
      baseScores: { career: 50, finance: 45, wlb: 40, happiness: 45, health: 40, learning: 60 },
      annualGrowth: [18, 16, 12, 14, 10],
      riskThemes: ["Higher cost of living in prime location", "Intense competitive market", "Steeper cultural learning curve"],
      oppThemes: ["Access to top employers and networks", "Higher salary ceiling", "Career acceleration through proximity"],
      milestones: ["Secure role at target company or industry", "Build a local professional network", "Achieve cost-of-living adjusted growth"],
    },
  },
  education: {
    safe: {
      description: "A part-time or online program while keeping your current job. Slower but stable — you graduate debt-free with experience.",
      baseScores: { career: 35, finance: 50, wlb: 50, happiness: 45, health: 45, learning: 55 },
      annualGrowth: [15, 5, 5, 5, 5, 15],
      riskThemes: ["Longer time to degree", "Difficult to balance work and study", "Less immersive experience"],
      oppThemes: ["No gap in professional experience", "Apply learning immediately at work", "Graduate debt-free"],
      milestones: ["Complete first year of courses", "Apply a skill at work", "Graduate with degree/certificate"],
    },
    ambitious: {
      description: "Full-time study at a top institution. Significant investment of time and money. High upside in career trajectory, but financial strain upfront.",
      baseScores: { career: 30, finance: 20, wlb: 30, happiness: 40, health: 35, learning: 70 },
      annualGrowth: [35, 25, 10, 15, 5, 20],
      riskThemes: ["Student debt burden", "Opportunity cost of lost income", "No guarantee of job placement"],
      oppThemes: ["Elite network access", "Accelerated career pivot", "Transformational knowledge"],
      milestones: ["Get into target program", "Complete core requirements", "Secure placement or job offer"],
    },
    alt: {
      description: "A self-directed learning path: bootcamps, certifications, MOOCs, or a hybrid part-time program. Lower cost, fast results, less prestige.",
      baseScores: { career: 30, finance: 45, wlb: 45, happiness: 45, health: 45, learning: 55 },
      annualGrowth: [20, 15, 10, 10, 5, 20],
      riskThemes: ["Less recognized credentials", "Requires self-discipline", "Variable quality of programs"],
      oppThemes: ["Low financial risk", "Highly customizable", "Fast time-to-market for skills"],
      milestones: ["Complete first bootcamp/cert", "Land first role using new skills", "Achieve income recovery"],
    },
    bold: {
      description: "An intensive executive or specialized program at a top school while maintaining your career — think EMBA, intensive certificate, or dual-track study. Maximum investment for maximum return.",
      baseScores: { career: 50, finance: 35, wlb: 35, happiness: 40, health: 35, learning: 65 },
      annualGrowth: [28, 22, 15, 12, 10],
      riskThemes: ["High financial and time cost", "Difficult work-study balance", "May over-specialize too soon"],
      oppThemes: ["Prestigious credential and network", "Rapid career pivot capability", "Highest earning potential post-grad"],
      milestones: ["Get accepted into selective program", "Balance work and study successfully", "Land top-tier role upon completion"],
    },
  },
  finance: {
    safe: {
      description: "A conservative financial strategy — stick to renting, invest regularly, maintain an emergency fund and follow a standard budget.",
      baseScores: { career: 30, finance: 55, wlb: 70, happiness: 55, health: 65, learning: 25 },
      annualGrowth: [5, 8, 2, 5, 5, 3],
      riskThemes: ["Housing cost inflation over time", "Missed investment opportunities", "Lifestyle creep eroding savings"],
      oppThemes: ["Low stress financial path", "Predictable savings growth", "Ability to pivot if needed"],
      milestones: ["Build 6-month emergency fund", "Max out retirement account", "Achieve 20% savings rate"],
    },
    ambitious: {
      description: "Aggressive financial moves — buy a property with leverage, invest heavily in growth assets, side hustles for extra income.",
      baseScores: { career: 25, finance: 35, wlb: 25, happiness: 40, health: 30, learning: 35 },
      annualGrowth: [10, 30, 5, 8, 3, 8],
      riskThemes: ["Market downturn during leveraged period", "Cash flow pressure", "High stress from financial risk"],
      oppThemes: ["Wealth acceleration", "Asset appreciation", "Financial independence faster"],
      milestones: ["Make first major property/investment", "Achieve positive cash flow", "Reach first major net worth milestone"],
    },
    alt: {
      description: "A balanced middle path — buy a smaller home or co-ownership, invest moderately, maintain a healthy cash buffer.",
      baseScores: { career: 30, finance: 45, wlb: 55, happiness: 55, health: 55, learning: 30 },
      annualGrowth: [5, 15, 5, 8, 5, 5],
      riskThemes: ["Moderate market exposure", "May miss out on high-growth opportunities", "Compromise on location/size"],
      oppThemes: ["Equity building over time", "Manageable monthly costs", "Less financial stress than renting"],
      milestones: ["Secure financing/co-ownership deal", "Build home equity", "Refinance to better terms"],
    },
    bold: {
      description: "An aggressive investment and income strategy — real estate with calculated leverage, angel investing, and high-growth side ventures. You play to win big with managed downsides.",
      baseScores: { career: 30, finance: 55, wlb: 30, happiness: 45, health: 35, learning: 40 },
      annualGrowth: [15, 25, 20, 18, 15],
      riskThemes: ["Market timing risk", "Liquidity crunches during downturns", "High cognitive load from multiple streams"],
      oppThemes: ["Accelerated wealth building", "Multiple income streams", "Financial independence timeline shortened"],
      milestones: ["Launch first investment or side venture", "Achieve positive cash flow across streams", "Cross first major net worth threshold"],
    },
  },
  entrepreneurship: {
    safe: {
      description: "Start a side business while keeping your day job. Low risk, constrained time, but allows you to test the waters before committing fully.",
      baseScores: { career: 35, finance: 40, wlb: 35, happiness: 45, health: 40, learning: 55 },
      annualGrowth: [12, 15, 5, 12, 3, 15],
      riskThemes: ["Burnout from double workload", "Business may not scale with limited time", "Slow progress demotivating"],
      oppThemes: ["No income risk", "Real market validation", "Transition timing is your choice"],
      milestones: ["Launch MVP or first product", "Get first paying customer", "Achieve recurring revenue"],
    },
    ambitious: {
      description: "Quit your job and go all in. Full focus, maximum speed, but zero income buffer. High stress, high potential.",
      baseScores: { career: 30, finance: 15, wlb: 20, happiness: 40, health: 25, learning: 70 },
      annualGrowth: [40, 40, 10, 20, 5, 25],
      riskThemes: ["Personal runway running out", "Psychological toll of uncertainty", "Opportunity cost of leaving workforce"],
      oppThemes: ["Uncapped upside", "Total creative control", "Deepest learning curve"],
      milestones: ["Secure initial funding or revenue", "Achieve product-market fit", "Hire first employee", "Reach break-even"],
    },
    alt: {
      description: "A structured approach — join an accelerator, get a co-founder, or start a lifestyle business with a clear scope. Moderate intensity.",
      baseScores: { career: 35, finance: 30, wlb: 35, happiness: 50, health: 35, learning: 60 },
      annualGrowth: [25, 25, 8, 15, 5, 18],
      riskThemes: ["Co-founder conflict", "Equity dilution from investors", "Scope creep"],
      oppThemes: ["Structured support system", "Access to capital and mentorship", "Shared risk"],
      milestones: ["Get into accelerator or get first grant", "Define clear MVP roadmap", "Achieve sustainable run rate"],
    },
    bold: {
      description: "A founder's path with strategic backing — raise a seed round, build a team, and pursue venture-scale growth. The intensity of a startup with the structure of investor guidance.",
      baseScores: { career: 40, finance: 25, wlb: 25, happiness: 45, health: 30, learning: 65 },
      annualGrowth: [35, 30, 20, 15, 12],
      riskThemes: ["Investor pressure and milestones", "Equity dilution with each round", "Co-founder and team dynamics"],
      oppThemes: ["Access to significant capital", "Scale and impact potential", "Long-term equity upside"],
      milestones: ["Raise seed or pre-seed round", "Achieve product-market fit", "Scale to team of 5+", "Reach Series A readiness"],
    },
  },
  personal: {
    safe: {
      description: "A gradual personal change — start with small daily habits, take an evening class, explore the change while keeping your routine.",
      baseScores: { career: 30, finance: 60, wlb: 65, happiness: 50, health: 55, learning: 40 },
      annualGrowth: [5, 5, 8, 12, 10, 10],
      riskThemes: ["Change may not feel significant enough", "May lose motivation without urgency", "Comfort zone hard to leave"],
      oppThemes: ["Stable foundation to explore from", "Build momentum safely", "No major commitment needed"],
      milestones: ["Establish consistent new habit", "Reach a personal milestone", "Integrate change into daily life"],
    },
    ambitious: {
      description: "Make a radical life change — move to a new city, change your lifestyle completely, pursue a passion project. Transformative but destabilizing.",
      baseScores: { career: 20, finance: 25, wlb: 30, happiness: 45, health: 30, learning: 60 },
      annualGrowth: [10, 15, 15, 20, 10, 15],
      riskThemes: ["Identity disruption", "Relationship strain", "Financial shock"],
      oppThemes: ["Profound personal growth", "Live authentically to values", "Inspiring story and perspective"],
      milestones: ["Take the leap / make the decision", "Build new life structure", "Feel truly at home in new path"],
    },
    alt: {
      description: "A phased life redesign — try the change for 3 months, set measurable goals, have a fallback plan.",
      baseScores: { career: 30, finance: 45, wlb: 50, happiness: 50, health: 45, learning: 50 },
      annualGrowth: [5, 8, 8, 15, 8, 10],
      riskThemes: ["Hard to commit fully in trial mode", "May not go deep enough to assess", "Fallback can become default"],
      oppThemes: ["Evidence-based decision", "Lower regret risk", "Refined understanding of true needs"],
      milestones: ["Complete trial period", "Evaluate results honestly", "Make informed final decision"],
    },
    bold: {
      description: "A transformative personal overhaul — combine multiple changes (move, career shift, lifestyle redesign) into one intentional, supported transition. Maximum growth through coordinated change.",
      baseScores: { career: 30, finance: 35, wlb: 35, happiness: 50, health: 35, learning: 55 },
      annualGrowth: [15, 18, 12, 18, 10, 12],
      riskThemes: ["Overwhelm from too many changes at once", "Identity disorientation", "Support network strain"],
      oppThemes: ["Compound personal growth", "Reinvent multiple life areas simultaneously", "Shorter transition period overall"],
      milestones: ["Design integrated change plan", "Execute first phase of multi-area change", "Achieve new equilibrium in all areas"],
    },
  },
};

/* ─── Path generation ─── */

function generateBaseScores(
  template: typeof SCENARIO_TEMPLATES[DecisionType][PathKind],
  priorities: DimensionId[],
  riskTolerance: string,
  rand: () => number,
): DimensionScores {
  const base = { career: 50, finance: 50, wlb: 50, happiness: 50, health: 50, learning: 50 };
  for (const d of DIMENSION_ORDER) {
    const tVal = (template.baseScores as any)?.[d];
    const mod = tVal !== undefined ? (tVal as number) - 50 : 0;
    const priorityBoost = priorities.includes(d) ? 8 : 0;
    const riskMod = riskTolerance === "high" ? 5 : riskTolerance === "low" ? -5 : 0;
    const noise = (rand() - 0.5) * 12;
    (base as any)[d] = clamp(50 + mod + priorityBoost + riskMod + noise);
  }
  return base;
}

function generateOutcomes(
  base: DimensionScores,
  annualGrowth: number[],
  milestones: string[],
  horizonYears: number,
  rand: () => number,
): YearOutcome[] {
  const outcomes: YearOutcome[] = [];
  let current = { ...base };

  for (let y = 1; y <= horizonYears; y++) {
    const growthPct = annualGrowth[Math.min(y - 1, annualGrowth.length - 1)] / 100;
    for (const d of DIMENSION_ORDER) {
      const noise = (rand() - 0.5) * 8;
      const dimGrowth = y <= 2 ? growthPct * 30 : growthPct * 15;
      const dimBoost = Math.min(y, 3) * dimGrowth * 0.3;
      (current as any)[d] = clamp(current[d] + dimBoost + noise + (rand() - 0.5) * 4);
    }

    const milestone = milestones.length > 0 && rand() > 0.5
      ? {
          year: y,
          title: pick(milestones, rand),
          detail: milestones.length > 1 ? pick(milestones.filter((_, i) => i !== 0), rand) : milestones[0],
          impact: (["positive", "positive", "neutral"] as const)[Math.floor(rand() * 3)],
        }
      : undefined;

    // Special last-year milestone
    const finalMilestone = y === horizonYears
      ? {
          year: y,
          title: pick(milestones, rand) || pick(milestones, rand),
          detail: "A major turning point in this path",
          impact: (["positive", "positive", "neutral"] as const)[Math.floor(rand() * 3)],
        }
      : milestone;

    outcomes.push({
      year: y,
      scores: { ...current },
      milestone: y === horizonYears ? finalMilestone : milestone,
    });
  }

  return outcomes;
}

function computeFinalScores(outcomes: YearOutcome[]): DimensionScores {
  const last = outcomes[outcomes.length - 1];
  return { ...last.scores };
}

function generateRecommendation(
  pathKind: PathKind,
  scores: DimensionScores,
  priorities: DimensionId[],
): string {
  const prioritizedScore = priorities.length > 0
    ? priorities.reduce((sum, d) => sum + (scores as any)[d], 0) / priorities.length
    : 60;

  if (pathKind === "safe") {
    if (prioritizedScore > 70) return "This path strongly aligns with your priorities — you'll progress steadily without major disruptions.";
    if (prioritizedScore > 50) return "A balanced option that provides stability. You may need to supplement with side projects to hit all your goals.";
    return "Conservative path with low stress but may not fully satisfy your ambitions in the prioritized areas.";
  }
  if (pathKind === "ambitious") {
    if (prioritizedScore > 70) return "This path maximizes your priority dimensions. The high risk is matched by high potential — your values align with the challenge.";
    if (prioritizedScore > 45) return "High-risk, high-reward. Your priority areas see moderate gains, but be prepared for tradeoffs in stability and stress.";
    return "The ambitious route doesn't strongly favor your priorities. The risk may not be worth the potential outcome in the areas you care about most.";
  }
  if (pathKind === "alt") {
    if (prioritizedScore > 65) return "The middle path offers an excellent balance — good outcomes where it matters most, with manageable risk.";
    if (prioritizedScore > 45) return "A compromise option with moderate results. It's neither the best nor worst in your priority areas, but offers flexibility.";
    return "This alternative path may not serve your top priorities well. Consider whether the flexibility trade-off is worth it.";
  }
  // bold
  if (prioritizedScore > 70) return "The bold path strikes an excellent balance — high growth potential with strong alignment to your priorities. A calculated risk worth taking.";
  if (prioritizedScore > 50) return "A solid growth-oriented option. Your priorities see good outcomes, but the increased intensity may challenge your work-life balance.";
  return "The bold path's high-growth focus doesn't strongly align with your priorities. Consider whether the extra intensity is worth the tradeoff.";
}

function computeRiskScore(outcomes: YearOutcome[], riskTolerance: string): number {
  // Lower scores in health/wlb = higher risk
  const healthScores = outcomes.map((o) => o.scores.health);
  const wlbScores = outcomes.map((o) => o.scores.wlb);
  const healthDips = healthScores.filter((s) => s < 40).length;
  const wlbDips = wlbScores.filter((s) => s < 40).length;
  const volatility = healthScores.reduce((sum, s, i) => {
    if (i === 0) return 0;
    return sum + Math.abs(s - healthScores[i - 1]);
  }, 0);
  const base = (healthDips * 15 + wlbDips * 10 + volatility * 0.5) / 2;
  const toleranceMod = riskTolerance === "high" ? -10 : riskTolerance === "low" ? 15 : 0;
  return clamp(base + toleranceMod);
}

/* ─── Assumptions ─── */

function generateAssumptions(input: DecisionInput): AssumptionNote[] {
  const assumptions: AssumptionNote[] = [
    {
      label: "Economic stability",
      detail: "Assumes stable economic conditions without major recessions or disruptions over the simulation period."
    },
    {
      label: "Personal health baseline",
      detail: "Assumes no major health events that would significantly alter your trajectory."
    },
    {
      label: "Network maintenance",
      detail: "Assumes you actively maintain key relationships and professional connections."
    },
  ];
  if (input.decisionType === "relocation" || input.decisionType === "education") {
    assumptions.push({
      label: "Visa & regulatory",
      detail: "Assumes you secure necessary permits or admission without extraordinary delays."
    });
  }
  if (input.decisionType === "entrepreneurship" || input.decisionType === "career") {
    assumptions.push({
      label: "Market conditions",
      detail: "Assumes your industry continues to exist and grow at typical rates for your field."
    });
  }
  return assumptions;
}

/* ─── Main engine ─── */

export function simulate(input: DecisionInput): SimulationResult {
  const seed = input.question.toLowerCase().trim() + input.decisionType + input.riskTolerance;
  const rand = seededRandom(seed);

  const allPathKinds: PathKind[] = ["safe", "ambitious", "alt", "bold"];
  const allPaths: (ScenarioPath & { priorityScore: number })[] = allPathKinds.map((kind) => {
    const template = SCENARIO_TEMPLATES[input.decisionType][kind];
    const baseScores = generateBaseScores(template, input.priorities, input.riskTolerance, rand);
    const outcomes = generateOutcomes(
      baseScores,
      template.annualGrowth,
      template.milestones,
      input.horizonYears,
      rand,
    );
    const finalScores = computeFinalScores(outcomes);
    const totalRisk = computeRiskScore(outcomes, input.riskTolerance);
    const totalReward = clamp(
      DIMENSION_ORDER.reduce((sum, d) => sum + (finalScores as any)[d] - 50, 0) / 2 + 50,
    );
    const recommendation = generateRecommendation(kind, finalScores, input.priorities);

    const name =
      kind === "safe" ? "Steady Path"
      : kind === "ambitious" ? "Ambitious Path"
      : kind === "alt" ? "Alternative Path"
      : "Bold Path";

    const tagline =
      kind === "safe" ? "Stable & predictable growth"
      : kind === "ambitious" ? "High risk, high reward"
      : kind === "alt" ? "Balanced flexibility"
      : "Structured high growth";

    const confidence = clamp(
      kind === "safe" ? 78 + rand() * 10
      : kind === "ambitious" ? 60 + rand() * 15
      : kind === "alt" ? 70 + rand() * 12
      : 65 + rand() * 14,
    );

    const priorityScore = input.priorities.length > 0
      ? input.priorities.reduce((sum, d) => sum + (finalScores as any)[d], 0)
      : DIMENSION_ORDER.reduce((sum, d) => sum + (finalScores as any)[d], 0);

    return {
      kind,
      name,
      tagline,
      confidence,
      description: template.description,
      outcomes,
      finalScores,
      risks: template.riskThemes.map((r) => (Array.isArray(r) ? r[0] : r)),
      opportunities: template.oppThemes.map((r) => (Array.isArray(r) ? r[0] : r)),
      totalRisk,
      totalReward,
      recommendation,
      priorityScore,
    };
  });

  // Sort by priority score descending and take the requested number of paths
  allPaths.sort((a, b) => b.priorityScore - a.priorityScore);
  const selectedPaths = allPaths.slice(0, input.numPaths);

  // Best fit is the highest-scoring among selected paths
  const bestPath = selectedPaths[0].kind;
  const bestPathLabel = selectedPaths[0].name;

  // Clean up the paths to remove internal priorityScore
  const paths: ScenarioPath[] = selectedPaths.map(({ priorityScore: _, ...p }) => p);

  const bestFitReason = input.priorities.length > 0
    ? `Based on your priorities (${input.priorities.join(", ")}), the ${bestPathLabel} maximizes outcomes in the areas most important to you.`
    : `The ${bestPathLabel} balances the highest overall outcomes with manageable risk.`;

  return {
    id: `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    input,
    paths,
    assumptions: generateAssumptions(input),
    generatedAt: Date.now(),
    bestFitPath: bestPath,
    bestFitReason,
  };
}