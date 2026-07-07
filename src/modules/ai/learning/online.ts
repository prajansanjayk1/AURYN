import { MenuItem } from '../types';
import { RankingEngine } from '../ranking/engine';

interface AnonymousLearningRecord {
  timestamp: string;
  action: 'cart_add' | 'cart_remove' | 'order_checkout';
  itemId: string;
  category: string;
  price: number;
}

export class OnlineLearningAdapter {
  private static localLearningLog: AnonymousLearningRecord[] = [];

  /**
   * Tracks an interaction and updates model weights dynamically based on user feedback loop.
   */
  public static trackAction(
    action: 'cart_add' | 'cart_remove' | 'order_checkout',
    item: MenuItem
  ): void {
    // 1. Log anonymous telemetry record
    const record: AnonymousLearningRecord = {
      timestamp: new Date().toISOString(),
      action,
      itemId: item.id,
      category: item.category,
      price: item.price
    };
    
    this.localLearningLog.push(record);
    if (this.localLearningLog.length > 500) {
      this.localLearningLog.shift(); // Cap local history
    }

    // 2. Adjust Ranking weights dynamically based on user interaction (Online Learning)
    const currentWeights = RankingEngine.getWeights();

    if (action === 'cart_add' || action === 'order_checkout') {
      // User is interacting positively with recommendations:
      // Reward preference weights & semantic matching weights
      RankingEngine.configureWeights({
        preference: Math.min(0.40, currentWeights.preference + 0.01),
        semantic: Math.min(0.50, currentWeights.semantic + 0.005)
      });
    } else if (action === 'cart_remove') {
      // User removed recommended item:
      // Lower preference weight (rely more on direct queries)
      RankingEngine.configureWeights({
        preference: Math.max(0.05, currentWeights.preference - 0.02)
      });
    }
  }

  /**
   * Returns current learning logs for analytics diagnostics.
   */
  public static getLearningHistory(): AnonymousLearningRecord[] {
    return this.localLearningLog;
  }
}
