import { EntityExtraction, MenuItem } from '../types';
import { TextPreprocessor } from '../parser/preprocessor';

export class EntityExtractor {
  private static sizeKeywords = {
    small: ['small', 'mini', 'half'],
    regular: ['regular', 'standard', 'medium', 'normal'],
    large: ['large', 'big', 'full', 'double'],
    combo: ['combo', 'meal', 'set', 'deal']
  };

  private static quantityWords: Record<string, number> = {
    one: 1, single: 1, a: 1, an: 1,
    two: 2, double: 2, couple: 2,
    three: 3, triple: 3,
    four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10
  };

  /**
   * Main entity extraction entrypoint
   */
  public static extract(queryText: string, menu: MenuItem[]): EntityExtraction {
    const preprocessed = TextPreprocessor.preprocess(queryText);
    const tokens = preprocessed.tokens;
    const stemmed = preprocessed.stemmed;

    const extraction: EntityExtraction = {
      quantity: 1,
      modifiers: [],
      negations: [],
      drinks: [],
      specialRequests: []
    };

    // 1. Quantity Extraction
    let quantityFound = false;
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const stem = stemmed[i];

      // Direct integer parse
      const parsedInt = parseInt(token, 10);
      if (!isNaN(parsedInt) && parsedInt > 0) {
        extraction.quantity = parsedInt;
        quantityFound = true;
        break;
      }

      // Word number matches
      if (this.quantityWords[token] !== undefined) {
        extraction.quantity = this.quantityWords[token];
        quantityFound = true;
        break;
      }
      if (this.quantityWords[stem] !== undefined) {
        extraction.quantity = this.quantityWords[stem];
        quantityFound = true;
        break;
      }
    }

    // 2. Size Extraction
    for (const [size, keywords] of Object.entries(this.sizeKeywords)) {
      if (keywords.some(kw => tokens.includes(kw) || stemmed.includes(kw))) {
        extraction.size = size as EntityExtraction['size'];
        break;
      }
    }

    // 3. Negations extraction (e.g. "without onions", "no dairy")
    const negationKeywords = ['no', 'without', 'exclude', 'free', 'remove', 'avoid', 'dont'];
    const queryWords = queryText.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(/\s+/);
    
    for (let i = 0; i < queryWords.length; i++) {
      if (negationKeywords.includes(queryWords[i]) && i < queryWords.length - 1) {
        // Add the next word as a negation target
        extraction.negations.push(queryWords[i + 1]);
        if (i < queryWords.length - 2 && !['and', 'or', 'with'].includes(queryWords[i+2])) {
          extraction.negations.push(queryWords[i + 2]);
        }
      }
    }

    // 4. Food & Drink Item extraction using substring overlaps
    for (const item of menu) {
      const nameLower = item.name.toLowerCase();
      
      // Fuzzy matching item name in normalized text
      if (preprocessed.normalized.includes(nameLower)) {
        if (item.category === 'Beverages') {
          extraction.drinks.push(item.name);
        } else {
          extraction.foodItem = item.name;
        }
      } else {
        // Try matching core parts of the name
        const parts = nameLower.split(/\s+/).filter((p: string) => p.length > 3);
        if (parts.length > 0 && parts.every((part: string) => preprocessed.normalized.includes(part))) {
          if (item.category === 'Beverages') {
            extraction.drinks.push(item.name);
          } else {
            extraction.foodItem = item.name;
          }
        }
      }
    }

    // 5. Modifiers extraction (e.g., "extra spicy", "less cheese")
    const modifiersKeywords = ['extra', 'more', 'less', 'spicy', 'hot', 'cold', 'warm', 'baked', 'sweet', 'double'];
    tokens.forEach(token => {
      if (modifiersKeywords.includes(token) && !extraction.negations.includes(token)) {
        extraction.modifiers.push(token);
      }
    });

    // 6. Special Requests
    const specialKeywords = ['urgent', 'fast', 'quick', 'allergy', 'allergic', 'birthday', 'anniversary', 'kid', 'child', 'baby'];
    tokens.forEach(token => {
      if (specialKeywords.includes(token)) {
        extraction.specialRequests.push(token);
      }
    });

    return extraction;
  }
}
