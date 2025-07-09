"use client";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useLanguage } from "@/context/LanguageContext";
import { FileText, LayoutDashboard, Settings, Truck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppSidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const menuItems = [
    { href: "/dashboard", label: t.dashboard, icon: LayoutDashboard },
    { href: "/vehicles", label: t.vehicles, icon: Truck },
    { href: "/reports", label: t.reports, icon: FileText },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
          <img src="/logo.svg" alt="Amar Khata Logo" className="h-8 w-8" />
          <h1 className="text-xl font-bold font-headline group-data-[collapsible=icon]:hidden">
            {t.appName}
          </h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={{ children: item.label }}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/settings'} tooltip={{children: t.settings}}>
                    <Link href="/settings">
                        <Settings/>
                        <span>{t.settings}</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
