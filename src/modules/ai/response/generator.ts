import { MenuItem, ReasoningResult } from '../types';
import { SentimentState } from '../sentiment/detector';

export class ResponseGenerator {
  private static luxuryAromaPrefixes = [
    "Welcome to our digital culinary studio. For your consideration this evening, ",
    "Greetings from the chef's table. To complement your culinary session, ",
    "Welcome to the AURYN dining portal. Presenting our chef's hand-crafted selection: ",
    "Good day. An exquisite selection has been arranged for your dining session: "
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
    customPrefix?: string
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

    // Append explanation if reasoning check passed
    if (reasoning && reasoning.allowed && reasoning.constraintsEvaluated.length > 0) {
      body += `\n\n*Note: Checked ${reasoning.constraintsEvaluated.join(', ')} constraints. All tests passed.*`;
    }

    return `${greeting}\n\n${body}`;
  }
}
