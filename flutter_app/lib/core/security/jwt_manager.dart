import 'dart:convert';

class DecodedToken {
  final String userId;
  final String email;
  final String name;
  final String role;
  final DateTime expiry;

  DecodedToken({
    required this.userId,
    required this.email,
    required this.name,
    required this.role,
    required this.expiry,
  });

  bool get isExpired => DateTime.now().isAfter(expiry);
}

class JWTManager {
  // Decode JWT base64 payload locally
  DecodedToken? decode(String token) {
    try {
      final parts = token.split('.');
      if (parts.length < 2) return null;
      
      final String payloadB64 = parts[1];
      final String normalized = base64Url.normalize(payloadB64);
      final String decodedJson = utf8.decode(base64Url.decode(normalized));
      
      final Map<String, dynamic> payload = json.decode(decodedJson);
      
      return DecodedToken(
        userId: payload['userId'] ?? payload['sub'] ?? '',
        email: payload['email'] ?? '',
        name: payload['name'] ?? '',
        role: payload['role'] ?? 'runner',
        expiry: DateTime.fromMillisecondsSinceEpoch((payload['exp'] as int) * 1000),
      );
    } catch (e) {
      print('[JWTManager] Failed to decode token: $e');
      return null;
    }
  }
}
