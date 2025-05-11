// src/app/ngo/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { ngoAPI, reputationAPI } from "@/lib/api";
import {
  MapPin,
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
import { FoodListing } from "@/lib/types";

interface PerformanceMetrics {
  totalPickupsClaimed: number;
  totalPickupsCompleted: number;
  completionRate: number;
  uniqueVendorsHelped: number;
  totalQuantityCollected: Record<string, number>;
  estimatedCO2Saved: number;
  animalsFed: number;
}

interface MonthlyStat {
  month: string;
  pickups: number;
  quantity: Record<string, number>;
}

interface NGOStats {
  performanceMetrics: PerformanceMetrics;
  monthlyStats: MonthlyStat[];
}

interface Pickup {
  _id: string;
  status: string;
  foodListing: FoodListing;
  estimatedPickupTime: string;
  vendor: {
    name: string;
    vendorDetails?: {
      businessName?: string;
    };
  };
}

interface APIResponse<T> {
  data: T;
}

const NGODashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<NGOStats | null>(null);
  const [activePickups, setActivePickups] = useState<Pickup[]>([]);
  const [availableFood, setAvailableFood] = useState<FoodListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Get reputation data for NGO
        const reputationResponse = await reputationAPI
          .getNGOReport(user?._id || "")
          .catch((err) => {
            throw new Error(`Failed to fetch reputation data: ${err.message}`);
          });

        // Get claimed pickups
        const pickupsResponse = await ngoAPI
          .getClaimedPickups("scheduled,in_progress")
          .catch((err) => {
            throw new Error(`Failed to fetch active pickups: ${err.message}`);
          });

        // Get available food nearby
        const availableResponse = await ngoAPI
          .getAvailableFood()
          .catch((err) => {
            if (
              err.response?.status === 400 &&
              err.response?.data?.error?.includes("location is not set")
            ) {
              setError(
                "Please update your profile with your location to see available food listings."
              );
              setAvailableFood([]);
            } else {
              throw new Error(`Failed to fetch available food: ${err.message}`);
            }
          });

        setStats((reputationResponse as APIResponse<NGOStats>).data);
        setActivePickups((pickupsResponse as APIResponse<Pickup[]>).data);
        if (availableResponse?.data) {
          setAvailableFood(
            (availableResponse as APIResponse<FoodListing[]>).data
          );
        }
        setError(null);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load dashboard data";
        setError(errorMessage);
        toast.error(errorMessage);
        console.error("Dashboard data error:", err);
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
      case "scheduled":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "picked_up":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "missed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">NGO Dashboard</h1>
        <Link href="/ngo/available-food">
          <Button icon={<MapPin className="h-4 w-4 mr-2" />}>
            Find Available Food
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
          title="Total Pickups"
          value={stats?.performanceMetrics?.totalPickupsClaimed || 0}
          icon={<BarChart2 className="h-8 w-8 text-emerald-500" />}
        />
        <StatCard
          title="Completed Pickups"
          value={stats?.performanceMetrics?.totalPickupsCompleted || 0}
          icon={<CheckCircle className="h-8 w-8 text-emerald-500" />}
        />
        <StatCard
          title="Completion Rate"
          value={
            Number(stats?.performanceMetrics?.completionRate?.toFixed(0)) || 0
          }
          unit="%"
          icon={<Clock className="h-8 w-8 text-emerald-500" />}
        />
        <StatCard
          title="Vendors Helped"
          value={stats?.performanceMetrics?.uniqueVendorsHelped || 0}
          icon={<Users className="h-8 w-8 text-emerald-500" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
        <Card title="Impact Overview">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Food Collected:</span>
              <div>
                {stats?.performanceMetrics?.totalQuantityCollected ? (
                  Object.entries(
                    stats.performanceMetrics.totalQuantityCollected
                  ).map(([unit, value]: [string, number]) => (
                    <div key={unit} className="text-right">
                      <span className="font-bold">{value.toFixed(2)}</span>{" "}
                      {unit}
                    </div>
                  ))
                ) : (
                  <span className="font-bold">0 kg</span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">CO₂ Emissions Saved:</span>
              <span className="font-bold">
                {stats?.performanceMetrics?.estimatedCO2Saved
                  ? `${stats.performanceMetrics.estimatedCO2Saved.toFixed(
                      2
                    )} kg`
                  : "0 kg"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Animals Fed:</span>
              <span className="font-bold">
                {stats?.performanceMetrics?.animalsFed || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Reputation Score:</span>
              <span className="font-bold">{user.reputationScore}</span>
            </div>
          </div>
          <div className="mt-6">
            <Link href="/ngo/history">
              <Button variant="outline" className="w-full">
                View History & Impact
              </Button>
            </Link>
          </div>
        </Card>

        <Card title="Monthly Statistics">
          {stats?.monthlyStats && stats.monthlyStats.length > 0 ? (
            <div className="space-y-4">
              {stats.monthlyStats
                .slice(0, 6)
                .map((month: MonthlyStat, index: number) => (
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
        <Card title="Active Pickups">
          {activePickups.length > 0 ? (
            <div className="space-y-4">
              {activePickups.map((pickup) => (
                <div
                  key={pickup._id}
                  className="p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">
                        {pickup.foodListing.title}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadgeClass(
                            pickup.status
                          )}`}
                        >
                          {pickup.status.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        Scheduled:{" "}
                        {dayjs(pickup.estimatedPickupTime).format(
                          "MMM D, h:mm A"
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      From:{" "}
                      {pickup.vendor?.vendorDetails?.businessName ||
                        pickup.vendor?.name}
                    </div>
                    <Link href={`/ngo/pickups/${pickup._id}`}>
                      <Button variant="outline" size="sm">
                        Manage Pickup
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
              <div className="mt-4">
                <Link href="/ngo/pickups">
                  <Button variant="outline" className="w-full">
                    View All Pickups
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500">No active pickups at the moment.</p>
              <div className="mt-4">
                <Link href="/ngo/available-food">
                  <Button className="mx-auto">Find Available Food</Button>
                </Link>
              </div>
            </div>
          )}
        </Card>

        <Card title="Nearby Available Food">
          {error && error.includes("location is not set") ? (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-4">{error}</p>
              <Link href="/ngo/profile">
                <Button className="mx-auto">Update Profile Location</Button>
              </Link>
            </div>
          ) : availableFood.length > 0 ? (
            <div className="space-y-4">
              {availableFood.map((food) => (
                <div
                  key={food._id}
                  className="p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{food.title}</h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {food.foodType
                          .slice(0, 3)
                          .map((type: string, i: number) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-800"
                            >
                              {type}
                            </span>
                          ))}
                        {food.foodType.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{food.foodType.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {food.quantity.value} {food.quantity.unit}
                      </div>
                      <div className="text-sm text-gray-500">
                        Expires:{" "}
                        {dayjs(food.expiryTime).format("MMM D, h:mm A")}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      {food.pickupDetails?.address ? (
                        <>
                          {food.pickupDetails.address.city &&
                            `${food.pickupDetails.address.city}, `}
                          {food.pickupDetails.address.state}
                        </>
                      ) : (
                        "Location not specified"
                      )}
                    </div>
                    <Link href={`/ngo/available-food/${food._id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
              <div className="mt-4">
                <Link href="/ngo/available-food">
                  <Button variant="outline" className="w-full">
                    View All Available Food
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500">
                No available food listings in your area at the moment.
              </p>
              <div className="mt-4">
                <Link href="/ngo/available-food">
                  <Button className="mx-auto">Browse All Areas</Button>
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: number;
  unit?: string;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, unit, icon }) => {
  return (
    <Card className="flex items-center">
      <div className="mr-4">{icon}</div>
      <div>
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="text-2xl font-bold">
          {value}
          {unit}
        </p>
      </div>
    </Card>
  );
};

export default NGODashboard;
