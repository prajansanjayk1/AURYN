import { PlanOrchestration, PlanSubtask, MenuItem } from '../types';
import { EntityExtractor } from '../entities/extractor';
import { MemoryManager } from '../memory/manager';
import { HybridRecommender } from '../recommendation/hybrid';

export class PlannerOrchestrator {
  /**
   * Plans and executes a multi-step resolution for complex, multi-turn user requests.
   */
  public static executePlan(
    sessionId: string,
    queryText: string,
    menu: MenuItem[]
  ): { plan: PlanOrchestration; message: string; recommendations: MenuItem[] } {
    const subtasks: PlanSubtask[] = [];
    const memory = MemoryManager.getMemory(sessionId);
    
    // 1. Task: Entity & Constraint Extraction
    subtasks.push({ id: 'extract', description: 'Extract quantities, budget caps, and diet alerts.', status: 'pending' });
    const entities = EntityExtractor.extract(queryText, menu);
    
    // Parse party size and budget limits
    let partySize = 1;
    const sizeMatch = queryText.match(/(?:for|group of)\s*(?:one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s*(?:people|persons|guests|vegetarians|adults)/i) || queryText.match(/(\d+)\s*(?:people|persons|guests|vegetarians)/i);
    if (sizeMatch) {
      const matchWord = sizeMatch[1] || sizeMatch[0];
      const wordNum: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
      partySize = wordNum[matchWord.toLowerCase()] || parseInt(matchWord, 10) || 1;
    }

    const budgetCap = entities.modifiers.includes('budget') || queryText.includes('budget') || queryText.includes('₹') || queryText.includes('rs')
      ? queryText.match(/\d+/g)?.map(Number).find(n => n > 50) || null
      : null;

    subtasks[0].status = 'completed';
    subtasks[0].result = { entities, partySize, budgetCap };

    // 2. Task: Update Diet and Budget Rules in Memory
    subtasks.push({ id: 'rules', description: 'Map constraints to session memory.', status: 'pending' });
    const isVeg = queryText.toLowerCase().includes('veg');
    const isVegan = queryText.toLowerCase().includes('vegan');
    
    const allergies: string[] = [];
    if (queryText.toLowerCase().includes('dairy') || queryText.toLowerCase().includes('milk')) allergies.push('Dairy');
    if (queryText.toLowerCase().includes('nut') || queryText.toLowerCase().includes('peanut')) allergies.push('Nuts');
    if (queryText.toLowerCase().includes('gluten') || queryText.toLowerCase().includes('wheat')) allergies.push('Gluten');

    MemoryManager.updateDietPreferences(sessionId, {
      allergies,
      vegetarian: isVeg ? true : undefined,
      vegan: isVegan ? true : undefined,
      maxBudget: budgetCap ? budgetCap : undefined
    });
    subtasks[1].status = 'completed';

    // 3. Task: Compute Recommended Items Matching Constraints
    subtasks.push({ id: 'retrieve', description: 'Retrieve matching menu combinations.', status: 'pending' });
    const candidates = HybridRecommender.recommend(sessionId, menu);
    subtasks[2].status = 'completed';
    subtasks[2].result = { count: candidates.length };

    // 4. Task: Formulate Group Combinations (if budget cap is defined)
    subtasks.push({ id: 'compose', description: 'Compose balanced selection groups.', status: 'pending' });
    let selection: MenuItem[] = [...candidates];
    let explanation = '';

    if (budgetCap && partySize > 1) {
      explanation = `Plan Executed: Found options for a group of ${partySize} guests within a total budget of ₹${budgetCap}. `;
      
      // Attempt to pick a combination of items whose total sum fits the budget
      const combo: MenuItem[] = [];
      let currentCost = 0;
      
      // Greedy composition: add starters, mains, beverages matching constraints
      const starters = candidates.filter(c => c.category === 'Starters');
      const mains = candidates.filter(c => c.category === 'Mains');
      const beverages = candidates.filter(c => c.category === 'Beverages');

      // Add one beverage per person if within budget
      if (beverages.length > 0) {
        const bev = beverages[0];
        if (currentCost + (bev.price * partySize) <= budgetCap) {
          combo.push(bev);
          currentCost += bev.price * partySize;
        }
      }

      // Add mains to share
      for (const main of mains) {
        if (currentCost + main.price <= budgetCap) {
          combo.push(main);
          currentCost += main.price;
        }
      }

      // Fill remaining budget with starters
      for (const starter of starters) {
        if (currentCost + starter.price <= budgetCap) {
          combo.push(starter);
          currentCost += starter.price;
        }
      }

      if (combo.length > 0) {
        selection = combo;
        explanation += `Recommended combination total: ₹${currentCost} (includes ${combo.map(c => c.name).join(', ')}).`;
      } else {
        explanation += `No shared combination fits under ₹${budgetCap}. Showing individual matching items below.`;
      }
    } else if (budgetCap) {
      explanation = `Plan Executed: Found dishes matching your budget of ₹${budgetCap}.`;
    } else {
      explanation = `Plan Executed: Found recommendations matching your dietary criteria.`;
    }

    subtasks[3].status = 'completed';
    subtasks[3].result = { selectionCount: selection.length };

    return {
      plan: { goal: `Assemble dining set for party size ${partySize} with constraints`, subtasks },
      message: explanation,
      recommendations: selection
    };
  }
}
