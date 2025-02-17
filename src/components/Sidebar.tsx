
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Car,
  Settings,
  Users,
  Wrench,
  Fuel,
  Users2,
  FileText,
  Calendar,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Vehicles", href: "/vehicles", icon: Car },
  { name: "Drivers", href: "/drivers", icon: Users },
  { name: "Maintenance", href: "/maintenance", icon: Wrench },
  { name: "Fuel Logs", href: "/fuel-logs", icon: Fuel },
  { name: "Clients", href: "/clients", icon: Users2 },
  { name: "Quotations", href: "/quotations", icon: FileText },
  { name: "Trips", href: "/trips", icon: Calendar },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();

  return (
    <aside
      className={cn(
        "w-64 border-r bg-white transition-all duration-300",
        !open && "-ml-64"
      )}
    >
      <nav className="flex flex-col gap-1 p-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-secondary/10 text-secondary font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
