// src/app/page.tsx
"use client";

import React from "react";
import Link from "next/link";
import { Utensils, Heart, Users, Award } from "lucide-react";
import Button from "@/components/ui/Button";
import { useAuth } from "@/lib/auth";
import Image from "next/image";
import heroImage from "@/public/test.jpeg";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-emerald-500 to-emerald-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:flex lg:items-center lg:justify-between">
            <div className="lg:w-1/2">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                Reducing Food Waste, Feeding Street Animals
              </h1>
              <p className="mt-6 text-xl max-w-3xl">
                LeftoverLove connects food donors with NGOs to ensure surplus
                food helps feed street animals instead of going to waste.
              </p>
              <div className="mt-10 flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                {!user ? (
                  <>
                    <Link href="/auth/register-vendor">
                      <Button size="lg" className="w-full sm:w-auto">
                        Join as a Food Donor
                      </Button>
                    </Link>
                    <Link href="/auth/register-ngo">
                      <Button
                        size="lg"
                        variant="outline"
                        className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-emerald-700"
                      >
                        Register Your NGO
                      </Button>
                    </Link>
                  </>
                ) : (
                  <Link href={`/${user.role}/dashboard`}>
                    <Button size="lg">Go to Dashboard</Button>
                  </Link>
                )}
              </div>
            </div>

            <div className="mt-12 lg:mt-0 lg:w-1/2 flex justify-center">
              <div className="rounded-lg bg-white bg-opacity-10 p-8 backdrop-blur-sm shadow-lg">
                <Image
                  src={heroImage}
                  alt="Food Donation"
                  className="max-w-full h-auto"
                  // Add a placeholder image or import an actual one
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              How LeftoverLove Works
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Our platform creates a simple workflow to connect food donors with
              animal welfare NGOs.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <div className="flex justify-center">
                <Utensils className="h-12 w-12 text-emerald-500" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                1. List Surplus Food
              </h3>
              <p className="mt-2 text-gray-600">
                Restaurants and caterers list their leftover food with details
                on quantity and pickup time.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <div className="flex justify-center">
                <Users className="h-12 w-12 text-emerald-500" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                2. NGOs Get Notified
              </h3>
              <p className="mt-2 text-gray-600">
                Nearby animal welfare NGOs receive alerts about available food
                in their vicinity.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <div className="flex justify-center">
                <Heart className="h-12 w-12 text-emerald-500" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                3. Schedule Pickup
              </h3>
              <p className="mt-2 text-gray-600">
                NGOs claim and schedule pickups, ensuring the food goes to
                street animals in need.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <div className="flex justify-center">
                <Award className="h-12 w-12 text-emerald-500" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                4. Build Reputation
              </h3>
              <p className="mt-2 text-gray-600">
                Earn reputation points and generate CSR reports showcasing your
                contribution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Making a Difference Together
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Our community is growing and making a positive impact every day.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-4xl font-extrabold text-emerald-600">
                200+
              </div>
              <div className="mt-2 text-lg font-medium text-gray-900">
                Food Donors
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-extrabold text-emerald-600">
                50+
              </div>
              <div className="mt-2 text-lg font-medium text-gray-900">
                Animal NGOs
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-extrabold text-emerald-600">
                5,000+
              </div>
              <div className="mt-2 text-lg font-medium text-gray-900">
                Meals Delivered
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-extrabold text-emerald-600">
                10+
              </div>
              <div className="mt-2 text-lg font-medium text-gray-900">
                Cities Covered
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-emerald-700 rounded-lg shadow-xl overflow-hidden">
            <div className="px-6 py-12 sm:px-12 lg:px-16">
              <div className="lg:flex lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                    Ready to Make a Difference?
                  </h2>
                  <p className="mt-4 text-lg text-emerald-100 max-w-3xl">
                    Join our community today and help reduce food waste while
                    feeding street animals.
                  </p>
                </div>
                <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
                  {!user ? (
                    <div className="inline-flex rounded-md shadow">
                      <Link href="/auth/register">
                        <Button size="lg" className="w-full">
                          Get Started
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="inline-flex rounded-md shadow">
                      <Link href={`/${user.role}/dashboard`}>
                        <Button size="lg" className="w-full">
                          Go to Dashboard
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
