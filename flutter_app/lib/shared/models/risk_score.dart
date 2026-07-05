enum RiskLevel { low, medium, high, critical }

class RiskAssessment {
  final int riskScore;
  final RiskLevel level;
  final List<String> triggers;
  final bool isAllowed;

  const RiskAssessment({
    required this.riskScore,
    required this.level,
    required this.triggers,
    required this.isAllowed,
  });
}
