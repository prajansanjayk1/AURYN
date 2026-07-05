import 'package:flutter/material.dart';
import '../../shared/models/dining_stage.dart';
import 'experience_base.dart';

class LeavingExperience extends DiningExperience {
  const LeavingExperience()
      : super(
          stage: DiningStage.leaving,
          title: 'Orchestrated Elegance',
          description: 'Thank you for dining with us. Your session is now closed.',
        );

  @override
  List<Widget> buildActionControls(BuildContext context) {
    return [
      ElevatedButton(
        onPressed: () {},
        child: const Text('Return to Welcome Screen'),
      ),
    ];
  }

  @override
  Widget buildStageBody(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.check_circle_outline, size: 80, color: Colors.green),
          SizedBox(height: 16),
          Text(
            'Payment Successful',
            style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 8),
          Text('Your digital receipt has been generated and saved.'),
        ],
      ),
    );
  }
}
