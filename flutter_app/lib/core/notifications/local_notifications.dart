import 'notification_engine.dart';

class LocalNotifications {
  final NotificationEngine _engine;

  LocalNotifications(this._engine);

  void triggerLocalBanner(String title, String message, NotificationPriority priority) {
    _engine.dispatchNotification(
      title: title,
      message: message,
      priority: priority,
    );
  }
}
