"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/lib/auth";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { toast } from "sonner";

interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
  "address.street": string;
  "address.city": string;
  "address.state": string;
  "address.zipCode": string;
}

interface ProfileUpdateData {
  name: string;
  email: string;
  phone: string;
  address: {
    street?: string;
    city: string;
    state: string;
    zipCode?: string;
    country: string;
  };
}

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      "address.street": user?.address?.street || "",
      "address.city": user?.address?.city || "",
      "address.state": user?.address?.state || "",
      "address.zipCode": user?.address?.zipCode || "",
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setServerError(null);
    setLoading(true);

    try {
      // Format the data for the API
      const formattedData: ProfileUpdateData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: {
          street: data["address.street"],
          city: data["address.city"],
          state: data["address.state"],
          zipCode: data["address.zipCode"],
          country: "India",
        },
      };

      await updateProfile(formattedData);
      toast.success("Profile updated successfully!");
    } catch (err: unknown) {
      const error = err as ApiError;
      const errorMessage =
        error.response?.data?.error || "Failed to update profile";
      setServerError(errorMessage);
      toast.error(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Profile</h1>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {serverError && (
            <div className="bg-red-50 p-4 rounded-md">
              <p className="text-sm text-red-500">{serverError}</p>
            </div>
          )}

          <div className="flex items-center mb-6">
            <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
              <span className="text-2xl font-medium text-emerald-600">
                {user.name.charAt(0)}
              </span>
            </div>
            <div className="ml-6">
              <h2 className="text-xl font-semibold">{user.name}</h2>
              <p className="text-gray-600 capitalize">{user.role}</p>
              <p className="text-sm text-gray-500">
                Joined on {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
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
              disabled // Email cannot be changed
              {...register("email")}
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

          <div className="text-lg font-medium border-b pb-2 mb-4">Address</div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Input
              label="Street Address"
              {...register("address.street")}
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
              {...register("address.zipCode")}
              error={errors["address.zipCode"]?.message}
            />
          </div>

          {/* Role-specific information would be displayed here */}
          {user.role === "vendor" && user.vendorDetails && (
            <>
              <div className="text-lg font-medium border-b pb-2 mb-4">
                Business Details
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Business Name
                  </label>
                  <p className="mt-1 text-gray-900">
                    {user.vendorDetails.businessName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Business Type
                  </label>
                  <p className="mt-1 text-gray-900 capitalize">
                    {user.vendorDetails.businessType}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <p className="mt-1 text-gray-900">
                    {user.vendorDetails?.address?.street &&
                      `${user.vendorDetails.address.street}, `}
                    {user.vendorDetails?.address?.city},{" "}
                    {user.vendorDetails?.address?.state}
                    {user.vendorDetails?.address?.zipCode &&
                      ` ${user.vendorDetails.address.zipCode}`}
                  </p>
                </div>
              </div>
            </>
          )}

          {user.role === "ngo" && user.ngoDetails && (
            <>
              <div className="text-lg font-medium border-b pb-2 mb-4">
                NGO Details
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Organization Name
                  </label>
                  <p className="mt-1 text-gray-900">
                    {user.ngoDetails.organizationName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Registration Number
                  </label>
                  <p className="mt-1 text-gray-900">
                    {user.ngoDetails.registrationNumber}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <p className="mt-1 text-gray-900">
                    {user.ngoDetails?.address?.street &&
                      `${user.ngoDetails.address.street}, `}
                    {user.ngoDetails?.address?.city},{" "}
                    {user.ngoDetails?.address?.state}
                    {user.ngoDetails?.address?.zipCode &&
                      ` ${user.ngoDetails.address.zipCode}`}
                  </p>
                </div>
              </div>
            </>
          )}

          <div className="pt-5 border-t border-gray-200">
            <div className="flex justify-end">
              <Button type="submit" disabled={!isDirty} loading={loading}>
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </Card>

      <div className="mt-6">
        <Card title="Account Status">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Verification Status:</span>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  user.isVerified
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {user.isVerified ? "Verified" : "Pending Verification"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Reputation Score:</span>
              <span className="font-medium">{user.reputationScore}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Card title="Security">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Password</h3>
              <p className="mt-1 text-sm text-gray-500">
                For security reasons, you cannot see your current password. You
                can reset it if needed.
              </p>
            </div>
            <div>
              <Button
                variant="outline"
                onClick={() =>
                  toast.info("Password reset functionality will be added soon.")
                }
              >
                Reset Password
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Card title="Danger Zone" className="border-red-100">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700">
                Delete Account
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Once you delete your account, there is no going back. Please be
                certain.
              </p>
            </div>
            <div>
              <Button
                variant="danger"
                onClick={() => {
                  if (
                    window.confirm(
                      "Are you sure you want to delete your account? This action cannot be undone."
                    )
                  ) {
                    toast.info(
                      "Account deletion functionality will be added soon."
                    );
                  }
                }}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
