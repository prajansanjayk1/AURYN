import '../context/context_engine.dart';

class HospitalityContext {
  final String weather;
  final String timeOfDay;
  final double kitchenLoad;
  final List<String> lowStockIngredients;
  final Map<String, dynamic> sessionPreferences;

  const HospitalityContext({
    required this.weather,
    required this.timeOfDay,
    required this.kitchenLoad,
    required this.lowStockIngredients,
    required this.sessionPreferences,
  });

  factory HospitalityContext.current(AurynContext appCtx, double load, List<String> lowStock) {
    return HospitalityContext(
      weather: 'Pleasant',
      timeOfDay: DateTime.now().hour < 12 
          ? 'Morning' 
          : (DateTime.now().hour < 17 ? 'Afternoon' : 'Evening'),
      kitchenLoad: load,
      lowStockIngredients: lowStock,
      sessionPreferences: {
        'vegetarian': false,
        'allergies': <String>[],
        'guestName': appCtx.guestName ?? 'Guest',
      },
    );
  }
}

class AIEngine {
  final HospitalityContext context;

  const AIEngine(this.context);
}
