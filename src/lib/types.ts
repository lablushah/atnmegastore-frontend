export interface Category {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  products_count?: number;
  children?: Category[];
}

export interface Product {
  id: number;
  category_id: number;
  category: Category;
  name: string;
  name_secondary: string | null;
  author: string | null;
  genre: string | null;
  slug: string;
  description: string | null;
  price: string;
  stock: number;
  image: string | null;
  featured: boolean;
  active: boolean;
  reviews_count?: number;
  reviews_avg_rating?: number | null;
}

export interface CartItem {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  product: Product;
}

export interface OrderItem {
  id: number;
  product_id: number | null;
  product_name: string;
  price: string;
  quantity: number;
  product?: Product;
}

export interface Order {
  id: number;
  user_id: number | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  status: 'awaiting_payment' | 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  payment_method: 'stripe' | 'interac_etransfer' | 'pay_at_store';
  delivery_method: 'pickup' | 'delivery';
  total: string;
  stripe_payment_intent_id: string | null;
  notes: string | null;
  shipping_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string | null;
  shipping_zip: string;
  shipping_country: string;
  items: OrderItem[];
  created_at: string;
}

export type EmployeeRole = 'developer' | 'owner' | 'product_manager' | 'sales' | 'marketing';
export type UserType     = 'employee' | 'customer';

export interface User {
  id: number;
  name: string;
  email: string;
  type: UserType;
  roles: EmployeeRole[];       // array — employees have one or more roles
  role_label: string;
  is_staff?: boolean;
  // employee-specific
  phone?: string;
  job_title?: string;
  is_active?: boolean;
  // customer-specific
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country?: string;
  full_address?: string;
  orders_count?: number;
  reviews_count?: number;
  created_at?: string;
  // first-login flag
  must_change_password?: boolean;
  // 2FA
  two_factor_enabled?: boolean;
  two_factor_method?: 'totp' | 'email' | null;
  two_factor_setup_required?: boolean;
}

export const EMPLOYEE_ROLE_COLORS: Record<EmployeeRole, string> = {
  developer:       'bg-gray-800 text-white',
  owner:           'bg-red-100 text-red-700',
  product_manager: 'bg-purple-100 text-purple-700',
  sales:           'bg-blue-100 text-blue-700',
  marketing:       'bg-green-100 text-green-700',
};

// ── Permission helpers ────────────────────────────────────────────────────────

export function hasRole(user: User | null, ...roles: EmployeeRole[]): boolean {
  if (!user || user.type !== 'employee') return false;
  // Support both new (roles array) and legacy (role string) API formats
  const rawRole = (user as unknown as Record<string, unknown>).role as string | undefined;
  const effectiveRoles: string[] = Array.isArray(user.roles) && user.roles.length > 0
    ? user.roles
    : rawRole === 'admin'
      ? ['owner']           // old 'admin' maps to new 'owner'
      : rawRole ? [rawRole] : [];
  return roles.some(r => effectiveRoles.includes(r));
}

export function isEmployee(user: User | null): boolean {
  return !!user && user.type === 'employee';
}

export function isStaff(user: User | null): boolean {
  return isEmployee(user);
}

export function isDeveloper(user: User | null): boolean {
  return hasRole(user, 'developer');
}

export function isOwner(user: User | null): boolean {
  return hasRole(user, 'owner');
}

export function canAccessSiteTools(user: User | null): boolean {
  return hasRole(user, 'developer', 'owner');
}

export function canManageProducts(user: User | null): boolean {
  return hasRole(user, 'developer', 'owner', 'product_manager');
}

export function canManageOrders(user: User | null): boolean {
  return hasRole(user, 'developer', 'owner', 'sales');
}

export function canManageEmployees(user: User | null): boolean {
  return hasRole(user, 'developer', 'owner');
}

export function canManageCustomers(user: User | null): boolean {
  return hasRole(user, 'developer', 'owner', 'sales');
}

export function canManageCampaigns(user: User | null): boolean {
  return hasRole(user, 'developer', 'owner', 'marketing');
}

export function canManageSocialPosts(user: User | null): boolean {
  return hasRole(user, 'developer', 'owner', 'marketing');
}

// Legacy alias
export function canManageUsers(user: User | null): boolean {
  return canManageEmployees(user);
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
