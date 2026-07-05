import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'core/context/context_engine.dart';
import 'core/theme/theme_engine.dart';
import 'core/security/trust_engine.dart';
import 'features/authentication/login_screen.dart';
import 'features/customer/customer_screen.dart';
import 'features/kitchen/kitchen_screen.dart';
import 'features/runner/runner_screen.dart';
import 'features/manager/manager_screen.dart';
import 'features/owner/owner_screen.dart';
import 'shared/widgets/auryn_button.dart';
import 'shared/widgets/auryn_card.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Supabase Flutter SDK
  // Since we are connecting to the existing PostgreSQL backend, we utilize credentials seeded in the Next.js app
  await Supabase.initialize(
    url: 'https://tgoinscpvcilgwhezoxu.supabase.co',
    anonKey: 'sb_publishable_tQLlIMZb8Cgwbg3Sf52G6g_OwPoWQ4E',
  );

  runApp(
    const ProviderScope(
      child: AurynApp(),
    ),
  );
}

class AurynApp extends ConsumerWidget {
  const AurynApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = ref.watch(themeEngineProvider);
    final appCtx = ref.watch(contextEngineProvider);

    return MaterialApp(
      title: 'AURYN Hospitality OS',
      theme: theme.toThemeData(),
      debugShowCheckedModeBanner: false,
      home: appCtx.isLoading 
          ? const SplashScreen() 
          : _resolveWorkspace(appCtx),
    );
  }

  Widget _resolveWorkspace(AurynContext context) {
    if (context.isStaff) {
      final role = context.staffRole!.toLowerCase();
      if (role == 'chef') return const KitchenScreen();
      if (role == 'runner') return const RunnerScreen();
      if (role == 'admin' || role == 'manager') return const ManagerScreen();
      if (role == 'owner') return const OwnerScreen();
      return const RunnerScreen(); // Default staff fallback
    }

    if (context.isCustomer) {
      return const CustomerScreen();
    }

    // Default luxury onboarding landing stage
    return const OnboardingPortal();
  }
}

// 1. Splash Screen
class SplashScreen extends ConsumerWidget {
  const SplashScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = ref.watch(themeEngineProvider);
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.02),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white10),
              ),
              child: Icon(Icons.auto_awesome, size: 24, color: theme.accentColor),
            ),
            const SizedBox(height: 24),
            Text(
              theme.splashText.toUpperCase(),
              style: TextStyle(
                fontFamily: theme.typography,
                fontSize: 12,
                fontWeight: FontWeight.bold,
                letterSpacing: 3.0,
                color: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// 2. Onboarding Portal (Landing screen for scanning QRs or logging in as staff)
class OnboardingPortal extends ConsumerStatefulWidget {
  const OnboardingPortal({Key? key}) : super(key: key);

  @override
  ConsumerState<OnboardingPortal> createState() => _OnboardingPortalState();
}

class _OnboardingPortalState extends ConsumerState<OnboardingPortal> {
  final SupabaseClient _client = Supabase.instance.client;
  bool _scanning = false;
  String? _onboardingError;

  // Simulate scanning a table QR code and validating presence via the Trust Engine
  Future<void> _simulateQRScan(String tableId) async {
    setState(() {
      _scanning = true;
      _onboardingError = null;
    });

    try {
      final qrToken = 'df-table-$tableId-auth';
      
      // Trust Engine verification
      final trust = TrustEngine();
      final assessment = await trust.assessSessionRisk(
        tableId: tableId,
        qrToken: qrToken,
        lat: 12.9716, // Central Bengaluru restaurant coordinates (simulated GPS check)
        lon: 77.5946,
        isSimulator: false,
        consecutiveJoinAttempts: 1,
      );

      if (!assessment.isAllowed) {
        setState(() {
          _onboardingError = 'Geofence trust validation failed: ${assessment.triggers.join(', ')}';
          _scanning = false;
        });
        return;
      }

      // Check or create dining session in Supabase PostgreSQL
      final tableRes = await _client.from('tables').select().eq('id', tableId).maybeSingle();
      if (tableRes == null) {
        throw Exception('Table $tableId not registered in workspace.');
      }

      String? activeSessionId = tableRes['current_session_id'];
      final guestId = 'guest-${DateTime.now().millisecondsSinceEpoch}';
      const guestName = 'Luxury Guest';

      if (activeSessionId == null) {
        // Create new dining session
        activeSessionId = 'session-${DateTime.now().millisecondsSinceEpoch}';
        await _client.from('sessions').insert({
          'id': activeSessionId,
          'table_id': tableId,
          'owner_id': guestId,
          'guests': [{'id': guestId, 'name': guestName}],
          'status': 'active',
          'created_at': DateTime.now().toIso8601String(),
          'timeline': [{
            'timestamp': DateTime.now().toIso8601String(),
            'type': 'session.created',
            'description': 'Dining Session initialized by $guestName.'
          }]
        });

        // Set table occupied
        await _client.from('tables').update({
          'status': 'occupied',
          'current_session_id': activeSessionId,
        }).eq('id', tableId);
      } else {
        // Table occupied, join active companion session
        final sessionRes = await _client.from('sessions').select().eq('id', activeSessionId).single();
        final List guests = sessionRes['guests'] ?? [];
        guests.add({'id': guestId, 'name': guestName});

        final List timeline = sessionRes['timeline'] ?? [];
        timeline.add({
          'timestamp': DateTime.now().toIso8601String(),
          'type': 'session.joined',
          'description': '$guestName joined the table.'
        });

        await _client.from('sessions').update({
          'guests': guests,
          'timeline': timeline,
        }).eq('id', activeSessionId);
      }

      // Initialize session inside Context Engine
      await ref.read(contextEngineProvider.notifier).initializeCustomerSession(
            tableId: tableId,
            guestName: guestName,
            guestId: guestId,
            sessionId: activeSessionId,
          );
    } catch (e) {
      setState(() {
        _onboardingError = 'Session join failed: ${e.toString()}';
      });
    } finally {
      setState(() {
        _scanning = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = ref.watch(themeEngineProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF0C0C0C),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Logo Badge
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.02),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.white10),
                ),
                child: Icon(Icons.blur_on, size: 28, color: theme.accentColor),
              ),
              const SizedBox(height: 24),
              Text(
                theme.welcomeTitle.toUpperCase(),
                style: TextStyle(
                  fontFamily: theme.typography,
                  fontSize: 18,
                  fontWeight: FontWeight.w300,
                  letterSpacing: 2.0,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                theme.welcomeSubtitle.toUpperCase(),
                style: TextStyle(
                  fontFamily: theme.typography,
                  fontSize: 8,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.5,
                  color: theme.accentColor,
                ),
              ),
              const SizedBox(height: 36),
              AurynCard(
                padding: const EdgeInsets.all(28),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Scan Table QR Code',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Verify your presence and initialize a shared dining session.',
                      style: TextStyle(fontSize: 11, color: Colors.white38),
                    ),
                    const SizedBox(height: 24),
                    if (_onboardingError != null) ...[
                      Text(
                        _onboardingError!,
                        style: const TextStyle(fontSize: 11, color: Colors.red),
                      ),
                      const SizedBox(height: 16),
                    ],
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildTableScanButton('Table 1', '1'),
                        _buildTableScanButton('Table 2', '2'),
                        _buildTableScanButton('Table 3', '3'),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              // Staff Portal entry button
              TextButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const LoginScreen()),
                  );
                },
                child: Text(
                  'STAFF COMMAND PORTAL LOG IN',
                  style: TextStyle(
                    fontFamily: theme.typography,
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.5,
                    color: Colors.white38,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTableScanButton(String label, String id) {
    final theme = ref.watch(themeEngineProvider);
    return InkWell(
      onTap: _scanning ? null : () => _simulateQRScan(id),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.02),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white10),
        ),
        child: Column(
          children: [
            Icon(Icons.qr_code_scanner, color: theme.accentColor, size: 20),
            const SizedBox(height: 6),
            Text(label, style: const TextStyle(fontSize: 10, color: Colors.white)),
          ],
        ),
      ),
    );
  }
}
