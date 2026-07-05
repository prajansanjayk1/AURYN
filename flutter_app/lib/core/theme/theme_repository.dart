import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'restaurant_theme.dart';

class ThemeRepository {
  final SupabaseClient _client;
  static const _cacheKey = 'auryn_theme_cache';

  ThemeRepository(this._client);

  Future<RestaurantTheme> getThemeSettings() async {
    try {
      // 1. Fetch from Supabase
      final response = await _client
          .from('settings')
          .select()
          .eq('id', 'global')
          .maybeSingle();

      if (response != null) {
        final theme = RestaurantTheme.fromJson(response);
        await cacheTheme(response);
        return theme;
      }
    } catch (e) {
      // Fallback to cache or default on failure (e.g. offline)
      print('[ThemeRepository] Failed to fetch theme from network: $e');
    }
    return getCachedTheme();
  }

  Future<void> cacheTheme(Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_cacheKey, json.encode(data));
  }

  Future<RestaurantTheme> getCachedTheme() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cached = prefs.getString(_cacheKey);
      if (cached != null) {
        final Map<String, dynamic> data = json.decode(cached);
        return RestaurantTheme.fromJson(data);
      }
    } catch (e) {
      print('[ThemeRepository] Failed to read cached theme: $e');
    }
    return RestaurantTheme.fallback();
  }
}
