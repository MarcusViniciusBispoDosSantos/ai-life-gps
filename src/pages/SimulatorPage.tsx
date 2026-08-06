import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Route,
  ArrowRight,
  RotateCcw,
  Save,
  Info,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";
import { useApp } from "../store/AppContext";
import PathDetailModal from "../components/PathDetailModal";
import {
  DecisionInput,
  DecisionType,
  DimensionId,
  DIMENSION_META,
  DIMENSION_ORDER,
  DIMENSION_COLORS,
  PATH_META,
  getScoreExplanation,
} from "../lib/simulation/types";

/* ─── Decision Type Options ─── */
const DECISION_TYPES: { value: DecisionType; label: string }[] = [
  { value: "career", label: "Career Change" },
  { value: "relocation", label: "Relocation / Move" },
  { value: "education", label: "Education" },
  { value: "finance", label: "Finance / Housing" },
  { value: "entrepreneurship", label: "Entrepreneurship" },
  { value: "personal", label: "Personal Life" },
];

const RISK_OPTIONS = [
  { value: "low" as const, label: "Low — I prefer stability" },
  { value: "moderate" as const, label: "Moderate — I'll take calculated risks" },
  { value: "high" as const, label: "High — I'm ready for big changes" },
];

const CARD_COUNT_OPTIONS = [2, 3, 4] as const;

/* ─── Form Component ─── */
function DecisionForm({
  onRun,
}: {
  onRun: (input: DecisionInput) => void;
}) {
  const [question, setQuestion] = useState("");
  const [decisionType, setDecisionType] = useState<DecisionType>("career");
  const [riskTolerance, setRiskTolerance] = useState<"low" | "moderate" | "high">(
    "moderate"
  );
  const [priorities, setPriorities] = useState<DimensionId[]>([]);
  const [horizonYears, setHorizonYears] = useState<number>(3);
  const [numPaths, setNumPaths] = useState<2 | 3 | 4>(3);

  const togglePriority = (d: DimensionId) => {
    setPriorities((prev) =>
      prev.includes(d) ? prev.filter((p) => p !== d) : [...prev, d]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    onRun({
      question: question.trim(),
      decisionType,
      riskTolerance,
      priorities,
      horizonYears,
      numPaths,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Question */}
      <div>
        <label className="block text-sm font-medium mb-2 font-heading">
          What decision are you facing?
        </label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder='e.g. "Should I quit my job to start a business?", "Should I move to Canada?", "Should I pursue a Master&apos;s degree?"'
          rows={3}
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-path-safe/30 focus:border-path-safe/50 transition-all resize-none"
        />
      </div>

      {/* Decision Type */}
      <div>
        <label className="block text-sm font-medium mb-2 font-heading">
          What type of decision is this?
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DECISION_TYPES.map((dt) => (
            <button
              key={dt.value}
              type="button"
              onClick={() => setDecisionType(dt.value)}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm border transition-all cursor-pointer ${
                decisionType === dt.value
                  ? "border-path-safe bg-path-safe/15 text-foreground"
                  : "border-border bg-surface hover:bg-surface-raised text-muted"
              }`}
            >
              {dt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Risk Tolerance */}
      <div>
        <label className="block text-sm font-medium mb-2 font-heading">
          Your risk tolerance
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {RISK_OPTIONS.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRiskTolerance(r.value)}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm border transition-all cursor-pointer ${
                riskTolerance === r.value
                  ? "border-path-ambitious bg-path-ambitious/15 text-foreground"
                  : "border-border bg-surface hover:bg-surface-raised text-muted"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Priorities */}
      <div>
        <label className="block text-sm font-medium mb-2 font-heading">
          What matters most to you? (tap to select)
        </label>
        <div className="flex flex-wrap gap-2">
          {DIMENSION_ORDER.map((d) => {
            const active = priorities.includes(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => togglePriority(d)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-all cursor-pointer ${
                  active
                    ? "border-foreground bg-foreground/10 text-foreground"
                    : "border-border bg-surface text-muted hover:bg-surface-raised"
                }`}
              >
                {DIMENSION_META[d].short}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted mt-1">
          {priorities.length === 0
            ? "None selected — we'll optimize for overall balance."
            : `${priorities.length} selected`}
        </p>
      </div>

      {/* Number of Paths */}
      <div>
        <label className="block text-sm font-medium mb-2 font-heading">
          Scenario paths to compare
        </label>
        <div className="flex gap-2">
          {CARD_COUNT_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNumPaths(n)}
              className={`flex-1 px-4 py-2 rounded-lg text-sm border transition-all cursor-pointer ${
                numPaths === n
                  ? "border-path-bold bg-path-bold/15 text-foreground"
                  : "border-border bg-surface hover:bg-surface-raised text-muted"
              }`}
            >
              {n} Paths
            </button>
          ))}
        </div>
      </div>

      {/* Horizon Slider */}
      <div>
        <label className="block text-sm font-medium mb-2 font-heading">
          Simulation horizon: <strong>{horizonYears} {horizonYears === 1 ? "year" : "years"}</strong>
        </label>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted w-6 text-right">1</span>
          <input
            type="range"
            min={1}
            max={20}
            value={horizonYears}
            onChange={(e) => setHorizonYears(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer bg-surface-raised accent-path-alt"
            style={{
              background: `linear-gradient(to right, var(--color-path-alt) 0%, var(--color-path-alt) ${((horizonYears - 1) / 19) * 100}%, var(--color-surface-raised) ${((horizonYears - 1) / 19) * 100}%, var(--color-surface-raised) 100%)`,
            }}
          />
          <span className="text-xs text-muted w-6">20</span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted/50">Short-term</span>
          <span className="text-[10px] text-muted/50">Long-term</span>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!question.trim()}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-path-safe text-background font-semibold text-sm hover:brightness-110 transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        <Sparkles className="w-4 h-4" />
        Simulate My Futures
        <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}

/* ─── Radar Chart ─── */
function ComparisonRadar({ result }: { result: import("../lib/simulation/types").SimulationResult }) {
  const chartData = useMemo(() => {
    return DIMENSION_ORDER.map((d) => {
      const row: Record<string, number | string> = {
        dimension: DIMENSION_META[d].short,
      };
      for (const path of result.paths) {
        row[path.kind] = path.finalScores[d];
      }
      return row;
    });
  }, [result]);

  return (
    <div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
      <h3 className="font-heading font-semibold text-sm mb-4 flex items-center gap-2">
        <Route className="w-4 h-4 text-path-safe" />
        Dimension Comparison
      </h3>
      <ResponsiveContainer width="100%" height={320}>
        <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="65%">
          <PolarGrid stroke="var(--color-border)" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: "var(--color-muted)", fontSize: 11 }}
          />
          <PolarRadiusAxis
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          {result.paths.map((p) => (
            <Radar
              key={p.kind}
              dataKey={p.kind}
              name={p.name}
              stroke={PATH_META[p.kind].color}
              fill={PATH_META[p.kind].color}
              fillOpacity={0.12}
              strokeWidth={2}
            />
          ))}
          <Legend
            wrapperStyle={{ fontSize: 12, color: "var(--color-muted)" }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Timeline Chart ─── */
function TimelineChart({ result }: { result: import("../lib/simulation/types").SimulationResult }) {
  const data = useMemo(() => {
    return result.paths[0].outcomes.map((_, idx) => {
      const year = idx + 1;
      const row: Record<string, number | string> = { year: `Y${year}` };
      for (const path of result.paths) {
        const avg =
          DIMENSION_ORDER.reduce(
            (sum, d) => sum + path.outcomes[idx].scores[d],
            0
          ) / DIMENSION_ORDER.length;
        row[`${path.kind}_avg`] = Math.round(avg);
      }
      return row;
    });
  }, [result]);

  return (
    <div className="bg-surface border border-border rounded-xl p-4 sm:p-6">
      <h3 className="font-heading font-semibold text-sm mb-4 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-path-ambitious" />
        Average Score Over Time
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey="year"
            tick={{ fill: "var(--color-muted)", fontSize: 11 }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "var(--color-muted)", fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-surface-raised)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--color-foreground)",
            }}
          />
          {result.paths.map((p) => (
            <Line
              key={p.kind}
              type="monotone"
              dataKey={`${p.kind}_avg`}
              name={p.name}
              stroke={PATH_META[p.kind].color}
              strokeWidth={2}
              dot={{ fill: PATH_META[p.kind].color, r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
          <Legend
            wrapperStyle={{ fontSize: 12, color: "var(--color-muted)" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Score Bars ─── */
function ScoreBars({
  path,
}: {
  path: import("../lib/simulation/types").ScenarioPath;
}) {
  return (
    <div className="space-y-3">
      {DIMENSION_ORDER.map((d) => {
        const score = path.finalScores[d];
        const explanation = getScoreExplanation(d, score);
        const bandColors: Record<string, string> = {
          Excellent: "text-success",
          Good: "text-dim-career",
          Moderate: "text-dim-wlb",
          "Below Average": "text-destructive",
          Weak: "text-destructive",
        };
        return (
          <div key={d} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted">{DIMENSION_META[d].label}</span>
              <span className="font-medium" style={{ color: DIMENSION_COLORS[d] }}>
                {score}/100
              </span>
            </div>
            <div className="h-1.5 bg-background rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${score}%`,
                  backgroundColor: DIMENSION_COLORS[d],
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-medium ${bandColors[explanation.band] || "text-muted"}`}>
                {explanation.band}
              </span>
              <span className="text-[10px] text-muted/70 truncate">{explanation.description}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Scenario Card ─── */
function ScenarioCard({
  path,
  isBest,
  onDeepDive,
}: {
  path: import("../lib/simulation/types").ScenarioPath;
  isBest: boolean;
  onDeepDive: (path: import("../lib/simulation/types").ScenarioPath) => void;
}) {
  const meta = PATH_META[path.kind];
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border overflow-hidden ${
        isBest
          ? `border-${path.kind === "bold" ? "path-bold" : path.kind === "safe" ? "path-safe" : path.kind === "ambitious" ? "path-ambitious" : "path-alt"}/40 shadow-card`
          : "border-border"
      }`}
      style={{
        borderColor: isBest ? meta.color + "66" : undefined,
        boxShadow: isBest ? `0 0 20px ${meta.glow}` : undefined,
      }}
    >
      {/* Header */}
      <div
        className="px-4 sm:px-5 py-3 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${meta.color}22` }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: meta.color }}
          />
          <span className="font-heading font-semibold text-sm">{path.name}</span>
          {isBest && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-path-safe/15 text-path-safe border border-path-safe/20">
              Best Fit
            </span>
          )}
        </div>
        <span
          className="text-xs font-medium"
          style={{ color: meta.color }}
        >
          {path.confidence}% confidence
        </span>
      </div>

      {/* Tagline */}
      <div className="px-4 sm:px-5 py-2 border-b border-border/30">
        <p className="text-xs text-muted">{path.tagline}</p>
      </div>

      {/* Body */}
      <div className="px-4 sm:px-5 py-3 sm:py-4 space-y-4">
        {/* Score Bars */}
        <ScoreBars path={path} />

        {/* Risk / Reward */}
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
            <span>
              Risk: <strong>{path.totalRisk}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-success" />
            <span>
              Reward: <strong>{path.totalReward}</strong>
            </span>
          </div>
        </div>

        {/* Description (collapsible) */}
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <Info className="w-3 h-3" />
            Details
            {expanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <p className="text-xs text-muted mt-2 leading-relaxed">
                  {path.description}
                </p>

                {/* Risks */}
                {path.risks.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-destructive mb-1">
                      Risks
                    </p>
                    <ul className="space-y-1">
                      {path.risks.map((r, i) => (
                        <li
                          key={i}
                          className="text-xs text-muted flex items-start gap-1.5"
                        >
                          <span className="text-destructive mt-0.5">•</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Opportunities */}
                {path.opportunities.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-success mb-1">
                      Opportunities
                    </p>
                    <ul className="space-y-1">
                      {path.opportunities.map((o, i) => (
                        <li
                          key={i}
                          className="text-xs text-muted flex items-start gap-1.5"
                        >
                          <span className="text-success mt-0.5">•</span>
                          {o}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendation */}
                <div className="mt-3 p-3 rounded-lg bg-foreground/5 border border-border/50">
                  <p className="text-xs font-medium mb-1">Recommendation</p>
                  <p className="text-xs text-muted leading-relaxed">
                    {path.recommendation}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Deep Dive Button */}
        <button
          onClick={() => onDeepDive(path)}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg border transition-all cursor-pointer"
          style={{
            borderColor: meta.color + "44",
            color: meta.color,
            backgroundColor: meta.color + "0a",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = meta.color + "18";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = meta.color + "0a";
          }}
        >
          <Search className="w-3 h-3" />
          Explore Path in Detail
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Assumptions Panel ─── */
function AssumptionsPanel({
  assumptions,
}: {
  assumptions: import("../lib/simulation/types").AssumptionNote[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-surface border border-border rounded-xl p-4 sm:p-5">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full cursor-pointer"
      >
        <h3 className="font-heading font-semibold text-sm flex items-center gap-2">
          <Info className="w-4 h-4 text-muted" />
          Assumptions & Limitations
        </h3>
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted" />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2">
              {assumptions.map((a, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-background border border-border/50"
                >
                  <p className="text-xs font-medium mb-0.5">{a.label}</p>
                  <p className="text-xs text-muted">{a.detail}</p>
                </div>
              ))}
              <p className="text-xs text-muted mt-2 italic">
                These simulations are illustrative projections based on templates
                and heuristics — not financial or life advice. Use them as a
                thinking tool, not a guarantee.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main Page ─── */
export default function SimulatorPage() {
  const { runSimulation, saveCurrent, clearResult, user } = useApp();
  const [result, setResult] =
    useState<import("../lib/simulation/types").SimulationResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [detailPath, setDetailPath] =
    useState<import("../lib/simulation/types").ScenarioPath | null>(null);

  const handleRun = (input: DecisionInput) => {
    const simResult = runSimulation(input);
    setResult(simResult);
    setSaved(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async () => {
    setSaving(true);
    const success = await saveCurrent();
    setSaving(false);
    if (success) setSaved(true);
  };

  const handleReset = () => {
    setResult(null);
    clearResult();
    setSaved(false);
  };

  const bestPath = result?.bestFitPath ?? null;

  return (
    <div className="min-h-screen pt-20 pb-12 sm:pt-24 sm:pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 sm:mb-10"
        >
          <h1 className="font-heading text-2xl sm:text-3xl font-bold mb-2">
            {result ? "Your Simulation Results" : "Decision Simulator"}
          </h1>
          <p className="text-sm text-muted">
            {result
              ? "Compare paths and explore trade-offs for your decision."
              : "Describe your decision below and we'll map out your possible futures."}
          </p>
        </motion.div>

        {!result ? (
          /* ─── Input Form ─── */
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-surface border border-border rounded-2xl p-5 sm:p-8">
              <DecisionForm onRun={handleRun} />
            </div>
          </motion.div>
        ) : (
          /* ─── Results ─── */
          <div className="space-y-6 sm:space-y-8">
            {/* Best Fit Banner */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 sm:p-5 rounded-xl border border-path-safe/30 bg-path-safe/5 flex items-start gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-path-safe shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium mb-0.5">Best Fit</p>
                <p className="text-xs sm:text-sm text-muted">
                  {result.bestFitReason}
                </p>
              </div>
            </motion.div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-3">
              {user && (
                <button
                  onClick={handleSave}
                  disabled={saving || saved}
                  className="flex items-center gap-1.5 text-xs sm:text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-surface-raised transition-all cursor-pointer disabled:opacity-40"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saved ? "Saved!" : saving ? "Saving..." : "Save Result"}
                </button>
              )}
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs sm:text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-surface-raised transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                New Simulation
              </button>
            </div>

            {/* Scenario Cards */}
            <div className={`grid grid-cols-1 gap-4 sm:gap-5 ${
              result.paths.length === 2 ? "lg:grid-cols-2" :
              result.paths.length === 4 ? "lg:grid-cols-2 xl:grid-cols-4" :
              "lg:grid-cols-3"
            }`}>
              {result.paths.map((p) => (
                <ScenarioCard
                  key={p.kind}
                  path={p}
                  isBest={p.kind === bestPath}
                  onDeepDive={setDetailPath}
                />
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              <ComparisonRadar result={result} />
              <TimelineChart result={result} />
            </div>

            {/* Assumptions */}
            <AssumptionsPanel assumptions={result.assumptions} />
          </div>
        )}
      </div>

      {/* Path Detail Modal */}
      <PathDetailModal
        path={detailPath}
        open={detailPath !== null}
        onClose={() => setDetailPath(null)}
      />
    </div>
  );
}