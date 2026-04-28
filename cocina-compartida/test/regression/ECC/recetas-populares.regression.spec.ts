import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { Home } from '../../../src/app/features/pages/home/home';
import { RecipeService } from '../../../src/app/shared/services/recipe';
import { RecipeInteractionService } from '../../../src/app/shared/services/recipe-interaction.service';
import { Auth } from '../../../src/app/shared/services/auth';
import { Recipe } from '../../../src/app/shared/interfaces/recipe';

type Stubs = {
  recipe: { recipes: any };
  auth: { isLoged: jasmine.Spy };
  router: { navigate: jasmine.Spy };
  interaction: { toggleLike: jasmine.Spy };
};

const R1: Recipe = {
  id: 'r1',
  name: 'Paella',
  descripcion: 'desc',
  ingredients: ['arroz'],
  steps: ['cocinar'],
  images: ['img1.png'],
  category: 'Esp',
  user: { id: 'u1', username: 'chef1' },
  likes: 10,
  likedBy: [],
  comments: [],
};
const R2: Recipe = {
  id: 'r2',
  name: 'Tacos',
  descripcion: 'desc',
  ingredients: ['tortilla'],
  steps: ['armar'],
  images: ['img2.png'],
  category: 'Mex',
  user: { id: 'u2', username: 'chef2' },
  likes: 25,
  likedBy: [],
  comments: [],
};
const R3: Recipe = {
  id: 'r3',
  name: 'Sushi',
  descripcion: 'desc',
  ingredients: ['arroz'],
  steps: ['enrollar'],
  images: ['img3.png'],
  category: 'Jap',
  user: { id: 'u3', username: 'chef3' },
  likes: 5,
  likedBy: [],
  comments: [],
};
const R4: Recipe = {
  id: 'r4',
  name: 'Pizza',
  descripcion: 'desc',
  ingredients: ['masa'],
  steps: ['hornear'],
  images: ['img4.png'],
  category: 'Ita',
  user: { id: 'u4', username: 'chef4' },
  likes: 50,
  likedBy: [],
  comments: [],
};

function buildStubs(recipes: Recipe[]): Stubs {
  return {
    recipe: { recipes: signal(recipes) },
    auth: { isLoged: jasmine.createSpy('isLoged').and.returnValue(true) },
    router: { navigate: jasmine.createSpy('navigate') },
    interaction: { toggleLike: jasmine.createSpy('toggleLike').and.returnValue(Promise.resolve()) },
  };
}

async function buildComponent(recipes: Recipe[]) {
  const stubs = buildStubs(recipes);
  await TestBed.configureTestingModule({
    imports: [Home],
    providers: [
      { provide: RecipeService, useValue: stubs.recipe },
      { provide: Auth, useValue: stubs.auth },
      { provide: Router, useValue: stubs.router },
      { provide: RecipeInteractionService, useValue: stubs.interaction },
    ],
  }).compileComponents();

  return {
    component: TestBed.createComponent(Home).componentInstance,
    stubs,
  };
}

describe('Recetas Populares Regression Frontend', () => {
  beforeEach(() => TestBed.resetTestingModule());

  // Verifica que el top 3 se ordena por likes.
  it('RecetasPopulares_CuandoHayMasDeTres_DebeRetornarTopTresOrdenado', async () => {
    // Arrange
    const { component } = await buildComponent([R1, R2, R3, R4]);

    // Act
    const result = component.featuredRecipes;

    // Assert
    expect(result.length).toBe(3);
    expect(result[0].id).toBe('r4');
    expect(result[1].id).toBe('r2');
  });

  // Verifica que likes NaN se tratan como 0.
  it('RecetasPopulares_CuandoLikesNaN_DebeTratarComoCero', async () => {
    // Arrange
    const broken = { ...R1, id: 'r5', likes: Number.NaN } as Recipe;
    const { component } = await buildComponent([broken, R2, R3]);

    // Act
    const result = component.featuredRecipes;

    // Assert
    expect(result[0].id).toBe('r2');
    expect(result[result.length - 1].id).toBe('r5');
  });
});
