import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/theme/theme_engine.dart';
import '../../core/ai/runner_ai.dart';
import '../../core/ai/ai_engine.dart';
import '../../shared/widgets/auryn_top_bar.dart';
import '../../shared/widgets/auryn_card.dart';
import '../../shared/widgets/auryn_dialog.dart';

class RunnerScreen extends ConsumerStatefulWidget {
  const RunnerScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<RunnerScreen> createState() => _RunnerScreenState();
}

class _RunnerScreenState extends ConsumerState<RunnerScreen> {
  final SupabaseClient _client = Supabase.instance.client;
  List<Map<String, dynamic>> _orders = [];
  List<Map<String, dynamic>> _sessions = [];
  bool _loading = true;

  // Cash payment calculator variables
  Map<String, dynamic>? _selectedCashSession;
  final _cashReceivedController = TextEditingController();
  double _cashChangeToReturn = 0.0;

  @override
  void initState() {
    super.initState();
    _fetchRoster();
    _subscribeToRoster();
  }

  Future<void> _fetchRoster() async {
    try {
      final oRes = await _client.from('orders').select();
      final sRes = await _client.from('sessions').select();

      setState(() {
        _orders = List<Map<String, dynamic>>.from(oRes ?? []);
        _sessions = List<Map<String, dynamic>>.from(sRes ?? []);
        _loading = false;
      });
    } catch (e) {
      print('[RunnerScreen] Fetch telemetry failed: $e');
    }
  }

  void _subscribeToRoster() {
    _client.channel('public:runner:telemetry')
      .onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: 'orders',
        callback: (payload) => _fetchRoster(),
      )
      .onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: 'sessions',
        callback: (payload) => _fetchRoster(),
      )
      .subscribe();
  }

  double _getSessionTotal(Map<String, dynamic> session) {
    final sessOrders = _orders.where((o) => o['session_id'] == session['id']).toList();
    double total = 0.0;
    for (final order in sessOrders) {
      final List items = order['items'] ?? [];
      for (final item in items) {
        final double price = (item['price'] as num?)?.toDouble() ?? 0.0;
        final int quantity = (item['quantity'] as num?)?.toInt() ?? 0;
        total += price * quantity;
      }
    }
    return total;
  }

  Future<void> _handleStartDelivery(String orderId, String tableId) async {
    // Runner AI routing optimization
    final readyOrders = _orders.where((o) => o['status'] == 'ready').map((o) => o['table_id'].toString()).toList();
    final runnerAi = RunnerAI(const HospitalityContext(
      weather: 'Mild',
      timeOfDay: 'Evening',
      kitchenLoad: 30,
      lowStockIngredients: [],
      sessionPreferences: {},
    ));
    final aiResult = runnerAi.optimizeRosterRoute(tableId, readyOrders);

    await _client.from('orders').update({
      'status': 'delivering',
      'runner_id': 'runner-alpha',
      'runner_route': aiResult['pathVector'],
      'updated_at': DateTime.now().toIso8601String(),
    }).eq('id', orderId);

    _fetchRoster();
  }

  Future<void> _handleMarkDelivered(String orderId) async {
    await _client.from('orders').update({
      'status': 'delivered',
      'updated_at': DateTime.now().toIso8601String(),
    }).eq('id', orderId);

    _fetchRoster();
  }

  Future<void> _handleConfirmCashPayment() async {
    if (_selectedCashSession == null) return;
    final total = _getSessionTotal(_selectedCashSession!);
    final received = double.tryParse(_cashReceivedController.text) ?? 0.0;

    if (received < total) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Cash received must be equal to or greater than the bill total.')),
      );
      return;
    }

    try {
      final sessionId = _selectedCashSession!['id'];
      final tableId = _selectedCashSession!['table_id'];

      // 1. Create receipt
      final receiptId = 'rcpt-${DateTime.now().millisecondsSinceEpoch}';
      await _client.from('receipts').insert({
        'id': receiptId,
        'restaurant_id': 'auryn-hq',
        'branch_id': 'main-branch',
        'receipt_number': 'AUR-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
        'session_id': sessionId,
        'table_id': tableId,
        'payment_method': 'Cash',
        'amount_paid': total,
        'amount_received': received,
        'change_returned': received - total,
        'timestamp': DateTime.now().toIso8601String(),
        'gst': (total * 0.18).round(),
        'taxes': (total * 0.05).round(),
      });

      // 2. Close session
      await _client.from('sessions').update({
        'status': 'completed',
        'closed_at': DateTime.now().toIso8601String(),
      }).eq('id', sessionId);

      // 3. Clear table
      await _client.from('tables').update({
        'status': 'available',
        'current_session_id': null,
      }).eq('id', tableId);

      setState(() {
        _selectedCashSession = null;
        _cashReceivedController.clear();
        _cashChangeToReturn = 0.0;
      });

      _fetchRoster();
    } catch (e) {
      print('[RunnerScreen] Cash checkout error: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = ref.watch(themeEngineProvider);
    final isDark = theme.primaryColor.computeLuminance() < 0.5;

    final dispatchQueue = _orders.where((o) => o['status'] == 'ready').toList();
    final activeDeliveries = _orders.where((o) => o['status'] == 'delivering').toList();
    final cashRequests = _sessions.where((s) => s['status'] == 'payment_pending' && s['payment_method'] == 'Cash').toList();

    return Scaffold(
      appBar: const AurynTopBar(),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Cash Collector Alert Row
                  if (cashRequests.isNotEmpty) ...[
                    const Text(
                      '⚠️ CASH PAYMENTS PENDING',
                      style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 10, letterSpacing: 1.0),
                    ),
                    const SizedBox(height: 8),
                    ...cashRequests.map((session) {
                      final total = _getSessionTotal(session);
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.red.withOpacity(0.04),
                          border: Border.all(color: Colors.red.withOpacity(0.2)),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('TABLE ${session['table_id']}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                Text('Invoice total: ₹${total.toStringAsFixed(0)}', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                              ],
                            ),
                            ElevatedButton(
                              onPressed: () {
                                setState(() {
                                  _selectedCashSession = session;
                                });
                              },
                              style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                              child: const Text('CHECKOUT', style: TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.bold)),
                            ),
                          ],
                        ),
                      );
                    }),
                    const SizedBox(height: 16),
                  ],

                  // Delivery Roster Lane
                  const Text(
                    'DISPATCH WAITING',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 10, color: Colors.grey, letterSpacing: 1.0),
                  ),
                  const SizedBox(height: 8),
                  if (dispatchQueue.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 24.0),
                      child: Center(child: Text('No orders ready for delivery', style: TextStyle(fontSize: 11, color: Colors.grey))),
                    )
                  else
                    ...dispatchQueue.map((order) => Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          child: AurynCard(
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Table ${order['table_id']}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                    Text('Estimated Wait: ${order['estimated_completion'] ?? '1m'}', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                                  ],
                                ),
                                ElevatedButton(
                                  onPressed: () => _handleStartDelivery(order['id'], order['table_id'].toString()),
                                  child: const Text('DISPATCH', style: TextStyle(fontSize: 10)),
                                ),
                              ],
                            ),
                          ),
                        )),

                  const SizedBox(height: 24),
                  const Text(
                    'ACTIVE DELIVERIES',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 10, color: Colors.grey, letterSpacing: 1.0),
                  ),
                  const SizedBox(height: 8),
                  if (activeDeliveries.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 24.0),
                      child: Center(child: Text('No active deliveries', style: TextStyle(fontSize: 11, color: Colors.grey))),
                    )
                  else
                    ...activeDeliveries.map((order) => Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          child: AurynCard(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text('Table ${order['table_id']}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                    const Text('STATUS: IN ROUTE', style: TextStyle(fontSize: 10, color: Colors.amber, fontWeight: FontWeight.bold)),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                ElevatedButton(
                                  onPressed: () => _handleMarkDelivered(order['id']),
                                  style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                                  child: const Text('SLIDE TO COMPLETE', style: TextStyle(fontSize: 10, color: Colors.white)),
                                ),
                              ],
                            ),
                          ),
                        )),
                ],
              ),
            ),
      // Cash payment calculator popup modal
      bottomNavigationBar: _selectedCashSession == null
          ? null
          : AurynDialog(
              title: 'CASH CHECKOUT CALCULATOR',
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Total Bill Amount: ₹${_getSessionTotal(_selectedCashSession!).toStringAsFixed(0)}',
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _cashReceivedController,
                    keyboardType: TextInputType.number,
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    onChanged: (val) {
                      final parsed = double.tryParse(val) ?? 0.0;
                      final total = _getSessionTotal(_selectedCashSession!);
                      setState(() {
                        _cashChangeToReturn = parsed >= total ? (parsed - total) : 0.0;
                      });
                    },
                    decoration: InputDecoration(
                      labelText: 'CASH RECEIVED FROM GUEST',
                      labelStyle: TextStyle(
                        fontSize: 9,
                        color: theme.accentColor,
                        letterSpacing: 1.5,
                        fontFamily: theme.typography,
                      ),
                      prefixText: '₹ ',
                      prefixStyle: const TextStyle(color: Colors.white),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Colors.white10),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: theme.accentColor),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Change to return: ₹${_cashChangeToReturn.toStringAsFixed(0)}',
                    style: const TextStyle(fontSize: 13, color: Colors.green, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () {
                    setState(() {
                      _selectedCashSession = null;
                      _cashReceivedController.clear();
                      _cashChangeToReturn = 0.0;
                    });
                  },
                  child: const Text('CANCEL'),
                ),
                ElevatedButton(
                  onPressed: _handleConfirmCashPayment,
                  child: const Text('CONFIRM PAYMENT'),
                ),
              ],
            ),
    );
  }

  @override
  void dispose() {
    _cashReceivedController.dispose();
    super.dispose();
  }
}
