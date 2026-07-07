export type SentimentState = 'happy' | 'confused' | 'excited' | 'angry' | 'frustrated' | 'hungry' | 'sarcastic' | 'uncertain' | 'urgent' | 'neutral';

export class SentimentDetector {
  private static sentimentLexicon: Record<SentimentState, string[]> = {
    happy: ['great', 'love', 'amazing', 'good', 'excellent', 'thanks', 'thank you', 'appreciate', 'cool', 'perfect', 'yummy', 'delicious'],
    confused: ['why', 'how come', 'what does', 'dont understand', 'explain', 'confused', 'lost', 'help me understand', 'where is'],
    excited: ['wow', 'hype', 'awesome', 'cant wait', 'stunning', 'incredible', 'eager', 'best', 'yay', 'superb'],
    angry: ['worst', 'hate', 'terrible', 'refund', 'charge', 'complaint', 'awful', 'disgusting', 'rude', 'poor'],
    frustrated: ['slow', 'wait', 'delay', 'boring', 'annoying', 'still waiting', 'where is my', 'taking forever', 'stuck'],
    hungry: ['starving', 'hungry', 'feed', 'eat', 'craving', 'delicious', 'mouth watering', 'grumblings', 'food'],
    sarcastic: ['obviously', 'really', 'surely', 'thanks a lot', 'genius', 'whatever', 'slowest ever', 'so fast'],
    uncertain: ['maybe', 'not sure', 'perhaps', 'might', 'possibly', 'thinking', 'don\'t know'],
    urgent: ['quick', 'fast', 'hurry', 'rush', 'asap', 'immediately', 'urgent', 'speedy', 'now'],
    neutral: []
  };

  /**
   * Scans a query text and computes matches to classify user's sentiment state.
   */
  public static detect(queryText: string): SentimentState {
    const lower = queryText.toLowerCase();
    let bestSentiment: SentimentState = 'neutral';
    let maxMatches = 0;

    for (const [state, words] of Object.entries(this.sentimentLexicon)) {
      if (state === 'neutral') continue;
      
      let matches = 0;
      words.forEach(word => {
        if (lower.includes(word)) {
          matches += 1;
        }
      });

      if (matches > maxMatches) {
        maxMatches = matches;
        bestSentiment = state as SentimentState;
      }
    }

    return bestSentiment;
  }
}
