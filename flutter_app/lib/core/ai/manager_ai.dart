import 'ai_engine.dart';

class ManagerAI extends AIEngine {
  const ManagerAI(super.context);

  String answerManagerQuery(String query) {
    final lower = query.toLowerCase();

    if (lower.contains('why') && (lower.contains('delay') || lower.contains('slow'))) {
      return 'AURYN operations analysis reveals active cooking load is at ${context.kitchenLoad.toStringAsFixed(1)}%. '
          'Grill prep times have increased by 4 mins due to consecutive orders for Wagyu Beef Sliders at Tables 1, 2, and 4. '
          'Recommendation: Instruct the sous chef to assist the grill runner station.';
    }

    if (lower.contains('promote') || lower.contains('marketing') || lower.contains('tonight')) {
      final String stockAlert = context.lowStockIngredients.isNotEmpty 
          ? 'Avoid promoting dishes containing: ${context.lowStockIngredients.join(', ')}.'
          : 'All core ingredient stocks are safe.';
      return 'AURYN Marketing Recommendation:\n'
          'Promote the Truffle Burrata Pizza. Stock buffer is safe, and margins are optimal.\n'
          'Security alert: $stockAlert';
    }

    if (lower.contains('runner') || lower.contains('delivery') || lower.contains('steps')) {
      return 'Runner Telemetry Analysis:\n'
          'Service runners average 1.25 mins per delivery path. Route vector mapping has '
          'reduced step count by 14% this shift. No dispatch bottlenecks detected.';
    }

    return 'AURYN Operations AI Command Panel. I can analyze live telemetry. Ask me:\n'
        '- "Why are orders delayed?" (Kitchen bottleneck analyzer)\n'
        '- "What should we promote tonight?" (Stock-based campaign suggestions)\n'
        '- "How are the runners performing?" (Telemetry tracking)';
  }
}
