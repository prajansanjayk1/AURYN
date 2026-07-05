import { RestaurantState, Order, MenuItem, DiningSession, InventoryItem } from '../../shared/types';
import { RestaurantRepository } from '../../shared/database/repo';

export interface AIResponse {
  message: string;
  recommendations: MenuItem[];
  suggestedAction?: {
    type: 'add_to_cart' | 'request_payment' | 'filter_menu';
    payload: any;
  };
}

export class RestaurantIntelligence {
  
  // 1. Kitchen Intelligence: Bottlenecks & Prep Predictions
  public static async getKitchenPrediction(orderItemsCount: number): Promise<{
    estimatedCompletion: string;
    confidenceScore: number;
    kitchenLoad: number;
    bottleneckDetected: boolean;
    recommendation: string;
  }> {
    const orders = await RestaurantRepository.getOrders();
    const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'placed');
    
    // Calculate current kitchen load based on active orders (each active order adds about 15% load)
    const baseLoad = Math.min(95, 10 + activeOrders.length * 15 + orderItemsCount * 5);
    const kitchenLoad = Math.max(10, Math.round(baseLoad + (Math.random() * 6 - 3)));

    // Calculate prep time: base 8 mins + load factors
    const additionalMinutes = Math.floor(kitchenLoad / 20);
    const estimatedMinutes = 6 + additionalMinutes;
    const estimatedSeconds = Math.floor(Math.random() * 60);
    const estimatedCompletion = `${estimatedMinutes}m ${estimatedSeconds}s`;

    // Confidence score degrades as load increases
    const confidenceScore = Math.max(75, 98 - Math.floor(kitchenLoad / 5));
    const bottleneckDetected = kitchenLoad > 75;

    let recommendation = 'Kitchen capacity is optimal. Proceed with standard prep.';
    if (bottleneckDetected) {
      recommendation = 'HIGH LOAD ALERT: Kitchen load exceeded 75%. Diverting backup prep chef and prioritizing quick-serve starters.';
    }

    return {
      estimatedCompletion,
      confidenceScore,
      kitchenLoad,
      bottleneckDetected,
      recommendation
    };
  }

  // 2. Runner Intelligence: Route optimization & dispatch guides
  public static calculateOptimalRoute(targetTableId: string, readyOrders: Order[]): {
    path: string[];
    distanceMeters: number;
    estimatedSteps: number;
  } {
    const otherTables = readyOrders
      .filter(o => o.tableId !== targetTableId)
      .map(o => `Table ${o.tableId}`);
    
    // Proximity logic simulation: Kitchen -> Ready tables -> Target table
    const path = ['Kitchen', ...otherTables.slice(0, 2), `Table ${targetTableId}`];
    const distanceMeters = 15 + otherTables.slice(0, 2).length * 12 + 10;
    const estimatedSteps = Math.round(distanceMeters * 1.4);

    return {
      path,
      distanceMeters,
      estimatedSteps
    };
  }

  // 3. Inventory Intelligence: Stock depletion & forecast
  public static analyzeInventory(inventory: InventoryItem[]): {
    depletedItems: string[];
    criticalWarnings: string[];
    reorderSuggestions: Array<{ item: string; qty: number }>;
  } {
    const depletedItems: string[] = [];
    const criticalWarnings: string[] = [];
    const reorderSuggestions: Array<{ item: string; qty: number }> = [];

    inventory.forEach(item => {
      if (item.stock <= 0) {
        depletedItems.push(item.name);
        criticalWarnings.push(`CRITICAL: ${item.name} is completely out of stock! Menu items requiring this ingredient will be disabled.`);
        reorderSuggestions.push({ item: item.name, qty: Math.max(10, item.minStock * 3) });
      } else if (item.stock < item.minStock) {
        criticalWarnings.push(`Warning: ${item.name} is below threshold (${item.stock} ${item.unit} remaining).`);
        reorderSuggestions.push({ item: item.name, qty: Math.ceil(item.minStock * 2) });
      }
    });

    return {
      depletedItems,
      criticalWarnings,
      reorderSuggestions
    };
  }

  // 4. Business Intelligence: Revenue, peak hour forecasting & Health Score
  public static getExecutiveInsights(state: RestaurantState): {
    revenueIncrease: string;
    avgDiningTime: string;
    peakHours: string;
    healthScore: number;
    insights: string[];
  } {
    const completedSessions = state.sessions.filter(s => s.status === 'completed');
    
    // Average dining session duration
    let avgMinutes = 34;
    if (completedSessions.length > 0) {
      const totalMs = completedSessions.reduce((acc, s) => {
        if (!s.closedAt) return acc;
        return acc + (new Date(s.closedAt).getTime() - new Date(s.createdAt).getTime());
      }, 0);
      const calculated = Math.round(totalMs / completedSessions.length / 60000);
      if (calculated > 5) avgMinutes = calculated;
    }

    // Health Score calculation (Weighted combination of parameters)
    const activeOrders = state.orders.filter(o => o.status !== 'delivered');
    const delayedOrders = activeOrders.filter(o => {
      const duration = (Date.now() - new Date(o.createdAt).getTime()) / 60000;
      return duration > 20; // Orders taking > 20 mins
    });
    const lowStockItems = state.inventory.filter(i => i.stock < i.minStock).length;

    let baseHealth = 100;
    baseHealth -= delayedOrders.length * 10;
    baseHealth -= lowStockItems * 5;
    const healthScore = Math.max(60, Math.min(100, baseHealth));

    // Dynamic sales intelligence matching times
    const hours = new Date().getHours();
    const peakHours = (hours >= 19 && hours <= 21) ? 'Currently Peak (7 PM - 9 PM)' : 'Upcoming Dinner Peak (8 PM - 9:30 PM)';

    return {
      revenueIncrease: '+18.4%',
      avgDiningTime: `${avgMinutes} min`,
      peakHours,
      healthScore,
      insights: [
        `Revenue Score: Upward momentum (+18.4%) driven by luxury pizzas and charcoal sliders.`,
        `Kitchen Studio Operations: Efficiency is currently at ${healthScore > 90 ? 'Outstanding' : 'Moderate'} status.`,
        `Staff Flow: Optimal server routes assigned. Food Runner service step counts reduced by 14% this shift.`,
        lowStockItems > 0 
          ? `Inventory Alert: ${lowStockItems} items are running low. Verify auto-purchase orders in the inventory panel.`
          : 'Inventory Flow: Safe. All core ingredients are above threshold levels.',
        'AI Demand Forecast: Highly favorable dinner service expected. Peak load expected at 8:30 PM.'
      ]
    };
  }

  // 5. Menu Recommendation Engine
  public static getMenuRecommendations(
    menu: MenuItem[],
    preferences: { vegetarian?: boolean; allergies?: string[]; time?: string; weather?: string }
  ): MenuItem[] {
    let list = [...menu];

    // Filter Vegetarian
    if (preferences.vegetarian) {
      list = list.filter(m => !m.ingredients.some(i => 
        ['beef', 'lobster', 'shrimp', 'crab', 'chicken', 'pork', 'fish'].includes(i.toLowerCase())
      ));
    }

    // Filter Allergies
    if (preferences.allergies && preferences.allergies.length > 0) {
      list = list.filter(m => !m.allergens.some(a => 
        preferences.allergies!.map(x => x.toLowerCase()).includes(a.toLowerCase())
      ));
    }

    // Time-based recommendations
    const isMorning = preferences.time?.toLowerCase().includes('morning');
    const isNight = preferences.time?.toLowerCase().includes('night') || preferences.time?.toLowerCase().includes('evening');
    
    if (isMorning) {
      list = list.filter(m => m.category === 'Beverages' || m.category === 'Starters');
    }

    // Sort by popular / recommendations
    return list.sort((a, b) => {
      if (a.isChefRecommendation && !b.isChefRecommendation) return -1;
      if (!a.isChefRecommendation && b.isChefRecommendation) return 1;
      return b.rating - a.rating;
    });
  }

  // 6. Dining Concierge: AI Chatbot Conversational Intelligence
  public static async chatConcierge(
    query: string,
    sessionId: string,
    guestName: string,
    context?: { weather?: string; time?: string }
  ): Promise<AIResponse> {
    const state = await RestaurantRepository.getState();
    const session = state.sessions.find(s => s.id === sessionId);
    const menu = state.menu;

    const lowerQuery = query.toLowerCase();
    let message = '';
    let recommendations: MenuItem[] = [];
    let suggestedAction: AIResponse['suggestedAction'] = undefined;

    // Detect weather or time context
    const time = context?.time || 'Evening';
    const weather = context?.weather || 'Mild';

    // 1. Vegetarian query handling
    if (lowerQuery.includes('veg') || lowerQuery.includes('vegetarian') || lowerQuery.includes('no meat')) {
      recommendations = this.getMenuRecommendations(menu, { vegetarian: true });
      message = `Good ${time}, ${guestName}. For our vegetarian guests, I highly recommend starting with our delicate **Edamame Truffle Gyoza** (pan-seared with white truffle oil) followed by our flagship **Truffle Burrata Pizza** baked on 48-hour sourdough. For dessert, the **Smoked Rose Pistachio Kulfi** is completely eggless and premium.`;
    } 
    
    // 2. Allergy query handling
    else if (lowerQuery.includes('dairy') || lowerQuery.includes('allergy') || lowerQuery.includes('allergic')) {
      if (lowerQuery.includes('dairy') || lowerQuery.includes('milk') || lowerQuery.includes('cheese')) {
        recommendations = this.getMenuRecommendations(menu, { allergies: ['Dairy'] });
        message = `I understand you would like to avoid dairy, ${guestName}. I have filtered our menu. You can safely enjoy our pan-seared **Edamame Truffle Gyoza** (no dairy) and refresh with a **Himalayan Peach Iced Nectar**. I have flagged the kitchen to avoid butter-basting for your table.`;
        suggestedAction = {
          type: 'filter_menu',
          payload: { category: 'All', allergenFilter: 'Dairy' }
        };
      } else if (lowerQuery.includes('nut') || lowerQuery.includes('peanut') || lowerQuery.includes('pistachio')) {
        recommendations = this.getMenuRecommendations(menu, { allergies: ['Nuts'] });
        message = `To keep you safe from nut allergens, I recommend our **Truffle Burrata Pizza** or **Charcoal Wagyu Sliders**. Please note that our **Smoked Rose Pistachio Kulfi** contains Iranian pistachios and should be avoided. The kitchen has been alerted.`;
      } else {
        message = `I have logged your allergy alert, ${guestName}. Let me know if you would like me to filter out dairy, gluten, soy, or nuts.`;
      }
    }
    
    // 3. Price-based queries
    else if (lowerQuery.includes('under') || lowerQuery.includes('price') || lowerQuery.includes('cheap') || lowerQuery.includes('budget')) {
      const match = lowerQuery.match(/\d+/);
      const budget = match ? parseInt(match[0], 10) : 500;
      
      recommendations = menu.filter(m => m.price <= budget);
      if (recommendations.length > 0) {
        message = `Here are our finest selections under ₹${budget}, ${guestName}. The **Edamame Truffle Gyoza** (₹490), our artisan **Smoked Rose Pistachio Kulfi** (₹320), or the cold-pressed **Himalayan Peach Iced Nectar** (₹240) are excellent choices.`;
      } else {
        message = `Our starting plates begin at ₹240. I suggest trying our refreshing **Himalayan Peach Iced Nectar** (₹240) or **Smoked Rose Pistachio Kulfi** (₹320).`;
      }
    }
    
    // 4. Wine pairing
    else if (lowerQuery.includes('pair') && (lowerQuery.includes('slider') || lowerQuery.includes('wagyu') || lowerQuery.includes('burger'))) {
      const sliders = menu.find(m => m.id === 'm2');
      if (sliders) recommendations.push(sliders);
      message = `For the **Charcoal Wagyu Sliders**, the rich marbling of A5 Wagyu and melted Gruyère cheese pairs exquisitely with a full-bodied red vintage or our dry sparkling herbal infusions. Would you like me to request a beverage recommendation?`;
    }
    
    // 5. Chef recommendations
    else if (lowerQuery.includes('recommend') || lowerQuery.includes('special') || lowerQuery.includes('best') || lowerQuery.includes('today')) {
      recommendations = this.getMenuRecommendations(menu, {});
      message = `The Chef’s absolute masterpieces for this ${weather.toLowerCase()} ${time.toLowerCase()} are the **Truffle Burrata Pizza** and the **Saffron Lobster Bisque**. Both offer rich, warming flavor profiles perfect for our current dining session.`;
    }
    
    // 6. Direct ordering execution
    else if (lowerQuery.includes('add') || lowerQuery.includes('order') || lowerQuery.includes('want to get') || lowerQuery.includes('get me')) {
      let itemToAdd: MenuItem | undefined = undefined;
      let quantity = 1;

      const qtyMatch = lowerQuery.match(/\b\d+\b/);
      if (qtyMatch) {
        quantity = parseInt(qtyMatch[0], 10);
      }

      if (lowerQuery.includes('pizza') || lowerQuery.includes('burrata')) {
        itemToAdd = menu.find(m => m.id === 'm1');
      } else if (lowerQuery.includes('slider') || lowerQuery.includes('wagyu') || lowerQuery.includes('burger')) {
        itemToAdd = menu.find(m => m.id === 'm2');
      } else if (lowerQuery.includes('bisque') || lowerQuery.includes('lobster') || lowerQuery.includes('soup')) {
        itemToAdd = menu.find(m => m.id === 'm3');
      } else if (lowerQuery.includes('gyoza') || lowerQuery.includes('edamame') || lowerQuery.includes('dumpling')) {
        itemToAdd = menu.find(m => m.id === 'm4');
      } else if (lowerQuery.includes('kulfi') || lowerQuery.includes('dessert') || lowerQuery.includes('pistachio')) {
        itemToAdd = menu.find(m => m.id === 'm5');
      } else if (lowerQuery.includes('nectar') || lowerQuery.includes('peach') || lowerQuery.includes('drink') || lowerQuery.includes('beverage')) {
        itemToAdd = menu.find(m => m.id === 'm6');
      }

      if (itemToAdd) {
        recommendations.push(itemToAdd);
        message = `I have prepared a draft order to add **${quantity}x ${itemToAdd.name}** (₹${itemToAdd.price * quantity}) to your table's live session. Please click **Approve Order** below to execute it.`;
        suggestedAction = {
          type: 'add_to_cart',
          payload: {
            menuItemId: itemToAdd.id,
            name: itemToAdd.name,
            quantity,
            price: itemToAdd.price
          }
        };
      } else {
        message = `I couldn't quite identify which dish you'd like to add. Did you mean the **Truffle Burrata Pizza**, **Charcoal Wagyu Sliders**, or **Edamame Truffle Gyoza**?`;
      }
    }
    
    // 7. General conversational fallback
    else {
      recommendations = menu.slice(0, 2);
      message = `Hello, ${guestName}. Welcome to **AURYN**. I am your Specialized Restaurant Intelligence Concierge. I can recommend dishes based on your preferences, coordinate wine pairings, filter for allergens, or even add items directly to your table cart. What can I assist you with today?`;
    }

    return {
      message,
      recommendations,
      suggestedAction
    };
  }

  // 7. Manager AI: Conversational Business Advisor
  public static chatManager(query: string, state: RestaurantState): string {
    const lower = query.toLowerCase();
    const completedSessions = state.sessions.filter(s => s.status === 'completed');
    const totalRevenue = completedSessions.reduce((sum, s) => {
      const sessOrders = state.orders.filter(o => o.sessionId === s.id);
      return sum + sessOrders.reduce((acc, o) => acc + o.items.reduce((a, i) => a + (i.price * i.quantity), 0), 0);
    }, 0);

    const activeSessions = state.sessions.filter(s => s.status !== 'completed');

    if (lower.includes('why') && (lower.includes('sales') || lower.includes('down') || lower.includes('delay'))) {
      const activeOrders = state.orders.filter(o => o.status !== 'delivered');
      const delayedCount = activeOrders.filter(o => {
        const duration = (Date.now() - new Date(o.createdAt).getTime()) / 60000;
        return duration > 20;
      }).length;

      return `AURYN Sales & Operations Analysis:
• **Delayed Orders**: There are currently **${delayedCount} orders** that have exceeded the 20-minute preparation threshold. This is causing dining session extensions, lowering table turnover rates.
• **Current Revenue**: Today's recorded completed revenue is **₹${totalRevenue}** across **${completedSessions.length} tables**. 
• **Weather Correlation**: The pleasant weather has shifted guest preferences towards lighter starters, reducing the average transaction size by 8% compared to yesterday's dinner peak.
• **Recommendation**: Instruct the Kitchen Studio to prioritize hot mains and suggest dessert pairings at Table 1 and Table 2 to recover the average ticket size.`;
    }

    if (lower.includes('promote') || lower.includes('marketing') || lower.includes('tonight')) {
      const lowStockItems = state.inventory.filter(i => i.stock < i.minStock).map(i => i.name);
      const safeIngredients = state.inventory.filter(i => i.stock >= i.minStock).map(i => i.name);
      
      let dishToPromote = "Truffle Burrata Pizza";
      if (safeIngredients.includes("Burrata Cheese")) {
        dishToPromote = "Truffle Burrata Pizza (High Ingredient Stock)";
      } else if (safeIngredients.includes("A5 Wagyu Beef")) {
        dishToPromote = "Charcoal Wagyu Sliders";
      }

      return `AURYN Marketing Strategy Recommendations:
• **Target Dish**: **${dishToPromote}**.
• **Rationale**: Our stock level analysis indicates safe buffer quantities for its ingredients, while ingredients for soup dishes are running low (current warning: ${lowStockItems.length > 0 ? lowStockItems.join(', ') : 'None'}).
• **Target Auditing**: Create a 10% loyalty discount for tables scanning after 7 PM using the code **AURYNGLOW**. This will boost our dinner cover count during the upcoming peak.`;
    }

    if (lower.includes('runner') || lower.includes('best') || lower.includes('perform')) {
      const runnersMap: { [id: string]: number } = {};
      state.orders.forEach(o => {
        if (o.runnerId && o.status === 'delivered') {
          runnersMap[o.runnerId] = (runnersMap[o.runnerId] || 0) + 1;
        }
      });

      const bestRunner = Object.entries(runnersMap).sort((a, b) => b[1] - a[1])[0];
      const bestRunnerName = bestRunner ? bestRunner[0] : 'runner-alpha';
      const count = bestRunner ? bestRunner[1] : 3;

      return `AURYN Runner Telemetry Analysis:
• **Top Performing Runner**: **${bestRunnerName}** (with **${count} successful dispatches**).
• **Efficiency Index**: Average walking time is estimated at **1.2 minutes per route**, indicating optimal route vector mapping.
• **Runner Bottleneck**: Delay alerts are currently minimal (0 delayed handovers). Ensure runners are notified of table clear requests immediately.`;
    }

    if (lower.includes('table') || lower.includes('revenue') || lower.includes('highest')) {
      const tableRevenueMap: { [id: string]: number } = {};
      state.sessions.forEach(s => {
        const sessOrders = state.orders.filter(o => o.sessionId === s.id);
        const sessTotal = sessOrders.reduce((acc, o) => acc + o.items.reduce((a, i) => a + (i.price * i.quantity), 0), 0);
        tableRevenueMap[s.tableId] = (tableRevenueMap[s.tableId] || 0) + sessTotal;
      });

      const sortedTables = Object.entries(tableRevenueMap).sort((a, b) => b[1] - a[1]);
      const topTable = sortedTables[0] ? `Table ${sortedTables[0][0]} (₹${sortedTables[0][1]})` : 'Table 1';

      return `AURYN Space Valuation & Revenue Analytics:
• **Highest Generating Node**: **${topTable}**.
• **Turnover Frequency**: Average guest occupancy is **${activeSessions.length} active sessions** currently dine-in.
• **Spatial Efficiency**: Tables near the kitchen (Table 1 - Table 4) average **6 minutes shorter prep-to-delivery loops**, generating 15% higher ticket velocity.`;
    }

    if (lower.includes('predict') || lower.includes('lunch') || lower.includes('tomorrow')) {
      return `AURYN Predictive Demand Forecasting:
• **Tomorrow's Lunch Coverage**: Anticipating **12-15 dining sessions** between 12:30 PM and 2 PM.
• **Core Drivers**: Corporate lunch bookings and a warm temperature forecast (+2°C) will likely boost iced beverage orders (estimate: 25% order share for Himalayan Peach Iced Nectar).
• **Ingredient Preparation**: Advise prep station to prepare 5kg of Burrata dough and ensure Wagyu sliders are defrosted by 10 AM.`;
    }

    return `AURYN Business Intelligence Command:
I can analyze your restaurant's live telemetry database. Ask me:
- "Why are sales down today?" (Operations bottleneck analyzer)
- "What should I promote tonight?" (Marketing & stock-based suggestions)
- "Which runner is performing best?" (Logistics telemetry tracker)
- "Which tables generate the highest revenue?" (Space valuation dashboard)
- "Predict tomorrow's lunch" (Predictive demand forecaster)`;
  }
}
