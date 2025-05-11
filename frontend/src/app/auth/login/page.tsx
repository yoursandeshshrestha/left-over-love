"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useAuth } from "@/lib/auth";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      await login(data.email, data.password);
    } catch (error: unknown) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Login failed. Please try again."
      );
    }
  };

  const useDummyVendor = () => {
    setValue("email", "contact@tasteofindia.com");
    setValue("password", "password123");
  };

  const useDummyNGO = () => {
    setValue("email", "contact@pawsandcare.org");
    setValue("password", "password123");
  };

  const useDummyAdmin = () => {
    setValue("email", "admin@leftoverlove.com");
    setValue("password", "admin123");
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <div className="flex gap-4 mb-6">
            <Button
              type="button"
              onClick={useDummyVendor}
              variant="outline"
              className="flex-1"
            >
              Use Vendor Demo
            </Button>
            <Button
              type="button"
              onClick={useDummyNGO}
              variant="outline"
              className="flex-1"
            >
              Use NGO Demo
            </Button>
            <Button
              type="button"
              onClick={useDummyAdmin}
              variant="outline"
              className="flex-1"
            >
              Use Admin Demo
            </Button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {serverError && (
              <div className="bg-red-50 p-4 rounded-md">
                <p className="text-sm text-red-500">{serverError}</p>
              </div>
            )}

            <Input
              label="Email address"
              type="email"
              autoComplete="email"
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
              autoComplete="current-password"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}
              error={errors.password?.message}
            />

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link
                  href="/auth/forgot-password"
                  className="text-emerald-600 hover:text-emerald-500"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full">
              Sign in
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">
                  Don&apos;t have an account?
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <Link
                href="/auth/register"
                className="text-emerald-600 hover:text-emerald-500"
              >
                Register now
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
