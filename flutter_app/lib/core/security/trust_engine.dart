import 'dart:math';
import 'package:geolocator/geolocator.dart';
import '../../shared/models/risk_score.dart';

class TrustEngine {
  static const double restaurantLat = 12.9716; // Central Bengaluru
  static const double restaurantLon = 77.5946;
  static const double allowedRadiusMeters = 50.0;

  // Verify signed QR token authenticity
  bool verifyQRToken(String tableId, String qrToken) {
    if (qrToken.isEmpty) return false;
    
    // In production, this matches a signature format like: tableId_restaurantId_timestamp_hmac
    // For our current implementation, we validate the token format matching `df-table-$tableId-auth`
    final expected = 'df-table-$tableId-auth';
    return qrToken == expected;
  }

  // Calculate geofence distance using Haversine formula
  double calculateDistance(double lat, double lon) {
    const r = 6371000.0; // Earth radius in meters
    final dLat = _toRadians(lat - restaurantLat);
    final dLon = _toRadians(lon - restaurantLon);
    
    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(_toRadians(restaurantLat)) * cos(_toRadians(lat)) * 
        sin(dLon / 2) * sin(dLon / 2);
    
    final c = 2 * atan2(sqrt(a), sqrt(1 - a));
    return r * c;
  }

  double _toRadians(double degree) => degree * pi / 180.0;

  // High fidelity trust analysis generating a Risk Score
  Future<RiskAssessment> assessSessionRisk({
    required String tableId,
    required String qrToken,
    required double? lat,
    required double? lon,
    required bool isSimulator,
    required int consecutiveJoinAttempts,
  }) async {
    int score = 0;
    final List<String> triggers = [];

    // 1. QR Signature Check (Primary)
    if (!verifyQRToken(tableId, qrToken)) {
      score += 100;
      triggers.add('CRITICAL: Invalid or forged table QR signature.');
    }

    // 2. Geofence Check (Secondary)
    if (lat != null && lon != null) {
      final distance = calculateDistance(lat, lon);
      if (distance > allowedRadiusMeters) {
        score += 40;
        triggers.add('WARNING: Device location is ${distance.toStringAsFixed(1)}m away (limit is ${allowedRadiusMeters}m).');
        if (distance > 150) {
          score += 60;
          triggers.add('CRITICAL: Out of operational range. Session locked.');
        }
      }
    } else {
      score += 20;
      triggers.add('SUSPICIOUS: GPS geolocation details missing or denied.');
    }

    // 3. Device Integrity Check (Secondary)
    if (isSimulator) {
      score += 30;
      triggers.add('WARNING: Virtual device/simulator detected.');
    }

    // 4. Rate-Limiting & Behavioural Check (Secondary)
    if (consecutiveJoinAttempts > 3) {
      score += 40;
      triggers.add('WARNING: High frequency of session join attempts.');
    }

    RiskLevel level = RiskLevel.low;
    if (score >= 100) {
      level = RiskLevel.critical;
    } else if (score >= 50) {
      level = RiskLevel.high;
    } else if (score >= 20) {
      level = RiskLevel.medium;
    }

    return RiskAssessment(
      riskScore: score,
      level: level,
      triggers: triggers,
      isAllowed: level != RiskLevel.critical,
    );
  }
}
