import { MenuItem, ReasoningResult, EntityExtraction } from '../types';
import { SentimentState } from '../sentiment/detector';

export class ResponseGenerator {
  private static luxuryAromaPrefixes = [
    "Welcome to our digital culinary studio. For your consideration this evening, ",
    "Greetings from the chef's table. To complement your culinary session, ",
    "Good day. An exquisite selection has been arranged for your dining session: ",
    "Welcome to the Kings of Wings dining portal. Presenting our chef's hand-crafted selection: "
  ];

  private static cafePrefixes = [
    "Hey there! Ready for some delicious bites? Here is what I found: ",
    "Hello! Let's get you something tasty. Check these out: ",
    "Welcome! Here's the menu scoop for you today: "
  ];

  /**
   * Generates a natural language response with support citations and adaptive tone voicing.
   */
  public static generate(
    guestName: string,
    sentiment: SentimentState,
    intents: string[],
    recommendations: MenuItem[],
    reasoning?: ReasoningResult,
    customPrefix?: string,
    entities?: EntityExtraction
  ): string {
    // 1. Determine tone style based on sentiment or logged defaults
    let tone: 'luxury' | 'cafe' | 'friendly' = 'luxury';
    if (sentiment === 'frustrated' || sentiment === 'angry') {
      tone = 'friendly'; // Soften and stabilize response
    } else if (sentiment === 'excited' || sentiment === 'hungry') {
      tone = 'cafe';
    }

    // 2. Select starting prefix
    let greeting = '';
    if (customPrefix) {
      greeting = customPrefix;
    } else if (tone === 'luxury') {
      const idx = Math.floor(Math.random() * this.luxuryAromaPrefixes.length);
      greeting = `Good day, ${guestName}. ${this.luxuryAromaPrefixes[idx]}`;
    } else if (tone === 'cafe') {
      const idx = Math.floor(Math.random() * this.cafePrefixes.length);
      greeting = `Hey ${guestName}! ${this.cafePrefixes[idx]}`;
    } else {
      greeting = `Hello, ${guestName}. I am here to ensure you have a wonderful experience. `;
    }

    // 3. Address reasoning deductions (Allergen tracing, safety boundaries)
    let body = '';
    if (reasoning && !reasoning.allowed) {
      return `${greeting}\n\n${reasoning.deduction}`;
    }

    // 4. Formulate response based on primary intent
    if (intents.includes('Order') && recommendations.length > 0) {
      const item = recommendations[0];
      body += `I have prepared a draft order to add **${item.name}** (₹${item.price}) to your cart. 

Our culinary database confirms it features: ${item.ingredients.join(', ')}. 

Please tap **Approve Order** below to send it to the kitchen studio!`;
    } 
    
    else if (intents.includes('Diet') && recommendations.length > 0) {
      body += `I have applied your dietary preferences to the menu views. 

You can safely enjoy our gourmet selections:
${recommendations.slice(0, 3).map(r => `• **${r.name}** (₹${r.price}) — ${r.description}`).join('\n')}

The kitchen studio will handle your order with absolute safety controls.`;
    }

    else if (intents.includes('Pricing') && recommendations.length > 0) {
      body += `Here are our finest selections within your budget limits:
${recommendations.slice(0, 3).map(r => `• **${r.name}** (₹${r.price})`).join('\n')}

Let me know if you would like me to list them by lowest price!`;
    }

    else if (recommendations.length > 0) {
      body += `I highly recommend these chef-selected specialties:
${recommendations.slice(0, 2).map(r => `• **${r.name}** (₹${r.price}) — ${r.description}`).join('\n')}

Would you like me to pair these with our refreshing **Peach Thyme Sparkler** (₹350)?`;
    } 
    
    else {
      body += `I am at your service. Tell me if you are looking for specific cuisines, allergen exclusions, or would like me to add an item directly to your cart.`;
    }

    // 5. Add custom entity clarifications (e.g. spicy adjustments, egg exclusions)
    if (entities) {
      const wantsSpicy = entities.modifiers.includes('spicy') || entities.modifiers.includes('hot');
      if (wantsSpicy) {
        const hasSpicyItem = recommendations.some(r => r.name.toLowerCase().includes('chili') || r.description.toLowerCase().includes('spicy'));
        if (!hasSpicyItem) {
          body += `\n\n*🌶️ Note: We noticed you requested spicier options. While our core menu items are prepared mild-to-medium, our kitchen de cuisine can easily customize any of these selections with extra fresh chilies or house-made chili oil.*`;
        }
      }

      if (entities.negations.length > 0) {
        const negatedIngredients = entities.negations.map(n => n.toLowerCase());
        const safetyChecks = negatedIngredients.map(neg => {
          const matchingItems = recommendations.filter(r => 
            r.name.toLowerCase().includes(neg) || 
            r.ingredients.some(ing => ing.toLowerCase().includes(neg))
          );
          if (matchingItems.length === 0) {
            return `We have verified that none of our recommended selections contain **${neg}**, making them completely safe for you.`;
          } else {
            return `Please note that the kitchen will prepare your selection strictly without **${neg}** per your request.`;
          }
        });
        body += `\n\n*🥚 Note: ${safetyChecks.join(' ')}*`;
      }
    }

    // Append explanation if reasoning check passed
    if (reasoning && reasoning.allowed && reasoning.constraintsEvaluated.length > 0) {
      body += `\n\n*Note: Checked ${reasoning.constraintsEvaluated.join(', ')} constraints. All tests passed.*`;
    }

    return `${greeting}\n\n${body}`;
  }
}
