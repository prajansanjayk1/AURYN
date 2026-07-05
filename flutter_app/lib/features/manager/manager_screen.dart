import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/theme/theme_engine.dart';
import '../../core/ai/manager_ai.dart';
import '../../core/ai/ai_engine.dart';
import '../../shared/widgets/auryn_top_bar.dart';
import '../../shared/widgets/auryn_card.dart';
import '../../shared/widgets/auryn_button.dart';

class ManagerScreen extends ConsumerStatefulWidget {
  const ManagerScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<ManagerScreen> createState() => _ManagerScreenState();
}

class _ManagerScreenState extends ConsumerState<ManagerScreen> {
  final SupabaseClient _client = Supabase.instance.client;
  int _activeTabIdx = 0;
  bool _loading = true;

  List<Map<String, dynamic>> _tables = [];
  List<Map<String, dynamic>> _menuItems = [];
  List<Map<String, dynamic>> _inventory = [];
  List<Map<String, dynamic>> _users = [];
  List<Map<String, dynamic>> _sessions = [];
  List<Map<String, dynamic>> _orders = [];

  // Manager AI Chat variables
  final List<String> _aiLog = [
    'Good afternoon. I am your AURYN AI Business Intelligence Manager. Ask me about delays, revenue metrics, best-selling dishes, inventory stock-outs, or tomorrow\'s demand predictions.'
  ];
  final _aiQueryController = TextEditingController();

  // Branding Editor state variables
  final _brandNameController = TextEditingController();
  final _primaryColorController = TextEditingController();
  final _accentColorController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchManagerData();
    _subscribeToManagerData();
  }

  Future<void> _fetchManagerData() async {
    try {
      final tables = await _client.from('tables').select();
      final menu = await _client.from('menu_items').select();
      final inventory = await _client.from('inventory').select();
      final users = await _client.from('users').select();
      final sessions = await _client.from('sessions').select();
      final orders = await _client.from('orders').select();

      final settingsRes = await _client.from('settings').select().eq('id', 'global').maybeSingle();

      setState(() {
        _tables = List<Map<String, dynamic>>.from(tables ?? []);
        _menuItems = List<Map<String, dynamic>>.from(menu ?? []);
        _inventory = List<Map<String, dynamic>>.from(inventory ?? []);
        _users = List<Map<String, dynamic>>.from(users ?? []);
        _sessions = List<Map<String, dynamic>>.from(sessions ?? []);
        _orders = List<Map<String, dynamic>>.from(orders ?? []);

        if (settingsRes != null) {
          _brandNameController.text = settingsRes['restaurant_name'] ?? 'AURYN';
          _primaryColorController.text = settingsRes['primary_color'] ?? '#0A0A0A';
          _accentColorController.text = settingsRes['accent_color'] ?? '#D4AF37';
        }

        _loading = false;
      });
    } catch (e) {
      print('[ManagerScreen] Fetch operations failed: $e');
    }
  }

  void _subscribeToManagerData() {
    _client.channel('public:manager:telemetry')
      .onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: 'tables',
        callback: (payload) => _fetchManagerData(),
      )
      .onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: 'menu_items',
        callback: (payload) => _fetchManagerData(),
      )
      .onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: 'inventory',
        callback: (payload) => _fetchManagerData(),
      )
      .subscribe();
  }

  Future<void> _handleSaveBranding() async {
    try {
      await _client.from('settings').update({
        'restaurant_name': _brandNameController.text.trim(),
        'primary_color': _primaryColorController.text.trim(),
        'accent_color': _accentColorController.text.trim(),
      }).eq('id', 'global');

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('SaaS branding settings updated dynamically.')),
      );
    } catch (e) {
      print('[ManagerScreen] Branding save error: $e');
    }
  }

  void _handleAskManagerAI() {
    final query = _aiQueryController.text.trim();
    if (query.isEmpty) return;
    _aiQueryController.clear();

    final activeCooking = _orders.where((o) => o['status'] == 'preparing').toList();
    final lowStock = _inventory.where((i) => (i['stock'] as num) < (i['min_stock'] as num)).map((i) => i['name'].toString()).toList();

    final ai = ManagerAI(HospitalityContext(
      weather: 'Pleasant',
      timeOfDay: 'Evening',
      kitchenLoad: activeCooking.length * 15.0,
      lowStockIngredients: lowStock,
      sessionPreferences: const {},
    ));

    final response = ai.answerManagerQuery(query);

    setState(() {
      _aiLog.add('Manager: $query');
      _aiLog.add('AURYN: $response');
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = ref.watch(themeEngineProvider);
    final isDark = theme.primaryColor.computeLuminance() < 0.5;

    return Scaffold(
      appBar: const AurynTopBar(),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Top Tab Bar
                Container(
                  height: 48,
                  color: isDark ? Colors.white.withOpacity(0.02) : Colors.black.withOpacity(0.02),
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    children: [
                      _buildTabButton('TWIN MAP', 0),
                      _buildTabButton('MENU', 1),
                      _buildTabButton('INVENTORY', 2),
                      _buildTabButton('BRANDING', 3),
                      _buildTabButton('OPERATIONS AI', 4),
                    ],
                  ),
                ),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: _buildActiveTabContent(),
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildTabButton(String label, int index) {
    final theme = ref.watch(themeEngineProvider);
    final active = _activeTabIdx == index;
    return TextButton(
      onPressed: () {
        setState(() {
          _activeTabIdx = index;
        });
      },
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.bold,
          letterSpacing: 1.0,
          color: active ? theme.accentColor : Colors.grey,
        ),
      ),
    );
  }

  Widget _buildActiveTabContent() {
    switch (_activeTabIdx) {
      case 0:
        return _buildDigitalTwinTab();
      case 1:
        return _buildMenuTab();
      case 2:
        return _buildInventoryTab();
      case 3:
        return _buildBrandingTab();
      case 4:
      default:
        return _buildAITab();
    }
  }

  // 1. Digital Twin View (Tables Grid)
  Widget _buildDigitalTwinTab() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'LIVE DIGITAL TWIN MAP',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, letterSpacing: 1.5),
        ),
        const SizedBox(height: 16),
        Expanded(
          child: GridView.builder(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              childAspectRatio: 1.0,
            ),
            itemCount: _tables.length,
            itemBuilder: (context, idx) {
              final table = _tables[idx];
              final status = table['status'] ?? 'available';

              Color statusColor = Colors.green;
              if (status == 'occupied') {
                statusColor = Colors.red;
              } else if (status == 'payment_pending') {
                statusColor = Colors.amber;
              }

              return AurynCard(
                padding: const EdgeInsets.all(12),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'T-${table['id']}',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(color: statusColor, shape: BoxShape.circle),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          status.toString().toUpperCase(),
                          style: const TextStyle(fontSize: 8, color: Colors.grey),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  // 2. Menu Listing CRUD Tab
  Widget _buildMenuTab() {
    return ListView.builder(
      itemCount: _menuItems.length,
      itemBuilder: (context, idx) {
        final item = _menuItems[idx];
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          child: AurynCard(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(item['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    Text(item['category'] ?? '', style: const TextStyle(fontSize: 10, color: Colors.grey)),
                  ],
                ),
                Text(
                  '₹${item['price']}',
                  style: TextStyle(fontWeight: FontWeight.bold, color: ref.watch(themeEngineProvider).accentColor),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // 3. Inventory Stock-Out Alert Tab
  Widget _buildInventoryTab() {
    return ListView.builder(
      itemCount: _inventory.length,
      itemBuilder: (context, idx) {
        final item = _inventory[idx];
        final double stock = (item['stock'] as num?)?.toDouble() ?? 0.0;
        final double minStock = (item['min_stock'] as num?)?.toDouble() ?? 0.0;
        final isLow = stock < minStock;

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          child: AurynCard(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(item['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    Text('Safety Buffer: $minStock ${item['unit']}', style: const TextStyle(fontSize: 10, color: Colors.grey)),
                  ],
                ),
                Text(
                  '$stock ${item['unit']}',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: isLow ? Colors.red : Colors.green,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // 4. Branding & Styling Configuration Tab
  Widget _buildBrandingTab() {
    final theme = ref.watch(themeEngineProvider);
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('BRAND IDENTITY CONFIGURATOR', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, letterSpacing: 1.0)),
          const SizedBox(height: 16),
          TextField(
            controller: _brandNameController,
            style: const TextStyle(color: Colors.white, fontSize: 13),
            decoration: const InputDecoration(labelText: 'RESTAURANT NAME', labelStyle: TextStyle(fontSize: 10)),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _primaryColorController,
            style: const TextStyle(color: Colors.white, fontSize: 13),
            decoration: const InputDecoration(labelText: 'PRIMARY THEME COLOR (HEX)', labelStyle: TextStyle(fontSize: 10)),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _accentColorController,
            style: const TextStyle(color: Colors.white, fontSize: 13),
            decoration: const InputDecoration(labelText: 'ACCENT ACCENT COLOR (HEX)', labelStyle: TextStyle(fontSize: 10)),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: AurynButton(
              label: 'Commit SaaS Branding Changes',
              onPressed: _handleSaveBranding,
            ),
          ),
        ],
      ),
    );
  }

  // 5. Manager Natural Language BI AI Command Tab
  Widget _buildAITab() {
    final theme = ref.watch(themeEngineProvider);
    return Column(
      children: [
        Expanded(
          child: ListView.builder(
            itemCount: _aiLog.length,
            itemBuilder: (context, idx) {
              final text = _aiLog[idx];
              final isAi = text.startsWith('AURYN:') || text.startsWith('Good afternoon');
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isAi ? Colors.grey.withOpacity(0.04) : theme.accentColor.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white10),
                ),
                child: Text(
                  text,
                  style: const TextStyle(fontSize: 12, color: Colors.white),
                ),
              );
            },
          ),
        ),
        const Divider(height: 1),
        Padding(
          padding: const EdgeInsets.only(top: 12.0),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _aiQueryController,
                  style: const TextStyle(color: Colors.white, fontSize: 13),
                  decoration: InputDecoration(
                    hintText: 'Ask: "Why are orders delayed?" or "What to promote?"...',
                    hintStyle: const TextStyle(color: Colors.white30, fontSize: 11),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(24),
                      borderSide: const BorderSide(color: Colors.white10),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(24),
                      borderSide: BorderSide(color: theme.accentColor),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                onPressed: _handleAskManagerAI,
                icon: Icon(Icons.send, color: theme.accentColor),
              ),
            ],
          ),
        ),
      ],
    );
  }

  @override
  void dispose() {
    _brandNameController.dispose();
    _primaryColorController.dispose();
    _accentColorController.dispose();
    _aiQueryController.dispose();
    super.dispose();
  }
}
