import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Input } from "@/components/ui/input";
import NotificationsPanel from "@/components/ui/notifications";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/useData";
import { useAuth } from "@/contexts/AuthContext";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b bg-card/60 glass px-4 shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="hidden sm:block w-96">
                <Input placeholder="Search products, categories or orders..." className="bg-background/40" />
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <motion.div whileHover={{ scale: 1.04 }}>
                <NotificationsPanel />
              </motion.div>
                <ThemeToggle />
                <ProfileAvatar />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function ProfileAvatar() {
  const { data: profile } = useProfile();
  const { user } = useAuth();

  const name = profile?.owner_name || user?.user_metadata?.full_name || user?.email || "Shopkeeper";
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <Link to="/profile" className="flex items-center gap-2">
        <Avatar>
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <span className="hidden sm:inline text-sm font-medium">{name}</span>
      </Link>
    </div>
  );
}
