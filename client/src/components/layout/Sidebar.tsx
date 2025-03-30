import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  User, 
  FileText, 
  Search, 
  Layers, 
  BarChart, 
  Wrench, 
  BriefcaseBusiness,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

type NavItem = {
  path: string;
  label: string;
  icon: React.ReactNode;
};

export default function Sidebar({ mobileMenuOpen, setMobileMenuOpen }: { 
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const mainNavItems: NavItem[] = [
    { path: "/", label: "Dashboard", icon: <LayoutDashboard className="mr-3 h-5 w-5" /> },
    { path: "/profile", label: "My Profile", icon: <User className="mr-3 h-5 w-5" /> },
    { path: "/resumes", label: "Resumes & CVs", icon: <FileText className="mr-3 h-5 w-5" /> },
    { path: "/jobs", label: "Job Search", icon: <Search className="mr-3 h-5 w-5" /> },
    { path: "/applications", label: "Applications", icon: <Layers className="mr-3 h-5 w-5" /> },
  ];

  const insightsNavItems: NavItem[] = [
    { path: "/analytics", label: "Analytics", icon: <BarChart className="mr-3 h-5 w-5" /> },
    { path: "/skills", label: "Skill Analysis", icon: <Wrench className="mr-3 h-5 w-5" /> },
  ];

  const handleNavigation = (path: string) => {
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 md:relative transition-transform duration-300 ease-in-out ${
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-primary-600 text-white p-2 rounded-lg mr-2">
              <BriefcaseBusiness className="h-5 w-5" />
            </div>
            <span className="text-xl font-semibold text-gray-800">JobAI</span>
          </div>
        </div>
        
        {/* Navigation Links */}
        <nav className="flex-1 px-3 mt-4 space-y-1">
          {mainNavItems.map((item) => (
            <Link 
              key={item.path}
              href={item.path}
              onClick={() => handleNavigation(item.path)}
            >
              <Button
                variant={location === item.path ? "secondary" : "ghost"}
                className={`w-full justify-start ${
                  location === item.path 
                    ? "bg-primary-50 text-primary-700" 
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                size="sm"
              >
                {item.icon}
                {item.label}
              </Button>
            </Link>
          ))}
          
          <div className="pt-4 mt-4 border-t border-gray-200">
            <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Insights
            </h3>
          </div>
          
          {insightsNavItems.map((item) => (
            <Link 
              key={item.path}
              href={item.path}
              onClick={() => handleNavigation(item.path)}
            >
              <Button
                variant={location === item.path ? "secondary" : "ghost"}
                className={`w-full justify-start ${
                  location === item.path 
                    ? "bg-primary-50 text-primary-700" 
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                size="sm"
              >
                {item.icon}
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>
        
        {/* User Section */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.avatar} alt={user?.name || user?.username} />
              <AvatarFallback className="bg-primary-100 text-primary-800">
                {user?.name?.charAt(0) || user?.username?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">{user?.name || user?.username}</p>
              <p className="text-xs text-gray-500">{user?.plan === "premium" ? "Premium Plan" : "Free Plan"}</p>
            </div>
          </div>
          <Separator className="my-3" />
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start text-gray-700"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>
    </aside>
  );
}
