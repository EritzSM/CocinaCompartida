import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Explore } from '../features/pages/explore/explore';
import { Auth } from '../shared/services/auth';
import { RecipeService } from '../shared/services/recipe';
import { SearchService } from '../shared/services/search.service';
import { Recipe } from '../shared/interfaces/recipe';
import Swal from 'sweetalert2';

const RECIPES: Recipe[] = Array.from({ length: 14 }, (_, index) => ({
  id: `r${index + 1}`,
  name: `Receta ${index + 1}`,
  descripcion: 'Receta para explore ECC',
  ingredients: ['a'],
  steps: ['b'],
  images: ['img.jpg'],
  category: index % 2 === 0 ? 'desayuno' : 'cena',
  user: { id: 'u1', username: 'chef' },
  likes: index,
  likedBy: index === 0 ? ['u-current'] : [],
}));

function fakeSignal<T>(initialValue: T) {
  let value = initialValue;
  const fn: any = () => value;
  fn.set = (next: T) => { value = next; };
  fn.update = (updater: (current: T) => T) => { value = updater(value); };
  fn.asReadonly = () => fn;
  return fn;
}

describe('Explore ECC - busqueda navegacion favoritos y paginacion', () => {
  let component: Explore;
  let recipeService: any;
  let auth: any;
  let router: any;
  let search: any;

  beforeEach(() => {
    recipeService = {
      recipes: fakeSignal<Recipe[]>(RECIPES),
      toggleLike: jasmine.createSpy('toggleLike').and.returnValue(Promise.resolve()),
    };
    auth = {
      isLoged: jasmine.createSpy('isLoged').and.returnValue(true),
      getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue({ id: 'u-current' }),
    };
    router = { navigate: jasmine.createSpy('navigate') };
    search = {
      results: fakeSignal<Recipe[]>([]),
      suggestions: fakeSignal<Recipe[]>([]),
      currentQuery: fakeSignal(''),
      currentCategory: fakeSignal('todas'),
      clearFilters: jasmine.createSpy('clearFilters'),
    };

    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: false } as any));

    TestBed.configureTestingModule({
      imports: [Explore],
      providers: [
        provideRouter([]),
        { provide: RecipeService, useValue: recipeService },
        { provide: Auth, useValue: auth },
        { provide: Router, useValue: router },
        { provide: SearchService, useValue: search },
      ],
    });

    component = TestBed.createComponent(Explore).componentInstance;
  });

  it('Dado Explore sin busqueda, cuando carga, entonces muestra recetas del servicio y pagina inicialmente 6', () => {
    expect(component.allRecipes().length).toBe(14);
    expect(component.recipesToShow().length).toBe(6);
  });

  it('Dado paginacion inicial, cuando aumenta visibleRecipeCount en +6, entonces recipesToShow crece a 12', () => {
    expect(component.recipesToShow().length).toBe(6);

    component.visibleRecipeCount.update((c) => c + 6);

    expect(component.visibleRecipeCount()).toBe(12);
    expect(component.recipesToShow().length).toBe(12);
  });

  it('Dado paginacion al limite, cuando se exige mas que el total, entonces recipesToShow no excede el total disponible', () => {
    component.visibleRecipeCount.update((c) => c + 100);

    expect(component.recipesToShow().length).toBe(14); // 14 = RECIPES.length
  });

  it('Dado resultados de busqueda, cuando existen, entonces Explore usa esos resultados', () => {
    const filtered = [RECIPES[1]];
    search.results.set(filtered);

    expect(component.allRecipes()).toEqual(filtered);
  });

  it('Dado filtros activos, cuando limpia busqueda, entonces delega al SearchService', () => {
    component.clearSearch();

    expect(search.clearFilters).toHaveBeenCalled();
  });

  it('Dado usuario autenticado, cuando marca favorito, entonces delega toggleLike', () => {
    component.toggleLike('r1');

    expect(recipeService.toggleLike).toHaveBeenCalledWith('r1');
  });

  it('Dado visitante no autenticado, cuando marca favorito, entonces muestra alerta y no llama servicio', () => {
    auth.isLoged.and.returnValue(false);

    component.toggleLike('r1');

    expect(recipeService.toggleLike).not.toHaveBeenCalled();
    expect(Swal.fire).toHaveBeenCalled();
  });

  it('Dado un usuario autenticado dueno de la receta r1, cuando consulta hasLiked, entonces retorna true', () => {
    expect(component.hasLiked(RECIPES[0])).toBeTrue();
  });

  it('Dado una receta sin likedBy del usuario, cuando consulta hasLiked, entonces retorna false', () => {
    expect(component.hasLiked(RECIPES[1])).toBeFalse();
  });

  it('Dado un visitante no autenticado, cuando consulta hasLiked, entonces retorna false sin tocar likedBy', () => {
    auth.isLoged.and.returnValue(false);

    expect(component.hasLiked(RECIPES[0])).toBeFalse();
  });

  it('Dado una receta, cuando se invoca trackByRecipeId, entonces devuelve el id', () => {
    expect(component.trackByRecipeId(0, RECIPES[3])).toBe('r4');
  });
});
