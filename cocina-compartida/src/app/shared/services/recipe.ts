// recipe.service.ts
import { Injectable, signal, effect } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';

export interface Recipe {
  id: string; 
  name: string;
  descripcion: string;
  ingredients: string[];
  steps: string[];
  images: string[];
  author: string;
  avatar: string;
}

export const RECIPES: Recipe[] = [
  {
    id: uuidv4(),
    name: 'Tarta de Limón y Merengue',
    descripcion: 'Un clásico agridulce con una cubierta de merengue dorado y suave.',
    ingredients: [
      '200g de galletas de vainilla',
      '100g de mantequilla derretida',
      '4 yemas de huevo',
      '1 lata de leche condensada',
      'Jugo de 4 limones',
      '3 claras de huevo',
      '100g de azúcar'
    ],
    steps: [
      'Tritura las galletas y mézclalas con la mantequilla. Forra un molde.',
      'Hornea la base por 10 minutos a 180°C.',
      'Mezcla las yemas, la leche condensada y el jugo de limón. Vierte sobre la base.',
      'Hornea 15 minutos más.',
      'Bate las claras con el azúcar a punto de nieve. Cubre la tarta.',
      'Dora el merengue con un soplete o en el grill del horno por 5 minutos.'
    ],
    images: [
      'logos/Tarta.jpg',
      'logos/R.jpeg'
    ],
    author: 'Chef Paty',
    avatar: 'https://i.pravatar.cc/150?img=1'
  },
  {
    id: uuidv4(),
    name: 'Lasaña Clásica de Carne',
    descripcion: 'La receta italiana tradicional, con capas de pasta, ragú y bechamel.',
    ingredients: [
      '500g de carne molida',
      '1 cebolla, 1 zanahoria, 1 tallo de apio (sofrito)',
      '800g de tomate triturado',
      '500g de láminas de pasta para lasaña',
      '50g de mantequilla y 50g de harina (para bechamel)',
      '1L de leche',
      'Queso Parmesano y Mozzarella'
    ],
    steps: [
      'Prepara el ragú: sofríe las verduras, añade la carne y el tomate. Cocina a fuego lento por 1 hora.',
      'Prepara la bechamel: derrite la mantequilla, añade la harina y luego la leche hasta espesar.',
      'Monta la lasaña: capa de salsa, pasta, bechamel y queso. Repite 4 veces.',
      'Cubre con mozzarella y Parmesano.',
      'Hornea a 180°C por 30 minutos.'
    ],
    images: [
      'logos/Lasa.jpg'    
    ],
    author: 'Nonno Rico',
    avatar: 'https://i.pravatar.cc/150?img=5'
  },
  {
    id: uuidv4(),
    name: 'Tacos al Pastor Caseros',
    descripcion: 'Una versión simplificada para hacer el clásico taco mexicano en casa.',
    ingredients: [
      '1 kg de carne de cerdo (lomo o pierna)',
      '1/2 piña fresca',
      'Adobo (chiles guajillos, chipotle, especias)',
      'Tortillas de maíz',
      'Cebolla y cilantro para adornar'
    ],
    steps: [
      'Marina el cerdo en el adobo por al menos 4 horas.',
      'Cocina el cerdo a la plancha o en el horno hasta que esté bien dorado.',
      'Pica la carne y la piña en trozos pequeños.',
      'Calienta las tortillas y rellena con la carne, piña, cebolla y cilantro.'
    ],
    images: [
      'logos/Tacos.jpeg'],
    author: 'Juanito Taco',
    avatar: 'https://i.pravatar.cc/150?img=32'
  },
  {
    id: uuidv4(),
    name: 'Brownies Súper Chocolatosos',
    descripcion: 'Receta rápida y fácil para obtener unos brownies húmedos y con corteza crujiente.',
    ingredients: [
      '200g de chocolate negro',
      '150g de mantequilla',
      '150g de azúcar',
      '3 huevos',
      '80g de harina de trigo',
      '1 cucharadita de vainilla'
    ],
    steps: [
      'Precalienta el horno a 180°C. Engrasa un molde cuadrado.',
      'Derrite el chocolate y la mantequilla juntos.',
      'Bate los huevos con el azúcar y la vainilla hasta que estén espumosos.',
      'Incorpora la mezcla de chocolate y luego la harina tamizada.',
      'Vierte en el molde y hornea por 25-30 minutos.'
    ],
    images: [
      'https://images.unsplash.com/photo-1579304024227-6f809d300063?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w0NTUyMTZ8MHwxfHNlYXJjaHwxfHxiaG93bmllc3xlbnwwfHx8fHwxNzAwMTUwOTY0fDA&ixlib=rb-4.0.3&q=80&w=1080',
    ],
    author: 'Ana Dulce',
    avatar: 'https://i.pravatar.cc/150?img=47'
  },
  {
    id: uuidv4(),
    name: 'Curry de Garbanzos (Vegano)',
    descripcion: 'Un plato de la India, lleno de sabor, especias y muy nutritivo. Perfecto con arroz.',
    ingredients: [
      '1 lata de garbanzos cocidos',
      '1 lata de leche de coco',
      '1 cebolla, picada',
      '2 dientes de ajo',
      '1 trozo de jengibre',
      '1 cucharada de pasta de curry rojo',
      'Hojas de espinaca fresca'
    ],
    steps: [
      'Sofríe la cebolla, el ajo y el jengibre hasta que estén blandos.',
      'Añade la pasta de curry y cocina por un minuto.',
      'Incorpora la leche de coco y los garbanzos (escurridos). Cocina a fuego lento 15 minutos.',
      'Agrega las espinacas al final hasta que se marchiten. Sirve con arroz basmati.'
    ],
    images: [
      'https://images.unsplash.com/photo-1620756282299-4a0b784e8677?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w0NTUyMTZ8MHwxfHNlYXJjaHwxfHxjaGljayUyMHBlYSUyMGN1cnJ5fGVufDB8fHx8fDE3MDAxNTA5Mjh8MA&ixlib=rb-4.0.3&q=80&w=1080',
    ],
    author: 'Chef Paty',
    avatar: 'https://i.pravatar.cc/150?img=1'
  }
];

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private readonly STORAGE_KEY = 'my_recipes';
  private _recipes = signal<Recipe[]>(this.initializeRecipes());

  get recipes() {
    return this._recipes.asReadonly();
  }

  constructor() {
    effect(() => {
      this.saveRecipesToStorage(this._recipes());
    });
  }

  addRecipe(recipe: Recipe) {
    this._recipes.update((list) => [...list, recipe]);
  }
  
  private initializeRecipes(): Recipe[] {
    try {
      const storedRecipes = localStorage.getItem(this.STORAGE_KEY);
      
      if (storedRecipes) {
        // Si hay recetas en localStorage, las combinamos con las precargadas
        const parsedStoredRecipes = JSON.parse(storedRecipes) as Recipe[];
        
        // Combinar recetas: primero las precargadas, luego las del localStorage
        // y eliminar duplicados por ID
        const allRecipes = [...RECIPES, ...parsedStoredRecipes];
        const uniqueRecipes = this.removeDuplicateRecipes(allRecipes);
        
        return uniqueRecipes;
      } else {
        // Si no hay nada en localStorage, devolvemos solo las recetas precargadas
        return RECIPES;
      }

    } catch (e) {
      console.error("Error loading recipes from localStorage", e);
      return RECIPES; // En caso de error, devolvemos las recetas precargadas
    }
  }

  private removeDuplicateRecipes(recipes: Recipe[]): Recipe[] {
    const seen = new Set();
    return recipes.filter(recipe => {
      if (seen.has(recipe.id)) {
        return false;
      }
      seen.add(recipe.id);
      return true;
    });
  }

  private saveRecipesToStorage(recipes: Recipe[]) {
    try {
      // Guardamos todas las recetas (precargadas + nuevas) en localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recipes));
    } catch (e) {
      console.error("Error saving recipes to localStorage", e);
    }
  }

  // Opcional: Método para resetear a las recetas precargadas
  resetToDefaultRecipes() {
    this._recipes.set(RECIPES);
  }

  // Opcional: Método para obtener solo las recetas del usuario (excluyendo precargadas)
  getUserRecipes(): Recipe[] {
    const precargadasIds = new Set(RECIPES.map(recipe => recipe.id));
    return this._recipes().filter(recipe => !precargadasIds.has(recipe.id));
  }
}