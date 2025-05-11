"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { foodListingsAPI } from "@/lib/api";
import dynamic from "next/dynamic";
import {
  Edit,
  Trash,
  Clock,
  MapPin,
  Calendar,
  User,
  Phone,
  Info,
  AlertTriangle,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { toast } from "sonner";
import dayjs from "dayjs";
import { FoodListing } from "@/lib/types";

// Import Map component dynamically to avoid SSR issues
const SingleMarkerMap = dynamic(
  () => import("@/components/ngo/SingleMarkerMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    ),
  }
);

const FoodListingDetailsPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const [listing, setListing] = useState<FoodListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        const response = await foodListingsAPI.getById(id as string);
        setListing(response.data);
        setError(null);
      } catch (err: unknown) {
        const error = err as { response?: { data?: { error?: string } } };
        setError(
          error.response?.data?.error || "Failed to load food listing details"
        );
        toast.error(
          error.response?.data?.error || "Failed to load food listing details"
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchListing();
    }
  }, [id]);

  const handleDeleteListing = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this food listing? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await foodListingsAPI.delete(id as string);
      toast.success("Food listing deleted successfully");
      router.push("/vendor/food-listings");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(
        error.response?.data?.error || "Failed to delete food listing"
      );
      console.error(err);
    }
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-500">{error || "Listing not found"}</p>
      </div>
    );
  }

  const isExpired = getTimeUntilExpiry(listing.expiryTime) === "Expired";
  const canEdit = listing.status === "available";
  const canDelete = listing.status !== "picked_up";

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Food Listing Details</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
          {canEdit && (
            <Link href={`/vendor/food-listings/edit/${listing._id}`}>
              <Button
                variant="outline"
                icon={<Edit className="h-4 w-4 mr-2" />}
              >
                Edit
              </Button>
            </Link>
          )}
          {canDelete && (
            <Button
              variant="danger"
              icon={<Trash className="h-4 w-4 mr-2" />}
              onClick={handleDeleteListing}
            >
              Delete
            </Button>
          )}
        </div>
      </div>

      {isExpired && listing.status === "available" && (
        <Card className="mb-6 bg-red-50 border-red-200">
          <div className="flex items-start p-4">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                This listing has expired
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  The food in this listing has passed its expiry time and is no
                  longer available for pickup.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold">{listing.title}</h2>
                <div className="flex flex-col items-end">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(
                      listing.status
                    )}`}
                  >
                    {listing.status.replace("_", " ").toUpperCase()}
                  </span>
                  {listing.isUrgent && (
                    <span className="mt-1 px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                      URGENT
                    </span>
                  )}
                </div>
              </div>

              <p className="text-gray-700 mb-6">{listing.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Quantity
                  </h3>
                  <p className="text-lg font-medium">
                    {listing.quantity.value} {listing.quantity.unit}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Food Types
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {listing.foodType.map((type: string, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-800"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Expiry Time
                  </h3>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-400 mr-1" />
                    <span>
                      {dayjs(listing.expiryTime).format("MMM D, YYYY h:mm A")}
                    </span>
                    <span
                      className={`ml-2 text-sm ${
                        isExpired ? "text-red-600 font-medium" : "text-gray-500"
                      }`}
                    >
                      ({getTimeUntilExpiry(listing.expiryTime)})
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Created At
                  </h3>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                    <span>
                      {dayjs(listing.createdAt).format("MMM D, YYYY h:mm A")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Pickup Location
                </h3>
                <div className="flex items-center mb-2">
                  <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                  <span>
                    {listing.pickupDetails?.address ? (
                      <>
                        {listing.pickupDetails.address.street &&
                          `${listing.pickupDetails.address.street}, `}
                        {listing.pickupDetails.address.city &&
                          `${listing.pickupDetails.address.city}, `}
                        {listing.pickupDetails.address.state &&
                          `${listing.pickupDetails.address.state}, `}
                        {listing.pickupDetails.address.zipCode}
                      </>
                    ) : (
                      "Address not specified"
                    )}
                  </span>
                </div>
                <div className="h-64 bg-gray-100 rounded-lg overflow-hidden">
                  {listing.pickupDetails?.location?.coordinates ? (
                    <SingleMarkerMap
                      position={[
                        listing.pickupDetails.location.coordinates[1],
                        listing.pickupDetails.location.coordinates[0],
                      ]}
                      popupContent={listing.title}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      Location not specified
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Pickup Window
                  </h3>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-400 mr-1" />
                    <span>
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
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Contact Person
                  </h3>
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-1" />
                    <span>
                      {listing.pickupDetails?.contactName || "Not specified"}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Contact Phone
                  </h3>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-1" />
                    <span>
                      {listing.pickupDetails?.contactPhone || "Not specified"}
                    </span>
                  </div>
                </div>
              </div>

              {listing.specialInstructions && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Special Instructions
                  </h3>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <p className="text-gray-700">
                        {listing.specialInstructions}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div>
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-medium mb-4">Status Information</h2>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Current Status:</span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(
                      listing.status
                    )}`}
                  >
                    {listing.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Time Until Expiry:</span>
                  <span
                    className={`font-medium ${
                      isExpired
                        ? "text-red-600"
                        : parseInt(getTimeUntilExpiry(listing.expiryTime)) < 3
                        ? "text-yellow-600"
                        : "text-green-600"
                    }`}
                  >
                    {getTimeUntilExpiry(listing.expiryTime)}
                  </span>
                </div>

                {listing.status === "claimed" && listing.claimedBy && (
                  <>
                    <div className="border-t pt-4 mt-4">
                      <h3 className="font-medium mb-2">Claimed By</h3>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <span>{listing.claimedBy.name}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-gray-400 mr-2" />
                          <span>
                            Claimed at:{" "}
                            {dayjs(listing.claimedAt).format(
                              "MMM D, YYYY h:mm A"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Pickup Information */}
                    {listing.pickupDetails && (
                      <div className="mt-4">
                        <h3 className="font-medium mb-2">Pickup Information</h3>
                        <div className="space-y-2">
                          {listing.pickupDetails.estimatedPickupTime && (
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 text-gray-400 mr-2" />
                              <span>
                                Estimated pickup:{" "}
                                {dayjs(
                                  listing.pickupDetails.estimatedPickupTime
                                ).format("MMM D, YYYY h:mm A")}
                              </span>
                            </div>
                          )}
                          {listing.pickupDetails.transportMethod && (
                            <div className="flex items-center">
                              <span className="text-gray-400 mr-2">🚗</span>
                              <span>
                                Transport:{" "}
                                {listing.pickupDetails.transportMethod}
                              </span>
                            </div>
                          )}
                          {listing.pickupDetails.contactPerson && (
                            <div className="flex items-center">
                              <User className="h-4 w-4 text-gray-400 mr-2" />
                              <span>
                                NGO contact:{" "}
                                {listing.pickupDetails.contactPerson}
                              </span>
                            </div>
                          )}
                          {listing.pickupDetails.contactPhone && (
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 text-gray-400 mr-2" />
                              <span>
                                Phone: {listing.pickupDetails.contactPhone}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {listing.status === "picked_up" && (
                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-medium mb-2">Pickup Completed</h3>
                    <div className="space-y-2">
                      {listing.pickupDetails.actualPickupTime && (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-gray-400 mr-2" />
                          <span>
                            Picked up at:{" "}
                            {dayjs(
                              listing.pickupDetails.actualPickupTime
                            ).format("MMM D, YYYY h:mm A")}
                          </span>
                        </div>
                      )}
                      {listing.pickupDetails.ngoFeedback && (
                        <div className="p-3 bg-gray-50 rounded-md mt-2">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">NGO Feedback:</span>{" "}
                            {listing.pickupDetails.ngoFeedback}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {listing.status === "available" && (
                <>
                  <div className="p-3 bg-yellow-50 rounded-md mb-4">
                    <p className="text-sm text-yellow-800">
                      <AlertTriangle className="h-4 w-4 inline-block mr-1" />
                      This listing is still available and waiting to be claimed
                      by an NGO.
                    </p>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between">
                      <Link href={`/vendor/food-listings/edit/${listing._id}`}>
                        <Button
                          variant="outline"
                          icon={<Edit className="h-4 w-4 mr-2" />}
                        >
                          Edit Listing
                        </Button>
                      </Link>

                      <Button
                        variant="danger"
                        icon={<Trash className="h-4 w-4 mr-2" />}
                        onClick={handleDeleteListing}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {listing.status === "expired" && (
                <div className="p-3 bg-red-50 rounded-md mb-4">
                  <p className="text-sm text-red-800">
                    <AlertTriangle className="h-4 w-4 inline-block mr-1" />
                    This listing has expired and is no longer available for
                    pickup.
                  </p>
                </div>
              )}

              {listing.status === "cancelled" && (
                <div className="p-3 bg-gray-50 rounded-md mb-4">
                  <p className="text-sm text-gray-800">
                    <AlertTriangle className="h-4 w-4 inline-block mr-1" />
                    This listing has been cancelled.
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Card className="mt-6">
            <div className="p-6">
              <h2 className="text-lg font-medium mb-4">Quick Actions</h2>

              <div className="space-y-3">
                <Link href="/vendor/food-listings/create">
                  <Button variant="outline" className="w-full">
                    Create New Listing
                  </Button>
                </Link>

                <Link href="/vendor/food-listings">
                  <Button variant="outline" className="w-full">
                    View All Listings
                  </Button>
                </Link>

                <Link href="/vendor/reports">
                  <Button variant="outline" className="w-full">
                    View Impact Report
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FoodListingDetailsPage;
