export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  category: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  tags: string[];
  brand: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  addedDate: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  address?: Address;
  preferences: UserPreferences;
  memberSince: Date;
  totalOrders: number;
  totalSpent: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface UserPreferences {
  favoriteCategories: string[];
  priceRange: {
    min: number;
    max: number;
  };
  notifications: boolean;
}