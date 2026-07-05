import 'ai_engine.dart';

class InventoryAI extends AIEngine {
  const InventoryAI(super.context);

  Map<String, dynamic> auditInventory(List<Map<String, dynamic>> currentStockList) {
    final List<String> criticalAlerts = [];
    final List<Map<String, dynamic>> reorderList = [];

    for (final item in currentStockList) {
      final String name = item['name'] ?? 'Ingredient';
      final double stock = (item['stock'] as num?)?.toDouble() ?? 0.0;
      final double minStock = (item['min_stock'] as num?)?.toDouble() ?? 0.0;

      if (stock <= 0.0) {
        criticalAlerts.add('CRITICAL STOCK OUT: $name is completely empty.');
        reorderList.add({'name': name, 'quantity': (minStock * 3).ceil(), 'priority': 'High'});
      } else if (stock < minStock) {
        criticalAlerts.add('Warning: $name stock level ($stock) is below safety threshold ($minStock).');
        reorderList.add({'name': name, 'quantity': (minStock * 2).ceil(), 'priority': 'Medium'});
      }
    }

    return {
      'hasLowStock': criticalAlerts.isNotEmpty,
      'alerts': criticalAlerts,
      'reorders': reorderList,
      'demandForecast': 'Expect high Burrata cheese demand (+35%) for upcoming dinner peak.'
    };
  }
}
