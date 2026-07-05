import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/theme/theme_engine.dart';
import '../../core/ai/kitchen_ai.dart';
import '../../core/ai/ai_engine.dart';
import '../../shared/widgets/auryn_top_bar.dart';
import '../../shared/widgets/auryn_card.dart';

class KitchenScreen extends ConsumerStatefulWidget {
  const KitchenScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<KitchenScreen> createState() => _KitchenScreenState();
}

class _KitchenScreenState extends ConsumerState<KitchenScreen> {
  final SupabaseClient _client = Supabase.instance.client;
  List<Map<String, dynamic>> _orders = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchOrders();
    _subscribeToOrders();
  }

  Future<void> _fetchOrders() async {
    try {
      final response = await _client.from('orders').select().order('created_at', ascending: true);
      if (response != null) {
        setState(() {
          _orders = List<Map<String, dynamic>>.from(response);
          _loading = false;
        });
      }
    } catch (e) {
      print('[KitchenScreen] Fetch orders error: $e');
    }
  }

  void _subscribeToOrders() {
    _client.channel('public:orders:kitchen')
      .onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: 'orders',
        callback: (payload) => _fetchOrders(),
      )
      .subscribe();
  }

  Future<void> _updateOrderStatus(String orderId, String newStatus) async {
    try {
      await _client
          .from('orders')
          .update({'status': newStatus, 'updated_at': DateTime.now().toIso8601String()})
          .eq('id', orderId);
      _fetchOrders();
    } catch (e) {
      print('[KitchenScreen] Status update error: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = ref.watch(themeEngineProvider);
    final isDark = theme.primaryColor.computeLuminance() < 0.5;

    // Filter incoming and preparing cooking lanes
    final incoming = _orders.where((o) => o['status'] == 'placed').toList();
    final preparing = _orders.where((o) => o['status'] == 'accepted' || o['status'] == 'preparing').toList();
    final ready = _orders.where((o) => o['status'] == 'ready' || o['status'] == 'delivering').toList();

    // AI evaluate
    final ai = KitchenAI(HospitalityContext(
      weather: 'Mild',
      timeOfDay: 'Evening',
      kitchenLoad: (preparing.length * 15.0) + (incoming.length * 5.0),
      lowStockIngredients: const [],
      sessionPreferences: const {},
    ));
    final aiResult = ai.evaluateKitchenLoad(incoming.length, preparing.length);

    return Scaffold(
      appBar: const AurynTopBar(),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : OrientationBuilder(
              builder: (context, orientation) {
                return Column(
                  children: [
                    // Top stats banner
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                      decoration: BoxDecoration(
                        color: isDark ? Colors.white.withOpacity(0.02) : Colors.black.withOpacity(0.02),
                        border: Border(bottom: BorderSide(color: isDark ? Colors.white10 : Colors.black12)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.kitchen, color: theme.accentColor, size: 18),
                              const SizedBox(width: 8),
                              Text(
                                'KITCHEN LOAD: ${aiResult['loadPercentage']}%',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
                              ),
                            ],
                          ),
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 24.0),
                              child: Text(
                                aiResult['recommendation'],
                                style: TextStyle(fontSize: 10, color: theme.accentColor, fontStyle: FontStyle.italic),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ),
                          Text(
                            'ESTIMATED WAIT: ${aiResult['estimatedMinutes']} MIN',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      child: Row(
                        children: [
                          // 1. Incoming Lane
                          Expanded(
                            child: _buildLane(
                              title: 'INCOMING QUEUE',
                              items: incoming,
                              color: Colors.blue.withOpacity(0.2),
                              actionLabel: 'ACCEPT PREP',
                              onAction: (id) => _updateOrderStatus(id, 'preparing'),
                            ),
                          ),
                          const VerticalDivider(width: 1),
                          // 2. Preparing Lane
                          Expanded(
                            child: _buildLane(
                              title: 'ACTIVE PREPARATION',
                              items: preparing,
                              color: Colors.orange.withOpacity(0.2),
                              actionLabel: 'MARK READY',
                              onAction: (id) => _updateOrderStatus(id, 'ready'),
                            ),
                          ),
                          const VerticalDivider(width: 1),
                          // 3. Ready Lane
                          Expanded(
                            child: _buildLane(
                              title: 'READY TO DISPATCH',
                              items: ready,
                              color: Colors.green.withOpacity(0.2),
                              actionLabel: 'MARK DELIVERED',
                              onAction: (id) => _updateOrderStatus(id, 'delivered'),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                );
              },
            ),
    );
  }

  Widget _buildLane({
    required String title,
    required List<Map<String, dynamic>> items,
    required Color color,
    required String actionLabel,
    required Function(String) onAction,
  }) {
    return Column(
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 8),
          color: color.withOpacity(0.05),
          alignment: Alignment.center,
          child: Text(
            '$title (${items.length})',
            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.0),
          ),
        ),
        Expanded(
          child: items.isEmpty
              ? const Center(child: Text('LANE VACANT', style: TextStyle(fontSize: 10, color: Colors.grey)))
              : ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: items.length,
                  itemBuilder: (context, idx) {
                    final order = items[idx];
                    final List itemsList = order['items'] ?? [];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: AurynCard(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'TABLE ${order['table_id']}',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                ),
                                Text(
                                  'ID: ${order['id'].toString().split('-').last}',
                                  style: const TextStyle(fontSize: 9, color: Colors.grey),
                                ),
                              ],
                            ),
                            const Divider(height: 16),
                            ...itemsList.map((item) => Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 4.0),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        '${item['quantity']}x ${item['name']}',
                                        style: const TextStyle(fontSize: 12),
                                      ),
                                      Text(
                                        item['status'] ?? 'placed',
                                        style: const TextStyle(fontSize: 9, color: Colors.grey),
                                      ),
                                    ],
                                  ),
                                )),
                            const SizedBox(height: 16),
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: () => onAction(order['id']),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.white10,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                                child: Text(
                                  actionLabel,
                                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }
}
