import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'restaurant_theme.dart';
import 'theme_repository.dart';

// Repository provider
final themeRepositoryProvider = Provider<ThemeRepository>((ref) {
  return ThemeRepository(Supabase.instance.client);
});

// Theme state notifier
class ThemeEngine extends StateNotifier<RestaurantTheme> {
  final ThemeRepository _repository;
  final SupabaseClient _client;
  RealtimeChannel? _channel;

  ThemeEngine(this._repository, this._client) : super(RestaurantTheme.fallback()) {
    _init();
  }

  Future<void> _init() async {
    // 1. Load cached or fetched theme
    state = await _repository.getThemeSettings();

    // 2. Subscribe to Supabase real-time updates
    _channel = _client.channel('public:settings:global')
      .onPostgresChanges(
        event: PostgresChangeEvent.update,
        schema: 'public',
        table: 'settings',
        filter: 'id=eq.global',
        callback: (payload) {
          final newSettings = payload.newRecord;
          if (newSettings.isNotEmpty) {
            state = RestaurantTheme.fromJson(newSettings);
            _repository.cacheTheme(newSettings);
          }
        },
      )
      .subscribe();
  }

  @override
  void dispose() {
    if (_channel != null) {
      _client.removeChannel(_channel!);
    }
    super.dispose();
  }
}

// Global theme provider
final themeEngineProvider = StateNotifierProvider<ThemeEngine, RestaurantTheme>((ref) {
  final repo = ref.watch(themeRepositoryProvider);
  return ThemeEngine(repo, Supabase.instance.client);
});
