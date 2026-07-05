export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'Starters' | 'Mains' | 'Desserts' | 'Beverages';
  rating: number;
  isChefRecommendation: boolean;
  isPopular: boolean;
  isTrending: boolean;
  prepTime: number; // in minutes
  calories: number; // kcal
  protein: string;  // e.g. "18g"
  allergens: string[];
  ingredients: string[];
  image: string;    // image URL or path
}

export type TableStatus = 'available' | 'occupied' | 'payment_pending';

export interface Table {
  id: string;
  name: string;
  qrCode: string;
  status: TableStatus;
  currentSessionId: string | null;
}

export type SessionStatus = 'active' | 'payment_pending' | 'completed';

export interface SessionEvent {
  timestamp: string;
  type: string;
  description: string;
  payload?: any;
}

export interface DiningSession {
  id: string;
  tableId: string;
  ownerId: string; // guestId of session owner
  guests: { id: string; name: string }[];
  status: SessionStatus;
  createdAt: string;
  closedAt: string | null;
  orders: string[]; // Order IDs
  timeline: SessionEvent[];
  paymentMethod?: string;
}

export type OrderStatus = 'placed' | 'accepted' | 'preparing' | 'quality_check' | 'ready' | 'delivering' | 'delivered';

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  status: 'placed' | 'preparing' | 'ready' | 'delivered';
}

export interface Order {
  id: string;
  sessionId: string;
  tableId: string;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  runnerId: string | null;
  runnerRoute: string[]; // e.g. ["Kitchen", "Table 3", "Table 7"]
  estimatedCompletion: string; // AI prediction string (e.g. "4m 12s")
  confidenceScore: number;      // AI prediction confidence (e.g. 96)
  kitchenLoad: number;          // AI predicted kitchen load (e.g. 78)
}

export interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  unit: string;
  minStock: number;
  expiryDate: string;
}

export interface Notification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  read: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  userId?: string;
  details: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: 'admin' | 'chef' | 'runner';
}

export interface RestaurantState {
  tables: Table[];
  sessions: DiningSession[];
  orders: Order[];
  menu: MenuItem[];
  inventory: InventoryItem[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  users: User[];
}
