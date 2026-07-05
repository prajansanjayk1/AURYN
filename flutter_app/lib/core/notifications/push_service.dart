import 'package:supabase_flutter/supabase_flutter.dart';
import 'notification_engine.dart';

class PushService {
  final SupabaseClient _client;
  final NotificationEngine _engine;
  RealtimeChannel? _channel;

  PushService(this._client, this._engine);

  // Subscribe to public.notifications table updates
  void initializePushSync(String targetRestaurantId) {
    _channel = _client.channel('public:notifications')
      .onPostgresChanges(
        event: PostgresChangeEvent.insert,
        schema: 'public',
        table: 'notifications',
        callback: (payload) {
          final record = payload.newRecord;
          if (record.isNotEmpty) {
            final title = record['title'] ?? 'Operations Notice';
            final message = record['message'] ?? '';
            final type = record['type'] ?? 'info';

            NotificationPriority priority = NotificationPriority.medium;
            if (type == 'warning' || type == 'alert') {
              priority = NotificationPriority.high;
            }

            _engine.dispatchNotification(
              title: title,
              message: message,
              priority: priority,
            );
          }
        },
      )
      .subscribe();
  }

  void dispose() {
    if (_channel != null) {
      _client.removeChannel(_channel!);
    }
  }
}
