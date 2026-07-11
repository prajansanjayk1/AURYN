import { Vector, MenuItem } from '../types';
import { LRUCache } from '../cache/lru';
import { TextPreprocessor } from '../parser/preprocessor';

export class VectorEngine {
  private static dimensions = 32;
  private static vectorCache = new LRUCache<string, Vector>(500);

  // Keyword mappings for our 32-dimension projection space
  private static featureKeywords: Record<number, string[]> = {
    0: ['starter', 'appetizer', 'fries', 'ring', 'mozzarella', 'snack', 'bite', 'first'], // Starters
    1: ['main', 'wing', 'platter', 'slider', 'combo', 'plate', 'dinner'],                 // Mains
    2: ['dessert', 'churros', 'sweet', 'sugar', 'marshmallow', 'chocolate', 'skillet'],   // Desserts
    3: ['beverage', 'drink', 'lemonade', 'mojito', 'sparkler', 'iced', 'soda'],           // Beverages
    4: ['truffle', 'pepper', 'garlic', 'parmesan', 'seasoning'],                          // Seasonings
    5: ['cheese', 'mozzarella', 'parmesan', 'butter', 'dairy', 'milk'],                   // Cheese/Dairy
    6: ['chicken', 'wing', 'wings', 'sliders'],                                           // Chicken/Meat
    7: ['buffalo', 'honey', 'habanero', 'bbq', 'sauce', 'cayenne', 'spicy'],              // Sauces
    8: ['chocolate', 'marshmallow', 'graham', 'churros', 'cinnamon'],                     // Dessert profile
    9: ['blueberry', 'basil', 'lemon', 'mango', 'lime', 'mint'],                          // Fruits/Herbs
    10: ['spicy', 'hot', 'chili', 'heat', 'spiciest', 'habanero', 'cayenne'],             // Spicy
    11: ['sweet', 'sugar', 'dessert', 'glaze', 'honey'],                                  // Sweet profile
    12: ['savory', 'salty', 'truffle', 'parmesan', 'garlic', 'buffalo'],                  // Savory profile
    13: ['sour', 'lime', 'citrus', 'lemon', 'lemonade'],                                  // Sour profile
    14: ['protein', 'meat', 'chicken', 'wings', 'sliders'],                               // High protein
    15: ['calorie', 'diet', 'light', 'healthy', 'lemonade', 'mojito'],                    // Low calorie
    16: ['expensive', 'luxury', 'premium', 'high-end', 'platter', 'feast'],               // Premium price
    17: ['chef', 'recommendation', 'special', 'masterpiece'],                             // Chef recommendation
    18: ['popular', 'trending', 'star', 'best', 'seller'],                                // Popularity
    19: ['quick', 'fast', 'beverage', 'lemonade', 'fries'],                               // Quick prep
    20: ['gluten', 'wheat', 'bread', 'brioche', 'bun', 'flour', 'churros'],               // Gluten allergen
    21: ['nut', 'peanut', 'cashew', 'almond'],                                            // Nuts allergen
    22: ['dairy', 'milk', 'cheese', 'mozzarella', 'parmesan', 'butter'],                  // Dairy allergen
    23: ['shellfish', 'shrimp', 'crab', 'lobster'],                                       // Shellfish allergen
    24: ['starter', 'fries', 'ring', 'mozzarella', 'staves'],                             // Starter keywords
    25: ['wings', 'platter', 'sliders', 'chicken'],                                       // Mains keywords
    26: ['churros', 'chocolate', 'skillet', 'marshmallow'],                               // Desserts keywords
    27: ['drink', 'soda', 'lemonade', 'mojito'],                                          // Beverages keywords
    28: ['budget', 'cheap', 'affordable', 'under', 'low-cost'],                           // Budget friendly
    29: ['organic', 'natural', 'fresh', 'herb', 'botanical'],                             // Healthy/Organic
    30: ['warm', 'hot', 'baked', 'cooked', 'sliders', 'skillet'],                         // Warm profile
    31: ['cold', 'refreshing', 'iced', 'lemonade', 'mojito']                              // Cold profile
  };

  /**
   * Normalizes a vector to unit length (L2 normalization).
   */
  public static normalize(v: Vector): Vector {
    const norm = Math.sqrt(v.reduce((sum, val) => sum + val * val, 0));
    if (norm === 0) return Array(this.dimensions).fill(0);
    return v.map(val => val / norm);
  }

  /**
   * Generates a 32-dimensional dense vector for a query.
   */
  public static vectorizeQuery(queryText: string): Vector {
    const cached = this.vectorCache.get(queryText);
    if (cached) return cached;

    const prep = TextPreprocessor.preprocess(queryText);
    const words = new Set([...prep.stemmed, ...prep.synonyms]);

    const vector: number[] = Array(this.dimensions).fill(0);

    for (let d = 0; d < this.dimensions; d++) {
      const keywords = this.featureKeywords[d];
      let score = 0;
      keywords.forEach(kw => {
        if (words.has(kw)) score += 1.0;
        // Search in N-grams for compound matching
        prep.ngrams.forEach(ngram => {
          if (ngram.includes(kw)) score += 0.5;
        });
      });
      vector[d] = score;
    }

    const normalized = this.normalize(vector);
    this.vectorCache.set(queryText, normalized);
    return normalized;
  }

  /**
   * Generates a 32-dimensional dense vector for a MenuItem.
   */
  public static vectorizeMenuItem(item: MenuItem): Vector {
    const vector: number[] = Array(this.dimensions).fill(0);

    // Feature mappings from MenuItem schema
    const nameLower = item.name.toLowerCase();
    const descLower = item.description.toLowerCase();
    const ingredients = item.ingredients.map((i: string) => i.toLowerCase());
    const allergens = item.allergens.map((a: string) => a.toLowerCase());

    // Category projections
    if (item.category === 'Starters') vector[0] = 1;
    if (item.category === 'Mains') vector[1] = 1;
    if (item.category === 'Desserts') vector[2] = 1;
    if (item.category === 'Beverages') vector[3] = 1;

    // Ingredient mapping
    if (ingredients.some((i: string) => i.includes('truffle') || i.includes('pepper') || i.includes('garlic'))) vector[4] = 1;
    if (ingredients.some((i: string) => i.includes('cheese') || i.includes('mozzarella') || i.includes('parmigiano') || i.includes('butter'))) vector[5] = 1;
    if (ingredients.some((i: string) => i.includes('chicken') || i.includes('wing'))) vector[6] = 1;
    if (ingredients.some((i: string) => i.includes('buffalo') || i.includes('sauce') || i.includes('habanero') || i.includes('cayenne'))) vector[7] = 1;
    if (ingredients.some((i: string) => i.includes('chocolate') || i.includes('marshmallow'))) vector[8] = 1;
    if (ingredients.some((i: string) => i.includes('blueberry') || i.includes('lemon') || i.includes('mango') || i.includes('lime'))) vector[9] = 1;

    // Profiles
    if (descLower.includes('spicy') || nameLower.includes('chili')) vector[10] = 1;
    if (item.category === 'Desserts') vector[11] = 1;
    if (item.category === 'Mains' || item.category === 'Starters') vector[12] = 1;
    if (descLower.includes('lime') || descLower.includes('citrus')) vector[13] = 1;

    // Calories & Protein
    if (item.protein && parseInt(item.protein) > 20) vector[14] = 1;
    if (item.calories && item.calories < 400) vector[15] = 1;

    // Pricing & Recommendations
    if (item.price > 1000) vector[16] = 1;
    if (item.isChefRecommendation) vector[17] = 1;
    if (item.isPopular) vector[18] = 1;
    if (item.prepTime < 10) vector[19] = 1;

    // Allergen projection
    if (allergens.includes('gluten')) vector[20] = 1;
    if (allergens.includes('nuts')) vector[21] = 1;
    if (allergens.includes('dairy')) vector[22] = 1;
    if (allergens.includes('shellfish')) vector[23] = 1;

    // Keyword containment
    for (let d = 24; d < this.dimensions; d++) {
      const keywords = this.featureKeywords[d];
      let score = 0;
      keywords.forEach(kw => {
        if (nameLower.includes(kw) || descLower.includes(kw) || ingredients.some((i: string) => i.includes(kw))) {
          score += 1.0;
        }
      });
      vector[d] = score;
    }

    return this.normalize(vector);
  }

  /**
   * Performs batch vectorization of MenuItems.
   */
  public static batchVectorize(items: MenuItem[]): Map<string, Vector> {
    const map = new Map<string, Vector>();
    items.forEach(item => {
      map.set(item.id, this.vectorizeMenuItem(item));
    });
    return map;
  }

  /**
   * Distance Metrics: Cosine Similarity
   */
  public static cosineSimilarity(v1: Vector, v2: Vector): number {
    const dot = v1.reduce((sum, val, idx) => sum + val * v2[idx], 0);
    const mag1 = Math.sqrt(v1.reduce((sum, val) => sum + val * val, 0));
    const mag2 = Math.sqrt(v2.reduce((sum, val) => sum + val * val, 0));
    if (mag1 === 0 || mag2 === 0) return 0;
    return dot / (mag1 * mag2);
  }

  /**
   * Distance Metrics: Dot Product
   */
  public static dotProduct(v1: Vector, v2: Vector): number {
    return v1.reduce((sum, val, idx) => sum + val * v2[idx], 0);
  }

  /**
   * Distance Metrics: Euclidean Distance
   */
  public static euclideanDistance(v1: Vector, v2: Vector): number {
    return Math.sqrt(v1.reduce((sum, val, idx) => sum + Math.pow(val - v2[idx], 2), 0));
  }

  /**
   * Distance Metrics: Manhattan Distance
   */
  public static manhattanDistance(v1: Vector, v2: Vector): number {
    return v1.reduce((sum, val, idx) => sum + Math.abs(val - v2[idx]), 0);
  }
}
