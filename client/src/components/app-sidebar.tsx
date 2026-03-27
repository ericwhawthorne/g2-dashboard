import { LayoutDashboard } from "lucide-react";
import { PerplexityAttribution } from "./PerplexityAttribution";

export function AppSidebar() {
  return (
    <aside
      className="hidden md:flex flex-col w-[220px] shrink-0 h-full"
      style={{ backgroundColor: "#1D424A" }}
      data-testid="sidebar"
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
        <div className="flex items-center gap-3">
          <G2Logo />
          <div>
            <p className="text-sm font-bold text-white leading-tight">G2 Advisors</p>
            <p className="text-[10px] font-medium tracking-wider" style={{ color: "#ADDADF" }}>
              RECRUITING OPS
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <div
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-white"
          style={{ backgroundColor: "rgba(173, 218, 223, 0.15)" }}
          data-testid="nav-dashboard"
        >
          <LayoutDashboard className="h-4 w-4" style={{ color: "#ADDADF" }} />
          <span>Dashboard</span>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-5 py-3 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
        <PerplexityAttribution />
      </div>
    </aside>
  );
}

function G2Logo() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="G2 Advisors"
    >
      {/* Outer circle */}
      <rect x="2" y="2" width="36" height="36" rx="8" fill="#ADDADF" />
      {/* G2 text */}
      <text
        x="20"
        y="27"
        textAnchor="middle"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="700"
        fontSize="20"
        fill="#1D424A"
      >
        G2
      </text>
    </svg>
  );
}
