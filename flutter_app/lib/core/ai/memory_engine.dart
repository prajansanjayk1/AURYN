import 'dart:async';
import '../../shared/models/dining_stage.dart';

class AmbientAIEvent {
  final String title;
  final String message;
  final String priority;

  const AmbientAIEvent({
    required this.title,
    required this.message,
    required this.priority,
  });
}

class MemoryEngine {
  final StreamController<AmbientAIEvent> _eventController = StreamController<AmbientAIEvent>.broadcast();

  Stream<AmbientAIEvent> get ambientEvents => _eventController.stream;

  // Evaluates table state and triggers proactive alerts
  void evaluateAmbientRules({
    required String tableId,
    required DiningStage currentStage,
    required int orderWaitMinutes,
    required double kitchenLoad,
    required bool runnerIsIdle,
  }) {
    // Rule 1: Customer waiting > 8 minutes
    if (currentStage == DiningStage.waiting && orderWaitMinutes >= 8) {
      _eventController.add(AmbientAIEvent(
        title: 'Table $tableId Delay Update',
        message: 'Kitchen is slightly busy today. Your order is being finalized and is estimated in 3 minutes.',
        priority: 'high',
      ));
    }

    // Rule 2: Runner idle
    if (runnerIsIdle) {
      _eventController.add(const AmbientAIEvent(
        title: 'Runner Dispatch Vector',
        message: 'Runner idle detected. Assigning nearby ready delivery for Table 3 to optimize step count.',
        priority: 'medium',
      ));
    }

    // Rule 3: Kitchen overloaded
    if (kitchenLoad > 75.0) {
      _eventController.add(AmbientAIEvent(
        title: 'Manager Operations Warning',
        message: 'Kitchen load is critical (${kitchenLoad.toStringAsFixed(0)}%). Diverting backup prep chef.',
        priority: 'critical',
      ));
    }

    // Rule 4: Suggest dessert when finished
    if (currentStage == DiningStage.finishing) {
      _eventController.add(const AmbientAIEvent(
        title: 'Dessert Pairing',
        message: 'Would you like to try our signature artisan Smoked Rose Pistachio Kulfi to conclude your dining session?',
        priority: 'low',
      ));
    }
  }

  void dispose() {
    _eventController.close();
  }
}
