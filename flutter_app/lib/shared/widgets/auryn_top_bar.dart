import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/theme_engine.dart';
import '../../core/context/context_engine.dart';

class AurynTopBar extends ConsumerWidget implements PreferredSizeWidget {
  final List<Widget>? actions;

  const AurynTopBar({
    Key? key,
    this.actions,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = ref.watch(themeEngineProvider);
    final appCtx = ref.watch(contextEngineProvider);
    final isDark = theme.primaryColor.computeLuminance() < 0.5;

    Widget titleWidget;
    if (appCtx.isStaff) {
      titleWidget = Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            theme.restaurantName.toUpperCase(),
            style: TextStyle(
              fontSize: 12,
              fontFamily: theme.typography,
              fontWeight: FontWeight.bold,
              letterSpacing: 2.0,
            ),
          ),
          Text(
            '${appCtx.staffRole!.toUpperCase()} PORTAL',
            style: TextStyle(
              fontSize: 9,
              fontFamily: theme.typography,
              color: theme.accentColor,
              fontWeight: FontWeight.w600,
              letterSpacing: 1.5,
            ),
          ),
        ],
      );
    } else if (appCtx.isCustomer) {
      titleWidget = Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            theme.restaurantName.toUpperCase(),
            style: TextStyle(
              fontSize: 12,
              fontFamily: theme.typography,
              fontWeight: FontWeight.bold,
              letterSpacing: 2.0,
            ),
          ),
          Text(
            'TABLE ${appCtx.tableId} • ${appCtx.diningStage.name.toUpperCase()}',
            style: TextStyle(
              fontSize: 9,
              fontFamily: theme.typography,
              color: theme.accentColor,
              fontWeight: FontWeight.w600,
              letterSpacing: 1.5,
            ),
          ),
        ],
      );
    } else {
      titleWidget = Text(
        theme.restaurantName.toUpperCase(),
        style: TextStyle(
          fontSize: 14,
          fontFamily: theme.typography,
          fontWeight: FontWeight.bold,
          letterSpacing: 2.5,
        ),
      );
    }

    return AppBar(
      title: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: isDark ? Colors.white : Colors.black,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 12),
          titleWidget,
        ],
      ),
      actions: [
        if (actions != null) ...actions!,
        const SizedBox(width: 8),
      ],
      backgroundColor: Colors.transparent,
      elevation: 0,
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
