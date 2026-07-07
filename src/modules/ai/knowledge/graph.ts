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
    this.addNode({ id: 'cuisine_gourmet', type: 'Cuisine', label: 'Gourmet Fusion' });

    // 4. Add core ingredients nodes
    const ingredients = [
      { id: 'ing_wagyu', label: 'A5 Wagyu Beef', vegan: false, veg: false },
      { id: 'ing_brioche', label: 'Brioche Buns', vegan: false, veg: true },
      { id: 'ing_truffle', label: 'Black Truffle', vegan: true, veg: true },
      { id: 'ing_gruyere', label: 'Gruyère Cheese', vegan: false, veg: true, dairy: true },
      { id: 'ing_burrata', label: 'Burrata Cheese', vegan: false, veg: true, dairy: true },
      { id: 'ing_sourdough', label: 'Sourdough', vegan: true, veg: true, gluten: true },
      { id: 'ing_lobster', label: 'Maine Lobster', vegan: false, veg: false, shellfish: true },
      { id: 'ing_saffron', label: 'Kashmiri Saffron', vegan: true, veg: true },
      { id: 'ing_rice', label: 'Acquerello Rice', vegan: true, veg: true },
      { id: 'ing_parmigiano', label: 'Parmigiano-Reggiano', vegan: false, veg: true, dairy: true },
      { id: 'ing_matcha', label: 'Uji Matcha', vegan: true, veg: true },
      { id: 'ing_almond', label: 'Almonds', vegan: true, veg: true, nuts: true },
      { id: 'ing_pistachio', label: 'Iranian Pistachios', vegan: true, veg: true, nuts: true },
      { id: 'ing_peach', label: 'Organic Peaches', vegan: true, veg: true },
      { id: 'ing_thyme', label: 'Himalayan Thyme', vegan: true, veg: true }
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
      { id: 'm1', name: 'Wagyu Beef Sliders', cat: 'starters', ings: ['ing_wagyu', 'ing_brioche', 'ing_truffle', 'ing_gruyere'], price: 950, rec: true, pop: true, tags: ['savory', 'premium'] },
      { id: 'm2', name: 'Truffle Burrata Pizza', cat: 'mains', ings: ['ing_burrata', 'ing_sourdough', 'ing_truffle'], price: 1200, rec: false, pop: true, tags: ['savory', 'popular'] },
      { id: 'm3', name: 'Saffron Lobster Risotto', cat: 'mains', ings: ['ing_lobster', 'ing_rice', 'ing_saffron', 'ing_parmigiano'], price: 1850, rec: true, pop: false, tags: ['premium'] },
      { id: 'm4', name: 'Matcha Pistachio Opera Cake', cat: 'desserts', ings: ['ing_matcha', 'ing_almond', 'ing_pistachio', 'ing_gruyere'], price: 650, rec: false, pop: true, tags: ['sweet', 'nuts'] },
      { id: 'm5', name: 'Peach Thyme Sparkler', cat: 'beverages', ings: ['ing_peach', 'ing_thyme'], price: 350, rec: false, pop: false, tags: ['refreshing', 'cold', 'vegan'] }
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
      this.addEdge({ from: `food_${item.id}`, to: 'cuisine_gourmet', type: 'belongsTo' });

      // Link to ingredients
      item.ings.forEach(ingId => {
        this.addEdge({ from: `food_${item.id}`, to: ingId, type: 'contains' });
      });
    });

    // 6. Cross-recommendation relationships
    this.addEdge({ from: 'food_m1', to: 'food_m5', type: 'recommendedWith', weight: 0.8 }); // Sliders + Sparkler
    this.addEdge({ from: 'food_m2', to: 'food_m5', type: 'recommendedWith', weight: 0.9 }); // Pizza + Sparkler
    this.addEdge({ from: 'food_m3', to: 'food_m5', type: 'recommendedWith', weight: 0.75 }); // Risotto + Sparkler
    this.addEdge({ from: 'food_m2', to: 'food_m4', type: 'recommendedWith', weight: 0.6 }); // Pizza + Dessert
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
