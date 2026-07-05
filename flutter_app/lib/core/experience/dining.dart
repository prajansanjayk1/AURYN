import 'package:flutter/material.dart';
import '../../shared/models/dining_stage.dart';
import 'experience_base.dart';

class DiningExperienceStage extends DiningExperience {
  const DiningExperienceStage()
      : super(
          stage: DiningStage.dining,
          title: 'Enjoy your meal',
          description: 'Orchestrated premium hospitality.',
        );

  @override
  List<Widget> buildActionControls(BuildContext context) {
    return [
      ElevatedButton(
        onPressed: () {},
        child: const Text('Request Assistance'),
      ),
    ];
  }

  @override
  Widget buildStageBody(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.local_dining, size: 80, color: Color(0xFFD4AF37)),
          SizedBox(height: 16),
          Text(
            'Enjoy Your Dining Session',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 8),
          Text('Call a runner anytime for water, napkins, or recommendations.'),
        ],
      ),
    );
  }
}
