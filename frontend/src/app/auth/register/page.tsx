// src/app/auth/register/page.tsx
"use client";

import React from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function RegisterPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Register for LeftoverLove
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Join our platform to help reduce food waste and feed street animals
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-gray-700 mb-4">
                Please select your account type:
              </p>
            </div>

            <Link href="/auth/register-vendor">
              <Button variant="primary" className="w-full mb-4">
                Register as a Food Vendor
              </Button>
            </Link>

            <Link href="/auth/register-ngo">
              <Button variant="secondary" className="w-full">
                Register as an NGO
              </Button>
            </Link>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">
                    Already have an account?
                  </span>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <Link
                  href="/auth/login"
                  className="text-emerald-600 hover:text-emerald-500"
                >
                  Sign in instead
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
