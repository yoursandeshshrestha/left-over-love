// src/app/admin/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Users, Utensils, CheckCircle, AlertCircle } from "lucide-react";
import { adminAPI } from "@/lib/api";
import Card from "@/components/ui/Card";
import { toast } from "sonner";

interface DashboardStats {
  userCounts: {
    total: number;
    vendors: number;
    ngos: number;
    admins: number;
    verified: number;
    unverified: number;
  };
  listingCounts: {
    total: number;
    available: number;
    claimed: number;
    pickedUp: number;
    expired: number;
    cancelled: number;
  };
  pickupCounts: {
    total: number;
    scheduled: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    missed: number;
  };
  totalQuantitySaved: Record<string, number>;
  topVendors: Array<{
    _id: {
      _id: string;
      name: string;
      vendorDetails: {
        businessName: string;
      };
      address: {
        city: string;
      };
    };
    count: number;
  }>;
  topNGOs: Array<{
    _id: {
      _id: string;
      name: string;
      address: {
        city: string;
      };
    };
    count: number;
  }>;
}

const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await adminAPI.getReports();
        setStats(response.data.data);
        setError(null);
      } catch (err: unknown) {
        setError("Failed to load dashboard data");
        toast.error("Failed to load dashboard data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

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

  if (!stats) {
    return null;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Users"
          value={stats.userCounts.total}
          icon={<Users className="h-8 w-8 text-emerald-500" />}
        />
        <StatCard
          title="Food Listings"
          value={stats.listingCounts.total}
          icon={<Utensils className="h-8 w-8 text-emerald-500" />}
        />
        <StatCard
          title="Completed Pickups"
          value={stats.pickupCounts.completed}
          icon={<CheckCircle className="h-8 w-8 text-emerald-500" />}
        />
        <StatCard
          title="Pending Verification"
          value={stats.userCounts.unverified}
          icon={<AlertCircle className="h-8 w-8 text-yellow-500" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
        <Card title="User Distribution">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium mb-2">By Role</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Vendors:</span>
                  <span className="font-medium">
                    {stats.userCounts.vendors}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>NGOs:</span>
                  <span className="font-medium">{stats.userCounts.ngos}</span>
                </div>
                <div className="flex justify-between">
                  <span>Admins:</span>
                  <span className="font-medium">{stats.userCounts.admins}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">By Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Verified:</span>
                  <span className="font-medium">
                    {stats.userCounts.verified}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Unverified:</span>
                  <span className="font-medium">
                    {stats.userCounts.unverified}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Food Listings Status">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Available:</span>
                <span className="font-medium">
                  {stats.listingCounts.available}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Claimed:</span>
                <span className="font-medium">
                  {stats.listingCounts.claimed}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Picked Up:</span>
                <span className="font-medium">
                  {stats.listingCounts.pickedUp}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Expired:</span>
                <span className="font-medium">
                  {stats.listingCounts.expired}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Cancelled:</span>
                <span className="font-medium">
                  {stats.listingCounts.cancelled}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
        <Card title="Total Food Saved">
          <div className="space-y-4">
            {Object.entries(stats.totalQuantitySaved).map(([unit, value]) => (
              <div key={unit} className="flex justify-between items-center">
                <span className="text-lg">{unit}:</span>
                <span className="text-xl font-bold">{value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Pickup Status">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Scheduled:</span>
                <span className="font-medium">
                  {stats.pickupCounts.scheduled}
                </span>
              </div>
              <div className="flex justify-between">
                <span>In Progress:</span>
                <span className="font-medium">
                  {stats.pickupCounts.inProgress}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Completed:</span>
                <span className="font-medium">
                  {stats.pickupCounts.completed}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Cancelled:</span>
                <span className="font-medium">
                  {stats.pickupCounts.cancelled}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Missed:</span>
                <span className="font-medium">{stats.pickupCounts.missed}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Top Vendors">
          <div className="space-y-4">
            {stats.topVendors.map((vendor) => (
              <div
                key={vendor._id._id}
                className="flex justify-between items-center p-2 border-b"
              >
                <div>
                  <h3 className="font-medium">
                    {vendor._id.vendorDetails?.businessName || vendor._id.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {vendor._id.address?.city}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-medium">{vendor.count}</span>
                  <p className="text-sm text-gray-500">listings</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Top NGOs">
          <div className="space-y-4">
            {stats.topNGOs.map((ngo) => (
              <div
                key={ngo._id._id}
                className="flex justify-between items-center p-2 border-b"
              >
                <div>
                  <h3 className="font-medium">{ngo._id.name}</h3>
                  <p className="text-sm text-gray-500">
                    {ngo._id.address?.city}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-medium">{ngo.count}</span>
                  <p className="text-sm text-gray-500">pickups</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
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

export default DashboardPage;
