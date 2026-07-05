import 'package:flutter/material.dart';
import '../../shared/models/dining_stage.dart';
import 'experience_base.dart';

class ArrivalExperience extends DiningExperience {
  const ArrivalExperience()
      : super(
          stage: DiningStage.arrival,
          title: 'Welcome to AURYN',
          description: 'Orchestrating your fine dining session.',
        );

  @override
  List<Widget> buildActionControls(BuildContext context) {
    return [
      ElevatedButton(
        onPressed: () {},
        child: const Text('Scan Signed QR'),
      ),
    ];
  }

  @override
  Widget buildStageBody(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.restaurant, size: 80, color: Color(0xFFD4AF37)),
          SizedBox(height: 16),
          Text(
            'Welcome to AURYN',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 8),
          Text('Scan the table QR code to join a live dining session.'),
        ],
      ),
    );
  }
}
