import { UserPreferences, MenuItem } from '../types';
import { MemoryManager } from '../memory/manager';

export class PersonalizationLearner {
  /**
   * Learns and updates preferences based on an ordered item.
   */
  public static learnFromOrder(sessionId: string, item: MenuItem, quantity = 1): void {
    const memory = MemoryManager.getMemory(sessionId);
    const prefs = memory.userPreferences;

    // Update orders tally
    prefs.ordersCount += quantity;
    prefs.spendSum += item.price * quantity;

    // Learn favorite categories
    if (!prefs.preferredCategories.includes(item.category)) {
      prefs.preferredCategories.push(item.category);
    } else {
      // Move to front (higher priority)
      prefs.preferredCategories = [
        item.category,
        ...prefs.preferredCategories.filter(c => c !== item.category)
      ];
    }

    // Learn preferences based on ingredients (spicy, sweet, dairy, nuts)
    const nameLower = item.name.toLowerCase();
    const descLower = item.description.toLowerCase();

    if (descLower.includes('spicy') || nameLower.includes('chili')) {
      prefs.heatTolerance = 'spicy';
    }

    // Capture ingredients as preferred components
    item.ingredients.forEach((ing: string) => {
      const ingStem = ing.toLowerCase();
      if (!prefs.preferredCuisines.includes(ingStem)) {
        prefs.preferredCuisines.push(ingStem);
      }
    });

    MemoryManager.saveMemory(sessionId, memory);
  }

  /**
   * Logs a dish that was explicitly rejected (e.g. removed from cart, or sent back).
   */
  public static logRejection(sessionId: string, item: MenuItem): void {
    const memory = MemoryManager.getMemory(sessionId);
    const prefs = memory.userPreferences;

    if (!prefs.rejectedDishes.includes(item.id)) {
      prefs.rejectedDishes.push(item.id);
    }

    MemoryManager.saveMemory(sessionId, memory);
  }

  /**
   * Generates a User Profile Vector (32-dimensions) representing user taste.
   */
  public static generateProfileVector(prefs: UserPreferences): number[] {
    const vector = Array(32).fill(0);

    // Map categories
    if (prefs.preferredCategories.includes('Starters')) vector[0] = 0.8;
    if (prefs.preferredCategories.includes('Mains')) vector[1] = 0.8;
    if (prefs.preferredCategories.includes('Desserts')) vector[2] = 0.8;
    if (prefs.preferredCategories.includes('Beverages')) vector[3] = 0.8;

    // Map ingredients preferences
    if (prefs.preferredCuisines.includes('truffle')) vector[4] = 0.7;
    if (prefs.preferredCuisines.includes('cheese') || prefs.preferredCuisines.includes('burrata')) vector[5] = 0.7;
    if (prefs.preferredCuisines.includes('beef') || prefs.preferredCuisines.includes('wagyu')) vector[6] = 0.7;
    if (prefs.preferredCuisines.includes('lobster')) vector[7] = 0.7;
    if (prefs.preferredCuisines.includes('matcha')) vector[8] = 0.7;
    if (prefs.preferredCuisines.includes('peach')) vector[9] = 0.7;

    // Map heat tolerance
    if (prefs.heatTolerance === 'spicy') vector[10] = 0.9;
    if (prefs.heatTolerance === 'medium') vector[10] = 0.4;

    // Map budget preferences
    const avgSpend = prefs.ordersCount > 0 ? prefs.spendSum / prefs.ordersCount : 800;
    if (avgSpend > 1200) vector[16] = 0.9; // Premium tier affinity
    if (avgSpend < 500) vector[28] = 0.9;  // Budget tier affinity

    // Map dietary filters directly
    if (prefs.vegetarian) {
      vector[22] = -0.5; // Avoid dairy allergens if marked (safety margins)
    }

    return vector;
  }
}
