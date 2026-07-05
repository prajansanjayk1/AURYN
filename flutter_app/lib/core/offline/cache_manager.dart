import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class CacheManager {
  static const String _menuCacheKey = 'auryn_menu_cache';
  static const String _sessionCacheKey = 'auryn_session_cache';

  // Cache menu items locally
  Future<void> cacheMenu(List<Map<String, dynamic>> menuData) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_menuCacheKey, json.encode(menuData));
  }

  // Retrieve cached menu
  Future<List<Map<String, dynamic>>?> getCachedMenu() async {
    final prefs = await SharedPreferences.getInstance();
    final cached = prefs.getString(_menuCacheKey);
    if (cached != null) {
      final List decoded = json.decode(cached);
      return decoded.cast<Map<String, dynamic>>();
    }
    return null;
  }

  // Cache active session timeline locally
  Future<void> cacheActiveSession(Map<String, dynamic> sessionData) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_sessionCacheKey, json.encode(sessionData));
  }

  // Retrieve cached session
  Future<Map<String, dynamic>?> getCachedSession() async {
    final prefs = await SharedPreferences.getInstance();
    final cached = prefs.getString(_sessionCacheKey);
    if (cached != null) {
      return json.decode(cached) as Map<String, dynamic>;
    }
    return null;
  }
}
