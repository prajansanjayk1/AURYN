import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/theme_engine.dart';

class AurynCard extends ConsumerWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final bool hasBorderHighlight;

  const AurynCard({
    Key? key,
    required this.child,
    this.padding,
    this.hasBorderHighlight = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = ref.watch(themeEngineProvider);
    final isDark = theme.primaryColor.computeLuminance() < 0.5;

    return ClipRRect(
      borderRadius: BorderRadius.circular(24),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
        child: Container(
          padding: padding ?? const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: isDark 
                ? Colors.white.withOpacity(0.04) 
                : Colors.white.withOpacity(0.85),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(
              color: hasBorderHighlight 
                  ? theme.accentColor.withOpacity(0.4) 
                  : (isDark ? Colors.white10 : const Color(0xFFECECEC)),
              width: hasBorderHighlight ? 1.5 : 1.0,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 40,
                offset: const Offset(0, 10),
              )
            ],
          ),
          child: child,
        ),
      ),
    );
  }
}
