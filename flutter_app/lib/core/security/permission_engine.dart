enum AurynPermission {
  viewRevenue,
  modifyMenu,
  deductInventory,
  closeSession,
  manageStaff,
  manageBranches,
  requestService,
  collectCash,
  viewDigitalTwin
}

class PermissionEngine {
  static bool hasPermission(String role, AurynPermission permission) {
    final lowerRole = role.toLowerCase();
    
    switch (permission) {
      case AurynPermission.viewRevenue:
        return ['admin', 'owner', 'manager', 'supervisor'].contains(lowerRole);
      case AurynPermission.modifyMenu:
        return ['admin', 'owner', 'manager', 'chef', 'supervisor'].contains(lowerRole);
      case AurynPermission.deductInventory:
        return ['admin', 'owner', 'manager', 'chef', 'runner', 'supervisor'].contains(lowerRole);
      case AurynPermission.closeSession:
        return ['admin', 'owner', 'manager', 'runner', 'supervisor'].contains(lowerRole);
      case AurynPermission.manageStaff:
        return ['admin', 'owner', 'manager'].contains(lowerRole);
      case AurynPermission.manageBranches:
        return ['owner', 'admin'].contains(lowerRole);
      case AurynPermission.requestService:
        return true; // Anyone (including customer) can trigger runner assistance
      case AurynPermission.collectCash:
        return ['runner', 'admin', 'manager', 'cashier'].contains(lowerRole);
      case AurynPermission.viewDigitalTwin:
        return ['admin', 'owner', 'manager', 'supervisor'].contains(lowerRole);
    }
  }
}
