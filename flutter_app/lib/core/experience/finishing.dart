import 'package:flutter/material.dart';
import '../../shared/models/dining_stage.dart';
import 'experience_base.dart';

class FinishingExperience extends DiningExperience {
  const FinishingExperience()
      : super(
          stage: DiningStage.finishing,
          title: 'Finishing Touches',
          description: 'Would you like to explore our desserts or request your bill?',
        );

  @override
  List<Widget> buildActionControls(BuildContext context) {
    return [
      ElevatedButton(
        onPressed: () {},
        child: const Text('Request Bill'),
      ),
    ];
  }

  @override
  Widget buildStageBody(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.cake, size: 80, color: Color(0xFFD4AF37)),
          SizedBox(height: 16),
          Text(
            'Sweet Endings',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 8),
          Text('Try our artisan Smoked Rose Pistachio Kulfi or Matcha Opera Cake.'),
        ],
      ),
    );
  }
}
