import 'ai_engine.dart';

class ConciergeAI extends AIEngine {
  const ConciergeAI(super.context);

  // Return text recommendation and cart action prompts
  Map<String, dynamic> generateMenuSuggestion({
    required bool isVegetarian,
    required List<String> userAllergens,
    required double budgetLimit,
  }) {
    String message = 'Welcome back, ${context.sessionPreferences['guestName']}. ';
    final List<String> suggestions = [];

    if (isVegetarian) {
      suggestions.add('Truffle Burrata Pizza (₹1200)');
      suggestions.add('Edamame Truffle Gyoza (₹490)');
      message += 'For our vegetarian guests, I highly recommend starting with our delicate Truffle Gyoza, followed by our artisan sourdough Burrata Pizza.';
    } else {
      suggestions.add('Wagyu Beef Sliders (₹950)');
      suggestions.add('Saffron Lobster Risotto (₹1850)');
      message += 'I recommend our signature poached Saffron Lobster Risotto or our flame-seared Wagyu Beef Sliders to elevate your dinner experience.';
    }

    if (userAllergens.contains('Dairy')) {
      suggestions.removeWhere((item) => item.contains('Pizza') || item.contains('Sliders') || item.contains('Risotto'));
      message += '\n(Note: I have filtered out dairy items for your safety, such as the Burrata Pizza.)';
    }

    return {
      'message': message,
      'recommendations': suggestions,
      'weatherContext': 'Since it is a ${context.weather.toLowerCase()} ${context.timeOfDay.toLowerCase()}, a chilled herbal sparkler would pair beautifully.',
    };
  }
}
