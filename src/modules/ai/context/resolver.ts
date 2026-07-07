import { MenuItem } from '../types';
import { MemoryManager } from '../memory/manager';

export class ContextResolver {
  /**
   * Scans query and resolves comparative/pronoun references based on memory context.
   */
  public static resolveContext(
    sessionId: string,
    queryText: string,
    menu: MenuItem[]
  ): { adjustedQuery: string; filterOverride?: (item: MenuItem) => boolean } {
    const memory = MemoryManager.getMemory(sessionId);
    const lastItemId = memory.lastDiscussedItemId;
    const lower = queryText.toLowerCase();
    
    let adjustedQuery = queryText;
    let filterOverride: ((item: MenuItem) => boolean) | undefined = undefined;

    if (!lastItemId) {
      return { adjustedQuery };
    }

    const lastItem = menu.find(m => m.id === lastItemId);
    if (!lastItem) return { adjustedQuery };

    // 1. Resolve direct pronouns: "it", "this", "that one"
    if (lower.includes(' it ') || lower.includes(' this ') || lower.includes('that one')) {
      adjustedQuery = `${queryText} ${lastItem.name}`;
    }

    // 2. Resolve comparative references: "cheaper option"
    if (lower.includes('cheaper') || lower.includes('less expensive') || lower.includes('lower price')) {
      adjustedQuery = `recommend item similar to ${lastItem.name} under ₹${lastItem.price}`;
      filterOverride = (item: MenuItem) => item.category === lastItem.category && item.price < lastItem.price;
    }

    // 3. Resolve comparative references: "healthier option"
    if (lower.includes('healthier') || lower.includes('less calories') || lower.includes('low calorie')) {
      adjustedQuery = `recommend healthy item similar to ${lastItem.name}`;
      const baseCal = lastItem.calories || 600;
      filterOverride = (item: MenuItem) => item.category === lastItem.category && (item.calories || 600) < baseCal;
    }

    // 4. Resolve comparative references: "spicier version"
    if (lower.includes('spicier') || lower.includes('more heat') || lower.includes('hotter')) {
      adjustedQuery = `spicy version of ${lastItem.name}`;
      filterOverride = (item: MenuItem) => item.category === lastItem.category && (item.description.includes('spicy') || item.name.includes('chili'));
    }

    // 5. Resolve allergen exclusions: "without dairy" or "without gluten"
    if (lower.includes('without dairy') || lower.includes('no dairy') || lower.includes('dairy free')) {
      adjustedQuery = `${lastItem.name} without dairy`;
      filterOverride = (item: MenuItem) => item.id === lastItem.id && !item.allergens.includes('Dairy');
    }

    if (lower.includes('without gluten') || lower.includes('no gluten') || lower.includes('gluten free')) {
      adjustedQuery = `${lastItem.name} without gluten`;
      filterOverride = (item: MenuItem) => item.id === lastItem.id && !item.allergens.includes('Gluten');
    }

    return { adjustedQuery, filterOverride };
  }
}
