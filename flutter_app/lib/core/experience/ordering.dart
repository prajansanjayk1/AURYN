import 'package:flutter/material.dart';
import '../../shared/models/dining_stage.dart';
import 'experience_base.dart';

class OrderingExperience extends DiningExperience {
  const OrderingExperience()
      : super(
          stage: DiningStage.ordering,
          title: 'Curated Menu',
          description: 'Explore gourmet selections pairing, allergens, and ingredients.',
        );

  @override
  List<Widget> buildActionControls(BuildContext context) {
    return [
      ElevatedButton(
        onPressed: () {},
        child: const Text('Review Order Cart'),
      ),
    ];
  }

  @override
  Widget buildStageBody(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: const [
        Text(
          'Chef\'s Recommendations',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        SizedBox(height: 8),
        // Placeholder for menu items list
      ],
    );
  }
}
