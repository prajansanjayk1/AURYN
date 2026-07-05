import 'package:supabase_flutter/supabase_flutter.dart';
import 'offline_queue.dart';

class SyncEngine {
  final SupabaseClient _client;
  final OfflineQueue _queue = OfflineQueue();
  bool _isSyncing = false;

  SyncEngine(this._client);

  // Trigger sync process when connection recovers
  Future<void> synchronizeOfflineQueue() async {
    if (_isSyncing) return;
    _isSyncing = true;

    try {
      final queue = await _queue.getQueue();
      if (queue.isEmpty) {
        _isSyncing = false;
        return;
      }

      print('[SyncEngine] Found ${queue.length} offline actions to synchronize.');

      for (final request in queue) {
        if (request.path == '/api/order/create') {
          // Push order insert directly to Supabase
          final body = request.body;
          await _client.from('orders').insert({
            'id': body['orderId'] ?? 'order-${request.id}',
            'session_id': body['sessionId'],
            'table_id': body['tableId'],
            'items': body['items'],
            'status': 'placed',
            'created_at': request.timestamp.toIso8601String(),
            'updated_at': request.timestamp.toIso8601String(),
          });
        }
      }

      // Clear sync queue on success
      await _queue.clearQueue();
      print('[SyncEngine] Synchronization complete.');
    } catch (e) {
      print('[SyncEngine] Synchronization failed, will retry: $e');
    } finally {
      _isSyncing = false;
    }
  }
}
