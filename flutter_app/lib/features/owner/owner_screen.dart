import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/theme_engine.dart';
import '../../core/ai/finance_ai.dart';
import '../../core/ai/ai_engine.dart';
import '../../shared/widgets/auryn_top_bar.dart';
import '../../shared/widgets/auryn_card.dart';

class OwnerScreen extends ConsumerStatefulWidget {
  const OwnerScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<OwnerScreen> createState() => _OwnerScreenState();
}

class _OwnerScreenState extends ConsumerState<OwnerScreen> {
  final List<String> _branches = ['AURYN Bengaluru HQ', 'AURYN Uptown Bistro', 'AURYN Seaside Lounge'];
  String _selectedBranch = 'AURYN Bengaluru HQ';
  String _currentPlan = 'Enterprise';

  @override
  Widget build(BuildContext context) {
    final theme = ref.watch(themeEngineProvider);
    final isDark = theme.primaryColor.computeLuminance() < 0.5;

    // AI evaluate
    final financeAi = FinanceAI(const HospitalityContext(
      weather: 'Pleasant',
      timeOfDay: 'Evening',
      kitchenLoad: 30,
      lowStockIngredients: [],
      sessionPreferences: {},
    ));
    final aiResult = financeAi.analyzeRevenueDetails(24500.0, 4800.0, [1000.0, 2400.0]);

    return Scaffold(
      appBar: const AurynTopBar(),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Plan and Subscription Tier
            const Text(
              'ENTERPRISE SAAS CENTER',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Colors.grey, letterSpacing: 1.5),
            ),
            const SizedBox(height: 12),
            AurynCard(
              padding: const EdgeInsets.all(20),
              hasBorderHighlight: true,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Plan: $_currentPlan Edition',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Active subscription renewal: Jan 2027',
                        style: TextStyle(fontSize: 11, color: Colors.grey),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: theme.accentColor.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      'ACTIVE',
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: theme.accentColor),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),
            const Text(
              'BRANCH TELEMETRY ROSTER',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 10, color: Colors.grey, letterSpacing: 1.0),
            ),
            const SizedBox(height: 12),
            AurynCard(
              padding: const EdgeInsets.all(8),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _selectedBranch,
                  isExpanded: true,
                  iconEnabledColor: theme.accentColor,
                  dropdownColor: isDark ? const Color(0xFF161616) : Colors.white,
                  items: _branches.map((b) {
                    return DropdownMenuItem<String>(
                      value: b,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12.0),
                        child: Text(b, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                      ),
                    );
                  }).toList(),
                  onChanged: (val) {
                    if (val != null) {
                      setState(() {
                        _selectedBranch = val;
                      });
                    }
                  },
                ),
              ),
            ),

            const SizedBox(height: 24),
            const Text(
              'FINANCIAL OVERVIEW',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 10, color: Colors.grey, letterSpacing: 1.0),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: AurynCard(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('TODAY SALES', style: TextStyle(fontSize: 9, color: Colors.grey)),
                        const SizedBox(height: 6),
                        Text('₹24,500', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: theme.accentColor)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: AurynCard(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('EST. MARGIN', style: TextStyle(fontSize: 9, color: Colors.grey)),
                        const SizedBox(height: 6),
                        Text('+ 18.4%', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: theme.accentColor)),
                      ],
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 24),
            const Text(
              'GLOBAL FINANCE AI INSIGHTS',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 10, color: Colors.grey, letterSpacing: 1.0),
            ),
            const SizedBox(height: 12),
            AurynCard(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.insights, color: theme.accentColor, size: 18),
                      const SizedBox(width: 8),
                      const Text(
                        'AI AUDIT SUMMARY',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
                      ),
                    ],
                  ),
                  const Divider(height: 24),
                  Text(
                    aiResult['financeInsight'],
                    style: const TextStyle(fontSize: 12, height: 1.5, color: Colors.white),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    aiResult['revenueSummary'],
                    style: const TextStyle(fontSize: 10, color: Colors.grey),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
