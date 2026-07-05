import 'package:shared_preferences/shared_preferences.dart';

class SessionManager {
  static const String _tokenKey = 'auryn_jwt_token';
  static const String _userRoleKey = 'auryn_user_role';
  static const String _tableIdKey = 'auryn_current_table_id';
  static const String _guestNameKey = 'auryn_guest_name';
  static const String _guestIdKey = 'auryn_guest_id';
  static const String _sessionIdKey = 'auryn_current_session_id';

  // Save Staff Session
  Future<void> saveStaffSession(String token, String role) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    await prefs.setString(_userRoleKey, role);
  }

  // Get Staff Token
  Future<String?> getStaffToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  // Get Staff Role
  Future<String?> getStaffRole() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_userRoleKey);
  }

  // Clear Staff Session
  Future<void> clearStaffSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userRoleKey);
  }

  // Save Customer Table Context
  Future<void> saveCustomerSession({
    required String tableId,
    required String guestName,
    required String guestId,
    required String sessionId,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tableIdKey, tableId);
    await prefs.setString(_guestNameKey, guestName);
    await prefs.setString(_guestIdKey, guestId);
    await prefs.setString(_sessionIdKey, sessionId);
  }

  // Get Customer Session Data
  Future<Map<String, String>?> getCustomerSession() async {
    final prefs = await SharedPreferences.getInstance();
    final tableId = prefs.getString(_tableIdKey);
    final guestName = prefs.getString(_guestNameKey);
    final guestId = prefs.getString(_guestIdKey);
    final sessionId = prefs.getString(_sessionIdKey);

    if (tableId != null && guestName != null && guestId != null && sessionId != null) {
      return {
        'tableId': tableId,
        'guestName': guestName,
        'guestId': guestId,
        'sessionId': sessionId,
      };
    }
    return null;
  }

  // Clear Customer Session
  Future<void> clearCustomerSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tableIdKey);
    await prefs.remove(_guestNameKey);
    await prefs.remove(_guestIdKey);
    await prefs.remove(_sessionIdKey);
  }
}
