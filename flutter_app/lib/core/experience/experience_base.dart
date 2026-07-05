import 'package:flutter/material.dart';
import '../../shared/models/dining_stage.dart';

abstract class DiningExperience {
  final DiningStage stage;
  final String title;
  final String description;

  const DiningExperience({
    required this.stage,
    required this.title,
    required this.description,
  });

  // Returns list of actions/controls permitted during this stage
  List<Widget> buildActionControls(BuildContext context);

  // Returns custom visual widgets specific to this stage
  Widget buildStageBody(BuildContext context);
}
