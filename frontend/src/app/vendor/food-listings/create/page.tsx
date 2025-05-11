// src/app/vendor/food-listings/create/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAuth } from "@/lib/auth";
import { foodListingsAPI } from "@/lib/api";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { toast } from "sonner";
import dayjs from "dayjs";

interface FoodListingFormData {
  title: string;
  description: string;
  "quantity.value": number;
  "quantity.unit": string;
  foodType: string;
  expiryTime: string;
  "pickupDetails.address.street": string;
  "pickupDetails.address.city": string;
  "pickupDetails.address.state": string;
  "pickupDetails.address.zipCode": string;
  "pickupDetails.location.coordinates.0": number; // longitude
  "pickupDetails.location.coordinates.1": number; // latitude
  "pickupDetails.startTime": string;
  "pickupDetails.endTime": string;
  "pickupDetails.contactName": string;
  "pickupDetails.contactPhone": string;
  specialInstructions: string;
  isUrgent: boolean;
}

const CreateFoodListingPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FoodListingFormData>({
    defaultValues: {
      title: "Leftover Wedding Buffet Food",
      description:
        "Fresh vegetarian food from a wedding ceremony. Includes rice, dal, sabzi, and rotis. Packed in clean containers.",
      "quantity.value": 50,
      "quantity.unit": "plates",
      foodType: "Indian, Vegetarian, Cooked",
      expiryTime: dayjs().add(4, "hours").format("YYYY-MM-DDTHH:mm"),
      "pickupDetails.address.street": user?.address.street || "123 Main Street",
      "pickupDetails.address.city": user?.address.city || "Mumbai",
      "pickupDetails.address.state": user?.address.state || "Maharashtra",
      "pickupDetails.address.zipCode": user?.address.zipCode || "400001",
      "pickupDetails.location.coordinates.0": 72.8777, // Mumbai longitude
      "pickupDetails.location.coordinates.1": 19.076, // Mumbai latitude
      "pickupDetails.startTime": dayjs()
        .add(1, "hour")
        .format("YYYY-MM-DDTHH:mm"),
      "pickupDetails.endTime": dayjs()
        .add(3, "hours")
        .format("YYYY-MM-DDTHH:mm"),
      "pickupDetails.contactName": user?.name || "John Doe",
      "pickupDetails.contactPhone": user?.phone || "9876543210",
      specialInstructions:
        "Please call 15 minutes before arrival. Park in the back parking lot.",
      isUrgent: false,
    },
  });

  const onSubmit = async (data: FoodListingFormData) => {
    setServerError(null);
    setLoading(true);

    try {
      // Format the data for the API
      const formattedData = {
        title: data.title,
        description: data.description,
        quantity: {
          value: data["quantity.value"],
          unit: data["quantity.unit"],
        },
        foodType: data.foodType.split(",").map((type) => type.trim()),
        expiryTime: new Date(data.expiryTime).toISOString(),
        pickupDetails: {
          address: {
            street: data["pickupDetails.address.street"],
            city: data["pickupDetails.address.city"],
            state: data["pickupDetails.address.state"],
            zipCode: data["pickupDetails.address.zipCode"],
            country: "India",
          },
          location: {
            type: "Point",
            coordinates: [
              data["pickupDetails.location.coordinates.0"],
              data["pickupDetails.location.coordinates.1"],
            ] as [number, number],
          },
          startTime: new Date(data["pickupDetails.startTime"]).toISOString(),
          endTime: new Date(data["pickupDetails.endTime"]).toISOString(),
          contactName: data["pickupDetails.contactName"],
          contactPhone: data["pickupDetails.contactPhone"],
        },
        specialInstructions: data.specialInstructions,
        isUrgent: data.isUrgent,
      };

      await foodListingsAPI.create(formattedData);

      toast.success("Food listing created successfully!");
      router.push("/vendor/food-listings");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      const errorMessage =
        error.response?.data?.error || "Failed to create food listing";
      setServerError(errorMessage);
      toast.error(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Get minimum date-time for expiry (current time + 1 hour)
  const minExpiryTime = dayjs().add(1, "hour").format("YYYY-MM-DDTHH:mm");

  if (!user) {
    return null;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Create Food Listing</h1>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {serverError && (
            <div className="bg-red-50 p-4 rounded-md">
              <p className="text-sm text-red-500">{serverError}</p>
            </div>
          )}

          <div className="text-lg font-medium border-b pb-2 mb-4">
            Basic Details
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Input
              label="Title"
              placeholder="E.g., Leftover Wedding Buffet Food"
              {...register("title", {
                required: "Title is required",
                maxLength: {
                  value: 100,
                  message: "Title must be less than 100 characters",
                },
              })}
              error={errors.title?.message}
            />

            <div className="sm:col-span-2">
              <Input
                label="Description"
                placeholder="Describe the food, its condition, etc."
                {...register("description", {
                  required: "Description is required",
                  maxLength: {
                    value: 500,
                    message: "Description must be less than 500 characters",
                  },
                })}
                error={errors.description?.message}
              />
            </div>

            <div className="flex space-x-4">
              <div className="w-1/2">
                <Input
                  label="Quantity"
                  type="number"
                  step="0.1"
                  placeholder="E.g., 10"
                  {...register("quantity.value", {
                    required: "Quantity is required",
                    min: {
                      value: 0.1,
                      message: "Quantity must be greater than 0",
                    },
                    valueAsNumber: true,
                  })}
                  error={errors["quantity.value"]?.message}
                />
              </div>
              <div className="w-1/2">
                <Select
                  label="Unit"
                  {...register("quantity.unit", {
                    required: "Unit is required",
                  })}
                  error={errors["quantity.unit"]?.message}
                  options={[
                    { value: "kg", label: "Kilograms (kg)" },
                    { value: "liters", label: "Liters" },
                    { value: "servings", label: "Servings" },
                    { value: "plates", label: "Plates" },
                    { value: "boxes", label: "Boxes" },
                    { value: "items", label: "Items" },
                  ]}
                />
              </div>
            </div>

            <Input
              label="Food Types (comma-separated)"
              placeholder="E.g., Indian, Vegetarian, Cooked"
              {...register("foodType", {
                required: "Please specify at least one food type",
              })}
              error={errors.foodType?.message}
              helperText="Enter the types of food you're offering, separated by commas."
            />

            <Input
              label="Expiry Time"
              type="datetime-local"
              min={minExpiryTime}
              {...register("expiryTime", {
                required: "Expiry time is required",
                validate: (value) =>
                  new Date(value) > new Date() ||
                  "Expiry time must be in the future",
              })}
              error={errors.expiryTime?.message}
              helperText="When will this food no longer be suitable for consumption?"
            />
          </div>

          <div className="text-lg font-medium border-b pb-2 mb-4">
            Pickup Details
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Input
              label="Street Address"
              {...register("pickupDetails.address.street")}
              error={errors["pickupDetails.address.street"]?.message}
            />

            <Input
              label="City"
              {...register("pickupDetails.address.city", {
                required: "City is required",
              })}
              error={errors["pickupDetails.address.city"]?.message}
            />

            <Input
              label="State"
              {...register("pickupDetails.address.state", {
                required: "State is required",
              })}
              error={errors["pickupDetails.address.state"]?.message}
            />

            <Input
              label="Zip Code"
              {...register("pickupDetails.address.zipCode")}
              error={errors["pickupDetails.address.zipCode"]?.message}
            />

            <Input
              label="Longitude"
              type="number"
              step="0.000001"
              helperText="You can get this from Google Maps (right-click on a location)"
              {...register("pickupDetails.location.coordinates.0", {
                required: "Longitude is required",
                valueAsNumber: true,
              })}
              error={errors["pickupDetails.location.coordinates.0"]?.message}
            />

            <Input
              label="Latitude"
              type="number"
              step="0.000001"
              helperText="You can get this from Google Maps (right-click on a location)"
              {...register("pickupDetails.location.coordinates.1", {
                required: "Latitude is required",
                valueAsNumber: true,
              })}
              error={errors["pickupDetails.location.coordinates.1"]?.message}
            />

            <Input
              label="Pickup Start Time"
              type="datetime-local"
              {...register("pickupDetails.startTime", {
                required: "Pickup start time is required",
              })}
              error={errors["pickupDetails.startTime"]?.message}
            />

            <Input
              label="Pickup End Time"
              type="datetime-local"
              {...register("pickupDetails.endTime", {
                required: "Pickup end time is required",
                validate: (value) => {
                  const startTime = watch("pickupDetails.startTime");
                  return !startTime || new Date(value) > new Date(startTime)
                    ? true
                    : "End time must be after start time";
                },
              })}
              error={errors["pickupDetails.endTime"]?.message}
            />

            <Input
              label="Contact Person"
              {...register("pickupDetails.contactName", {
                required: "Contact person is required",
              })}
              error={errors["pickupDetails.contactName"]?.message}
            />

            <Input
              label="Contact Phone"
              {...register("pickupDetails.contactPhone", {
                required: "Contact phone is required",
                pattern: {
                  value: /^[0-9]{10}$/,
                  message: "Please enter a valid 10-digit phone number",
                },
              })}
              error={errors["pickupDetails.contactPhone"]?.message}
            />
          </div>

          <div className="text-lg font-medium border-b pb-2 mb-4">
            Additional Information
          </div>

          <div className="grid grid-cols-1 gap-6">
            <Input
              label="Special Instructions"
              placeholder="Any special instructions for pickup?"
              {...register("specialInstructions")}
              error={errors.specialInstructions?.message}
              helperText="E.g., Park in the back, call upon arrival, etc."
            />

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isUrgent"
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                {...register("isUrgent")}
              />
              <label
                htmlFor="isUrgent"
                className="ml-2 block text-sm text-gray-900"
              >
                Mark as Urgent (NGOs will be notified immediately)
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Create Listing
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateFoodListingPage;
