import { ReasoningResult, MenuItem } from '../types';
import { KnowledgeGraph } from '../knowledge/graph';
import { MemoryManager } from '../memory/manager';

export class ReasoningEngine {
  private static graph = new KnowledgeGraph();

  /**
   * Evaluates if a guest can safely consume a specific dish based on their allergies/diets.
   * Traverses graph relationships to provide explaining justifications.
   */
  public static evaluateDishSafety(sessionId: string, item: MenuItem): ReasoningResult {
    const memory = MemoryManager.getMemory(sessionId);
    const prefs = memory.userPreferences;
    const constraints: string[] = [];
    const paths: string[] = [];

    // 1. Evaluate allergen constraints
    for (const allergy of prefs.allergies) {
      constraints.push(`allergy:${allergy}`);
      const check = this.graph.checkSafety(item.id, allergy);
      if (!check.safe) {
        paths.push(...(check.path || []));
        return {
          allowed: false,
          deduction: `Safety Alert: You cannot consume ${item.name} because you have a logged ${allergy} allergen alert. The Knowledge Graph traced this hazard: ${check.path?.join(' → ')}.`,
          constraintsEvaluated: constraints,
          pathTraced: paths
        };
      }
    }

    // 2. Evaluate vegetarian constraints
    if (prefs.vegetarian) {
      constraints.push('diet:vegetarian');
      const check = this.graph.isVegetarian(item.id);
      if (!check.vegetarian) {
        return {
          allowed: false,
          deduction: `Dietary Alert: ${item.name} is not suitable for your Vegetarian preference. It contains ${check.offendingIngredient}, which is flagged as a meat product in our culinary database.`,
          constraintsEvaluated: constraints,
          pathTraced: [`food_${item.id}`, `ing_offending`]
        };
      }
    }

    // 3. Evaluate vegan constraints
    if (prefs.vegan) {
      constraints.push('diet:vegan');
      const check = this.graph.isVegan(item.id);
      if (!check.vegan) {
        return {
          allowed: false,
          deduction: `Dietary Alert: ${item.name} is not suitable for your Vegan preference. It contains ${check.offendingIngredient}, which contains animal derivatives.`,
          constraintsEvaluated: constraints,
          pathTraced: [`food_${item.id}`, `ing_offending`]
        };
      }
    }

    // 4. Evaluate budget limits
    if (prefs.maxBudget && item.price > prefs.maxBudget) {
      constraints.push(`budget:${prefs.maxBudget}`);
      return {
        allowed: false,
        deduction: `Budget Alert: ${item.name} (₹${item.price}) exceeds your active spending limit of ₹${prefs.maxBudget}.`,
        constraintsEvaluated: constraints,
        pathTraced: []
      };
    }

    return {
      allowed: true,
      deduction: `Culinary Check Passed: ${item.name} satisfies all allergen, dietary, and budget constraints.`,
      constraintsEvaluated: constraints,
      pathTraced: []
    };
  }
}
