import 'package:flutter/material.dart';
import '../../shared/models/dining_stage.dart';
import 'experience_base.dart';

class WaitingExperience extends DiningExperience {
  const WaitingExperience()
      : super(
          stage: DiningStage.waiting,
          title: 'Kitchen Preparation',
          description: 'Our kitchen de cuisine is crafting your order.',
        );

  @override
  List<Widget> buildActionControls(BuildContext context) {
    return [
      ElevatedButton(
        onPressed: () {},
        child: const Text('Ask AI Concierge'),
      ),
    ];
  }

  @override
  Widget buildStageBody(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(color: Color(0xFFD4AF37)),
          SizedBox(height: 16),
          Text(
            'Order Placed Successfully',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 8),
          Text('Estimated wait time: 12 minutes'),
        ],
      ),
    );
  }
}
