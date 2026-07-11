import 'package:flutter/material.dart';

class RestaurantTheme {
  final String restaurantName;
  final Color primaryColor;
  final Color accentColor;
  final String typography;
  final String logoUrl;
  final String welcomeTitle;
  final String welcomeSubtitle;
  final String splashText;
  final int splashDurationMs;
  final String backgroundMusic;
  final bool notificationSounds;
  final String receiptLayout;
  final String qrCodeStyle;
  final String currency;
  final double gstPercentage;
  final double taxPercentage;

  const RestaurantTheme({
    required this.restaurantName,
    required this.primaryColor,
    required this.accentColor,
    required this.typography,
    required this.logoUrl,
    required this.welcomeTitle,
    required this.welcomeSubtitle,
    required this.splashText,
    required this.splashDurationMs,
    required this.backgroundMusic,
    required this.notificationSounds,
    required this.receiptLayout,
    required this.qrCodeStyle,
    required this.currency,
    required this.gstPercentage,
    required this.taxPercentage,
  });

  factory RestaurantTheme.fallback() {
    return const RestaurantTheme(
      restaurantName: 'Kings of Wings',
      primaryColor: Color(0xFF0B0C10),
      accentColor: Color(0xFFFF5A09),
      typography: 'Outfit',
      logoUrl: '',
      welcomeTitle: 'Kings of Wings',
      welcomeSubtitle: 'The Culinary Masterpiece',
      splashText: 'Kings of Wings — Orchestrated Flame',
      splashDurationMs: 3000,
      backgroundMusic: 'energetic_rock',
      notificationSounds: true,
      receiptLayout: 'classic_luxury',
      qrCodeStyle: 'rounded_flame',
      currency: 'INR',
      gstPercentage: 18.0,
      taxPercentage: 5.0,
    );
  }

  factory RestaurantTheme.fromJson(Map<String, dynamic> json) {
    return RestaurantTheme(
      restaurantName: json['restaurant_name'] ?? 'AURYN',
      primaryColor: _parseColor(json['primary_color'], const Color(0xFF0A0A0A)),
      accentColor: _parseColor(json['accent_color'], const Color(0xFFD4AF37)),
      typography: json['typography'] ?? 'Outfit',
      logoUrl: json['logo_url'] ?? '',
      welcomeTitle: json['welcome_screen']?['title'] ?? 'Welcome to AURYN',
      welcomeSubtitle: json['welcome_screen']?['subtitle'] ?? 'Luxury Dining Intelligence',
      splashText: json['splash_screen']?['text'] ?? 'AURYN — Orchestrated Elegance',
      splashDurationMs: json['splash_screen']?['duration'] ?? 3000,
      backgroundMusic: json['background_music'] ?? 'classical_jazz',
      notificationSounds: json['notification_sounds'] ?? true,
      receiptLayout: json['receipt_layout'] ?? 'classic_luxury',
      qrCodeStyle: json['qr_code_style'] ?? 'rounded_gold',
      currency: json['currency'] ?? 'INR',
      gstPercentage: (json['gst'] as num?)?.toDouble() ?? 18.0,
      taxPercentage: (json['taxes'] as num?)?.toDouble() ?? 5.0,
    );
  }

  static Color _parseColor(String? hexString, Color fallback) {
    if (hexString == null || hexString.isEmpty) return fallback;
    try {
      final hex = hexString.replaceAll('#', '');
      if (hex.length == 6) {
        return Color(int.parse('FF$hex', radix: 16));
      } else if (hex.length == 8) {
        return Color(int.parse(hex, radix: 16));
      }
    } catch (_) {}
    return fallback;
  }

  ThemeData toThemeData() {
    final isDark = primaryColor.computeLuminance() < 0.5;
    final colorScheme = ColorScheme.fromSeed(
      seedColor: primaryColor,
      primary: primaryColor,
      secondary: accentColor,
      brightness: isDark ? Brightness.dark : Brightness.light,
      background: isDark ? const Color(0xFF0A0A0A) : const Color(0xFFFAFAFA),
      surface: isDark ? const Color(0xFF161616) : Colors.white,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: colorScheme.background,
      fontFamily: typography,
      cardTheme: CardThemeData(
        color: colorScheme.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(color: isDark ? Colors.white10 : const Color(0xFFECECEC)),
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: colorScheme.background,
        elevation: 0,
        centerTitle: false,
        iconTheme: IconThemeData(color: isDark ? Colors.white : Colors.black),
      ),
    );
  }
}
