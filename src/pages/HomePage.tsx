import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Compass,
  Route,
  BarChart3,
  Sparkles,
  Brain,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: Route,
    title: "Multi-Path Simulation",
    desc: "See 3 different futures based on your decision — from safe to ambitious.",
    color: "text-path-safe",
    bg: "bg-path-safe/10",
  },
  {
    icon: BarChart3,
    title: "Side-by-Side Comparison",
    desc: "Compare career, finances, happiness, health, and more across paths.",
    color: "text-path-ambitious",
    bg: "bg-path-ambitious/10",
  },
  {
    icon: Brain,
    title: "Smart Recommendations",
    desc: "Personalized guidance based on what matters most to you.",
    color: "text-path-alt",
    bg: "bg-path-alt/10",
  },
  {
    icon: Shield,
    title: "Assumption Transparency",
    desc: "Every projection shows its confidence level and underlying assumptions.",
    color: "text-dim-finance",
    bg: "bg-dim-finance/10",
  },
];

const steps = [
  {
    num: "1",
    title: "Describe Your Decision",
    desc: "Type your crossroads — career change, move, education, or any life choice.",
  },
  {
    num: "2",
    title: "Set Your Priorities",
    desc: "Choose what matters most: career growth, happiness, financial security, balance?",
  },
  {
    num: "3",
    title: "Explore Your Futures",
    desc: "Compare scenarios across an interactive timeline and dimension dashboard.",
  },
  {
    num: "4",
    title: "Decide with Confidence",
    desc: "Understand trade-offs, risks, and opportunities before you leap.",
  },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* ─── Hero ─── */}
      <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-path-safe/5 blur-[100px]" />
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-path-ambitious/5 blur-[80px]" />
          <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-path-alt/5 blur-[80px]" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-path-safe/10 border border-path-safe/20 text-path-safe text-xs sm:text-sm font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Decision Simulator
            </div>

            <h1 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-4 sm:mb-6">
              Navigate Life's Biggest{" "}
              <span className="text-path-safe">Decisions</span>
            </h1>

            <p className="text-base sm:text-lg text-muted max-w-xl mx-auto mb-8 sm:mb-10 leading-relaxed">
              See multiple versions of your future before you choose. AI Life GPS
              simulates different paths so you can compare outcomes in career,
              finances, happiness, health, and growth.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <button
                onClick={() => navigate("/simulator")}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl bg-path-safe text-background font-semibold text-sm sm:text-base hover:brightness-110 transition-all active:scale-[0.97] cursor-pointer shadow-glow-sm"
              >
                Start Your Simulation
              </button>
              <button
                onClick={() =>
                  document
                    .getElementById("how-it-works")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl border border-border text-sm sm:text-base hover:bg-surface-raised transition-all cursor-pointer"
              >
                How It Works
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="py-16 sm:py-24 border-t border-border/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-2xl sm:text-3xl font-bold text-center mb-10 sm:mb-14"
          >
            See Beyond One Future
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="p-5 sm:p-6 rounded-xl border border-border bg-surface hover:bg-surface-raised transition-all"
                >
                  <div
                    className={`w-10 h-10 rounded-lg ${f.bg} flex items-center justify-center mb-4`}
                  >
                    <Icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <h3 className="font-heading font-semibold text-sm sm:text-base mb-2">
                    {f.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted leading-relaxed">
                    {f.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section
        id="how-it-works"
        className="py-16 sm:py-24 border-t border-border/30"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-2xl sm:text-3xl font-bold text-center mb-10 sm:mb-14"
          >
            How It Works
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative text-center"
              >
                <div className="w-12 h-12 rounded-full bg-path-safe/15 border border-path-safe/20 flex items-center justify-center mx-auto mb-4">
                  <span className="font-heading font-bold text-path-safe text-lg">
                    {s.num}
                  </span>
                </div>
                <h3 className="font-heading font-semibold text-sm sm:text-base mb-2">
                  {s.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted leading-relaxed">
                  {s.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-16 sm:py-24 border-t border-border/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Compass className="w-10 h-10 sm:w-12 sm:h-12 text-path-safe mx-auto mb-4" />
            <h2 className="font-heading text-2xl sm:text-3xl font-bold mb-3">
              Ready to explore your futures?
            </h2>
            <p className="text-muted text-sm sm:text-base mb-8 max-w-md mx-auto">
              No login required. Try it now and see where different choices can
              lead.
            </p>
            <button
              onClick={() => navigate("/simulator")}
              className="px-8 py-3.5 rounded-xl bg-path-safe text-background font-semibold text-sm sm:text-base hover:brightness-110 transition-all active:scale-[0.97] cursor-pointer shadow-glow-sm"
            >
              Start Your Simulation
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}