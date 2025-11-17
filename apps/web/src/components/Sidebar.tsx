import { NavLink } from "react-router-dom";
import { LayoutDashboard, Receipt } from "lucide-react";
import { cn } from "@tagmyexpenses/ui";

export function Sidebar() {
  return (
    <aside className="w-64 border-r bg-card">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center border-b px-6">
          <h2 className="text-lg font-bold">TagMyExpenses</h2>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )
            }
          >
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </NavLink>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )
            }
          >
            <Receipt className="h-5 w-5" />
            Transactions
          </NavLink>
        </nav>
      </div>
    </aside>
  );
}

