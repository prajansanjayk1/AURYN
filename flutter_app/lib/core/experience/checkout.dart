import 'package:flutter/material.dart';
import '../../shared/models/dining_stage.dart';
import 'experience_base.dart';

class CheckoutExperience extends DiningExperience {
  const CheckoutExperience()
      : super(
          stage: DiningStage.checkout,
          title: 'Invoice Statement',
          description: 'Verify dining ledger summary and complete payment.',
        );

  @override
  List<Widget> buildActionControls(BuildContext context) {
    return [
      ElevatedButton(
        onPressed: () {},
        child: const Text('Pay by Card/UPI'),
      ),
      OutlinedButton(
        onPressed: () {},
        child: const Text('Pay by Cash'),
      ),
    ];
  }

  @override
  Widget buildStageBody(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.payment, size: 80, color: Color(0xFFD4AF37)),
          SizedBox(height: 16),
          Text(
            'Dining Invoice Summary',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 8),
          Text('Verify taxes (5% GST + 18% Service Charge) before finalizing.'),
        ],
      ),
    );
  }
}
