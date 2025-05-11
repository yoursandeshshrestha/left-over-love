// src/components/layouts/Header.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, User, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import Button from "../ui/Button";

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-emerald-600">
                LeftoverLove
              </span>
            </Link>
          </div>

          {user && (
            <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-8">
              {user.role === "admin" && (
                <>
                  <Link
                    href="/admin/dashboard"
                    className={`px-3 py-2 text-sm font-medium ${
                      isActive("/admin/dashboard")
                        ? "text-emerald-600"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/admin/users"
                    className={`px-3 py-2 text-sm font-medium ${
                      isActive("/admin/users")
                        ? "text-emerald-600"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    Users
                  </Link>
                  <Link
                    href="/admin/food-listings"
                    className={`px-3 py-2 text-sm font-medium ${
                      isActive("/admin/food-listings")
                        ? "text-emerald-600"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    Listings
                  </Link>
                  <Link
                    href="/admin/reports"
                    className={`px-3 py-2 text-sm font-medium ${
                      isActive("/admin/reports")
                        ? "text-emerald-600"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    Reports
                  </Link>
                </>
              )}

              {user.role === "vendor" && (
                <>
                  <Link
                    href="/vendor/dashboard"
                    className={`px-3 py-2 text-sm font-medium ${
                      isActive("/vendor/dashboard")
                        ? "text-emerald-600"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/vendor/food-listings"
                    className={`px-3 py-2 text-sm font-medium ${
                      isActive("/vendor/food-listings")
                        ? "text-emerald-600"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    My Listings
                  </Link>
                  <Link
                    href="/vendor/reports"
                    className={`px-3 py-2 text-sm font-medium ${
                      isActive("/vendor/reports")
                        ? "text-emerald-600"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    CSR Reports
                  </Link>
                </>
              )}

              {user.role === "ngo" && (
                <>
                  <Link
                    href="/ngo/dashboard"
                    className={`px-3 py-2 text-sm font-medium ${
                      isActive("/ngo/dashboard")
                        ? "text-emerald-600"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/ngo/available-food"
                    className={`px-3 py-2 text-sm font-medium ${
                      isActive("/ngo/available-food")
                        ? "text-emerald-600"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    Available Food
                  </Link>
                  <Link
                    href="/ngo/pickups"
                    className={`px-3 py-2 text-sm font-medium ${
                      isActive("/ngo/pickups")
                        ? "text-emerald-600"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    My Pickups
                  </Link>
                  <Link
                    href="/ngo/history"
                    className={`px-3 py-2 text-sm font-medium ${
                      isActive("/ngo/history")
                        ? "text-emerald-600"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    History
                  </Link>
                </>
              )}
            </div>
          )}

          <div className="flex items-center">
            {user ? (
              <div className="flex items-center">
                <button className="p-2 text-gray-500 hover:text-emerald-600">
                  <Bell className="h-5 w-5" />
                </button>
                <Link
                  href="/profile"
                  className="ml-3 p-2 text-gray-500 hover:text-emerald-600"
                >
                  <User className="h-5 w-5" />
                </Link>
                <button
                  onClick={logout}
                  className="ml-3 p-2 text-gray-500 hover:text-red-600"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/auth/login">
                  <Button variant="outline" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">Register</Button>
                </Link>
              </div>
            )}

            <div className="flex items-center sm:hidden ml-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && user && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {user.role === "admin" && (
              <>
                <Link
                  href="/admin/dashboard"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive("/admin/dashboard")
                      ? "border-emerald-500 text-emerald-700 bg-emerald-50"
                      : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/users"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive("/admin/users")
                      ? "border-emerald-500 text-emerald-700 bg-emerald-50"
                      : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Users
                </Link>
                <Link
                  href="/admin/food-listings"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive("/admin/food-listings")
                      ? "border-emerald-500 text-emerald-700 bg-emerald-50"
                      : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Listings
                </Link>
                <Link
                  href="/admin/reports"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive("/admin/reports")
                      ? "border-emerald-500 text-emerald-700 bg-emerald-50"
                      : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Reports
                </Link>
              </>
            )}

            {user.role === "vendor" && (
              <>
                <Link
                  href="/vendor/dashboard"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive("/vendor/dashboard")
                      ? "border-emerald-500 text-emerald-700 bg-emerald-50"
                      : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/vendor/food-listings"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive("/vendor/food-listings")
                      ? "border-emerald-500 text-emerald-700 bg-emerald-50"
                      : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Listings
                </Link>
                <Link
                  href="/vendor/reports"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive("/vendor/reports")
                      ? "border-emerald-500 text-emerald-700 bg-emerald-50"
                      : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  CSR Reports
                </Link>
              </>
            )}

            {user.role === "ngo" && (
              <>
                <Link
                  href="/ngo/dashboard"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive("/ngo/dashboard")
                      ? "border-emerald-500 text-emerald-700 bg-emerald-50"
                      : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/ngo/available-food"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive("/ngo/available-food")
                      ? "border-emerald-500 text-emerald-700 bg-emerald-50"
                      : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Available Food
                </Link>
                <Link
                  href="/ngo/pickups"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive("/ngo/pickups")
                      ? "border-emerald-500 text-emerald-700 bg-emerald-50"
                      : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Pickups
                </Link>
                <Link
                  href="/ngo/history"
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive("/ngo/history")
                      ? "border-emerald-500 text-emerald-700 bg-emerald-50"
                      : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  History
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
