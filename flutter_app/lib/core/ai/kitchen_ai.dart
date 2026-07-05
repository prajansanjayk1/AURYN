import 'ai_engine.dart';

class KitchenAI extends AIEngine {
  const KitchenAI(super.context);

  Map<String, dynamic> evaluateKitchenLoad(int activeStartersCount, int activeMainsCount) {
    final double totalLoad = context.kitchenLoad;
    final int estimatedPrepTimeMins = 8 + (activeStartersCount * 2) + (activeMainsCount * 4);
    
    String actionRecommendation = 'Kitchen operations are executing smoothly. Proceed with standard station roster.';
    bool isOverloaded = false;

    if (totalLoad > 75.0) {
      isOverloaded = true;
      actionRecommendation = 'HIGH LOAD ALERT: Kitchen load exceeded 75%. Divert backup prep chef to grill station and suggest quick starters to incoming tables.';
    }

    return {
      'loadPercentage': totalLoad,
      'estimatedMinutes': estimatedPrepTimeMins,
      'isOverloaded': isOverloaded,
      'recommendation': actionRecommendation,
    };
  }
}
