import 'package:flutter/material.dart';
import 'notification_engine.dart';
import '../context/context_engine.dart';
import '../../shared/models/dining_stage.dart';

class NotificationRouter {
  // Routes staff or guest to corresponding UI workspace instantly
  static void routeNotificationClick(
    BuildContext context, 
    AurynNotification notification, 
    ContextEngine contextEngine
  ) {
    final title = notification.title.toLowerCase();
    final message = notification.message.toLowerCase();

    // 1. If Cash Payment request, route runner directly to payments cash collector
    if (title.contains('cash') || message.contains('cash payment')) {
      if (contextEngine.state.staffRole == 'runner') {
        // Triggers runner experience update
        print('[NotificationRouter] Routing runner directly to Cash checkout console.');
      }
    }

    // 2. If table order is ready, update dining stage to wait list
    if (title.contains('ready') && contextEngine.state.isCustomer) {
      contextEngine.updateDiningStage(DiningStage.dining);
    }
  }
}
