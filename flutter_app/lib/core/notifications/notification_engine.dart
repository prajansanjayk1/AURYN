import 'dart:async';
import 'package:audioplayers/audioplayers.dart';

enum NotificationPriority { low, medium, high, critical }

class AurynNotification {
  final String id;
  final String title;
  final String message;
  final NotificationPriority priority;
  final DateTime timestamp;

  const AurynNotification({
    required this.id,
    required this.title,
    required this.message,
    required this.priority,
    required this.timestamp,
  });
}

class NotificationEngine {
  final AudioPlayer _audioPlayer = AudioPlayer();
  final StreamController<AurynNotification> _notificationsStream = StreamController<AurynNotification>.broadcast();

  Stream<AurynNotification> get onNotificationReceived => _notificationsStream.stream;

  // Plays a synthesized elegant audio chime matching the priority
  Future<void> playNotificationChime(NotificationPriority priority) async {
    // In production, this loads an asset from assets/sounds/chime.wav
    // We catch errors if assets are unconfigured and run print telemetry
    try {
      String soundPath = 'sounds/low_chime.mp3';
      if (priority == NotificationPriority.high || priority == NotificationPriority.critical) {
        soundPath = 'sounds/high_chime.mp3';
      }
      await _audioPlayer.play(AssetSource(soundPath), volume: 0.85);
    } catch (e) {
      print('[NotificationEngine] Play sound fallback telemetry (AudioPlayer offline/unseeded): $priority');
    }
  }

  // Dispatches a notification banner and chime
  void dispatchNotification({
    required String title,
    required String message,
    required NotificationPriority priority,
  }) {
    final notification = AurynNotification(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      title: title,
      message: message,
      priority: priority,
      timestamp: DateTime.now(),
    );

    _notificationsStream.add(notification);
    playNotificationChime(priority);
  }

  void dispose() {
    _notificationsStream.close();
    _audioPlayer.dispose();
  }
}
