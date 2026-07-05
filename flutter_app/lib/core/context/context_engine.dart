import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../security/jwt_manager.dart';
import '../security/session_manager.dart';
import '../security/permission_engine.dart';
import '../../shared/models/dining_stage.dart';

class AurynContext {
  final User? firebaseUser; // Supabase user
  final String? staffRole;
  final String? staffName;
  final String? restaurantId;
  final String? branchId;
  final String? tableId;
  final String? guestId;
  final String? guestName;
  final String? sessionId;
  final DiningStage diningStage;
  final bool isLoading;

  const AurynContext({
    this.firebaseUser,
    this.staffRole,
    this.staffName,
    this.restaurantId,
    this.branchId,
    this.tableId,
    this.guestId,
    this.guestName,
    this.sessionId,
    this.diningStage = DiningStage.arrival,
    this.isLoading = true,
  });

  bool get isAuthenticated => firebaseUser != null || guestId != null;
  bool get isStaff => staffRole != null;
  bool get isCustomer => guestId != null && tableId != null;

  AurynContext copyWith({
    User? firebaseUser,
    String? staffRole,
    String? staffName,
    String? restaurantId,
    String? branchId,
    String? tableId,
    String? guestId,
    String? guestName,
    String? sessionId,
    DiningStage? diningStage,
    bool? isLoading,
  }) {
    return AurynContext(
      firebaseUser: firebaseUser ?? this.firebaseUser,
      staffRole: staffRole ?? this.staffRole,
      staffName: staffName ?? this.staffName,
      restaurantId: restaurantId ?? this.restaurantId,
      branchId: branchId ?? this.branchId,
      tableId: tableId ?? this.tableId,
      guestId: guestId ?? this.guestId,
      guestName: guestName ?? this.guestName,
      sessionId: sessionId ?? this.sessionId,
      diningStage: diningStage ?? this.diningStage,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

class ContextEngine extends StateNotifier<AurynContext> {
  final SessionManager _sessionManager = SessionManager();
  final JWTManager _jwtManager = JWTManager();
  final SupabaseClient _client = Supabase.instance.client;

  ContextEngine() : super(const AurynContext(isLoading: true)) {
    _loadInitialContext();
    _listenToAuthChanges();
  }

  // Auto-detect and resolve context at launch
  Future<void> _loadInitialContext() async {
    try {
      final supabaseUser = _client.auth.currentUser;
      if (supabaseUser != null) {
        // Authenticated Staff Member
        final token = await _sessionManager.getStaffToken();
        String? role = await _sessionManager.getStaffRole();
        String? name;

        if (token != null) {
          final decoded = _jwtManager.decode(token);
          if (decoded != null && !decoded.isExpired) {
            role = decoded.role;
            name = decoded.name;
          }
        }

        state = AurynContext(
          firebaseUser: supabaseUser,
          staffRole: role ?? 'runner',
          staffName: name ?? 'Staff Member',
          restaurantId: 'auryn-hq',
          branchId: 'main-branch',
          isLoading: false,
        );
        return;
      }

      // Check for Customer session in Cache
      final savedCustomer = await _sessionManager.getCustomerSession();
      if (savedCustomer != null) {
        state = AurynContext(
          tableId: savedCustomer['tableId'],
          guestName: savedCustomer['guestName'],
          guestId: savedCustomer['guestId'],
          sessionId: savedCustomer['sessionId'],
          restaurantId: 'auryn-hq',
          branchId: 'main-branch',
          diningStage: DiningStage.arrival, // Will resolve stage from session orders
          isLoading: false,
        );
        await resolveDiningStage();
        return;
      }
    } catch (e) {
      print('[ContextEngine] Initial load failed: $e');
    }
    state = const AurynContext(isLoading: false);
  }

  void _listenToAuthChanges() {
    _client.auth.onAuthStateChange.listen((data) async {
      final user = data.user;
      if (user == null) {
        // Reset staff context
        await _sessionManager.clearStaffSession();
        if (state.isStaff) {
          state = const AurynContext(isLoading: false);
        }
      } else {
        // Handle auth login
        final String? sessionToken = data.session?.accessToken;
        String role = 'runner';
        String name = 'Staff Member';

        if (sessionToken != null) {
          final decoded = _jwtManager.decode(sessionToken);
          if (decoded != null) {
            role = decoded.role;
            name = decoded.name;
          }
        }
        await _sessionManager.saveStaffSession(sessionToken ?? '', role);
        state = AurynContext(
          firebaseUser: user,
          staffRole: role,
          staffName: name,
          restaurantId: 'auryn-hq',
          branchId: 'main-branch',
          isLoading: false,
        );
      }
    });
  }

  // Setup Customer dining session manually (e.g. scanning table QR)
  Future<void> initializeCustomerSession({
    required String tableId,
    required String guestName,
    required String guestId,
    required String sessionId,
  }) async {
    await _sessionManager.saveCustomerSession(
      tableId: tableId,
      guestName: guestName,
      guestId: guestId,
      sessionId: sessionId,
    );
    state = AurynContext(
      tableId: tableId,
      guestName: guestName,
      guestId: guestId,
      sessionId: sessionId,
      restaurantId: 'auryn-hq',
      branchId: 'main-branch',
      diningStage: DiningStage.arrival,
      isLoading: false,
    );
  }

  // Clear session (checkout completed or logout)
  Future<void> clearSession() async {
    if (state.isStaff) {
      await _client.auth.signOut();
      await _sessionManager.clearStaffSession();
    } else {
      await _sessionManager.clearCustomerSession();
    }
    state = const AurynContext(isLoading: false);
  }

  // Dynamically evaluate current dining stage based on order updates
  Future<void> resolveDiningStage() async {
    if (!state.isCustomer || state.sessionId == null) return;
    try {
      final ordersResponse = await _client
          .from('orders')
          .select()
          .eq('session_id', state.sessionId!);
      
      if (ordersResponse == null || ordersResponse.isEmpty) {
        state = state.copyWith(diningStage: DiningStage.ordering);
        return;
      }

      final List orders = ordersResponse;
      final bool hasActiveCooking = orders.any((o) => 
        o['status'] == 'placed' || o['status'] == 'accepted' || o['status'] == 'preparing' || o['status'] == 'ready' || o['status'] == 'delivering'
      );
      final bool hasDelivered = orders.any((o) => o['status'] == 'delivered');

      if (hasActiveCooking) {
        state = state.copyWith(diningStage: DiningStage.waiting);
      } else if (hasDelivered) {
        state = state.copyWith(diningStage: DiningStage.dining);
      } else {
        state = state.copyWith(diningStage: DiningStage.ordering);
      }
    } catch (e) {
      print('[ContextEngine] Resolve dining stage error: $e');
    }
  }

  // Transition experience stage manually
  void updateDiningStage(DiningStage stage) {
    state = state.copyWith(diningStage: stage);
  }
}

// Global context engine provider
final contextEngineProvider = StateNotifierProvider<ContextEngine, AurynContext>((ref) {
  return ContextEngine();
});
