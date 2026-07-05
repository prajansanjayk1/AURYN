import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/context/context_engine.dart';
import '../../core/theme/theme_engine.dart';
import '../../core/experience/experience_base.dart';
import '../../core/experience/arrival.dart';
import '../../core/experience/ordering.dart';
import '../../core/experience/waiting.dart';
import '../../core/experience/dining.dart';
import '../../core/experience/finishing.dart';
import '../../core/experience/checkout.dart';
import '../../core/experience/leaving.dart';
import '../../shared/models/dining_stage.dart';
import '../../shared/widgets/auryn_top_bar.dart';
import '../../shared/widgets/auryn_bottom_sheet.dart';

class CustomerScreen extends ConsumerStatefulWidget {
  const CustomerScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<CustomerScreen> createState() => _CustomerScreenState();
}

class _CustomerScreenState extends ConsumerState<CustomerScreen> {
  // Controller for AI Concierge chat conversation
  final List<Map<String, String>> _aiMessages = [
    {'sender': 'ai', 'message': 'Welcome to AURYN. I am your specialized AI Concierge de Cuisine. How may I assist you today?'}
  ];
  final _chatController = TextEditingController();

  DiningExperience _getExperience(DiningStage stage) {
    switch (stage) {
      case DiningStage.arrival:
        return const ArrivalExperience();
      case DiningStage.ordering:
        return const OrderingExperience();
      case DiningStage.waiting:
        return const WaitingExperience();
      case DiningStage.dining:
        return const DiningExperienceStage();
      case DiningStage.finishing:
        return const FinishingExperience();
      case DiningStage.checkout:
        return const CheckoutExperience();
      case DiningStage.leaving:
        return const LeavingExperience();
    }
  }

  void _openAiConciergeSheet(BuildContext context, ThemeData themeData) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return DraggableScrollableSheet(
          initialChildSize: 0.65,
          maxChildSize: 0.9,
          minChildSize: 0.45,
          builder: (dctx, scrollController) {
            return StatefulBuilder(
              builder: (sctx, setStateSheet) {
                return AurynBottomSheet(
                  title: 'Concierge AI Assistant',
                  child: Column(
                    children: [
                      Expanded(
                        child: ListView.builder(
                          controller: scrollController,
                          padding: const EdgeInsets.all(20),
                          itemCount: _aiMessages.length,
                          itemBuilder: (itemCtx, index) {
                            final msg = _aiMessages[index];
                            final isUser = msg['sender'] == 'user';
                            return Align(
                              alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                              child: Container(
                                margin: const EdgeInsets.only(bottom: 12),
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                decoration: BoxDecoration(
                                  color: isUser 
                                      ? themeData.colorScheme.primary.withOpacity(0.1) 
                                      : Colors.grey.withOpacity(0.08),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: isUser 
                                        ? themeData.colorScheme.primary.withOpacity(0.2) 
                                        : Colors.white10,
                                  ),
                                ),
                                child: Text(
                                  msg['message'] ?? '',
                                  style: const TextStyle(fontSize: 13, color: Colors.white),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                      const Divider(height: 1),
                      Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _chatController,
                                style: const TextStyle(color: Colors.white, fontSize: 13),
                                decoration: InputDecoration(
                                  hintText: 'Ask about pairings, allergens, budget...',
                                  hintStyle: const TextStyle(color: Colors.white30),
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(24),
                                    borderSide: const BorderSide(color: Colors.white10),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(24),
                                    borderSide: BorderSide(color: themeData.colorScheme.secondary),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            IconButton(
                              onPressed: () {
                                final text = _chatController.text.trim();
                                if (text.isEmpty) return;
                                _chatController.clear();
                                setStateSheet(() {
                                  _aiMessages.add({'sender': 'user', 'message': text});
                                });
                                // Simulate AI response
                                Future.delayed(const Duration(milliseconds: 800), () {
                                  setStateSheet(() {
                                    _aiMessages.add({
                                      'sender': 'ai',
                                      'message': 'Certainly. I have noted your preferences. Let me coordinate with the kitchen.'
                                    });
                                  });
                                });
                              },
                              icon: Icon(Icons.send, color: themeData.colorScheme.secondary),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final appCtx = ref.watch(contextEngineProvider);
    final theme = ref.watch(themeEngineProvider);
    final mTheme = theme.toThemeData();

    final experience = _getExperience(appCtx.diningStage);

    return Theme(
      data: mTheme,
      child: Scaffold(
        appBar: AurynTopBar(
          actions: [
            IconButton(
              onPressed: () => _openAiConciergeSheet(context, mTheme),
              icon: Icon(Icons.support_agent, color: mTheme.colorScheme.secondary),
            ),
            IconButton(
              onPressed: () {
                ref.read(contextEngineProvider.notifier).clearSession();
              },
              icon: const Icon(Icons.exit_to_app),
            ),
          ],
        ),
        body: SafeArea(
          child: Column(
            children: [
              Expanded(child: experience.buildStageBody(context)),
              Padding(
                padding: const EdgeInsets.all(20.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: experience.buildActionControls(context),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
