// src/app/admin/food-listings/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import dayjs from "dayjs";
import { foodListingsAPI } from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import { toast } from "sonner";

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
    contactName: string;
    contactPhone: string;
  };
  vendor: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    vendorDetails?: {
      businessName: string;
    };
  };
  claimedBy?: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

const FoodListingsPage = () => {
  const [foodListings, setFoodListings] = useState<FoodListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchFoodListings = async () => {
      try {
        setLoading(true);
        const params: Record<string, string | number> = {
          page: currentPage,
          limit: 10,
          sort: "-createdAt", // Newest first
        };

        if (statusFilter) params.status = statusFilter;
        if (searchTerm) params.search = searchTerm;

        const response = await foodListingsAPI.getAll(params);

        setFoodListings(response.data);

        // Calculate total pages based on pagination info
        if (response.pagination) {
          setTotalPages(Math.ceil(response.pagination.total / 10));
        }

        setError(null);
      } catch (err: unknown) {
        setError("Failed to load food listings");
        toast.error("Failed to load food listings");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFoodListings();
  }, [currentPage, statusFilter, searchTerm, refreshTrigger]);

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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Food Listings</h1>
        <Button
          variant="outline"
          size="sm"
          icon={<RefreshCw className="h-4 w-4" />}
          onClick={handleRefresh}
        >
          Refresh
        </Button>
      </div>

      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
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
          <div className="w-full md:w-2/3">
            <form onSubmit={handleSearch}>
              <Input
                label="Search Listings"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, description, or food type..."
                className="pr-10"
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
      ) : (
        <>
          {foodListings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                No food listings found matching your criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {foodListings.map((listing) => (
                <Card key={listing._id} className="overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    {/* Left side: Basic info */}
                    <div className="flex-1 p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {listing.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {dayjs(listing.createdAt).format(
                              "MMM D, YYYY h:mm A"
                            )}
                          </p>
                        </div>
                        <div>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(
                              listing.status
                            )}`}
                          >
                            {listing.status.replace("_", " ").toUpperCase()}
                          </span>
                          {listing.isUrgent && (
                            <span className="ml-2 px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                              URGENT
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="text-gray-600 line-clamp-2">
                          {listing.description}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {listing.foodType.map((type, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"
                          >
                            {type}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Quantity:</p>
                          <p className="font-medium">
                            {listing.quantity.value} {listing.quantity.unit}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Expires at:</p>
                          <p className="font-medium">
                            {dayjs(listing.expiryTime).format(
                              "MMM D, YYYY h:mm A"
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right side: Vendor info & actions */}
                    <div className="flex-1 p-4 bg-gray-50 border-t md:border-t-0 md:border-l">
                      <h4 className="font-medium">Vendor Information</h4>
                      <p className="text-gray-800">
                        {listing.vendor.vendorDetails?.businessName ||
                          listing.vendor.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {listing.vendor.email}
                      </p>
                      <p className="text-sm text-gray-600">
                        {listing.vendor.phone}
                      </p>

                      <div className="mt-4">
                        <p className="text-sm text-gray-500">
                          Pickup Location:
                        </p>
                        <p className="text-gray-800">
                          {listing.pickupDetails?.address ? (
                            <>
                              {listing.pickupDetails.address.city &&
                                `${listing.pickupDetails.address.city}, `}
                              {listing.pickupDetails.address.state}
                            </>
                          ) : (
                            "Location not specified"
                          )}
                        </p>
                      </div>

                      <div className="mt-4">
                        <p className="text-sm text-gray-500">Pickup Window:</p>
                        <p className="text-gray-800">
                          {listing.pickupDetails?.startTime &&
                          listing.pickupDetails?.endTime ? (
                            <>
                              {dayjs(listing.pickupDetails.startTime).format(
                                "h:mm A"
                              )}{" "}
                              -{" "}
                              {dayjs(listing.pickupDetails.endTime).format(
                                "h:mm A"
                              )}
                            </>
                          ) : (
                            "Not specified"
                          )}
                        </p>
                      </div>

                      {listing.status === "claimed" && listing.claimedBy && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-500">Claimed By:</p>
                          <p className="text-gray-800">
                            {listing.claimedBy.name}
                          </p>
                        </div>
                      )}

                      <div className="mt-6 flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() =>
                            (window.location.href = `/admin/food-listings/${listing._id}`)
                          }
                        >
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          className="flex-1"
                          onClick={() => handleDeleteListing(listing._id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination controls */}
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
