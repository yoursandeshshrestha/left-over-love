// src/app/vendor/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { foodListingsAPI, reputationAPI } from "@/lib/api";
import {
  PlusCircle,
  BarChart2,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { toast } from "sonner";
import dayjs from "dayjs";
import { FoodListing, Stats } from "@/lib/types";

interface MonthlyStats {
  month: string;
  pickups: number;
  quantity: Record<string, number>;
}

interface VendorStats extends Stats {
  monthlyStats: MonthlyStats[];
  impactMetrics: {
    totalListingsCreated: number;
    totalListingsClaimed: number;
    totalPickupsCompleted: number;
    uniqueNGOsHelped: number;
    totalQuantitySaved: Record<string, number>;
    estimatedCO2Saved: number;
    animalsFed: number;
  };
}

const VendorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [recentListings, setRecentListings] = useState<FoodListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Get reputation data for vendor
        const reputationResponse = await reputationAPI.getVendorReport(
          user?._id || ""
        );

        // Get recent food listings
        const listingsResponse = await foodListingsAPI.getAll({
          limit: 5,
          sort: "-createdAt",
        });

        setStats(reputationResponse.data.data);
        setRecentListings(listingsResponse.data);
        setError(null);
      } catch (err: unknown) {
        const error = err as { response?: { data?: { error?: string } } };
        setError(
          error.response?.data?.error || "Failed to load dashboard data"
        );
        toast.error(
          error.response?.data?.error || "Failed to load dashboard data"
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800";
      case "claimed":
        return "bg-blue-100 text-blue-800";
      case "picked_up":
        return "bg-purple-100 text-purple-800";
      case "expired":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Vendor Dashboard</h1>
        <Link href="/vendor/food-listings/create">
          <Button icon={<PlusCircle className="h-4 w-4 mr-2" />}>
            Add New Food Listing
          </Button>
        </Link>
      </div>

      {!user.isVerified && (
        <Card className="mb-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Verification Pending
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Your account is currently awaiting verification by an admin.
                  Some features may be limited until your account is verified.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Listings"
          value={stats?.impactMetrics?.totalListingsCreated || 0}
          icon={<BarChart2 className="h-8 w-8 text-emerald-500" />}
        />
        <StatCard
          title="Claimed Listings"
          value={stats?.impactMetrics?.totalListingsClaimed || 0}
          icon={<Clock className="h-8 w-8 text-emerald-500" />}
        />
        <StatCard
          title="Completed Pickups"
          value={stats?.impactMetrics?.totalPickupsCompleted || 0}
          icon={<CheckCircle className="h-8 w-8 text-emerald-500" />}
        />
        <StatCard
          title="NGOs Helped"
          value={stats?.impactMetrics?.uniqueNGOsHelped || 0}
          icon={<Users className="h-8 w-8 text-emerald-500" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
        <Card title="Impact Overview">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Food Saved:</span>
              <div>
                {stats?.impactMetrics?.totalQuantitySaved ? (
                  Object.entries(stats.impactMetrics.totalQuantitySaved).map(
                    ([unit, value]: [string, number]) => (
                      <div key={unit} className="text-right">
                        <span className="font-bold">{value.toFixed(2)}</span>{" "}
                        {unit}
                      </div>
                    )
                  )
                ) : (
                  <span className="font-bold">0 kg</span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">CO₂ Emissions Saved:</span>
              <span className="font-bold">
                {stats?.impactMetrics?.estimatedCO2Saved
                  ? `${stats.impactMetrics.estimatedCO2Saved.toFixed(2)} kg`
                  : "0 kg"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Animals Fed:</span>
              <span className="font-bold">
                {stats?.impactMetrics?.animalsFed || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Reputation Score:</span>
              <span className="font-bold">{user.reputationScore}</span>
            </div>
          </div>
          <div className="mt-6">
            <Link href="/vendor/reports">
              <Button variant="outline" className="w-full">
                View Detailed Impact Report
              </Button>
            </Link>
          </div>
        </Card>

        <Card title="Monthly Statistics">
          {stats?.monthlyStats && stats.monthlyStats.length > 0 ? (
            <div className="space-y-4">
              {stats.monthlyStats
                .slice(0, 6)
                .map((month: MonthlyStats, index: number) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-2 border-b"
                  >
                    <span className="text-gray-600">{month.month}:</span>
                    <div className="text-right">
                      <div className="font-bold">{month.pickups} pickups</div>
                      {month.quantity &&
                        Object.entries(month.quantity).map(
                          ([unit, value]: [string, number]) => (
                            <div key={unit} className="text-sm text-gray-600">
                              {value.toFixed(2)} {unit}
                            </div>
                          )
                        )}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500">
                No monthly statistics available yet.
              </p>
            </div>
          )}
        </Card>
      </div>

      <Card title="Recent Food Listings">
        {recentListings.length > 0 ? (
          <div className="space-y-4">
            {recentListings.map((listing) => (
              <div
                key={listing._id}
                className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50"
              >
                <div>
                  <h3 className="font-medium">{listing.title}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadgeClass(
                        listing.status
                      )}`}
                    >
                      {listing.status.replace("_", " ").toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500">
                      {dayjs(listing.createdAt).format("MMM D, YYYY")}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {listing.quantity.value} {listing.quantity.unit}
                  </div>
                  <div className="text-sm text-gray-500">
                    Expires: {dayjs(listing.expiryTime).format("MMM D, h:mm A")}
                  </div>
                </div>
              </div>
            ))}
            <div className="mt-4">
              <Link href="/vendor/food-listings">
                <Button variant="outline" className="w-full">
                  View All Listings
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500">
              No food listings yet. Create your first listing to get started!
            </p>
            <div className="mt-4">
              <Link href="/vendor/food-listings/create">
                <Button className="mx-auto">Create Food Listing</Button>
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => {
  return (
    <Card className="flex items-center">
      <div className="mr-4">{icon}</div>
      <div>
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </Card>
  );
};

export default VendorDashboard;
