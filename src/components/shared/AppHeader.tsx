import { SidebarTrigger } from "@/components/ui/sidebar";
import { LanguageToggle } from "./LanguageToggle";
import { ThemeToggle } from "./ThemeToggle";
import { UserNav } from "./UserNav";
import { InstallPWAButton } from "./InstallPWAButton";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
       <SidebarTrigger className="sm:hidden" />
      <div className="relative ml-auto flex-1 md:grow-0">
        {/* Future search bar can go here */}
      </div>
      <div className="flex items-center gap-2">
        <InstallPWAButton />
        <LanguageToggle />
        <ThemeToggle />
        <UserNav />
      </div>
    </header>
  );
}
