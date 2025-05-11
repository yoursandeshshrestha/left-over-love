// src/app/vendor/food-listings/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { foodListingsAPI } from "@/lib/api";
import {
  PlusCircle,
  RefreshCw,
  AlertTriangle,
  Edit,
  Trash,
  Search,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { toast } from "sonner";
import dayjs from "dayjs";

interface FoodListing {
  _id: string;
  title: string;
  description: string;
  quantity: {
    value: number;
    unit: string;
  };
  foodType: string[];
  expiryTime: string;
  status: "available" | "claimed" | "picked_up" | "expired" | "cancelled";
  isUrgent: boolean;
  pickupDetails: {
    address: {
      city: string;
      state: string;
    };
    startTime: string;
    endTime: string;
  };
  claimedBy?: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

const FoodListingsPage = () => {
  const { user } = useAuth();
  const [foodListings, setFoodListings] = useState<FoodListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("-createdAt");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchFoodListings = async () => {
      try {
        setLoading(true);
        const params: Record<string, string | number> = {
          page: currentPage,
          limit: 6,
          sort: sortOption,
        };

        if (statusFilter) params.status = statusFilter;
        if (searchTerm) params.search = searchTerm;

        const response = await foodListingsAPI.getAll(params);

        setFoodListings(response.data);
        setTotalPages(Math.ceil(response.pagination?.total || 0 / 6));

        setError(null);
      } catch (err: unknown) {
        setError("Failed to load food listings");
        toast.error("Failed to load food listings");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchFoodListings();
    }
  }, [user, currentPage, statusFilter, searchTerm, sortOption, refreshTrigger]);

  const handleDeleteListing = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this food listing? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await foodListingsAPI.delete(id);

      // Remove the listing from local state
      setFoodListings(foodListings.filter((listing) => listing._id !== id));

      toast.success("Food listing deleted successfully");
    } catch (err: unknown) {
      toast.error("Failed to delete food listing");
      console.error(err);
    }
  };

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
  };

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

  if (!user) {
    return null;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Food Listings</h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
          <Link href="/vendor/food-listings/create">
            <Button size="sm" icon={<PlusCircle className="h-4 w-4" />}>
              Add Listing
            </Button>
          </Link>
        </div>
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
                  You can create food listings, but they won&apos;t be visible
                  to NGOs until your account is verified.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 p-4">
          <div className="w-full md:w-1/3">
            <Select
              label="Filter by Status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { value: "", label: "All Statuses" },
                { value: "available", label: "Available" },
                { value: "claimed", label: "Claimed" },
                { value: "picked_up", label: "Picked Up" },
                { value: "expired", label: "Expired" },
                { value: "cancelled", label: "Cancelled" },
              ]}
            />
          </div>
          <div className="w-full md:w-1/3">
            <Select
              label="Sort By"
              value={sortOption}
              onChange={(e) => {
                setSortOption(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { value: "-createdAt", label: "Newest First" },
                { value: "createdAt", label: "Oldest First" },
                { value: "expiryTime", label: "Expiry Time (Ascending)" },
                { value: "-expiryTime", label: "Expiry Time (Descending)" },
                { value: "title", label: "Title (A-Z)" },
                { value: "-title", label: "Title (Z-A)" },
              ]}
            />
          </div>
          <div className="w-full md:w-1/3">
            <form onSubmit={handleSearch} className="relative">
              <Input
                label="Search Listings"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title or food type..."
              />
              <button type="submit" className="absolute right-3 top-9 p-1">
                <Search className="h-4 w-4 text-gray-400" />
              </button>
            </form>
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
          <p className="text-gray-500 mb-4">
            No food listings found. Create your first listing to get started!
          </p>
          <Link href="/vendor/food-listings/create">
            <Button>Create Food Listing</Button>
          </Link>
        </div>
      ) : (
        <>
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
                        className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadgeClass(
                          listing.status
                        )}`}
                      >
                        {listing.status.replace("_", " ").toUpperCase()}
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
                      <span className="text-sm text-gray-600">
                        Created:{" "}
                        {dayjs(listing.createdAt).format("MMM D, YYYY")}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span
                        className={`text-sm ${
                          getTimeUntilExpiry(listing.expiryTime) === "Expired"
                            ? "text-red-600 font-medium"
                            : "text-gray-600"
                        }`}
                      >
                        Expires:{" "}
                        {dayjs(listing.expiryTime).format("MMM D, h:mm A")} (
                        {getTimeUntilExpiry(listing.expiryTime)})
                      </span>
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
                    {listing.foodType.slice(0, 3).map((type, index) => (
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

                  {listing.status === "claimed" && listing.claimedBy && (
                    <div className="mb-3 p-2 bg-blue-50 rounded-md">
                      <span className="text-sm text-blue-800">
                        Claimed by: {listing.claimedBy.name}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-gray-50 border-t mt-auto">
                  <div className="flex justify-between">
                    <Link href={`/vendor/food-listings/${listing._id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                    <div className="flex space-x-2">
                      {listing.status === "available" && (
                        <Link
                          href={`/vendor/food-listings/edit/${listing._id}`}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Edit className="h-4 w-4" />}
                          >
                            Edit
                          </Button>
                        </Link>
                      )}
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<Trash className="h-4 w-4" />}
                        onClick={() => handleDeleteListing(listing._id)}
                        disabled={listing.status === "picked_up"}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6">
            <div>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FoodListingsPage;
