import 'ai_engine.dart';

class MarketingAI extends AIEngine {
  const MarketingAI(super.context);

  Map<String, dynamic> generateCampaignRecommendations(List<String> surplusIngredients) {
    String promotedItem = 'Matcha Pistachio Opera Cake';
    String rationale = 'Surplus almonds and dark chocolate stock buffer.';

    if (surplusIngredients.contains('Burrata Cheese')) {
      promotedItem = 'Truffle Burrata Pizza';
      rationale = 'Burrata cheese stock is high (+200% above safety threshold).';
    } else if (surplusIngredients.contains('A5 Wagyu Beef')) {
      promotedItem = 'Wagyu Beef Sliders';
      rationale = 'Premium Wagyu stock is optimal for quick grill turnover.';
    }

    return {
      'recommendedDish': promotedItem,
      'campaignCode': 'AURYNGLOW',
      'discountPercent': 10,
      'rationale': rationale,
      'campaignAction': 'Deploy 10% loyalty discount code to all dine-in sessions active after 7 PM.',
    };
  }
}
