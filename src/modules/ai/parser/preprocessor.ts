import { PreprocessedQuery } from '../types';

const STOP_WORDS = new Set(['a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'arent', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'cant', 'cannot', 'could', 'couldnt', 'did', 'didnt', 'do', 'does', 'doesnt', 'doing', 'dont', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadnt', 'has', 'hasnt', 'have', 'havent', 'having', 'he', 'hed', 'hell', 'hes', 'her', 'here', 'heres', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'hows', 'i', 'id', 'im', 'ive', 'if', 'in', 'into', 'is', 'isnt', 'it', 'its', 'itself', 'lets', 'me', 'more', 'most', 'mustnt', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shant', 'she', 'shed', 'shell', 'shes', 'should', 'shouldnt', 'so', 'some', 'such', 'than', 'that', 'thats', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'theres', 'these', 'they', 'theyd', 'theyll', 'theyre', 'theyve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasnt', 'we', 'wed', 'well', 'were', 'weve', 'werent', 'what', 'whats', 'when', 'whens', 'where', 'wheres', 'which', 'while', 'who', 'whos', 'whom', 'why', 'whys', 'with', 'wont', 'would', 'wouldnt', 'you', 'youd', 'youll', 'youre', 'youve', 'your', 'yours', 'yourself', 'yourselves']);

const EMOJI_MAP: Record<string, string> = {
  '🍔': 'burger slider',
  '🍕': 'pizza',
  '🦞': 'lobster',
  '🍰': 'cake',
  '🍑': 'peach',
  '🥛': 'milk dairy',
  '🧀': 'cheese dairy',
  '🥜': 'nuts peanut',
  '🌶️': 'spicy heat',
  '🌶': 'spicy heat'
};

const SYNONYM_MAP: Record<string, string[]> = {
  'wings': ['wing', 'platter', 'feast', 'buffalo wings', 'bbq wings'],
  'churros': ['dessert', 'sweet', 'churro'],
  'lemonade': ['drink', 'beverage', 'soda', 'basil lemonade'],
  'mojito': ['drink', 'beverage', 'spiced mojito'],
  'mild': ['non-spicy', 'not spicy', 'honey garlic'],
  'spicy': ['hot', 'chili', 'spiciest', 'heat', 'habanero', 'nashville'],
  'allergy': ['allergic', 'intolerance', 'intolerant']
};

const VOCABULARY = [
  'chicken', 'wings', 'sliders', 'brioche', 'bun', 'truffle', 'parmesan', 'fries',
  'mozzarella', 'staves', 'platter', 'buffalo', 'honey', 'garlic', 'habanero',
  'mango', 'chocolate', 'marshmallow', 'skillet', 'churros', 'lemonade', 'mojito',
  'starters', 'mains', 'desserts', 'beverages', 'dairy', 'gluten', 'nuts',
  'shellfish', 'spicy', 'mild'
];

export class TextPreprocessor {
  /**
   * Normalizes Unicode characters and converts emojis.
   */
  public static normalizeUnicodeAndEmojis(text: string): string {
    let normalized = text.normalize('NFC').toLowerCase();
    
    // Replace emojis
    for (const [emoji, term] of Object.entries(EMOJI_MAP)) {
      normalized = normalized.replaceAll(emoji, ` ${term} `);
    }
    return normalized;
  }

  /**
   * Computes the Levenshtein distance between two strings.
   */
  public static levenshtein(s1: string, s2: string): number {
    const track = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
    for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
    for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;

    for (let j = 1; j <= s2.length; j += 1) {
      for (let i = 1; i <= s1.length; i += 1) {
        const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1, // deletion
          track[j - 1][i] + 1, // insertion
          track[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    return track[s2.length][s1.length];
  }

  /**
   * Performs spelling normalization / typo correction against our domain vocabulary.
   */
  public static correctTypos(word: string): string {
    if (word.length <= 3) return word;
    if (VOCABULARY.includes(word)) return word;

    let bestMatch = word;
    let minDistance = 2; // threshold max edit distance

    for (const vocabWord of VOCABULARY) {
      const dist = this.levenshtein(word, vocabWord);
      if (dist < minDistance) {
        minDistance = dist;
        bestMatch = vocabWord;
      }
    }
    return bestMatch;
  }

  /**
   * Hospitality Stemmer/Lemmatizer for our menu context
   */
  public static stem(word: string): string {
    let stemmed = word;
    
    // Plural removals
    if (stemmed.endsWith('s') && !stemmed.endsWith('ss') && stemmed.length > 2) {
      stemmed = stemmed.slice(0, -1);
    }
    
    // Common endings
    if (stemmed.endsWith('ing') && stemmed.length > 5) {
      stemmed = stemmed.slice(0, -3);
    } else if (stemmed.endsWith('ed') && stemmed.length > 4) {
      stemmed = stemmed.slice(0, -2);
    } else if (stemmed.endsWith('er') && stemmed.length > 4) {
      stemmed = stemmed.slice(0, -2);
    }

    // Manual canonical mappings
    const stems: Record<string, string> = {
      'spicier': 'spicy',
      'spiciness': 'spicy',
      'veggie': 'veg',
      'vegetarian': 'veg',
      'sliders': 'slider',
      'pizzas': 'pizza',
      'risottos': 'risotto',
      'beverages': 'beverage',
      'dairyfree': 'dairy-free',
      'glutenfree': 'gluten-free'
    };

    return stems[stemmed] || stemmed;
  }

  /**
   * Generates N-grams from tokens
   */
  public static generateNgrams(tokens: string[]): string[] {
    const ngrams: string[] = [];
    
    // Bi-grams
    for (let i = 0; i < tokens.length - 1; i++) {
      ngrams.push(`${tokens[i]} ${tokens[i+1]}`);
    }

    // Tri-grams
    for (let i = 0; i < tokens.length - 2; i++) {
      ngrams.push(`${tokens[i]} ${tokens[i+1]} ${tokens[i+2]}`);
    }

    return ngrams;
  }

  /**
   * Dynamic Synonym Expansion
   */
  public static expandSynonyms(word: string): string[] {
    const expansions = [word];
    for (const [key, list] of Object.entries(SYNONYM_MAP)) {
      if (key === word) {
        expansions.push(...list);
      } else if (list.includes(word)) {
        expansions.push(key);
      }
    }
    return Array.from(new Set(expansions));
  }

  /**
   * Main Preprocessing Orchestrator
   */
  public static preprocess(queryText: string): PreprocessedQuery {
    const normalized = this.normalizeUnicodeAndEmojis(queryText);
    
    // Tokenization and Punctuation removal
    const rawTokens = normalized
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
      .split(/\s+/)
      .filter(w => w.trim().length > 0);

    // Stop Word Removal & Typo Correction
    const filteredTokens = rawTokens
      .filter(word => !STOP_WORDS.has(word))
      .map(word => this.correctTypos(word));

    // Stemming
    const stemmed = filteredTokens.map(w => this.stem(w));

    // N-grams
    const ngrams = this.generateNgrams(stemmed);

    // Synonym Expansion
    const synonyms: string[] = [];
    stemmed.forEach(w => {
      synonyms.push(...this.expandSynonyms(w));
    });

    return {
      raw: queryText,
      normalized,
      tokens: filteredTokens,
      stemmed,
      ngrams,
      synonyms: Array.from(new Set(synonyms))
    };
  }
}
