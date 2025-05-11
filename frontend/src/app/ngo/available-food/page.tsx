// src/app/ngo/available-food/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { ngoAPI } from "@/lib/api";
import dynamic from "next/dynamic";
import { MapPin, List } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { toast } from "sonner";
import dayjs from "dayjs";
import { FoodListing } from "@/lib/types";

// Import Map component dynamically to avoid SSR issues
const MapView = dynamic(() => import("@/components/ngo/MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-96 flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
    </div>
  ),
});

const AvailableFoodPage = () => {
  const { user } = useAuth();
  const [foodListings, setFoodListings] = useState<FoodListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [foodType, setFoodType] = useState<string>("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchAvailableFood = async () => {
      try {
        setLoading(true);

        const response = await ngoAPI.getAvailableFood();
        setFoodListings(
          response.data.filter((listing: FoodListing) => {
            if (foodType && !listing.foodType.includes(foodType)) return false;
            return true;
          })
        );
        setError(null);
      } catch (err: unknown) {
        setError("Failed to load available food listings");
        toast.error("Failed to load available food listings");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAvailableFood();
    }
  }, [user, foodType, refreshTrigger]);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const getTimeUntilExpiry = (expiryTime: string) => {
    const now = dayjs();
    const expiry = dayjs(expiryTime);
    const hours = expiry.diff(now, "hour");
    const minutes = expiry.diff(now, "minute") % 60;

    if (hours <= 0 && minutes <= 0) return "Expired";
    if (hours < 1) return `${minutes}m left`;
    if (hours < 24) return `${hours}h ${minutes}m left`;
    return `${expiry.diff(now, "day")}d left`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Available Food</h1>
        <div className="flex space-x-2">
          <Button
            variant={viewMode === "list" ? "primary" : "outline"}
            size="sm"
            icon={<List className="h-4 w-4" />}
            onClick={() => setViewMode("list")}
          >
            List View
          </Button>
          <Button
            variant={viewMode === "map" ? "primary" : "outline"}
            size="sm"
            icon={<MapPin className="h-4 w-4" />}
            onClick={() => setViewMode("map")}
          >
            Map View
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Refresh
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/3">
            <Input
              label="Food Type"
              value={foodType}
              onChange={(e) => setFoodType(e.target.value)}
              placeholder="E.g. Vegetarian, Indian"
              helperText="Filter by food type"
            />
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-500">{error}</p>
        </div>
      ) : foodListings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No available food listings found. Try changing your filter.
          </p>
        </div>
      ) : viewMode === "map" ? (
        <MapView
          markers={foodListings.map((listing) => ({
            id: listing._id,
            position: [
              listing.pickupDetails?.location?.coordinates[1] || 0,
              listing.pickupDetails?.location?.coordinates[0] || 0,
            ],
            title: listing.title,
            description: listing.description,
            quantity: listing.quantity,
            expiryTime: listing.expiryTime,
            vendor: listing.vendor,
            address: {
              street: listing.pickupDetails?.address?.street || "",
              city: listing.pickupDetails?.address?.city || "",
            },
            popupContent: `${listing.title} - ${listing.quantity.value} ${listing.quantity.unit}`,
          }))}
          center={
            user?.address?.location?.coordinates
              ? [
                  user.address.location.coordinates[1],
                  user.address.location.coordinates[0],
                ]
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {foodListings.map((listing) => (
            <Card key={listing._id} className="h-full flex flex-col">
              <div className="p-4 flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-medium text-gray-900 line-clamp-1">
                    {listing.title}
                  </h3>
                  <div className="flex flex-col items-end">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        getTimeUntilExpiry(listing.expiryTime).includes(
                          "Expired"
                        )
                          ? "bg-red-100 text-red-800"
                          : parseInt(getTimeUntilExpiry(listing.expiryTime)) < 3
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {getTimeUntilExpiry(listing.expiryTime)}
                    </span>
                    {listing.isUrgent && (
                      <span className="mt-1 px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800">
                        URGENT
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                  {listing.description}
                </p>

                <div className="mb-3">
                  <div className="flex items-center mb-1">
                    <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="text-sm text-gray-600 line-clamp-1">
                      {listing.pickupDetails?.address ? (
                        <>
                          {listing.pickupDetails.address.street &&
                            `${listing.pickupDetails.address.street}, `}
                          {listing.pickupDetails.address.city}
                        </>
                      ) : (
                        "Location not specified"
                      )}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    From:{" "}
                    {listing.vendor?.vendorDetails?.businessName ||
                      listing.vendor?.name ||
                      "Unknown Vendor"}
                  </div>
                </div>

                <div className="flex justify-between items-center mb-3">
                  <div>
                    <span className="text-sm font-medium">Quantity:</span>
                    <span className="ml-1 text-gray-700">
                      {listing.quantity.value} {listing.quantity.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Pickup:</span>
                    <span className="ml-1 text-gray-700">
                      {listing.pickupDetails?.startTime
                        ? dayjs(listing.pickupDetails.startTime).format(
                            "h:mm A"
                          )
                        : "Not specified"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {listing.foodType
                    .slice(0, 3)
                    .map((type: string, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-800"
                      >
                        {type}
                      </span>
                    ))}
                  {listing.foodType.length > 3 && (
                    <span className="px-2 py-0.5 text-xs text-gray-500">
                      +{listing.foodType.length - 3}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t mt-auto">
                <Link href={`/ngo/available-food/${listing._id}`}>
                  <Button className="w-full">View & Claim</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableFoodPage;
