"use client";

import React, { useEffect, useState } from "react";
import { Check, X, RefreshCw } from "lucide-react";
import { adminAPI } from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { toast } from "sonner";
import { User as UserType } from "@/lib/types";

const UsersPage = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [roleFilter, setRoleFilter] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const params: Record<string, string | number> = {
          page: currentPage,
          limit: 10,
        };

        if (roleFilter) params.role = roleFilter;
        if (verifiedFilter) params.verified = verifiedFilter;

        const response = await adminAPI.getUsers(params);

        setUsers(response.data);

        // Calculate total pages based on pagination info
        if (response.pagination) {
          setTotalPages(Math.ceil(response.pagination.total / 10));
        }

        setError(null);
      } catch (err: unknown) {
        setError("Failed to load users");
        toast.error("Failed to load users");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentPage, roleFilter, verifiedFilter, refreshTrigger]);

  const handleVerifyUser = async (userId: string, isVerified: boolean) => {
    try {
      await adminAPI.verifyUser(userId, {
        isVerified,
        verificationNotes: isVerified
          ? "Verified by admin"
          : "Verification rejected by admin",
      });

      // Update local state to reflect the change
      setUsers(
        users.map((user) =>
          user._id === userId ? { ...user, isVerified } : user
        )
      );

      toast.success(
        isVerified ? "User verified successfully" : "User verification rejected"
      );
    } catch (err: unknown) {
      toast.error("Failed to update user verification status");
      console.error(err);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to remove this user? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await adminAPI.removeUser(userId);

      // Remove user from local state
      setUsers(users.filter((user) => user._id !== userId));

      toast.success("User removed successfully");
    } catch (err: unknown) {
      toast.error("Failed to remove user");
      console.error(err);
    }
  };

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
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
              label="Filter by Role"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { value: "", label: "All Roles" },
                { value: "vendor", label: "Vendors" },
                { value: "ngo", label: "NGOs" },
                { value: "admin", label: "Admins" },
              ]}
            />
          </div>
          <div className="w-full md:w-1/3">
            <Select
              label="Filter by Verification"
              value={verifiedFilter}
              onChange={(e) => {
                setVerifiedFilter(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { value: "", label: "All Users" },
                { value: "true", label: "Verified" },
                { value: "false", label: "Unverified" },
              ]}
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
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-200 text-black rounded-full flex items-center justify-center font-semibold text-lg">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">
                        {user.role}
                      </div>
                      {user.role === "vendor" && user.vendorDetails && (
                        <div className="text-sm text-gray-500">
                          {user.vendorDetails.businessName}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.address.city}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.address.state}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.isVerified
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {user.isVerified ? "Verified" : "Unverified"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {!user.isVerified && user.role !== "admin" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mr-2"
                          icon={<Check className="h-4 w-4" />}
                          onClick={() => handleVerifyUser(user._id, true)}
                        >
                          Verify
                        </Button>
                      )}
                      {user.isVerified && user.role !== "admin" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mr-2"
                          icon={<X className="h-4 w-4" />}
                          onClick={() => handleVerifyUser(user._id, false)}
                        >
                          Reject
                        </Button>
                      )}
                      {user.role !== "admin" && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleRemoveUser(user._id)}
                        >
                          Remove
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          <div className="flex justify-between items-center mt-4">
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

export default UsersPage;
