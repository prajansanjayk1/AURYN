import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/theme_engine.dart';

class AurynButton extends ConsumerWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final IconData? icon;
  final bool isSecondary;

  const AurynButton({
    Key? key,
    required this.label,
    required this.onPressed,
    this.isLoading = false,
    this.icon,
    this.isSecondary = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = ref.watch(themeEngineProvider);

    final ButtonStyle style = ElevatedButton.styleFrom(
      backgroundColor: isSecondary ? Colors.transparent : theme.primaryColor,
      foregroundColor: isSecondary ? theme.primaryColor : Colors.white,
      disabledBackgroundColor: Colors.grey.shade800,
      disabledForegroundColor: Colors.grey.shade400,
      shadowColor: Colors.black.withOpacity(0.4),
      elevation: isSecondary ? 0 : 4,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: isSecondary ? BorderSide(color: theme.primaryColor, width: 1.5) : BorderSide.none,
      ),
    );

    return AnimatedScale(
      scale: onPressed == null ? 1.0 : 0.98,
      duration: const Duration(milliseconds: 100),
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: style,
        child: isLoading
            ? const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (icon != null) ...[
                    Icon(icon, size: 16),
                    const SizedBox(width: 8),
                  ],
                  Text(
                    label.toUpperCase(),
                    style: TextStyle(
                      fontFamily: theme.typography,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.5,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
