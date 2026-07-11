import { supabase } from '@/shared/lib/supabase';
import { 
  MenuItem, Table, DiningSession, Order, InventoryItem, 
  Notification, AuditLog, User, RestaurantState, SessionEvent, OrderStatus
} from '@/shared/types';

const RESTAURANT_ID = 'auryn-hq';
const BRANCH_ID = 'main-branch';

// Default seed sets
const seedMenuItems: MenuItem[] = [
  {
    id: 'm1',
    name: 'Classic Buffalo Wings',
    description: 'Crispy fried wings tossed in our signature tangy hot Buffalo sauce, served with celery sticks and house-made blue cheese dip.',
    price: 480,
    category: 'Starters',
    rating: 4.8,
    isChefRecommendation: false,
    isPopular: true,
    isTrending: false,
    prepTime: 10,
    calories: 450,
    protein: '24g',
    allergens: ['Dairy'],
    ingredients: ['Chicken Wings', 'Buffalo Sauce', 'Blue Cheese', 'Butter'],
    image: '/images/buffalo_wings.jpg'
  },
  {
    id: 'm2',
    name: 'Truffle Parm Fries',
    description: 'Double-cooked hand-cut Idaho potatoes tossed in white truffle oil, fresh rosemary, and grated aged Parmigiano-Reggiano.',
    price: 420,
    category: 'Starters',
    rating: 4.8,
    isChefRecommendation: false,
    isPopular: true,
    isTrending: true,
    prepTime: 7,
    calories: 380,
    protein: '6g',
    allergens: ['Dairy'],
    ingredients: ['Potatoes', 'Truffle Oil', 'Parmigiano-Reggiano', 'Rosemary'],
    image: '/images/truffle_fries.jpg'
  },
  {
    id: 'm3',
    name: 'Mozzarella Staves',
    description: 'Double-breaded premium mozzarella logs infused with Italian herb crumbs, fried golden and served with warm house marinara.',
    price: 390,
    category: 'Starters',
    rating: 4.7,
    isChefRecommendation: false,
    isPopular: false,
    isTrending: false,
    prepTime: 8,
    calories: 420,
    protein: '14g',
    allergens: ['Gluten', 'Dairy'],
    ingredients: ['Mozzarella Cheese', 'Breadcrumbs', 'Herbs', 'Marinara Sauce'],
    image: '/images/mozzarella_staves.jpg'
  },
  {
    id: 'm4',
    name: 'The Monarch Platter',
    description: 'A royal feast of 18 wings with choice of up to three signature sauces, served with double Truffle Fries, crunchy coleslaw, and three dipping sauces.',
    price: 1250,
    category: 'Mains',
    rating: 4.9,
    isChefRecommendation: true,
    isPopular: true,
    isTrending: true,
    prepTime: 18,
    calories: 1400,
    protein: '72g',
    allergens: ['Gluten', 'Dairy'],
    ingredients: ['Chicken Wings', 'Buffalo Sauce', 'Honey Garlic Sauce', 'Mango Habanero Sauce', 'Potatoes', 'Coleslaw'],
    image: '/images/monarch_platter.jpg'
  },
  {
    id: 'm5',
    name: 'Lemon Pepper Wet Wings',
    description: 'Southern-style crispy wings tossed in warm clarified herb butter and loaded with zesty lemon pepper seasoning.',
    price: 780,
    category: 'Mains',
    rating: 4.7,
    isChefRecommendation: false,
    isPopular: false,
    isTrending: false,
    prepTime: 12,
    calories: 520,
    protein: '48g',
    allergens: ['Dairy'],
    ingredients: ['Chicken Wings', 'Butter', 'Lemon Pepper Seasoning'],
    image: '/images/lemon_pepper_wet.jpg'
  },
  {
    id: 'm6',
    name: 'Mango Habanero Wings',
    description: 'Crispy wings coated in a sweet tropical mango glaze infused with fiery habanero peppers, finished with a fresh cilantro garnish.',
    price: 790,
    category: 'Mains',
    rating: 4.9,
    isChefRecommendation: true,
    isPopular: true,
    isTrending: true,
    prepTime: 12,
    calories: 560,
    protein: '48g',
    allergens: [],
    ingredients: ['Chicken Wings', 'Alphonso Mangoes', 'Habanero Peppers', 'Cilantro'],
    image: '/images/mango_habanero.jpg'
  },
  {
    id: 'm7',
    name: 'Nashville Hot Sliders',
    description: 'Two toasted brioche sliders featuring crispy chicken breasts dipped in fiery Nashville cayenne oil, sweet pickles, and vinegar cabbage slaw.',
    price: 680,
    category: 'Mains',
    rating: 4.8,
    isChefRecommendation: false,
    isPopular: true,
    isTrending: false,
    prepTime: 14,
    calories: 680,
    protein: '32g',
    allergens: ['Gluten', 'Dairy'],
    ingredients: ['Chicken Breast', 'Brioche Buns', 'Cayenne Oil', 'Pickles', 'Slaw'],
    image: '/images/nashville_sliders.jpg'
  },
  {
    id: 'm8',
    name: 'Campfire S\'mores Skillet',
    description: 'Rich melted milk chocolate chunks topped with toasted gooey marshmallows, served warm with crisp graham cracker sheets for dipping.',
    price: 380,
    category: 'Desserts',
    rating: 4.9,
    isChefRecommendation: true,
    isPopular: true,
    isTrending: true,
    prepTime: 8,
    calories: 510,
    protein: '6g',
    allergens: ['Gluten', 'Dairy'],
    ingredients: ['Milk Chocolate', 'Marshmallows', 'Graham Crackers'],
    image: '/images/smores_skillet.jpg'
  },
  {
    id: 'm9',
    name: 'Churros with Spiced Chocolate',
    description: 'Crispy house-made churros dusted in warm cinnamon sugar, accompanied by a rich spiced dark chocolate dipping sauce.',
    price: 340,
    category: 'Desserts',
    rating: 4.8,
    isChefRecommendation: false,
    isPopular: false,
    isTrending: false,
    prepTime: 7,
    calories: 390,
    protein: '4g',
    allergens: ['Gluten', 'Dairy'],
    ingredients: ['Flour', 'Cinnamon', 'Sugar', 'Dark Chocolate', 'Spices'],
    image: '/images/churros_chocolate.jpg'
  },
  {
    id: 'm10',
    name: 'Blueberry Basil Lemonade',
    description: 'Cold-pressed wild blueberries, sweet basil leaves, and freshly squeezed lemon juice, served over crushed ice.',
    price: 260,
    category: 'Beverages',
    rating: 4.7,
    isChefRecommendation: false,
    isPopular: false,
    isTrending: true,
    prepTime: 4,
    calories: 140,
    protein: '1g',
    allergens: [],
    ingredients: ['Blueberries', 'Basil', 'Lemon Juice', 'Sugar'],
    image: '/images/blueberry_lemonade.jpg'
  },
  {
    id: 'm11',
    name: 'Spiced Mango Mojito',
    description: 'Sweet Alphonso mango nectar, fresh lime juice, mint leaves, and a dash of cayenne pepper syrup, topped with club soda.',
    price: 290,
    category: 'Beverages',
    rating: 4.8,
    isChefRecommendation: true,
    isPopular: true,
    isTrending: false,
    prepTime: 4,
    calories: 160,
    protein: '1g',
    allergens: [],
    ingredients: ['Alphonso Mangoes', 'Lime Juice', 'Mint Leaves', 'Cayenne Syrup', 'Club Soda'],
    image: '/images/mango_mojito.jpg'
  }
];

const seedTables: Table[] = Array.from({ length: 8 }, (_, i) => ({
  id: `${i + 1}`,
  name: `Table ${i + 1}`,
  qrCode: `df-table-${i + 1}-auth`,
  status: 'available',
  currentSessionId: null
}));

const seedInventory: InventoryItem[] = [
  { id: 'i1', name: 'Chicken Wings', stock: 80, unit: 'kg', minStock: 15, expiryDate: '2026-12-31T00:00:00.000Z' },
  { id: 'i2', name: 'Buffalo Sauce', stock: 12, unit: 'liters', minStock: 3, expiryDate: '2026-12-31T00:00:00.000Z' },
  { id: 'i3', name: 'Truffle Oil', stock: 3, unit: 'liters', minStock: 0.8, expiryDate: '2026-12-31T00:00:00.000Z' },
  { id: 'i4', name: 'Brioche Buns', stock: 50, unit: 'units', minStock: 12, expiryDate: '2026-12-31T00:00:00.000Z' },
  { id: 'i5', name: 'Mozzarella Cheese', stock: 15, unit: 'kg', minStock: 4, expiryDate: '2026-12-31T00:00:00.000Z' },
  { id: 'i6', name: 'Potatoes', stock: 60, unit: 'kg', minStock: 12, expiryDate: '2026-12-31T00:00:00.000Z' },
  { id: 'i7', name: 'Alphonso Mangoes', stock: 20, unit: 'kg', minStock: 5, expiryDate: '2026-12-31T00:00:00.000Z' },
  { id: 'i8', name: 'Dark Chocolate', stock: 10, unit: 'kg', minStock: 2, expiryDate: '2026-12-31T00:00:00.000Z' }
];

const seedUsers: User[] = [
  {
    id: 'u-admin',
    email: 'admin@dineflow.ai',
    name: 'Executive Director',
    passwordHash: 'admin123',
    role: 'admin'
  },
  {
    id: 'u-chef',
    email: 'chef@dineflow.ai',
    name: 'Chef de Cuisine',
    passwordHash: 'chef123',
    role: 'chef'
  },
  {
    id: 'u-runner',
    email: 'runner@dineflow.ai',
    name: 'Service Runner',
    passwordHash: 'runner123',
    role: 'runner'
  }
];

// Helper translators to convert PostgreSQL snake_case to Frontend camelCase
function mapMenuToTypes(m: any): MenuItem {
  return {
    id: m.id,
    name: m.name,
    description: m.description,
    price: Number(m.price),
    category: m.category,
    rating: Number(m.rating),
    isChefRecommendation: m.is_chef_recommendation,
    isPopular: m.is_popular,
    isTrending: m.is_trending,
    prepTime: m.prep_time,
    calories: m.calories,
    protein: m.protein,
    allergens: m.allergens || [],
    ingredients: m.ingredients || [],
    image: m.image
  };
}

function mapTableToTypes(t: any): Table {
  return {
    id: t.id,
    name: t.name,
    qrCode: t.qr_code,
    status: t.status,
    currentSessionId: t.current_session_id
  };
}

function mapSessionToTypes(s: any): DiningSession {
  return {
    id: s.id,
    tableId: s.table_id,
    ownerId: s.owner_id,
    guests: s.guests || [],
    status: s.status,
    createdAt: s.created_at,
    closedAt: s.closed_at,
    orders: s.orders || [],
    timeline: s.timeline || [],
    paymentMethod: s.payment_method
  };
}

function mapOrderToTypes(o: any): Order {
  return {
    id: o.id,
    sessionId: o.session_id,
    tableId: o.table_id,
    items: o.items || [],
    status: o.status,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
    runnerId: o.runner_id,
    runnerRoute: o.runner_route || [],
    estimatedCompletion: o.estimated_completion,
    confidenceScore: Number(o.confidence_score),
    kitchenLoad: Number(o.kitchen_load)
  };
}

export class RestaurantRepository {
  
  private static async ensureSeeded() {
    try {
      const { data: menuData, error } = await supabase.from('menu_items').select('id').limit(1);
      if (error) {
        console.error('[AURYN DB] Fetch error during seed check:', error.message);
        return;
      }
      if (menuData && menuData.length > 0) return; // Database already populated

      console.log('[AURYN DB] Seeding Supabase PostgreSQL database...');

      // Seed menu items
      for (const item of seedMenuItems) {
        await supabase.from('menu_items').insert({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          rating: item.rating,
          is_chef_recommendation: item.isChefRecommendation,
          is_popular: item.isPopular,
          is_trending: item.isTrending,
          prep_time: item.prepTime,
          calories: item.calories,
          protein: item.protein,
          allergens: item.allergens,
          ingredients: item.ingredients,
          image: item.image,
          restaurant_id: RESTAURANT_ID,
          branch_id: BRANCH_ID
        });
      }

      // Seed tables
      for (const table of seedTables) {
        await supabase.from('tables').insert({
          id: table.id,
          name: table.name,
          qr_code: table.qrCode,
          status: table.status,
          current_session_id: table.currentSessionId,
          restaurant_id: RESTAURANT_ID,
          branch_id: BRANCH_ID
        });
      }

      // Seed inventory
      for (const item of seedInventory) {
        await supabase.from('inventory').insert({
          id: item.id,
          name: item.name,
          stock: item.stock,
          unit: item.unit,
          min_stock: item.minStock,
          restaurant_id: RESTAURANT_ID,
          branch_id: BRANCH_ID
        });
      }

      // Seed users
      for (const user of seedUsers) {
        await supabase.from('users').insert({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          password_hash: user.passwordHash,
          restaurant_id: RESTAURANT_ID,
          branch_id: BRANCH_ID
        });
      }

      // Seed settings
      const defaultSettings = {
        id: 'global',
        restaurant_name: 'Kings of Wings',
        logo_url: '',
        primary_color: '#0B0C10',
        accent_color: '#FF5A09',
        typography: 'Outfit',
        welcome_screen: { title: 'Kings of Wings', subtitle: 'The Sovereign of Sizzle & Sauces' },
        splash_screen: { duration: 3000, text: 'Kings of Wings — Bold Flavors, Untamed Heat' },
        background_music: 'rock_blues',
        notification_sounds: true,
        receipt_layout: 'classic_luxury',
        qr_code_style: 'rounded_gold',
        business_hours: '11:00 AM - 11:00 PM',
        taxes: 5,
        gst: 18,
        currency: 'INR',
        language: 'English',
        dining_policies: 'Smart casual dress code. Bold flavors await.',
        payment_options: ['Razorpay', 'Cash'],
        ai_settings: { enableConcierge: true, recommendationIntensity: 'balanced' },
        restaurant_id: RESTAURANT_ID,
        branch_id: BRANCH_ID
      };
      await supabase.from('settings').insert(defaultSettings);

      // Seed welcome notification
      await supabase.from('notifications').insert({
        id: 'n-welcome',
        timestamp: new Date().toISOString(),
        title: 'Operations Active',
        message: 'Kings of Wings Hospitality OS initialized successfully.',
        type: 'success',
        read: false,
        restaurant_id: RESTAURANT_ID,
        branch_id: BRANCH_ID
      });

      // Seed initial audit log
      await supabase.from('audit_logs').insert({
        id: 'log-start',
        timestamp: new Date().toISOString(),
        action: 'system.start',
        details: 'Kings of Wings database seeded with wings menu, staff, and tables.',
        restaurant_id: RESTAURANT_ID,
        branch_id: BRANCH_ID
      });

      console.log('[Kings of Wings DB] Supabase database seeding complete.');
    } catch (err: any) {
      console.error('[Kings of Wings DB] Seeding error:', err.message);
    }
  }

  public static async forceReseed(): Promise<void> {
    console.log('[Kings of Wings DB] Wiping database for reseed...');
    try {
      // 1. Delete dependent tables first to avoid foreign key violations
      await supabase.from('orders').delete().neq('id', 'wipesystem');
      await supabase.from('sessions').delete().neq('id', 'wipesystem');
      await supabase.from('notifications').delete().neq('id', 'wipesystem');
      await supabase.from('audit_logs').delete().neq('id', 'wipesystem');
      
      // 2. Delete parent tables
      await supabase.from('menu_items').delete().neq('id', 'wipesystem');
      await supabase.from('tables').delete().neq('id', 'wipesystem');
      await supabase.from('inventory').delete().neq('id', 'wipesystem');
      await supabase.from('users').delete().neq('id', 'wipesystem');
      await supabase.from('settings').delete().neq('id', 'wipesystem');

      console.log('[Kings of Wings DB] Wiped all tables. Seeding new Kings of Wings data...');
      
      // Seed menu items
      for (const item of seedMenuItems) {
        const id = `menu-${Math.random().toString(36).substr(2, 9)}`;
        await supabase.from('menu_items').insert({
          id,
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          rating: item.rating,
          is_chef_recommendation: item.isChefRecommendation,
          is_popular: item.isPopular,
          is_trending: item.isTrending,
          prep_time: item.prepTime,
          calories: item.calories,
          protein: item.protein,
          allergens: item.allergens,
          ingredients: item.ingredients,
          image: item.image,
          restaurant_id: RESTAURANT_ID,
          branch_id: BRANCH_ID
        });
      }

      // Seed tables
      for (const table of seedTables) {
        await supabase.from('tables').insert({
          id: table.id,
          name: table.name,
          qr_code: table.qrCode,
          status: table.status,
          current_session_id: table.currentSessionId,
          restaurant_id: RESTAURANT_ID,
          branch_id: BRANCH_ID
        });
      }

      // Seed inventory
      for (const item of seedInventory) {
        await supabase.from('inventory').insert({
          id: item.id,
          name: item.name,
          stock: item.stock,
          unit: item.unit,
          min_stock: item.minStock,
          restaurant_id: RESTAURANT_ID,
          branch_id: BRANCH_ID
        });
      }

      // Seed users
      for (const user of seedUsers) {
        await supabase.from('users').insert({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          password_hash: user.passwordHash,
          restaurant_id: RESTAURANT_ID,
          branch_id: BRANCH_ID
        });
      }

      // Seed settings
      const defaultSettings = {
        id: 'global',
        restaurant_name: 'Kings of Wings',
        logo_url: '',
        primary_color: '#0B0C10',
        accent_color: '#FF5A09',
        typography: 'Outfit',
        welcome_screen: { title: 'Kings of Wings', subtitle: 'The Sovereign of Sizzle & Sauces' },
        splash_screen: { duration: 3000, text: 'Kings of Wings — Bold Flavors, Untamed Heat' },
        background_music: 'rock_blues',
        notification_sounds: true,
        receipt_layout: 'classic_luxury',
        qr_code_style: 'rounded_gold',
        business_hours: '11:00 AM - 11:00 PM',
        taxes: 5,
        gst: 18,
        currency: 'INR',
        language: 'English',
        dining_policies: 'Smart casual dress code. Bold flavors await.',
        payment_options: ['Razorpay', 'Cash'],
        ai_settings: { enableConcierge: true, recommendationIntensity: 'balanced' },
        restaurant_id: RESTAURANT_ID,
        branch_id: BRANCH_ID
      };
      await supabase.from('settings').insert(defaultSettings);

      // Seed welcome notification
      await supabase.from('notifications').insert({
        id: 'n-welcome',
        timestamp: new Date().toISOString(),
        title: 'Operations Active',
        message: 'Kings of Wings Hospitality OS initialized successfully.',
        type: 'success',
        read: false,
        restaurant_id: RESTAURANT_ID,
        branch_id: BRANCH_ID
      });

      // Seed initial audit log
      await supabase.from('audit_logs').insert({
        id: 'log-start',
        timestamp: new Date().toISOString(),
        action: 'system.start',
        details: 'Kings of Wings database wiped and re-seeded successfully.',
        restaurant_id: RESTAURANT_ID,
        branch_id: BRANCH_ID
      });

      console.log('[Kings of Wings DB] Database reset and reseed complete.');
    } catch (err: any) {
      console.error('[Kings of Wings DB] Reset error:', err.message);
      throw err;
    }
  }

  public static async getState(): Promise<RestaurantState> {
    await this.ensureSeeded();
    const [tables, sessions, orders, menu, inventory, notifications, auditLogs, users] = await Promise.all([
      this.getTables(),
      this.getSessions(),
      this.getOrders(),
      this.getMenuItems(),
      this.getInventory(),
      this.getNotifications(),
      this.getAuditLogs(),
      this.getUsers()
    ]);
    return { tables, sessions, orders, menu, inventory, notifications, auditLogs, users };
  }

  // Table operations
  public static async getTables(): Promise<Table[]> {
    await this.ensureSeeded();
    const { data } = await supabase.from('tables').select('*');
    const list = (data || []).map(mapTableToTypes);
    return list.sort((a, b) => parseInt(a.id) - parseInt(b.id));
  }

  public static async getTable(id: string): Promise<Table | undefined> {
    await this.ensureSeeded();
    const { data } = await supabase.from('tables').select('*').eq('id', id).single();
    return data ? mapTableToTypes(data) : undefined;
  }

  public static async updateTable(id: string, updates: Partial<Table>): Promise<Table> {
    await this.ensureSeeded();
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.qrCode !== undefined) dbUpdates.qr_code = updates.qrCode;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.currentSessionId !== undefined) dbUpdates.current_session_id = updates.currentSessionId;

    const { data } = await supabase.from('tables').update(dbUpdates).eq('id', id).select().single();
    return mapTableToTypes(data);
  }

  // Session operations
  public static async getSessions(): Promise<DiningSession[]> {
    await this.ensureSeeded();
    const { data } = await supabase.from('sessions').select('*');
    return (data || []).map(mapSessionToTypes);
  }

  public static async getSession(id: string): Promise<DiningSession | undefined> {
    await this.ensureSeeded();
    const { data } = await supabase.from('sessions').select('*').eq('id', id).single();
    return data ? mapSessionToTypes(data) : undefined;
  }

  public static async createSession(tableId: string, ownerId: string, ownerName: string): Promise<DiningSession> {
    await this.ensureSeeded();
    const isTakeaway = tableId.toLowerCase() === 'takeaway';

    if (!isTakeaway) {
      const table = await this.getTable(tableId);
      if (!table) throw new Error(`Table ${tableId} not found`);

      if (table.status !== 'available') {
        const sessions = await this.getSessions();
        const activeSession = sessions.find(s => s.tableId === tableId && s.status !== 'completed');
        if (activeSession) return activeSession;
      }
    }

    const sessionId = `session-${Date.now()}`;
    const newSession: DiningSession = {
      id: sessionId,
      tableId,
      ownerId,
      guests: [{ id: ownerId, name: ownerName }],
      status: 'active',
      createdAt: new Date().toISOString(),
      closedAt: null,
      orders: [],
      timeline: [
        {
          timestamp: new Date().toISOString(),
          type: 'session.created',
          description: isTakeaway 
            ? `Takeaway Session initialized by ${ownerName}.`
            : `Dining Session created by ${ownerName}.`
        }
      ]
    };

    await supabase.from('sessions').insert({
      id: sessionId,
      table_id: tableId,
      owner_id: ownerId,
      guests: newSession.guests,
      status: 'active',
      created_at: newSession.createdAt,
      closed_at: null,
      orders: [],
      timeline: newSession.timeline,
      restaurant_id: RESTAURANT_ID,
      branch_id: BRANCH_ID
    });

    if (!isTakeaway) {
      await this.updateTable(tableId, { status: 'occupied', currentSessionId: sessionId });
      await this.writeAuditLog('session.created', `Session ${sessionId} created at Table ${tableId} by ${ownerName}`, ownerId);
    } else {
      await this.writeAuditLog('session.created', `Takeaway Session ${sessionId} created by ${ownerName}`, ownerId);
    }
    return newSession;
  }

  public static async joinSession(sessionId: string, guestId: string, guestName: string): Promise<DiningSession> {
    await this.ensureSeeded();
    const session = await this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    if (session.status !== 'active') throw new Error(`Session ${sessionId} is not active`);

    if (!session.guests.some(g => g.id === guestId)) {
      session.guests.push({ id: guestId, name: guestName });
      session.timeline.push({
        timestamp: new Date().toISOString(),
        type: 'session.joined',
        description: `${guestName} joined the table.`
      });
      await supabase.from('sessions').update({
        guests: session.guests,
        timeline: session.timeline
      }).eq('id', sessionId);
      await this.writeAuditLog('session.joined', `${guestName} joined session ${sessionId}`, guestId);
    }
    return session;
  }

  public static async pushTimelineEvent(sessionId: string, event: Omit<SessionEvent, 'timestamp'>): Promise<DiningSession> {
    await this.ensureSeeded();
    const session = await this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const fullEvent: SessionEvent = {
      timestamp: new Date().toISOString(),
      ...event
    };
    session.timeline.push(fullEvent);
    await supabase.from('sessions').update({ timeline: session.timeline }).eq('id', sessionId);
    return session;
  }

  public static async requestPayment(sessionId: string): Promise<DiningSession> {
    await this.ensureSeeded();
    const session = await this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    session.status = 'payment_pending';
    session.timeline.push({
      timestamp: new Date().toISOString(),
      type: 'payment.requested',
      description: 'Bill payment requested by Session Owner.'
    });

    await supabase.from('sessions').update({
      status: 'payment_pending',
      timeline: session.timeline
    }).eq('id', sessionId);

    await this.updateTable(session.tableId, { status: 'payment_pending' });
    await this.writeAuditLog('payment.requested', `Payment requested for session ${sessionId}`);
    return session;
  }

  public static async closeSession(sessionId: string): Promise<DiningSession> {
    await this.ensureSeeded();
    const session = await this.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    session.status = 'completed';
    session.closedAt = new Date().toISOString();
    session.timeline.push({
      timestamp: new Date().toISOString(),
      type: 'session.closed',
      description: 'Dining session completed and table cleared.'
    });

    await supabase.from('sessions').update({
      status: 'completed',
      closed_at: session.closedAt,
      timeline: session.timeline
    }).eq('id', sessionId);

    await this.updateTable(session.tableId, { status: 'available', currentSessionId: null });
    await this.writeAuditLog('session.closed', `Session ${sessionId} closed successfully`);
    return session;
  }

  // Order operations
  public static async getOrders(): Promise<Order[]> {
    await this.ensureSeeded();
    const { data } = await supabase.from('orders').select('*');
    return (data || []).map(mapOrderToTypes);
  }

  public static async getOrder(id: string): Promise<Order | undefined> {
    await this.ensureSeeded();
    const { data } = await supabase.from('orders').select('*').eq('id', id).single();
    return data ? mapOrderToTypes(data) : undefined;
  }

  public static async createOrder(
    sessionId: string, 
    tableId: string, 
    items: { menuItemId: string; name: string; quantity: number; price: number }[],
    prediction: { estimatedCompletion: string; confidenceScore: number; kitchenLoad: number }
  ): Promise<Order> {
    await this.ensureSeeded();
    
    // Deduct inventory items
    const menu = await this.getMenuItems();
    const inventory = await this.getInventory();

    for (const orderItem of items) {
      const menuItem = menu.find(m => m.id === orderItem.menuItemId);
      if (menuItem) {
        for (const ingredientName of menuItem.ingredients) {
          const invItem = inventory.find(i => i.name.toLowerCase() === ingredientName.toLowerCase());
          if (invItem) {
            const deduction = 0.1 * orderItem.quantity; 
            invItem.stock = Math.max(0, Number((invItem.stock - deduction).toFixed(2)));
            await supabase.from('inventory').update({ stock: invItem.stock }).eq('id', invItem.id);
            
            if (invItem.stock < invItem.minStock) {
              await this.createNotification(
                'Inventory Alert',
                `Low stock detected for ${invItem.name}: ${invItem.stock} ${invItem.unit} remaining.`,
                'warning'
              );
            }
          }
        }
      }
    }

    const orderId = `order-${Date.now()}`;
    const newOrder: Order = {
      id: orderId,
      sessionId,
      tableId,
      items: items.map(i => ({
        menuItemId: i.menuItemId,
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        status: 'placed'
      })),
      status: 'placed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      runnerId: null,
      runnerRoute: [],
      estimatedCompletion: prediction.estimatedCompletion,
      confidenceScore: prediction.confidenceScore,
      kitchenLoad: prediction.kitchenLoad
    };

    await supabase.from('orders').insert({
      id: orderId,
      session_id: sessionId,
      table_id: tableId,
      items: newOrder.items,
      status: 'placed',
      created_at: newOrder.createdAt,
      updated_at: newOrder.updatedAt,
      runner_id: null,
      runner_route: [],
      estimated_completion: prediction.estimatedCompletion,
      confidence_score: prediction.confidenceScore,
      kitchen_load: prediction.kitchenLoad
    });

    // Update Session
    const session = await this.getSession(sessionId);
    if (session) {
      session.orders.push(orderId);
      session.timeline.push({
        timestamp: new Date().toISOString(),
        type: 'order.created',
        description: `New order ${orderId} placed (₹${items.reduce((acc, x) => acc + x.price * x.quantity, 0)})`,
        payload: { orderId, total: items.reduce((acc, x) => acc + x.price * x.quantity, 0) }
      });
      await supabase.from('sessions').update({
        orders: session.orders,
        timeline: session.timeline
      }).eq('id', sessionId);
    }

    // Add notification
    await this.createNotification(
      'New Order Placed',
      `Table ${tableId} has placed order ${orderId}.`,
      'info'
    );

    await this.writeAuditLog('order.created', `Order ${orderId} created for session ${sessionId} at Table ${tableId}`);
    return newOrder;
  }

  public static async updateOrderStatus(orderId: string, status: OrderStatus, runnerId?: string | null, route?: string[]): Promise<Order> {
    await this.ensureSeeded();
    const order = await this.getOrder(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    order.status = status;
    order.updatedAt = new Date().toISOString();
    if (runnerId !== undefined) order.runnerId = runnerId;
    if (route !== undefined) order.runnerRoute = route;

    // Update item statuses inside the order
    order.items = order.items.map(item => {
      let itemStatus: 'placed' | 'preparing' | 'ready' | 'delivered' = 'placed';
      if (status === 'preparing') itemStatus = 'preparing';
      else if (status === 'ready' || status === 'delivering') itemStatus = 'ready';
      else if (status === 'delivered') itemStatus = 'delivered';
      return { ...item, status: itemStatus };
    });

    const updates: any = {
      status,
      updated_at: order.updatedAt,
      items: order.items
    };
    if (runnerId !== undefined) updates.runner_id = runnerId;
    if (route !== undefined) updates.runner_route = route;

    await supabase.from('orders').update(updates).eq('id', orderId);

    // Update Session Timeline
    const session = await this.getSession(order.sessionId);
    if (session) {
      let desc = `Order ${orderId} status updated to ${status}.`;
      if (status === 'accepted') desc = `Order ${orderId} accepted by Kitchen.`;
      else if (status === 'preparing') desc = `Kitchen is preparing Order ${orderId}.`;
      else if (status === 'ready') desc = `Order ${orderId} is ready for pick-up.`;
      else if (status === 'delivering') desc = `Food Runner assigned to deliver Order ${orderId}.`;
      else if (status === 'delivered') desc = `Order ${orderId} delivered to Table ${order.tableId}.`;

      session.timeline.push({
        timestamp: new Date().toISOString(),
        type: `order.${status}`,
        description: desc,
        payload: { orderId }
      });
      await supabase.from('sessions').update({ timeline: session.timeline }).eq('id', order.sessionId);
    }

    // Add notifications for significant changes
    let notifyTitle = '';
    let notifyMessage = '';
    let notifyType: Notification['type'] = 'info';

    if (status === 'accepted') {
      notifyTitle = 'Order Accepted';
      notifyMessage = `Kitchen accepted order ${orderId} for Table ${order.tableId}.`;
      notifyType = 'success';
    } else if (status === 'ready') {
      notifyTitle = 'Order Ready';
      notifyMessage = `Order ${orderId} is ready to run to Table ${order.tableId}.`;
      notifyType = 'success';
    } else if (status === 'delivered') {
      notifyTitle = 'Order Delivered';
      notifyMessage = `Order ${orderId} delivered to Table ${order.tableId}.`;
      notifyType = 'success';
    }

    if (notifyTitle) {
      await this.createNotification(notifyTitle, notifyMessage, notifyType);
    }

    await this.writeAuditLog(`order.${status}`, `Order ${orderId} updated to ${status}`);
    return order;
  }

  // Menu operations
  public static async getMenuItems(): Promise<MenuItem[]> {
    await this.ensureSeeded();
    const { data } = await supabase.from('menu_items').select('*');
    return (data || []).map(mapMenuToTypes);
  }

  public static async getMenuItem(id: string): Promise<MenuItem | undefined> {
    await this.ensureSeeded();
    const { data } = await supabase.from('menu_items').select('*').eq('id', id).single();
    return data ? mapMenuToTypes(data) : undefined;
  }

  public static async createMenuItem(item: Omit<MenuItem, 'id'>): Promise<MenuItem> {
    await this.ensureSeeded();
    const id = `menu-${Date.now()}`;
    const newItem = { ...item, id };
    await supabase.from('menu_items').insert({
      id,
      name: newItem.name,
      description: newItem.description,
      price: newItem.price,
      category: newItem.category,
      rating: newItem.rating,
      is_chef_recommendation: newItem.isChefRecommendation,
      is_popular: newItem.isPopular,
      is_trending: newItem.isTrending,
      prep_time: newItem.prepTime,
      calories: newItem.calories,
      protein: newItem.protein,
      allergens: newItem.allergens,
      ingredients: newItem.ingredients,
      image: newItem.image,
      restaurant_id: RESTAURANT_ID,
      branch_id: BRANCH_ID
    });
    await this.writeAuditLog('menu.create', `Menu item ${newItem.name} created`);
    return newItem;
  }

  public static async updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<MenuItem> {
    await this.ensureSeeded();
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.rating !== undefined) dbUpdates.rating = updates.rating;
    if (updates.isChefRecommendation !== undefined) dbUpdates.is_chef_recommendation = updates.isChefRecommendation;
    if (updates.isPopular !== undefined) dbUpdates.is_popular = updates.isPopular;
    if (updates.isTrending !== undefined) dbUpdates.is_trending = updates.isTrending;
    if (updates.prepTime !== undefined) dbUpdates.prep_time = updates.prepTime;
    if (updates.calories !== undefined) dbUpdates.calories = updates.calories;
    if (updates.protein !== undefined) dbUpdates.protein = updates.protein;
    if (updates.allergens !== undefined) dbUpdates.allergens = updates.allergens;
    if (updates.ingredients !== undefined) dbUpdates.ingredients = updates.ingredients;
    if (updates.image !== undefined) dbUpdates.image = updates.image;

    const { data } = await supabase.from('menu_items').update(dbUpdates).eq('id', id).select().single();
    return mapMenuToTypes(data);
  }

  public static async deleteMenuItem(id: string): Promise<void> {
    await this.ensureSeeded();
    await supabase.from('menu_items').delete().eq('id', id);
    await this.writeAuditLog('menu.delete', `Menu item ${id} deleted`);
  }

  // Inventory operations
  public static async getInventory(): Promise<InventoryItem[]> {
    await this.ensureSeeded();
    const { data } = await supabase.from('inventory').select('*');
    return (data || []).map(r => ({
      id: r.id,
      name: r.name,
      stock: Number(r.stock),
      unit: r.unit,
      minStock: Number(r.min_stock),
      expiryDate: r.expiry_date
    }));
  }

  public static async updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    await this.ensureSeeded();
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.stock !== undefined) dbUpdates.stock = updates.stock;
    if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
    if (updates.minStock !== undefined) dbUpdates.min_stock = updates.minStock;
    if (updates.expiryDate !== undefined) dbUpdates.expiry_date = updates.expiryDate;

    const { data } = await supabase.from('inventory').update(dbUpdates).eq('id', id).select().single();
    return {
      id: data.id,
      name: data.name,
      stock: Number(data.stock),
      unit: data.unit,
      minStock: Number(data.min_stock),
      expiryDate: data.expiry_date
    };
  }

  // Notifications operations
  public static async getNotifications(): Promise<Notification[]> {
    await this.ensureSeeded();
    const { data } = await supabase.from('notifications').select('*').order('timestamp', { ascending: false });
    return (data || []).map(r => ({
      id: r.id,
      timestamp: r.timestamp,
      title: r.title,
      message: r.message,
      type: r.type,
      read: r.read
    }));
  }

  public static async markNotificationRead(id: string): Promise<void> {
    await this.ensureSeeded();
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  }

  public static async createNotification(title: string, message: string, type: Notification['type']): Promise<Notification> {
    await this.ensureSeeded();
    const id = `n-custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newN: Notification = {
      id,
      timestamp: new Date().toISOString(),
      title,
      message,
      type,
      read: false
    };
    await supabase.from('notifications').insert({
      id,
      timestamp: newN.timestamp,
      title: newN.title,
      message: newN.message,
      type: newN.type,
      read: false,
      restaurant_id: RESTAURANT_ID,
      branch_id: BRANCH_ID
    });
    return newN;
  }

  // Audit Logs
  public static async getAuditLogs(): Promise<AuditLog[]> {
    await this.ensureSeeded();
    const { data } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(500);
    return (data || []).map(r => ({
      id: r.id,
      timestamp: r.timestamp,
      action: r.action,
      userId: r.user_id,
      details: r.details
    }));
  }

  public static async writeAuditLog(action: string, details: string, userId?: string): Promise<AuditLog> {
    const id = `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const log: AuditLog = {
      id,
      timestamp: new Date().toISOString(),
      action,
      userId,
      details
    };
    try {
      await supabase.from('audit_logs').insert({
        id,
        timestamp: log.timestamp,
        action,
        user_id: userId || null,
        details,
        restaurant_id: RESTAURANT_ID,
        branch_id: BRANCH_ID
      });
    } catch (e: any) {
      console.error('[AURYN DB] AuditLog write failed:', e.message);
    }
    return log;
  }

  // User operations
  public static async getUsers(): Promise<User[]> {
    await this.ensureSeeded();
    const { data } = await supabase.from('users').select('*');
    return (data || []).map(r => ({
      id: r.id,
      email: r.email,
      name: r.name,
      role: r.role,
      passwordHash: r.password_hash
    }));
  }

  public static async findUserByEmail(email: string): Promise<User | undefined> {
    const users = await this.getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public static async getUserById(id: string): Promise<User | undefined> {
    const users = await this.getUsers();
    return users.find(u => u.id === id);
  }

  // Table Management CRUD
  public static async createTable(name: string): Promise<Table> {
    await this.ensureSeeded();
    const tables = await this.getTables();
    const tableId = `${tables.length > 0 ? Math.max(...tables.map(t => parseInt(t.id) || 0)) + 1 : 1}`;
    const newTable: Table = {
      id: tableId,
      name,
      qrCode: `df-table-${tableId}-auth`,
      status: 'available',
      currentSessionId: null
    };
    await supabase.from('tables').insert({
      id: tableId,
      name,
      qr_code: newTable.qrCode,
      status: 'available',
      current_session_id: null,
      restaurant_id: RESTAURANT_ID,
      branch_id: BRANCH_ID
    });
    await this.writeAuditLog('table.create', `Table ${name} (ID: ${tableId}) created`);
    return newTable;
  }

  public static async deleteTable(id: string): Promise<void> {
    await this.ensureSeeded();
    await supabase.from('tables').delete().eq('id', id);
    await this.writeAuditLog('table.delete', `Table ID ${id} deleted`);
  }
}
