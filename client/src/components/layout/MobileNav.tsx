import { Link, useLocation } from "wouter";
import { LayoutDashboard, FileText, Search, Layers, User } from "lucide-react";

export default function MobileNav() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: <LayoutDashboard className="text-lg" /> },
    { path: "/resumes", label: "Resumes", icon: <FileText className="text-lg" /> },
    { path: "/jobs", label: "Search", icon: <Search className="text-lg" /> },
    { path: "/applications", label: "Applications", icon: <Layers className="text-lg" /> },
    { path: "/profile", label: "Profile", icon: <User className="text-lg" /> },
  ];

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-30">
      <div className="grid grid-cols-5">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <button 
              className={`flex flex-col items-center py-3 text-xs font-medium ${
                location === item.path 
                  ? "text-primary-600" 
                  : "text-gray-500"
              }`}
            >
              {item.icon}
              <span className="mt-1">{item.label}</span>
            </button>
          </Link>
        ))}
      </div>
    </div>
  );
}
