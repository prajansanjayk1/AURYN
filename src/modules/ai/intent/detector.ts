import { IntentProbability, Vector } from '../types';
import { VectorEngine } from '../embeddings/engine';

export class IntentDetector {
  private static intentCentroids: Record<string, Vector> = {};
  private static initialized = false;

  private static initializeCentroids(): void {
    if (this.initialized) return;

    // Build dense centroid vectors for each intent
    const intentsDefinition: Record<string, string> = {
      'Greeting': 'hello hi hey greeting good morning evening afternoon welcome concierge greetings yo hello-there',
      'Order': 'order add cart buy get bring dish plate portion menu item select get-me add-to-cart checkout place-order request',
      'Recommendation': 'recommend chef special best popular today suggest signature signature-dish chef-special trending must-try',
      'Complaint': 'angry slow wait delay bad worst hate terrible refund charge delay-warning cold hair issue problem',
      'Question': 'what where when how why menu restaurant wifi password toilet washroom location address phone timing hours',
      'Reservation': 'reserve book table seat reservation party size guests seating time date calendar',
      'Availability': 'available stock out-of-stock have serving serve get-it ready',
      'Pricing': 'price cheap budget cost rupees cash cheap under affordable expensive worth price-limit billing bill ticket check',
      'Ingredients': 'ingredients contains components toppings inside include make-up recipe allergen',
      'Nutrition': 'calories protein calorie carbs fat macro nutrition healthy energy gym',
      'Diet': 'veg vegetarian vegan vegan-only halal gluten dairy nuts lactose wheat peanut safe allergen avoid dairy-free nut-free gluten-free allergy allergic',
      'Farewell': 'bye goodbye see-you see-ya talk-later quit exit leave thanks thank-you',
      'Feedback': 'feedback rating review comment star opinion suggestion improve like love'
    };

    for (const [intentName, text] of Object.entries(intentsDefinition)) {
      this.intentCentroids[intentName] = VectorEngine.vectorizeQuery(text);
    }

    this.initialized = true;
  }

  /**
   * Detects intent probabilities and returns a list of matching intents above threshold.
   */
  public static detect(queryText: string): IntentProbability[] {
    this.initializeCentroids();

    const queryVec = VectorEngine.vectorizeQuery(queryText);
    const results: IntentProbability[] = [];

    for (const [intentName, centroidVec] of Object.entries(this.intentCentroids)) {
      const similarity = VectorEngine.cosineSimilarity(queryVec, centroidVec);
      
      // Intent confidence scoring
      if (similarity > 0.05) {
        results.push({
          intent: intentName as IntentProbability['intent'],
          confidence: Math.round(similarity * 100) / 100
        });
      }
    }

    // Sort by confidence descending
    results.sort((a, b) => b.confidence - a.confidence);

    // Fallback default intent
    if (results.length === 0) {
      results.push({ intent: 'Question', confidence: 0.1 });
    }

    return results;
  }
}
