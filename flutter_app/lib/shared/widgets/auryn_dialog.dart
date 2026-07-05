import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/theme_engine.dart';
import 'auryn_card.dart';

class AurynDialog extends ConsumerWidget {
  final String title;
  final Widget content;
  final List<Widget> actions;

  const AurynDialog({
    Key? key,
    required this.title,
    required this.content,
    required this.actions,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = ref.watch(themeEngineProvider);

    return Dialog(
      backgroundColor: Colors.transparent,
      elevation: 0,
      child: AurynCard(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title.toUpperCase(),
              style: TextStyle(
                fontFamily: theme.typography,
                fontSize: 14,
                fontWeight: FontWeight.bold,
                letterSpacing: 2.0,
                color: theme.accentColor,
              ),
            ),
            const SizedBox(height: 16),
            content,
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: actions.map((act) => Padding(
                padding: const EdgeInsets.only(left: 8.0),
                child: act,
              )).toList(),
            ),
          ],
        ),
      ),
    );
  }
}
