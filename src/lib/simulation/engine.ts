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
  DIMENSION_META,
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
  _decisionType: DecisionType,
): string {
  const prioritizedScore = priorities.length > 0
    ? priorities.reduce((sum, d) => sum + (scores as any)[d], 0) / priorities.length
    : 60;

  // Identify strongest and weakest dimensions
  let bestDim = DIMENSION_ORDER[0];
  let worstDim = DIMENSION_ORDER[0];
  for (const d of DIMENSION_ORDER) {
    if ((scores as any)[d] > (scores as any)[bestDim]) bestDim = d;
    if ((scores as any)[d] < (scores as any)[worstDim]) worstDim = d;
  }
  const bestLabel = DIMENSION_META[bestDim].label;
  const worstLabel = DIMENSION_META[worstDim].label;
  const bestScore = (scores as any)[bestDim];
  const worstScore = (scores as any)[worstDim];

  if (pathKind === "safe") {
    if (prioritizedScore > 70) {
      return `This path is a natural fit for you. Your strongest area will be ${bestLabel} (${bestScore}/100) — you'll make reliable progress there without the stress of drastic change. The tradeoff is that ${worstLabel} may lag at ${worstScore}/100, but you can compensate with side initiatives. Think of this as building a solid foundation: slow and steady wins the race, especially if stability matters to you right now.`;
    }
    if (prioritizedScore > 50) {
      return `This path offers comfortable stability, especially in ${bestLabel} (${bestScore}/100). You won't be stretching yourself too thin, but ${worstLabel} (${worstScore}/100) is an area where you may feel held back. If you have major life responsibilities (family, health, finances) that need predictability, this path gives you that peace of mind — just don't expect rapid transformation.`;
    }
    return `The steady approach gives you peace of mind and low stress, but your priorities aren't its strong suit — particularly ${worstLabel} (${worstScore}/100). You'll likely feel a nagging sense of "what if?" over time. This path works best as a temporary base camp while you prepare for something bigger, not as a final destination if you're ambitious.`;
  }
  if (pathKind === "ambitious") {
    if (prioritizedScore > 70) {
      return `This is your high-ceiling play. ${bestLabel} (${bestScore}/100) is where you'll really shine — expect rapid growth and breakthrough moments. But be honest with yourself: ${worstLabel} (${worstScore}/100) will take a hit, and the first 1-2 years will feel like a grind. The payoff comes in years 3-5 when your trajectory steepens. If you have a strong support system and runway, this path could accelerate your life by 5+ years in one leap.`;
    }
    if (prioritizedScore > 45) {
      return `The ambitious route pushes you hard, with your biggest gains in ${bestLabel} (${bestScore}/100). But there's a real cost: ${worstLabel} (${worstScore}/100) is a weak spot that will test your resilience. You'll face late nights, uncertainty, and moments of doubt. Ask yourself: is the adrenaline of the climb worth the valleys you'll walk through? If you're in your 20s or early 30s with minimal obligations, this is the time to take this bet.`;
    }
    return `Honestly, the ambitious path doesn't play to your strengths or priorities — especially in ${worstLabel} (${worstScore}/100). The risk here (stress, instability, burnout risk) likely outweighs the reward for what you care about. You'd be fighting an uphill battle. Unless you have a burning conviction that this specific leap is necessary, a more moderate option would likely serve you better.`;
  }
  if (pathKind === "alt") {
    if (prioritizedScore > 65) {
      return `This middle way hits a sweet spot for you. ${bestLabel} (${bestScore}/100) gives you a meaningful edge where it counts, while the balanced approach keeps ${worstLabel} (${worstScore}/100) from becoming a crisis. You won't get the headline-grabbing wins of a riskier path, but you also won't lie awake at night worrying. This is the path for someone who wants real progress without sacrificing their peace of mind.`;
    }
    if (prioritizedScore > 45) {
      return `A balanced compromise: ${bestLabel} (${bestScore}/100) is decent, and ${worstLabel} (${worstScore}/100) is manageable — nothing extreme either way. This path gives you flexibility and optionality. The downside? You might feel like you're half-committing, which can be frustrating if you're decisive. It works well if you're still figuring out what you want and need time to explore.`;
    }
    return `The alternative path doesn't particularly serve your priorities. While ${bestLabel} (${bestScore}/100) shows some promise, ${worstLabel} (${worstScore}/100) is underwhelming for what you care about. You'd be making compromises without getting enough back in return. Unless the flexibility itself is your top value, you're likely better off with a more focused option.`;
  }
  // bold
  if (prioritizedScore > 70) {
    return `The bold path is your calculated fast-track. ${bestLabel} (${bestScore}/100) is where you'll see outsized returns — this path was practically designed to amplify that area. However, ${worstLabel} (${worstScore}/100) will require deliberate management. The key difference from the ambitious path is structure: bold isn't reckless, it's aggressive with a plan. If you have a clear 3-year vision and the discipline to execute, this is your smartest bet.`;
  }
  if (prioritizedScore > 50) {
    return `A strong growth option with real upside in ${bestLabel} (${bestScore}/100). The catch is that ${worstLabel} (${worstScore}/100) suffers under the intensity. You'll need strong systems (scheduling, support, self-care) to prevent the weak areas from dragging everything down. This path suits someone who wants to accelerate but still keep their life in working order — think of it as pushing the accelerator to 70%, not 100%.`;
  }
  return `The bold path demands a lot and gives mixed returns for your priorities. ${bestLabel} (${bestScore}/100) is decent, but ${worstLabel} (${worstScore}/100) is a real concern. The intensity may not justify the outcome for what truly matters to you. If you're drawn to this path, consider whether the challenge itself (not just the outcome) would make it worthwhile for you as a growth experience.`;
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
    const recommendation = generateRecommendation(kind, finalScores, input.priorities, input.decisionType);

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
  const bestPathScores = selectedPaths[0].finalScores;

  // Build a vivid best-fit reason
  let bestDim = DIMENSION_ORDER[0];
  let worstDim = DIMENSION_ORDER[0];
  for (const d of DIMENSION_ORDER) {
    if ((bestPathScores as any)[d] > (bestPathScores as any)[bestDim]) bestDim = d;
    if ((bestPathScores as any)[d] < (bestPathScores as any)[worstDim]) worstDim = d;
  }
  const bestLabel = DIMENSION_META[bestDim].label;

  // Clean up the paths to remove internal priorityScore
  const paths: ScenarioPath[] = selectedPaths.map(({ priorityScore: _, ...p }) => p);

  const bestFitReason = input.priorities.length > 0
    ? `${bestPathLabel} is your recommended path because it scores highest on what you care about most. It excels in ${bestLabel.toLowerCase()} (${(bestPathScores as any)[bestDim]}/100) and handles your other priorities well — giving you the best overall alignment with less compromise than other options.`
    : `${bestPathLabel} offers the best overall balance across all life dimensions — strong in ${bestLabel.toLowerCase()} (${(bestPathScores as any)[bestDim]}/100) while keeping trade-offs manageable. It's the safest bet when you want solid progress without betting everything on one area.`;

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

/* ─── Q&A — answer questions about a path ─── */

export function answerPathQuestion(path: ScenarioPath, question: string): string {
  const q = question.toLowerCase();

  // Find best/worst dimensions
  let bestDim = DIMENSION_ORDER[0];
  let worstDim = DIMENSION_ORDER[0];
  for (const d of DIMENSION_ORDER) {
    if ((path.finalScores as any)[d] > (path.finalScores as any)[bestDim]) bestDim = d;
    if ((path.finalScores as any)[d] < (path.finalScores as any)[worstDim]) worstDim = d;
  }
  const bestLabel = DIMENSION_META[bestDim].label;
  const worstLabel = DIMENSION_META[worstDim].label;
  const bestScore = (path.finalScores as any)[bestDim];
  const worstScore = (path.finalScores as any)[worstDim];

  // --- "what if" / "if I lose my job" / set back / unexpected ---
  if (q.includes("what if") || q.includes("lose") || q.includes("job") || q.includes("setback") || q.includes("unexpected") || q.includes("fail") || q.includes("wrong") || q.includes("worst")) {
    if (path.kind === "safe") {
      return `Even on the Steady Path, setbacks happen — but this path is the most resilient to them.\n\nIf you lost your job or faced a major unexpected expense, your strongest asset is ${bestLabel} (${bestScore}/100), which gives you more margin to recover. The area most vulnerable would be ${worstLabel} (${worstScore}/100) — it's already your weakest point, so a setback here could be harder to bounce back from.\n\nKey safety nets on this path:\n• Higher work-life balance means more energy to pivot\n• Steady income provides financial buffer\n• Established network helps with career transitions\n\nThe recommendation: build a 3-6 month emergency fund as your first priority on this path.`;
    }
    if (path.kind === "ambitious") {
      return `On the Ambitious Path, setbacks hit harder. This is the most vulnerable path to unexpected events because ${worstLabel} (${worstScore}/100) leaves little buffer.\n\nIf you lost your income stream or the bet doesn't pay off in Year 1-2, you'd face financial pressure quickly. The saving grace is ${bestLabel} (${bestScore}/100) — your strongest area gives you options to recover faster than you might expect.\n\nKey things that could go wrong:\n• Running out of runway before the payoff arrives\n• Burnout forcing you to slow down at a critical moment\n• The market not responding the way you hoped\n\nMitigation plan: define clear "stop-loss" checkpoints at 6, 12, and 18 months. If those milestones aren't met, have a Plan B ready.`;
    }
    if (path.kind === "alt") {
      return `The Alternative Path is designed for flexibility, so it handles setbacks better than you might think.\n\n${bestLabel} (${bestScore}/100) gives you a strong foundation, and the flexible nature of this path means you can adjust course without a major reset. The main risk is that ${worstLabel} (${worstScore}/100) could take longer to recover from because you're already operating with lower intensity.\n\nWhat a setback looks like here:\n• A client drops off or a project falls through — you have other streams to lean on\n• You lose motivation — the lower pressure means you can take a breather\n• Unexpected costs — the diversified approach gives you more adjustment levers\n\nThe key advantage: you can scale back temporarily without derailing your entire trajectory.`;
    }
    // bold
    return `The Bold Path has structure, so unexpected events are less catastrophic than on the Ambitious path — but they still matter.\n\n${bestLabel} (${bestScore}/100) is your shield — it's strong enough to weather some turbulence. The real concern is ${worstLabel} (${worstScore}/100), which would be the first domino to fall under pressure.\n\nWhat helps:\n• You have a plan with clear milestones, so you can detect problems early\n• The structured approach means you have identified back-up options\n• Your growth rate gives you more recovery velocity than slower paths\n\nWarning sign: if ${worstLabel.toLowerCase()} drops below 30, pause and reassess. That's the signal that the path's demands have exceeded your capacity.`;
  }

  // --- "compare" / "how is this different" / "versus" / "other path" ---
  if (q.includes("compare") || q.includes("different") || q.includes("versus") || q.includes("vs") || q.includes("other") || q.includes("another") || q.includes("instead")) {
    return `Here's how the ${path.name} compares to the alternatives:\n\n• **Steady Path**: Has higher ${DIMENSION_META.wlb.label} and ${DIMENSION_META.health.label} but lower growth potential. The ${path.name} trades some stability for more opportunity.\n• **Ambitious Path**: More extreme highs and lows. The ${path.name} has more structure and less pure upside, but also less risk of total derailment.\n• **Alternative Path**: More flexibility day-to-day. The ${path.name} requires more commitment but offers clearer progression.\n• **Bold Path**: Similar intensity to this one but with a more aggressive stance. The ${path.name} trades some speed for better balance.\n\nYour strongest advantage here: ${bestLabel} (${bestScore}/100) — that's the deciding factor that sets this path apart.`;
  }

  // --- "year 1" / "year 2" / "first year" / "how does it start" ---
  if (q.includes("year 1") || q.includes("first year") || q.includes("start") || q.includes("beginning") || q.includes("early") || q.includes("initial")) {
    const y1 = path.outcomes[0];
    if (!y1) return "I don't have enough data to describe the early phase of this path in detail.";
    const topDim = DIMENSION_ORDER.reduce((a, b) => (y1.scores[a] > y1.scores[b] ? a : b));
    const lowDim = DIMENSION_ORDER.reduce((a, b) => (y1.scores[a] < y1.scores[b] ? a : b));
    return `In Year 1 on the ${path.name}, here's what to expect:\n\n• Your strongest area from the start is **${DIMENSION_META[topDim].label}** (${y1.scores[topDim]}/100) — you'll see early wins here that build momentum.\n• Your biggest challenge is **${DIMENSION_META[lowDim].label}** (${y1.scores[lowDim]}/100) — this will feel like the hardest part and need the most attention.\n• The overall average score starts around ${Math.round(DIMENSION_ORDER.reduce((s, d) => s + y1.scores[d], 0) / DIMENSION_ORDER.length)}/100.\n${y1.milestone ? `• A key early milestone: "${y1.milestone.title}" — ${y1.milestone.detail}.` : ""}\n\nThe first year is about building the foundation. Focus on protecting ${DIMENSION_META[lowDim].label} to prevent early burnout.`;
  }

  // --- "year 3" / "later years" / "final" / "long term" ---
  if (q.includes("year 3") || q.includes("year 4") || q.includes("year 5") || q.includes("later") || q.includes("final") || q.includes("long term") || q.includes("eventually") || q.includes("end")) {
    const last = path.outcomes[path.outcomes.length - 1];
    if (!last) return "I don't have projected data for the later years of this path.";
    const delta = DIMENSION_ORDER.map(d => ({ d, change: last.scores[d] - path.outcomes[0].scores[d] }))
      .sort((a, b) => b.change - a.change);
    const biggestGain = delta[0];
    const biggestLoss = delta[delta.length - 1];
    return `Looking at the end of this ${path.outcomes.length}-year projection on the ${path.name}:\n\n• Your biggest gain is in **${DIMENSION_META[biggestGain.d].label}** (${biggestGain.change > 0 ? "+" : ""}${biggestGain.change} points) — reaching ${last.scores[biggestGain.d]}/100 by the final year.\n${biggestLoss.change < -5 ? `• Your biggest decline is in **${DIMENSION_META[biggestLoss.d].label}** (${biggestLoss.change} points) — ending at ${last.scores[biggestLoss.d]}/100.` : `• No significant declines — you end with ${DIMENSION_META[biggestLoss.d].label} at ${last.scores[biggestLoss.d]}/100.`}\n• Final overall average: ${Math.round(DIMENSION_ORDER.reduce((s, d) => s + last.scores[d], 0) / DIMENSION_ORDER.length)}/100\n\nAt the end of this horizon, ${bestLabel} (${bestScore}/100) remains your standout strength, while ${worstLabel} (${worstScore}/100) still needs attention. The trajectory is ${bestScore > 70 ? "strongly positive" : worstScore < 40 ? "mixed with concerns" : "generally stable"}.`;
  }

  // --- "how" / "what do I do" / "action" / "steps" / "plan" ---
  if (q.includes("how do i") || q.includes("what should") || q.includes("action") || q.includes("steps") || q.includes("plan") || q.includes("next") || q.includes("prepare") || q.includes("recommend")) {
    const milestones = path.outcomes.filter(o => o.milestone).slice(0, 3);
    const steps = milestones.map((m, i) => `${i + 1}. **${m.milestone!.title}** (Year ${m.year}) — ${m.milestone!.detail}`).join("\n");
    return `Here's a practical action plan for the ${path.name}:\n\n${steps || "1. Start by protecting your weakest area — **" + worstLabel + "** needs deliberate attention from day one.\n2. Double down on **" + bestLabel + "** — this is where you'll see the highest return on effort.\n3. Set 3-month review checkpoints to track progress and adjust."}\n\nWatch out for: ${path.risks.slice(0, 2).join(" and ")}. These are the most common stumbling blocks on this path.\n\nMost importantly, don't try to optimize everything at once. Pick ONE area to focus on each quarter and let the others coast.`;
  }

  // --- "risk" / "danger" / "scared" / "worried" / "nervous" ---
  if (q.includes("risk") || q.includes("danger") || q.includes("scared") || q.includes("worried") || q.includes("nervous") || q.includes("stress") || q.includes("anxious")) {
    const riskItems = path.risks.slice(0, 2);
    return `It's normal to feel nervous — here's an honest look at the risks on the ${path.name}:\n\n• **${riskItems[0] || "No specific risk identified"}** — this is the most likely challenge you'll face.\n${riskItems[1] ? `• **${riskItems[1]}** — a secondary concern to keep on your radar.` : ""}\n• **${worstLabel} (${worstScore}/100)** — this dimension is your weakest link and needs protection.\n\nHere's the thing: a risk score of ${path.totalRisk}/100 means the path has ${path.totalRisk < 30 ? "relatively low" : path.totalRisk < 50 ? "moderate" : "significant"} risk. ${path.totalRisk < 30 ? "This is actually one of the safer options available." : path.totalRisk < 50 ? "The risks are real but manageable with good planning." : "You should take these risks seriously and have contingency plans ready."}\n\nWhat helps most: having a trusted person to talk through decisions with, and writing down your "if-then" plans before you need them.`;
  }

  // --- "happiness" / "will I be happy" / "fulfill" / "satisfied" ---
  if (q.includes("happ") || q.includes("fulfill") || q.includes("satisfied") || q.includes("enjoy") || q.includes("love") || q.includes("regret")) {
    const happinessScore = path.finalScores.happiness;
    const healthScore = path.finalScores.health;
    if (happinessScore >= 65) {
      return `On the happiness front, this path scores well (${happinessScore}/100). You're likely to feel genuinely satisfied with your direction, especially as ${bestLabel} (${bestScore}/100) gives you a sense of purpose and progress.\n\nHowever, happiness isn't everything — your ${worstLabel} (${worstScore}/100) could create frustration that bleeds into overall wellbeing. The key is to have outlets and relationships outside of this path that keep you grounded.\n\nHealth ${healthScore >= 50 ? `(${healthScore}/100) is manageable` : `(${healthScore}/100) needs watching`}. ${healthScore < 50 ? "Make sure you build rest and recovery into your routine from day one." : "Adequate self-care should keep you in good shape."}`;
    }
    return `Honestly, happiness is a concern on this path (${happinessScore}/100). The demands and trade-offs may leave you feeling unfulfilled at times, especially if ${worstLabel} (${worstScore}/100) becomes a source of daily frustration.\n\nThat doesn't mean you can't be happy — it means you need to be intentional about finding fulfillment outside the path's main focus. Strong relationships, hobbies, and clear boundaries will make the difference.\n\nA practical tip: if you choose this path, commit to a 6-month check-in where you honestly assess your happiness. If it's below where you need to be, adjust or switch.`;
  }

  // --- "money" / "finance" / "salary" / "income" / "cost" ---
  if (q.includes("money") || q.includes("finance") || q.includes("salary") || q.includes("income") || q.includes("cost") || q.includes("pay") || q.includes("expensive") || q.includes("budget")) {
    const financeScore = path.finalScores.finance;
    const careerScore = path.finalScores.career;
    return `Let's talk finances. On the ${path.name}, your financial outlook is **${financeScore}/100**.\n\n${financeScore >= 65 ? "This path puts you in a solid financial position. Income growth is likely steady and your savings should build at a healthy rate." : financeScore >= 45 ? "Finances are adequate but not exciting. You'll cover your needs and build modest savings — but don't expect rapid wealth accumulation." : "This path puts financial pressure on you. Income may be tight, especially early on. Budgeting and a financial buffer are essential before committing."}\n\nYour ${DIMENSION_META.career.label} score (${careerScore}/100) ${careerScore >= 60 ? "supports good income growth over time, so the financial picture should improve as you progress." : "may limit income growth. Consider whether the financial trade-off is acceptable for what you gain in other areas."}\n\n⚠️ Important: these are rough directional estimates based on your decision type — not financial advice. Your actual outcomes depend on your specific industry, location, and personal circumstances.`;
  }

  // --- Generic response ---
  return `Great question! Here's what I can tell you about the ${path.name}:\n\n• This path scores highest in **${bestLabel}** (${bestScore}/100) — that's your strongest lever for success.\n• The area to watch is **${worstLabel}** (${worstScore}/100) — it needs extra attention.\n• Overall risk level is ${path.totalRisk}/100 and reward potential is ${path.totalReward}/100.\n\nSome specific things to think about:\n- Risks: ${path.risks.slice(0, 2).join(", ")}\n- Opportunities: ${path.opportunities.slice(0, 2).join(", ")}\n- Confidence in this projection: ${path.confidence}%\n\nTry asking me something more specific like "What happens in Year 1?" or "What are the main risks?" and I'll give you a deeper answer.`;
}