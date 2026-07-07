import { SessionMemory, UserPreferences } from '../types';

export class MemoryManager {
  private static store: Map<string, SessionMemory> = new Map();

  /**
   * Retrieves or initializes memory for a specific dining session.
   */
  public static getMemory(sessionId: string): SessionMemory {
    let memory = this.store.get(sessionId);
    if (!memory) {
      memory = {
        conversationHistory: [],
        userPreferences: {
          allergies: [],
          preferredCuisines: [],
          preferredCategories: [],
          heatTolerance: 'medium',
          spendSum: 0,
          ordersCount: 0,
          rejectedDishes: []
        }
      };
      this.store.set(sessionId, memory);
    }
    return memory;
  }

  /**
   * Saves/Updates memory for a session.
   */
  public static saveMemory(sessionId: string, memory: SessionMemory): void {
    this.store.set(sessionId, memory);
  }

  /**
   * Records a user interaction and compresses history if it exceeds limit.
   */
  public static recordInteraction(
    sessionId: string,
    role: 'user' | 'assistant',
    query: string,
    response: string
  ): void {
    const memory = this.getMemory(sessionId);
    
    // Add to history
    memory.conversationHistory.push({ role, query, response });
    
    // Memory compression: threshold at 5 turns (10 individual role entries)
    if (memory.conversationHistory.length > 8) {
      this.compressMemory(memory);
    }

    this.saveMemory(sessionId, memory);
  }

  /**
   * Compresses conversational history into a semantic summary, purging oldest turns.
   */
  private static compressMemory(memory: SessionMemory): void {
    const oldTurns = memory.conversationHistory.slice(0, 4);
    
    // Generate simple summary description
    let summaryText = memory.longTermSummary ? `${memory.longTermSummary}; ` : 'Past exchanges: ';
    const topics = oldTurns
      .filter(t => t.role === 'user')
      .map(t => t.query.toLowerCase())
      .map(q => {
        if (q.includes('order') || q.includes('add')) return 'ordering';
        if (q.includes('veg') || q.includes('allergy')) return 'diet preference';
        if (q.includes('recommend') || q.includes('best')) return 'recommendations';
        return 'general queries';
      });
    
    const uniqueTopics = Array.from(new Set(topics));
    summaryText += `Guest queried about ${uniqueTopics.join(', ')}.`;

    memory.longTermSummary = summaryText;
    
    // Discard compressed turns
    memory.conversationHistory = memory.conversationHistory.slice(4);
  }

  /**
   * Adds allergen or diet flags to preference profile
   */
  public static updateDietPreferences(
    sessionId: string,
    diet: { allergies?: string[]; vegetarian?: boolean; vegan?: boolean; maxBudget?: number }
  ): void {
    const memory = this.getMemory(sessionId);
    const prefs = memory.userPreferences;

    if (diet.allergies) {
      diet.allergies.forEach(allergy => {
        if (!prefs.allergies.includes(allergy)) prefs.allergies.push(allergy);
      });
    }

    if (diet.vegetarian !== undefined) prefs.vegetarian = diet.vegetarian;
    if (diet.vegan !== undefined) prefs.vegan = diet.vegan;
    if (diet.maxBudget !== undefined) prefs.maxBudget = diet.maxBudget;

    this.saveMemory(sessionId, memory);
  }
}
