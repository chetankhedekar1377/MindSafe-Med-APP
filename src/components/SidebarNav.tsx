'use client';

import { usePathname } from 'next/navigation';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  HeartPulse,
  Pill,
  Calendar,
  Sparkles,
  ClipboardList,
} from 'lucide-react';
import Link from 'next/link';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/triage', label: 'Triage', icon: ClipboardList },
  { href: '/symptoms', label: 'Symptoms', icon: HeartPulse },
  { href: '/medications', label: 'Medications', icon: Pill },
  { href: '/appointments', label: 'Appointments', icon: Calendar },
  { href: '/insights', label: 'Insights', icon: Sparkles },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <div className="p-2">
      <SidebarMenu>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <Icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </div>
  );
}
