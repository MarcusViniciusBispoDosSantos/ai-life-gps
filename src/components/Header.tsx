import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../store/AppContext";
import { Compass, LogIn, LogOut, BookOpen } from "lucide-react";

export default function Header() {
  const { user, signIn, signOut } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Compass className="w-6 h-6 sm:w-7 sm:h-7 text-path-safe" />
          <span className="font-heading text-base sm:text-lg font-semibold tracking-tight">
            AI Life GPS
          </span>
        </button>

        {/* Nav + Auth */}
        <div className="flex items-center gap-3 sm:gap-4">
          {location.pathname !== "/simulator" && (
            <button
              onClick={() => navigate("/simulator")}
              className="hidden sm:flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              Simulator
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-sm text-muted truncate max-w-[140px]">
                {user.email}
              </span>
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 text-xs sm:text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-surface-raised transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={signIn}
              className="flex items-center gap-1.5 text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-path-safe/20 text-path-safe border border-path-safe/30 hover:bg-path-safe/30 transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign In (Save)</span>
              <span className="sm:hidden">Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}