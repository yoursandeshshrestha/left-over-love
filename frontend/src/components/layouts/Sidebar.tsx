"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Utensils,
  PieChart,
  ClipboardList,
  MapPin,
  Clock,
  History,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

interface SidebarProps {
  role: "admin" | "vendor" | "ngo";
}

const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user || user.role !== role) {
    return null;
  }

  const isActive = (path: string) => pathname === path;

  const adminLinks = [
    {
      href: "/admin/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      href: "/admin/users",
      label: "Users",
      icon: <Users className="h-5 w-5" />,
    },
    {
      href: "/admin/food-listings",
      label: "Food Listings",
      icon: <Utensils className="h-5 w-5" />,
    },
    {
      href: "/admin/reports",
      label: "Reports",
      icon: <PieChart className="h-5 w-5" />,
    },
  ];

  const vendorLinks = [
    {
      href: "/vendor/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      href: "/vendor/food-listings",
      label: "My Listings",
      icon: <ClipboardList className="h-5 w-5" />,
    },
    {
      href: "/vendor/reports",
      label: "CSR Reports",
      icon: <PieChart className="h-5 w-5" />,
    },
  ];

  const ngoLinks = [
    {
      href: "/ngo/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      href: "/ngo/available-food",
      label: "Available Food",
      icon: <MapPin className="h-5 w-5" />,
    },
    {
      href: "/ngo/pickups",
      label: "My Pickups",
      icon: <Clock className="h-5 w-5" />,
    },
    {
      href: "/ngo/history",
      label: "History",
      icon: <History className="h-5 w-5" />,
    },
  ];

  const links =
    role === "admin" ? adminLinks : role === "vendor" ? vendorLinks : ngoLinks;

  return (
    <div className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 z-10">
      <div className="flex flex-col flex-grow bg-white border-r overflow-y-auto">
        <div className="px-4 py-5 flex items-center border-b">
          <Link href="/" className="text-xl font-bold text-emerald-600">
            LeftoverLove
          </Link>
        </div>
        <div className="flex-grow flex flex-col">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive(link.href)
                    ? "bg-emerald-100 text-emerald-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span
                  className={`mr-3 ${
                    isActive(link.href)
                      ? "text-emerald-500"
                      : "text-gray-500 group-hover:text-gray-500"
                  }`}
                >
                  {link.icon}
                </span>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-500">
                  {user?.name.charAt(0)}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">{user?.name}</p>
              <p className="text-xs font-medium text-gray-500 capitalize">
                {user?.role}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
