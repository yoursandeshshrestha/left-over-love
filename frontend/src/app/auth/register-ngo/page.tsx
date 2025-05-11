// src/app/auth/register-ngo/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useAuth } from "@/lib/auth";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface NGOFormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  "address.street": string;
  "address.city": string;
  "address.state": string;
  "address.zipCode": string;
  "address.country": string;
  "ngoDetails.registrationNumber": string;
  "ngoDetails.foundedYear": string;
  "ngoDetails.contactPerson": string;
  "ngoDetails.animalTypes": string;
  "ngoDetails.capacity": string;
}

export default function RegisterNGOPage() {
  const { register: registerUser, loading } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NGOFormData>({
    defaultValues: {
      name: "Paws & Care Animal Shelter",
      email: "contact@pawsandcare.org",
      password: "password123",
      phone: "9876543210",
      "address.street": "456 Animal Care Lane",
      "address.city": "Mumbai",
      "address.state": "Maharashtra",
      "address.zipCode": "400002",
      "address.country": "India",
      "ngoDetails.registrationNumber": "NGO12345678",
      "ngoDetails.foundedYear": "2015",
      "ngoDetails.contactPerson": "Priya Sharma",
      "ngoDetails.animalTypes": "Dogs, Cats, Cows, Birds",
      "ngoDetails.capacity": "500",
    },
  });

  const onSubmit = async (data: NGOFormData) => {
    setServerError(null);
    try {
      // Format the data for our API
      const formattedData = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: "ngo" as const,
        phone: data.phone,
        address: {
          street: data["address.street"],
          city: data["address.city"],
          state: data["address.state"],
          zipCode: data["address.zipCode"],
          country: data["address.country"] || "India",
        },
        ngoDetails: {
          organizationName: data.name,
          registrationNumber: data["ngoDetails.registrationNumber"],
          address: {
            street: data["address.street"],
            city: data["address.city"],
            state: data["address.state"],
            zipCode: data["address.zipCode"],
            country: data["address.country"] || "India",
          },
          location: {
            type: "Point",
            coordinates: [0, 0] as [number, number], // Default coordinates, should be updated later
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
          Register as an NGO
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
                label="NGO Name"
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
              NGO Details
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Input
                label="Registration Number"
                {...register("ngoDetails.registrationNumber", {
                  required: "Registration number is required",
                })}
                error={errors["ngoDetails.registrationNumber"]?.message}
              />

              <Input
                label="Founded Year"
                type="number"
                {...register("ngoDetails.foundedYear", {
                  required: "Founded year is required",
                  valueAsNumber: true,
                  validate: (value) =>
                    (value > 1900 && value <= new Date().getFullYear()) ||
                    "Please enter a valid year",
                })}
                error={errors["ngoDetails.foundedYear"]?.message}
              />

              <Input
                label="Contact Person"
                {...register("ngoDetails.contactPerson", {
                  required: "Contact person is required",
                })}
                error={errors["ngoDetails.contactPerson"]?.message}
              />

              <Input
                label="Collection Capacity (kg)"
                type="number"
                {...register("ngoDetails.capacity", {
                  required: "Capacity is required",
                  valueAsNumber: true,
                  min: {
                    value: 1,
                    message: "Capacity must be greater than 0",
                  },
                })}
                error={errors["ngoDetails.capacity"]?.message}
                helperText="Approximate food amount you can collect at once"
              />

              <div className="sm:col-span-2">
                <Input
                  label="Animal Types (comma-separated)"
                  placeholder="e.g., Dogs, Cats, Cows, Birds"
                  {...register("ngoDetails.animalTypes", {
                    required: "Please specify at least one animal type",
                  })}
                  error={errors["ngoDetails.animalTypes"]?.message}
                  helperText="Enter the types of animals you cater to, separated by commas."
                />
              </div>
            </div>

            <div className="flex items-center mt-6">
              <Button type="submit" loading={loading} className="w-full">
                Register as NGO
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
