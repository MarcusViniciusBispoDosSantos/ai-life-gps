import { Compass } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border/40 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-path-safe" />
            <span className="font-heading text-sm text-muted">
              AI Life GPS
            </span>
          </div>
          <p className="text-xs text-muted">
            Explore your futures. Make better decisions.
          </p>
        </div>
      </div>
    </footer>
  );
}