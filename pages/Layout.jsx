

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Shield, Briefcase, Users, Search, Bell, Settings, User, LogOut, Award } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User as UserEntity } from "@/api/entities";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;
    // Public pages that don't require an immediate user check in the layout.
    // These pages handle their own auth logic or are fully public.
    const publicPages = ['Home', 'AuthCallback', 'PaymentSuccess', 'PaymentCancel', 'Pricing'];

    const loadUser = async () => {
      try {
        const currentUser = await UserEntity.me();
        if (isMounted) {
          setUser(currentUser);
        }
      } catch (error) {
        console.log("User not authenticated, redirecting to home page.");
        // Only redirect if we're not already on a public page
        if (isMounted && !publicPages.includes(currentPageName)) {
          window.location.href = createPageUrl("Home");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (publicPages.includes(currentPageName)) {
      setLoading(false);
    } else {
      loadUser();
    }

    return () => {
      isMounted = false;
    };
  }, [currentPageName]);

  const handleLogout = async () => {
    await UserEntity.logout();
    window.location.reload();
  };

  // Navigation items based on user role
  const getNavigationItems = () => {
    if (!user) return [];
    
    if (user.role === 'company') {
      return [
        { title: "Dashboard", url: createPageUrl("CompanyDashboard"), icon: Briefcase },
        { title: "Post Job", url: createPageUrl("PostJob"), icon: Briefcase },
        { title: "Find Talent", url: createPageUrl("FindTalent"), icon: Search },
        { title: "Applications", url: createPageUrl("Applications"), icon: Users },
      ];
    } else if (user.role === 'jobseeker') {
      return [
        { title: "Dashboard", url: createPageUrl("JobseekerDashboard"), icon: User },
        { title: "Browse Jobs", url: createPageUrl("BrowseJobs"), icon: Search },
        { title: "My Applications", url: createPageUrl("MyApplications"), icon: Briefcase },
        { title: "Profile", url: createPageUrl("Profile"), icon: Settings },
      ];
    } else if (user.role === 'admin') {
      return [
        { title: "Dashboard", url: createPageUrl("AdminDashboard"), icon: Briefcase },
        { title: "Users", url: createPageUrl("AdminDashboard?tab=users"), icon: Users },
        { title: "Jobs", url: createPageUrl("AdminDashboard?tab=jobs"), icon: Briefcase },
        { title: "Skills", url: createPageUrl("AdminDashboard?tab=skills"), icon: Award },
      ];
    }
    return [];
  };

  // Determine if the current page is public for rendering purposes outside useEffect
  const isCurrentPagePublic = ['Home', 'AuthCallback', 'PaymentSuccess', 'PaymentCancel', 'Pricing'].includes(currentPageName);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // If user is not authenticated AND the current page is NOT a public page (e.g., login, register)
  if (!user && !isCurrentPagePublic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
        <style>{`
          :root {
            --primary: 220 52% 14%;
            --primary-foreground: 210 20% 98%;
            --secondary: 158 64% 52%;
            --accent: 158 64% 52%;
            --background: 222 84% 4.9%;
            --foreground: 210 40% 98%;
          }
          .glass-card {
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
        `}</style>
        {children}
      </div>
    );
  }

  // For public pages, show content without sidebar, regardless of user auth status
  if (isCurrentPagePublic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
        <style>{`
          :root {
            --primary: 220 52% 14%;
            --primary-foreground: 210 20% 98%;
            --secondary: 158 64% 52%;
            --accent: 158 64% 52%;
            --background: 222 84% 4.9%;
            --foreground: 210 40% 98%;
          }
          .glass-card {
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
        `}</style>
        {children}
      </div>
    );
  }

  // For authenticated users, show the sidebar layout
  const navigationItems = getNavigationItems();

  return (
    <SidebarProvider>
      <style>{`
        :root {
          --primary: 14 165 233;
          --primary-foreground: 255 255 255;
          --secondary: 15 23 42;
          --secondary-foreground: 248 250 252;
          --accent: 16 185 129;
          --accent-foreground: 255 255 255;
          --background: 248 250 252;
          --foreground: 15 23 42;
          --muted: 241 245 249;
          --muted-foreground: 51 65 85;
          --border: 226 232 240;
        }
      `}</style>
      
      <div className="min-h-screen flex w-full">
        <Sidebar className="border-r border-slate-200 bg-white shadow-lg">
          <SidebarHeader className="border-b border-slate-200/60 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-lg">ProofAndFit</h2>
                <p className="text-xs text-slate-500 font-medium">Skill-Verified Hiring</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-4">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
                {user.role === 'company' ? 'Company Portal' : user.role === 'admin' ? 'Admin Panel' : 'Job Search'}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-200 rounded-xl mb-1 group ${
                          location.pathname === item.url ? 'bg-emerald-50 text-emerald-700 shadow-sm font-semibold' : 'text-slate-600 font-medium hover:text-emerald-700'
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                          <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {user.role === 'jobseeker' && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
                  Status
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <div className="px-4 py-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-700 font-medium">Vetting Status</span>
                      <Badge 
                        variant={user.vetting_status === 'approved' ? 'default' : 'secondary'}
                        className={user.vetting_status === 'approved' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-800'}
                      >
                        {user.vetting_status?.replace('_', ' ') || 'Pending'}
                      </Badge>
                    </div>
                    {user.phone_verified && (
                      <div className="flex items-center gap-2 text-sm text-emerald-700 font-semibold">
                        <Shield className="w-4 h-4" />
                        <span>Phone Verified</span>
                      </div>
                    )}
                  </div>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-200 p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start px-3 py-2 h-auto hover:bg-slate-100">
                  <div className="flex items-center gap-3 w-full">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.profile_image_url} />
                      <AvatarFallback className="bg-emerald-600 text-white text-sm font-semibold">
                        {user.full_name?.[0] || user.email?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-semibold text-slate-900 text-sm truncate">
                        {user.full_name || user.email}
                      </p>
                      <p className="text-xs text-slate-600 truncate capitalize font-medium">
                        {user.role} {user.role === 'company' && user.company_name ? `• ${user.company_name}` : ''}
                      </p>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl("Profile")} className="flex items-center gap-2 text-slate-800">
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-red-600">
                  <LogOut className="w-4 h-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col min-h-screen">
          <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 md:hidden sticky top-0 z-40 shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors" />
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                <h1 className="text-lg font-bold text-slate-900">ProofAndFit</h1>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto bg-slate-100">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

