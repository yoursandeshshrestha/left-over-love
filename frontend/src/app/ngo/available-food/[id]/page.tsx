"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAuth } from "@/lib/auth";
import { foodListingsAPI, ngoAPI } from "@/lib/api";
import dynamic from "next/dynamic";
import {
  MapPin,
  Clock,
  User,
  Phone,
  Calendar,
  AlertTriangle,
  Mail,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
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

interface ClaimFormData {
  estimatedPickupTime: string;
  transportMethod: string;
  contactPerson: string;
  contactPhone: string;
}

const FoodDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [listing, setListing] = useState<FoodListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showClaimForm, setShowClaimForm] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ClaimFormData>();

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        const response = await foodListingsAPI.getById(id as string);
        setListing(response.data);
        setError(null);

        // Pre-fill some form fields
        setValue("contactPerson", user?.name || "");
        setValue("contactPhone", user?.phone || "");
      } catch (err: unknown) {
        setError("Failed to load food listing details");
        toast.error("Failed to load food listing details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchListing();
    }
  }, [id, user, setValue]);

  const onSubmit = async (data: ClaimFormData) => {
    setSubmitting(true);

    try {
      await ngoAPI.claimFood(id as string, {
        estimatedPickupTime: data.estimatedPickupTime,
        transportMethod: data.transportMethod,
        contactPerson: data.contactPerson,
        contactPhone: data.contactPhone,
      });

      toast.success("Food listing claimed successfully!");
      router.push("/ngo/pickups");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to claim food listing"
      );
      console.error(err);
    } finally {
      setSubmitting(false);
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
  const isAvailable = listing.status === "available";

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Food Listing Details</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
      </div>

      {!isAvailable && (
        <Card className="mb-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                This listing is no longer available
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  This food listing has already been {listing.status}. Please
                  check other available listings.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {isExpired && (
        <Card className="mb-6 bg-red-50 border-red-200">
          <div className="flex items-start">
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
                    className={`px-2 py-1 text-xs rounded-full ${
                      isExpired
                        ? "bg-red-100 text-red-800"
                        : parseInt(getTimeUntilExpiry(listing.expiryTime)) < 3
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {getTimeUntilExpiry(listing.expiryTime)}
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
                      "Location not specified"
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
                      Location not available
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
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Vendor
                  </h3>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                    <span>
                      {listing.vendor.vendorDetails?.businessName ||
                        listing.vendor.name}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                <span>
                  {listing.pickupDetails.address.street},{" "}
                  {listing.pickupDetails.address.city}
                </span>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Pickup Instructions
                </h3>
                <p className="text-gray-700">
                  Please arrive during the specified pickup window and bring
                  appropriate containers.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-medium mb-4">Claim This Food</h2>

              {!isAvailable ? (
                <div className="text-center py-6">
                  <p className="text-gray-500 mb-4">
                    This food listing has already been {listing.status}. Please
                    check other available listings.
                  </p>
                  <Button onClick={() => router.push("/ngo/available-food")}>
                    Browse Available Food
                  </Button>
                </div>
              ) : isExpired ? (
                <div className="text-center py-6">
                  <p className="text-gray-500 mb-4">
                    This food listing has expired and is no longer available for
                    pickup.
                  </p>
                  <Button onClick={() => router.push("/ngo/available-food")}>
                    Browse Available Food
                  </Button>
                </div>
              ) : !user?.isVerified ? (
                <div className="text-center py-6">
                  <p className="text-gray-500 mb-4">
                    Your NGO account needs to be verified by an admin before you
                    can claim food listings.
                  </p>
                  <p className="text-sm text-gray-400">
                    Please check back later or contact support.
                  </p>
                </div>
              ) : showClaimForm ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <Input
                    type="datetime-local"
                    label="Estimated Pickup Time"
                    min={dayjs().format("YYYY-MM-DDTHH:mm")}
                    max={dayjs(listing.expiryTime).format("YYYY-MM-DDTHH:mm")}
                    {...register("estimatedPickupTime", {
                      required: "Please select an estimated pickup time",
                      validate: (value) =>
                        (new Date(value) >= new Date() &&
                          new Date(value) <= new Date(listing.expiryTime)) ||
                        "Time must be before expiry",
                    })}
                    error={errors.estimatedPickupTime?.message as string}
                  />

                  <Select
                    label="Transport Method"
                    {...register("transportMethod", {
                      required: "Please select a transport method",
                    })}
                    error={errors.transportMethod?.message as string}
                    options={[
                      { value: "Car", label: "Car" },
                      { value: "Van", label: "Van" },
                      { value: "Bike", label: "Bike" },
                      { value: "Scooter", label: "Scooter" },
                      { value: "On Foot", label: "On Foot" },
                      { value: "Public Transport", label: "Public Transport" },
                      { value: "Other", label: "Other" },
                    ]}
                  />

                  <Input
                    label="Contact Person"
                    {...register("contactPerson", {
                      required: "Contact person is required",
                    })}
                    error={errors.contactPerson?.message as string}
                  />

                  <Input
                    label="Contact Phone"
                    {...register("contactPhone", {
                      required: "Contact phone is required",
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: "Please enter a valid 10-digit phone number",
                      },
                    })}
                    error={errors.contactPhone?.message as string}
                  />

                  <div className="flex space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowClaimForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      loading={submitting}
                    >
                      Confirm Claim
                    </Button>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium text-green-600">
                        Available
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Quantity:</span>
                      <span className="font-medium">
                        {listing.quantity.value} {listing.quantity.unit}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Expiry:</span>
                      <span className="font-medium">
                        {getTimeUntilExpiry(listing.expiryTime)}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 mb-6">
                    By claiming this food, you agree to pick it up during the
                    specified time window. The vendor will be notified of your
                    claim.
                  </p>

                  <Button
                    className="w-full"
                    onClick={() => setShowClaimForm(true)}
                  >
                    Claim This Food
                  </Button>
                </div>
              )}
            </div>
          </Card>

          <Card className="mt-6">
            <div className="p-6">
              <h2 className="text-lg font-medium mb-4">Vendor Information</h2>

              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-600 font-medium">
                    {listing.vendor.name.charAt(0)}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="font-medium">
                    {listing.vendor.vendorDetails?.businessName ||
                      listing.vendor.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {listing.pickupDetails.address.city},{" "}
                    {listing.pickupDetails.address.state}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-gray-400 mr-2" />
                  <span>{listing.vendor.phone}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-400 mr-2" />
                  <span>{listing.vendor.email}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FoodDetailsPage;
