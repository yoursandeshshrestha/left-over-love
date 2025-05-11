// src/app/auth/register-vendor/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useAuth } from "@/lib/auth";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface VendorFormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  "address.street": string;
  "address.city": string;
  "address.state": string;
  "address.zipCode": string;
  "address.country": string;
  "vendorDetails.businessName": string;
  "vendorDetails.businessType": string;
  "vendorDetails.registrationNumber": string;
  "vendorDetails.contactPerson": string;
  "vendorDetails.foodTypes": string;
}

export default function RegisterVendorPage() {
  const { register: registerUser, loading } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VendorFormData>({
    defaultValues: {
      name: "Taste of India Restaurant",
      email: "contact@tasteofindia.com",
      password: "password123",
      phone: "9876543210",
      "address.street": "123 Food Street",
      "address.city": "Mumbai",
      "address.state": "Maharashtra",
      "address.zipCode": "400001",
      "address.country": "India",
      "vendorDetails.businessName": "Taste of India",
      "vendorDetails.businessType": "restaurant",
      "vendorDetails.registrationNumber": "FSSAI12345678",
      "vendorDetails.contactPerson": "Raj Sharma",
      "vendorDetails.foodTypes": "Indian, Vegetarian, Non-Vegetarian",
    },
  });

  const onSubmit = async (data: VendorFormData) => {
    setServerError(null);
    try {
      // Format the data for our API
      const formattedData = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: "vendor" as const,
        phone: data.phone,
        address: {
          street: data["address.street"],
          city: data["address.city"],
          state: data["address.state"],
          zipCode: data["address.zipCode"],
          country: data["address.country"] || "India",
          location: {
            type: "Point",
            coordinates: [0, 0] as [number, number],
          },
        },
        vendorDetails: {
          businessName: data["vendorDetails.businessName"],
          businessType: data["vendorDetails.businessType"],
          registrationNumber: data["vendorDetails.registrationNumber"],
          contactPerson: data["vendorDetails.contactPerson"],
          foodTypes: data["vendorDetails.foodTypes"]
            .split(",")
            .map((type) => type.trim())
            .filter(Boolean),
          address: {
            street: data["address.street"],
            city: data["address.city"],
            state: data["address.state"],
            zipCode: data["address.zipCode"],
            country: data["address.country"] || "India",
          },
        },
      };

      await registerUser(formattedData);
    } catch (error: unknown) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again."
      );
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Register as a Food Vendor
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {serverError && (
              <div className="bg-red-50 p-4 rounded-md">
                <p className="text-sm text-red-500">{serverError}</p>
              </div>
            )}

            <div className="text-lg font-medium border-b pb-2 mb-4">
              Basic Information
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Input
                label="Full Name"
                {...register("name", {
                  required: "Name is required",
                })}
                error={errors.name?.message}
              />

              <Input
                label="Email address"
                type="email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: "Invalid email address",
                  },
                })}
                error={errors.email?.message}
              />

              <Input
                label="Password"
                type="password"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                })}
                error={errors.password?.message}
              />

              <Input
                label="Phone Number"
                {...register("phone", {
                  required: "Phone number is required",
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: "Phone number must be 10 digits",
                  },
                })}
                error={errors.phone?.message}
              />
            </div>

            <div className="text-lg font-medium border-b pb-2 mb-4">
              Address
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Input
                label="Street Address"
                {...register("address.street", {
                  required: "Street address is required",
                })}
                error={errors["address.street"]?.message}
              />

              <Input
                label="City"
                {...register("address.city", {
                  required: "City is required",
                })}
                error={errors["address.city"]?.message}
              />

              <Input
                label="State"
                {...register("address.state", {
                  required: "State is required",
                })}
                error={errors["address.state"]?.message}
              />

              <Input
                label="Zip Code"
                {...register("address.zipCode", {
                  required: "Zip code is required",
                })}
                error={errors["address.zipCode"]?.message}
              />

              <Input
                label="Country"
                defaultValue="India"
                {...register("address.country")}
              />
            </div>

            <div className="text-lg font-medium border-b pb-2 mb-4">
              Business Details
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Input
                label="Business Name"
                {...register("vendorDetails.businessName", {
                  required: "Business name is required",
                })}
                error={errors["vendorDetails.businessName"]?.message}
              />

              <Input
                label="Business Type"
                {...register("vendorDetails.businessType", {
                  required: "Business type is required",
                })}
                error={errors["vendorDetails.businessType"]?.message}
                helperText="e.g., restaurant, cafe, bakery"
              />

              <Input
                label="FSSAI Registration Number"
                {...register("vendorDetails.registrationNumber", {
                  required: "Registration number is required",
                })}
                error={errors["vendorDetails.registrationNumber"]?.message}
              />

              <Input
                label="Contact Person"
                {...register("vendorDetails.contactPerson", {
                  required: "Contact person is required",
                })}
                error={errors["vendorDetails.contactPerson"]?.message}
              />

              <div className="sm:col-span-2">
                <Input
                  label="Food Types (comma-separated)"
                  placeholder="e.g., Indian, Vegetarian, Non-Vegetarian"
                  {...register("vendorDetails.foodTypes", {
                    required: "Please specify at least one food type",
                  })}
                  error={errors["vendorDetails.foodTypes"]?.message}
                  helperText="Enter the types of food you serve, separated by commas"
                />
              </div>
            </div>

            <div className="flex items-center mt-6">
              <Button type="submit" loading={loading} className="w-full">
                Register as Vendor
              </Button>
            </div>

            <div className="mt-6 text-center text-sm">
              <Link
                href="/auth/login"
                className="text-emerald-600 hover:text-emerald-500"
              >
                Already have an account? Sign in
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
