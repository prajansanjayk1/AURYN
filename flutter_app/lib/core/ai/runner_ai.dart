import 'ai_engine.dart';

class RunnerAI extends AIEngine {
  const RunnerAI(super.context);

  Map<String, dynamic> optimizeRosterRoute(String destinationTable, List<String> activeTablesWithReadyOrders) {
    // Proximity route suggestion: Kitchen -> Ready Orders -> Destination Table
    final List<String> optimalPath = ['Kitchen'];
    
    // Sort tables by proximity (mock: nearby ready tables first)
    final nearby = activeTablesWithReadyOrders.take(2).map((t) => 'Table $t').toList();
    optimalPath.addAll(nearby);
    optimalPath.add('Table $destinationTable');

    final double distanceMeters = 15.0 + (nearby.length * 10.0) + 8.0;
    final int estimatedSteps = (distanceMeters * 1.45).round();

    return {
      'pathVector': optimalPath,
      'distanceMeters': distanceMeters,
      'estimatedSteps': estimatedSteps,
      'dispatchGuide': 'Deliver ready starters to intermediate tables on route to minimize step count.',
    };
  }
}
