import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Target,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ScenarioPath,
  DIMENSION_ORDER,
  DIMENSION_META,
  DIMENSION_COLORS,
  PATH_META,
} from "../lib/simulation/types";

/* ─── Props ─── */
interface PathDetailModalProps {
  path: import("../lib/simulation/types").ScenarioPath | null;
  open: boolean;
  onClose: () => void;
}

/* ─── Impact Icon ─── */
function ImpactIcon({ impact }: { impact: "positive" | "neutral" | "negative" }) {
  if (impact === "positive")
    return <ArrowUp className="w-3.5 h-3.5 text-success" />;
  if (impact === "negative")
    return <ArrowDown className="w-3.5 h-3.5 text-destructive" />;
  return <Minus className="w-3.5 h-3.5 text-muted" />;
}

/* ─── Score Progression Chart (inline) ─── */
function ScoreProgression({ path }: { path: ScenarioPath }) {
  const chartData = useMemo(() => {
    return path.outcomes.map((o) => {
      const row: Record<string, number | string> = { year: `Y${o.year}` };
      for (const d of DIMENSION_ORDER) {
        row[d] = o.scores[d];
      }
      return row;
    });
  }, [path]);

  return (
    <div className="bg-background border border-border/50 rounded-xl p-4">
      <h4 className="text-xs font-medium font-heading mb-3 flex items-center gap-1.5">
        <BarChart3 className="w-3.5 h-3.5 text-muted" />
        Score Progression Over Time
      </h4>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.5} />
          <XAxis
            dataKey="year"
            tick={{ fill: "var(--color-muted)", fontSize: 10 }}
            interval={Math.max(1, Math.floor(path.outcomes.length / 5))}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "var(--color-muted)", fontSize: 10 }}
            width={25}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-surface-raised)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              fontSize: 11,
              color: "var(--color-foreground)",
            }}
          />
          {DIMENSION_ORDER.map((d) => (
            <Line
              key={d}
              type="monotone"
              dataKey={d}
              stroke={DIMENSION_COLORS[d]}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: DIMENSION_COLORS[d] }}
              name={DIMENSION_META[d].short}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
        {DIMENSION_ORDER.map((d) => (
          <span key={d} className="flex items-center gap-1 text-[10px] text-muted">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: DIMENSION_COLORS[d] }}
            />
            {DIMENSION_META[d].short}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Milestone Timeline ─── */
function MilestoneTimeline({ path }: { path: ScenarioPath }) {
  const milestones = path.outcomes.filter((o) => o.milestone);

  return (
    <div className="bg-background border border-border/50 rounded-xl p-4">
      <h4 className="text-xs font-medium font-heading mb-3 flex items-center gap-1.5">
        <Calendar className="w-3.5 h-3.5 text-muted" />
        Key Milestones
      </h4>

      {milestones.length === 0 ? (
        <p className="text-xs text-muted italic">No milestones predicted for this path.</p>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

          <div className="space-y-3">
            {milestones.map((o, i) => {
              const m = o.milestone!;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-start gap-3"
                >
                  {/* Dot */}
                  <div
                    className={`w-[15px] h-[15px] rounded-full flex items-center justify-center shrink-0 mt-0.5 border-2 ${
                      m.impact === "positive"
                        ? "border-success bg-success/15"
                        : m.impact === "negative"
                        ? "border-destructive bg-destructive/15"
                        : "border-border bg-surface"
                    }`}
                  >
                    <div
                      className={`w-[7px] h-[7px] rounded-full ${
                        m.impact === "positive"
                          ? "bg-success"
                          : m.impact === "negative"
                          ? "bg-destructive"
                          : "bg-muted"
                      }`}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] text-muted font-mono">
                        Year {o.year}
                      </span>
                      <ImpactIcon impact={m.impact} />
                    </div>
                    <p className="text-xs font-medium">{m.title}</p>
                    <p className="text-[11px] text-muted leading-relaxed mt-0.5">
                      {m.detail}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Year-by-Year Score Table ─── */
function ScoreTable({ path }: { path: ScenarioPath }) {
  const [showAll, setShowAll] = useState(false);
  const displayYears = showAll
    ? path.outcomes
    : path.outcomes.slice(0, 5);

  return (
    <div className="bg-background border border-border/50 rounded-xl p-4">
      <h4 className="text-xs font-medium font-heading mb-3 flex items-center gap-1.5">
        <Target className="w-3.5 h-3.5 text-muted" />
        Year-by-Year Scores
      </h4>

      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left font-medium text-muted pb-1.5 pr-3">Year</th>
              {DIMENSION_ORDER.map((d) => (
                <th
                  key={d}
                  className="text-right font-medium text-muted pb-1.5 px-1"
                  style={{ color: DIMENSION_COLORS[d] }}
                >
                  {DIMENSION_META[d].short}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayYears.map((o) => (
              <tr key={o.year} className="border-b border-border/30">
                <td className="py-1.5 pr-3 text-muted font-mono">Y{o.year}</td>
                {DIMENSION_ORDER.map((d) => (
                  <td key={d} className="text-right py-1.5 px-1">
                    {o.scores[d]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {path.outcomes.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-2 text-xs text-muted hover:text-foreground transition-colors cursor-pointer"
        >
          {showAll
            ? "Show fewer years"
            : `Show all ${path.outcomes.length} years`}
        </button>
      )}
    </div>
  );
}

/* ─── Key Insights Panel ─── */
function KeyInsights({ path }: { path: ScenarioPath }) {
  const bestDim = useMemo(() => {
    let best = DIMENSION_ORDER[0];
    for (const d of DIMENSION_ORDER) {
      if (path.finalScores[d] > path.finalScores[best]) best = d;
    }
    return best;
  }, [path]);

  const dimDelta = useMemo(() => {
    const first = path.outcomes[0].scores;
    const last = path.outcomes[path.outcomes.length - 1].scores;
    return DIMENSION_ORDER.map((d) => ({
      dim: d,
      label: DIMENSION_META[d].short,
      start: first[d],
      end: last[d],
      delta: last[d] - first[d],
    })).sort((a, b) => b.delta - a.delta);
  }, [path]);

  const meta = PATH_META[path.kind];

  return (
    <div className="space-y-3">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div
          className="rounded-lg p-3 border"
          style={{ borderColor: meta.color + "22", backgroundColor: meta.color + "0a" }}
        >
          <p className="text-[10px] text-muted font-medium uppercase tracking-wider">Confidence</p>
          <p className="text-lg font-bold" style={{ color: meta.color }}>{path.confidence}%</p>
        </div>
        <div className="rounded-lg p-3 border border-border/50 bg-background">
          <p className="text-[10px] text-muted font-medium uppercase tracking-wider">Best Dimension</p>
          <p className="text-sm font-bold" style={{ color: DIMENSION_COLORS[bestDim] }}>
            {DIMENSION_META[bestDim].label}
          </p>
          <p className="text-xs text-muted">{path.finalScores[bestDim]}/100</p>
        </div>
        <div className="rounded-lg p-3 border border-border/50 bg-background">
          <p className="text-[10px] text-muted font-medium uppercase tracking-wider">Risk Score</p>
          <p className="text-sm font-bold flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
            {path.totalRisk}
          </p>
        </div>
        <div className="rounded-lg p-3 border border-border/50 bg-background">
          <p className="text-[10px] text-muted font-medium uppercase tracking-wider">Reward Score</p>
          <p className="text-sm font-bold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-success" />
            {path.totalReward}
          </p>
        </div>
      </div>

      {/* Biggest Gains / Losses */}
      <div className="bg-background border border-border/50 rounded-xl p-3">
        <h4 className="text-xs font-medium font-heading mb-2">Dimension Changes</h4>
        <div className="space-y-1.5">
          {dimDelta.map((d) => (
            <div key={d.dim} className="flex items-center justify-between text-[11px]">
              <span className="text-muted flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: DIMENSION_COLORS[d.dim] }}
                />
                {d.label}
              </span>
              <span
                className={`font-medium ${
                  d.delta > 5
                    ? "text-success"
                    : d.delta < -5
                    ? "text-destructive"
                    : "text-muted"
                }`}
              >
                {d.delta > 0 ? "+" : ""}
                {d.delta}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Modal ─── */
export default function PathDetailModal({ path, open, onClose }: PathDetailModalProps) {
  if (!path) return null;

  const meta = PATH_META[path.kind];
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "scores">("overview");

  /* Close on Escape */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 sm:inset-x-auto sm:inset-y-6 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-2xl sm:w-full z-50 overflow-hidden rounded-2xl border border-border bg-surface shadow-xl flex flex-col"
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="dialog"
            aria-modal="true"
            aria-label={`${path.name} — Deep Dive`}
          >
            {/* ─── Header ─── */}
            <div
              className="shrink-0 px-5 py-4 flex items-center justify-between border-b"
              style={{ borderColor: meta.color + "22" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: meta.color }}
                />
                <div>
                  <h2 className="font-heading font-semibold text-sm">
                    {path.name}
                  </h2>
                  <p className="text-[11px] text-muted">{path.tagline}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-surface-raised transition-colors cursor-pointer"
                aria-label="Close detail view"
              >
                <X className="w-4 h-4 text-muted" />
              </button>
            </div>

            {/* ─── Tabs ─── */}
            <div className="shrink-0 flex border-b border-border">
              {([
                { id: "overview", label: "Overview", icon: Lightbulb },
                { id: "timeline", label: "Timeline", icon: Calendar },
                { id: "scores", label: "Scores", icon: BarChart3 },
              ] as const).map((tab) => {
                const active = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium border-b-2 transition-all cursor-pointer ${
                      active
                        ? "border-foreground text-foreground"
                        : "border-transparent text-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* ─── Content ─── */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {activeTab === "overview" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {/* Description */}
                  <div className="bg-background border border-border/50 rounded-xl p-4">
                    <p className="text-xs text-foreground leading-relaxed">
                      {path.description}
                    </p>
                  </div>

                  {/* Key Insights */}
                  <KeyInsights path={path} />

                  {/* Risks & Opportunities */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {path.risks.length > 0 && (
                      <div className="bg-red-500/5 border border-destructive/15 rounded-xl p-3">
                        <h4 className="text-xs font-medium font-heading mb-2 flex items-center gap-1.5 text-destructive">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Risks
                        </h4>
                        <ul className="space-y-1.5">
                          {path.risks.map((r, i) => (
                            <li
                              key={i}
                              className="text-[11px] text-muted flex items-start gap-1.5"
                            >
                              <span className="text-destructive mt-0.5 shrink-0">•</span>
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {path.opportunities.length > 0 && (
                      <div className="bg-green-500/5 border border-success/15 rounded-xl p-3">
                        <h4 className="text-xs font-medium font-heading mb-2 flex items-center gap-1.5 text-success">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Opportunities
                        </h4>
                        <ul className="space-y-1.5">
                          {path.opportunities.map((o, i) => (
                            <li
                              key={i}
                              className="text-[11px] text-muted flex items-start gap-1.5"
                            >
                              <span className="text-success mt-0.5 shrink-0">•</span>
                              {o}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Recommendation */}
                  <div
                    className="rounded-xl p-4 border"
                    style={{ borderColor: meta.color + "22", backgroundColor: meta.color + "08" }}
                  >
                    <h4 className="text-xs font-medium font-heading mb-1.5 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" style={{ color: meta.color }} />
                      Recommendation
                    </h4>
                    <p className="text-xs text-foreground leading-relaxed">
                      {path.recommendation}
                    </p>
                  </div>
                </motion.div>
              )}

              {activeTab === "timeline" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <MilestoneTimeline path={path} />
                  <ScoreProgression path={path} />
                </motion.div>
              )}

              {activeTab === "scores" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <ScoreTable path={path} />
                  <ScoreProgression path={path} />
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}