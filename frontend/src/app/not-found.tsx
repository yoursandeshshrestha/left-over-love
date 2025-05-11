"use client";

import React from "react";
import Link from "next/link";
import { Construction } from "lucide-react";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto p-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Construction className="h-16 w-16 text-yellow-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Page Under Development
          </h1>
          <p className="text-gray-600 mb-8">
            We&apos;re working hard to bring you this feature. Please check back
            later!
          </p>
          <Link href="/">
            <Button variant="primary" className="w-full">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
