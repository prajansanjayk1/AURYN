import { MenuItem, Order, InventoryItem, DiningSession } from '../../shared/types';
export type { MenuItem, Order, InventoryItem, DiningSession };

export interface AIResponse {
  message: string;
  recommendations: MenuItem[];
  suggestedAction?: {
    type: 'add_to_cart' | 'request_payment' | 'filter_menu';
    payload: any;
  };
}

export type Vector = number[];

export interface PreprocessedQuery {
  raw: string;
  normalized: string;
  tokens: string[];
  stemmed: string[];
  ngrams: string[];
  synonyms: string[];
}

export interface EntityExtraction {
  quantity: number;
  foodItem?: string;
  size?: 'small' | 'regular' | 'large' | 'combo';
  modifiers: string[];
  negations: string[];
  drinks: string[];
  specialRequests: string[];
}

export interface IntentProbability {
  intent: 'Greeting' | 'Order' | 'Recommendation' | 'Complaint' | 'Question' | 'Reservation' | 'Availability' | 'Pricing' | 'Ingredients' | 'Nutrition' | 'Diet' | 'Farewell' | 'Feedback';
  confidence: number;
}

export interface SessionMemory {
  lastDiscussedItemId?: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; query: string; response: string }>;
  userPreferences: UserPreferences;
  longTermSummary?: string;
}

export interface UserPreferences {
  allergies: string[];
  vegetarian?: boolean;
  vegan?: boolean;
  maxBudget?: number;
  preferredCuisines: string[];
  preferredCategories: string[];
  heatTolerance: 'mild' | 'medium' | 'spicy';
  spendSum: number;
  ordersCount: number;
  rejectedDishes: string[];
}

export interface GraphNode {
  id: string;
  type: 'Food' | 'Ingredient' | 'Category' | 'Cuisine' | 'Allergen' | 'Nutrition' | 'Tag';
  label: string;
  properties?: Record<string, any>;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: 'contains' | 'belongsTo' | 'similarTo' | 'recommendedWith' | 'containsAllergen' | 'hasTag';
  weight?: number;
}

export interface ReasoningResult {
  allowed: boolean;
  deduction: string;
  constraintsEvaluated: string[];
  pathTraced: string[];
}

export interface PlanSubtask {
  id: string;
  description: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: any;
}

export interface PlanOrchestration {
  goal: string;
  subtasks: PlanSubtask[];
}

export interface HybridScore {
  menuItemId: string;
  score: number;
  breakdown: {
    semantic: number;
    preference: number;
    context: number;
    knowledgeGraph: number;
    popularity: number;
    recentOrders: number;
    availability: number;
  };
}

export interface AnalyticsMetrics {
  retrievalLatencyMs: number;
  reasoningLatencyMs: number;
  totalLatencyMs: number;
  cacheHits: number;
  cacheMisses: number;
  intentAccuracy: number;
  recommendationAcceptanceRate: number;
  memoryUsageBytes: number;
}
