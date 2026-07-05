import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class OfflineRequest {
  final String id;
  final String path;
  final Map<String, dynamic> body;
  final DateTime timestamp;

  const OfflineRequest({
    required this.id,
    required this.path,
    required this.body,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'path': path,
        'body': body,
        'timestamp': timestamp.toIso8601String(),
      };

  factory OfflineRequest.fromJson(Map<String, dynamic> json) => OfflineRequest(
        id: json['id'],
        path: json['path'],
        body: json['body'],
        timestamp: DateTime.parse(json['timestamp']),
      );
}

class OfflineQueue {
  static const String _queueKey = 'auryn_offline_request_queue';

  // Queue request locally
  Future<void> queueRequest(String path, Map<String, dynamic> body) async {
    final prefs = await SharedPreferences.getInstance();
    final queue = await getQueue();
    
    final request = OfflineRequest(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      path: path,
      body: body,
      timestamp: DateTime.now(),
    );
    
    queue.add(request);
    final listJson = queue.map((r) => r.toJson()).toList();
    await prefs.setString(_queueKey, json.encode(listJson));
  }

  // Get active queue
  Future<List<OfflineRequest>> getQueue() async {
    final prefs = await SharedPreferences.getInstance();
    final cached = prefs.getString(_queueKey);
    if (cached != null) {
      final List decoded = json.decode(cached);
      return decoded.map((item) => OfflineRequest.fromJson(item)).toList();
    }
    return [];
  }

  // Clear completed requests
  Future<void> clearQueue() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_queueKey);
  }
}
