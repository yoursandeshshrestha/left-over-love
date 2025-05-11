export interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "vendor" | "ngo";
  phone?: string;
  address: {
    street?: string;
    city: string;
    state: string;
    zipCode?: string;
    country: string;
    location?: {
      type: string;
      coordinates: [number, number];
    };
  };
  isVerified: boolean;
  reputationScore: number;
  profileImage: string;
  vendorDetails?: {
    businessName: string;
    businessType: string;
    address: Address;
  };
  ngoDetails?: {
    organizationName: string;
    registrationNumber: string;
    address: Address;
    location: {
      type: string;
      coordinates: [number, number];
    };
  };
  createdAt: string;
}

export interface Address {
  street?: string;
  city: string;
  state: string;
  zipCode?: string;
  country?: string;
}

export interface FoodListing {
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
  specialInstructions?: string;
  pickupDetails: {
    address: Address;
    startTime: string;
    endTime: string;
    contactName: string;
    contactPhone: string;
    location?: {
      type: string;
      coordinates: [number, number];
    };
    estimatedPickupTime?: string;
    actualPickupTime?: string;
    transportMethod?: string;
    contactPerson?: string;
    ngoFeedback?: string;
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
  claimedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  status?: string;
}

export interface MapMarker {
  id: string;
  position: [number, number];
  popupContent: string;
  title: string;
  description: string;
  quantity: {
    value: number;
    unit: string;
  };
  expiryTime: string;
  vendor: {
    name: string;
    vendorDetails?: {
      businessName?: string;
    };
  };
  address: {
    street: string;
    city: string;
  };
}

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
}

export interface Stats {
  totalListings: number;
  activeListings: number;
  completedPickups: number;
  totalDonations: number;
  impact: {
    mealsDonated: number;
    wasteReduced: number;
    animalsFed: number;
  };
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: User) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: User) => Promise<void>;
}
