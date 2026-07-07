import { MenuItem, HybridScore } from '../types';
import { VectorEngine } from '../embeddings/engine';
import { KnowledgeGraph } from '../knowledge/graph';
import { PersonalizationLearner } from '../personalization/learner';
import { MemoryManager } from '../memory/manager';
import { RankingEngine } from '../ranking/engine';

export class HybridRecommender {
  private static graph = new KnowledgeGraph();

  /**
   * Generates a ranked list of recommended menu items using multi-criteria weighted scoring.
   */
  public static recommend(
    sessionId: string,
    menu: MenuItem[],
    queryVector?: number[],
    context?: { weather?: string; time?: string; kitchenLoad?: number }
  ): MenuItem[] {
    const memory = MemoryManager.getMemory(sessionId);
    const prefs = memory.userPreferences;
    
    // Generate profile vectors
    const profileVec = PersonalizationLearner.generateProfileVector(prefs);

    // Calculate score details for each item
    const scoredList: Array<{ item: MenuItem; score: number }> = menu
      .filter(item => {
        // Filter out rejected dishes
        if (prefs.rejectedDishes.includes(item.id)) return false;

        // Filter out allergen items
        const hasAllergen = item.allergens.some((a: string) => prefs.allergies.includes(a));
        if (hasAllergen) return false;

        // Filter out vegetarian violations
        if (prefs.vegetarian) {
          const isVeg = !item.ingredients.some((ing: string) => 
            ['beef', 'lobster', 'shrimp', 'crab', 'chicken', 'pork', 'fish'].includes(ing.toLowerCase())
          );
          if (!isVeg) return false;
        }

        // Filter out budget limits
        if (prefs.maxBudget && item.price > prefs.maxBudget) return false;

        return true;
      })
      .map(item => {
        const itemVec = VectorEngine.vectorizeMenuItem(item);

        // 1. Semantic Query similarity
        let semanticScore = 0.5;
        if (queryVector) {
          semanticScore = VectorEngine.cosineSimilarity(queryVector, itemVec);
        }

        // 2. User preference profile similarity
        const preferenceScore = VectorEngine.cosineSimilarity(profileVec, itemVec);

        // 3. Knowledge Graph connection density
        let kgScore = 0.5;
        if (memory.lastDiscussedItemId) {
          const recommendations = this.graph.getRecommendations(memory.lastDiscussedItemId);
          if (recommendations.includes(item.name)) kgScore = 0.9;
        }

        // 4. Contextual features (time of day / weather matching)
        let contextScore = 0.5;
        const timeOfDay = context?.time || 'Evening';
        const weather = context?.weather || 'pleasant';

        if (timeOfDay.toLowerCase().includes('morning') && (item.category === 'Beverages' || item.category === 'Starters')) {
          contextScore += 0.2;
        }
        if (weather.toLowerCase().includes('hot') && item.category === 'Beverages') {
          contextScore += 0.2;
        }

        // 5. Popularity & ratings
        const popularityScore = item.isPopular ? 0.8 : (item.isChefRecommendation ? 0.9 : 0.5);

        // 6. Kitchen load factor
        const kitchenLoad = context?.kitchenLoad || 30;
        const loadMitigationScore = kitchenLoad > 75 && item.prepTime < 10 ? 0.8 : 0.5;

        // Compile weighted score metrics (using the RankingEngine as specified in Phase 12)
        const finalScore = RankingEngine.computeScore({
          semantic: semanticScore,
          preference: preferenceScore,
          context: contextScore,
          knowledgeGraph: kgScore,
          popularity: popularityScore,
          recentOrders: 0.5, // default baseline
          availability: loadMitigationScore
        });

        return {
          item,
          score: finalScore
        };
      });

    // Sort by final score descending
    return scoredList
      .sort((a, b) => b.score - a.score)
      .map(s => s.item);
  }
}
