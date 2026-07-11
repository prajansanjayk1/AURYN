import { GraphNode, GraphEdge, MenuItem } from '../types';

export class KnowledgeGraph {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: Map<string, GraphEdge[]> = new Map(); // Keyed by source node ID

  constructor() {
    this.initializeGraph();
  }

  /**
   * Clears the graph
   */
  public clear(): void {
    this.nodes.clear();
    this.edges.clear();
  }

  /**
   * Adds a node to the graph
   */
  public addNode(node: GraphNode): void {
    this.nodes.set(node.id, node);
    if (!this.edges.has(node.id)) {
      this.edges.set(node.id, []);
    }
  }

  /**
   * Adds a directional edge to the graph
   */
  public addEdge(edge: GraphEdge): void {
    if (!this.nodes.has(edge.from) || !this.nodes.has(edge.to)) {
      console.warn(`Cannot add edge from ${edge.from} to ${edge.to}. Nodes must exist.`);
      return;
    }
    const list = this.edges.get(edge.from) || [];
    list.push(edge);
    this.edges.set(edge.from, list);
  }

  /**
   * Seeds the graph with the standard restaurant domain data.
   */
  public initializeGraph(): void {
    this.clear();

    // 1. Add category nodes
    const categories = ['Starters', 'Mains', 'Desserts', 'Beverages'];
    categories.forEach(cat => {
      this.addNode({ id: `cat_${cat.toLowerCase()}`, type: 'Category', label: cat });
    });

    // 2. Add allergen nodes
    const allergens = ['Dairy', 'Gluten', 'Nuts', 'Shellfish'];
    allergens.forEach(all => {
      this.addNode({ id: `allergen_${all.toLowerCase()}`, type: 'Allergen', label: all });
    });

    // 3. Add cuisine node
    this.addNode({ id: 'cuisine_wings', type: 'Cuisine', label: 'Gourmet Wings' });

    // 4. Add core ingredients nodes
    const ingredients = [
      { id: 'ing_chicken_wings', label: 'Chicken Wings', vegan: false, veg: false },
      { id: 'ing_buffalo', label: 'Buffalo Sauce', vegan: false, veg: true },
      { id: 'ing_potatoes', label: 'Potatoes', vegan: true, veg: true },
      { id: 'ing_truffle', label: 'Truffle Oil', vegan: true, veg: true },
      { id: 'ing_parmigiano', label: 'Parmigiano-Reggiano', vegan: false, veg: true, dairy: true },
      { id: 'ing_mozzarella', label: 'Mozzarella Cheese', vegan: false, veg: true, dairy: true },
      { id: 'ing_breadcrumbs', label: 'Breadcrumbs', vegan: true, veg: true, gluten: true },
      { id: 'ing_brioche', label: 'Brioche Buns', vegan: false, veg: true, gluten: true, dairy: true },
      { id: 'ing_chocolate', label: 'Milk Chocolate', vegan: false, veg: true, dairy: true },
      { id: 'ing_marshmallows', label: 'Marshmallows', vegan: false, veg: false },
      { id: 'ing_blueberries', label: 'Blueberries', vegan: true, veg: true },
      { id: 'ing_lemon', label: 'Lemon Juice', vegan: true, veg: true },
      { id: 'ing_mangoes', label: 'Alphonso Mangoes', vegan: true, veg: true },
      { id: 'ing_habanero', label: 'Habanero Peppers', vegan: true, veg: true },
      { id: 'ing_butter', label: 'Butter', vegan: false, veg: true, dairy: true }
    ];

    ingredients.forEach(ing => {
      this.addNode({
        id: ing.id,
        type: 'Ingredient',
        label: ing.label,
        properties: { vegan: ing.vegan, veg: ing.veg }
      });

      // Link ingredients to their allergens
      if ('dairy' in ing) {
        this.addEdge({ from: ing.id, to: 'allergen_dairy', type: 'containsAllergen' });
      }
      if ('nuts' in ing) {
        this.addEdge({ from: ing.id, to: 'allergen_nuts', type: 'containsAllergen' });
      }
      if ('gluten' in ing) {
        this.addEdge({ from: ing.id, to: 'allergen_gluten', type: 'containsAllergen' });
      }
      if ('shellfish' in ing) {
        this.addEdge({ from: ing.id, to: 'allergen_shellfish', type: 'containsAllergen' });
      }
    });

    // 5. Seed standard menu items
    const menuItemsList = [
      { id: 'm1', name: 'Classic Buffalo Wings', cat: 'starters', ings: ['ing_chicken_wings', 'ing_buffalo', 'ing_butter'], price: 480, rec: false, pop: true, tags: ['savory', 'spicy'] },
      { id: 'm2', name: 'Truffle Parm Fries', cat: 'starters', ings: ['ing_potatoes', 'ing_truffle', 'ing_parmigiano'], price: 420, rec: false, pop: true, tags: ['savory', 'premium'] },
      { id: 'm3', name: 'Mozzarella Staves', cat: 'starters', ings: ['ing_mozzarella', 'ing_breadcrumbs'], price: 390, rec: false, pop: false, tags: ['savory', 'cheesy'] },
      { id: 'm4', name: 'The Monarch Platter', cat: 'mains', ings: ['ing_chicken_wings', 'ing_buffalo', 'ing_potatoes'], price: 1250, rec: true, pop: true, tags: ['savory', 'spicy', 'platter'] },
      { id: 'm5', name: 'Lemon Pepper Wet Wings', cat: 'mains', ings: ['ing_chicken_wings', 'ing_butter'], price: 780, rec: false, pop: false, tags: ['savory', 'citrus'] },
      { id: 'm6', name: 'Mango Habanero Wings', cat: 'mains', ings: ['ing_chicken_wings', 'ing_mangoes', 'ing_habanero'], price: 790, rec: true, pop: true, tags: ['spicy', 'sweet'] },
      { id: 'm7', name: 'Nashville Hot Sliders', cat: 'mains', ings: ['ing_chicken_wings', 'ing_brioche'], price: 680, rec: false, pop: true, tags: ['savory', 'spicy'] },
      { id: 'm8', name: 'Campfire S\'mores Skillet', cat: 'desserts', ings: ['ing_chocolate', 'ing_marshmallows'], price: 380, rec: true, pop: true, tags: ['sweet'] },
      { id: 'm9', name: 'Churros with Spiced Chocolate', cat: 'desserts', ings: ['ing_chocolate'], price: 340, rec: false, pop: false, tags: ['sweet'] },
      { id: 'm10', name: 'Blueberry Basil Lemonade', cat: 'beverages', ings: ['ing_blueberries', 'ing_lemon'], price: 260, rec: false, pop: false, tags: ['refreshing', 'cold', 'vegan'] },
      { id: 'm11', name: 'Spiced Mango Mojito', cat: 'beverages', ings: ['ing_mangoes', 'ing_lemon'], price: 290, rec: true, pop: true, tags: ['refreshing', 'cold', 'spicy'] }
    ];

    menuItemsList.forEach(item => {
      this.addNode({
        id: `food_${item.id}`,
        type: 'Food',
        label: item.name,
        properties: { price: item.price, chefRecommendation: item.rec, popular: item.pop, tags: item.tags }
      });

      // Link to Category
      this.addEdge({ from: `food_${item.id}`, to: `cat_${item.cat}`, type: 'belongsTo' });
      
      // Link to Cuisine
      this.addEdge({ from: `food_${item.id}`, to: 'cuisine_wings', type: 'belongsTo' });

      // Link to ingredients
      item.ings.forEach(ingId => {
        this.addEdge({ from: `food_${item.id}`, to: ingId, type: 'contains' });
      });
    });

    // 6. Cross-recommendation relationships
    this.addEdge({ from: 'food_m1', to: 'food_m10', type: 'recommendedWith', weight: 0.9 }); // Wings + Lemonade
    this.addEdge({ from: 'food_m4', to: 'food_m10', type: 'recommendedWith', weight: 0.95 }); // Platter + Lemonade
    this.addEdge({ from: 'food_m6', to: 'food_m11', type: 'recommendedWith', weight: 0.85 }); // Mango Habanero + Mango Mojito
    this.addEdge({ from: 'food_m7', to: 'food_m2', type: 'recommendedWith', weight: 0.8 }); // Sliders + Fries
    this.addEdge({ from: 'food_m4', to: 'food_m8', type: 'recommendedWith', weight: 0.7 }); // Platter + S'mores Skillet
  }

  /**
   * Traces paths using Breadth-First Search (BFS) to find if a food item leads to a target node.
   */
  public tracePath(startNodeId: string, endNodeId: string): string[] | null {
    if (!this.nodes.has(startNodeId) || !this.nodes.has(endNodeId)) return null;

    const queue: string[][] = [[startNodeId]];
    const visited = new Set<string>([startNodeId]);

    while (queue.length > 0) {
      const path = queue.shift()!;
      const current = path[path.length - 1];

      if (current === endNodeId) {
        return path.map(id => this.nodes.get(id)!.label);
      }

      const neighbors = this.edges.get(current) || [];
      for (const edge of neighbors) {
        if (!visited.has(edge.to)) {
          visited.add(edge.to);
          queue.push([...path, edge.to]);
        }
      }
    }
    return null;
  }

  /**
   * Checks if a food item is safe against a set of allergen labels using graph relationship traversal.
   */
  public checkSafety(foodItemId: string, targetAllergen: string): { safe: boolean; path?: string[] } {
    const startId = `food_${foodItemId}`;
    const endId = `allergen_${targetAllergen.toLowerCase()}`;

    const path = this.tracePath(startId, endId);
    if (path) {
      return { safe: false, path };
    }
    return { safe: true };
  }

  /**
   * Graph reasoning check for Vegetarian status (no meat ingredients).
   */
  public isVegetarian(foodItemId: string): { vegetarian: boolean; offendingIngredient?: string } {
    const foodNodeId = `food_${foodItemId}`;
    const outgoing = this.edges.get(foodNodeId) || [];

    for (const edge of outgoing) {
      if (edge.type === 'contains') {
        const ingredient = this.nodes.get(edge.to);
        if (ingredient && ingredient.properties?.veg === false) {
          return { vegetarian: false, offendingIngredient: ingredient.label };
        }
      }
    }
    return { vegetarian: true };
  }

  /**
   * Graph reasoning check for Vegan status (no animal ingredients, including dairy/honey/meat).
   */
  public isVegan(foodItemId: string): { vegan: boolean; offendingIngredient?: string } {
    const foodNodeId = `food_${foodItemId}`;
    const outgoing = this.edges.get(foodNodeId) || [];

    for (const edge of outgoing) {
      if (edge.type === 'contains') {
        const ingredient = this.nodes.get(edge.to);
        if (ingredient && ingredient.properties?.vegan === false) {
          return { vegan: false, offendingIngredient: ingredient.label };
        }
      }
    }
    return { vegan: true };
  }

  /**
   * Find similar items using graph similarity relations
   */
  public getRecommendations(foodItemId: string): string[] {
    const foodNodeId = `food_${foodItemId}`;
    const edges = this.edges.get(foodNodeId) || [];
    return edges
      .filter(e => e.type === 'recommendedWith')
      .map(e => this.nodes.get(e.to)!.label);
  }
}
