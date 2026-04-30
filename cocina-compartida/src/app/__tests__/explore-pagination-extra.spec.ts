import { TestBed, fakeAsync, tick, flushMicrotasks } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Explore } from '../features/pages/explore/explore';
import { Auth } from '../shared/services/auth';
import { RecipeService } from '../shared/services/recipe';
import { SearchService } from '../shared/services/search.service';
import { Recipe } from '../shared/interfaces/recipe';
import Swal from 'sweetalert2';

function fakeSignal<T>(initialValue: T) {
  let value = initialValue;
  const fn: any = () => value;
  fn.set = (next: T) => { value = next; };
  fn.update = (updater: (current: T) => T) => { value = updater(value); };
  fn.asReadonly = () => fn;
  return fn;
}

const RECIPES: Recipe[] = Array.from({ length: 15 }, (_, index) => ({
  id: `rx-${index + 1}`,
  name: `Receta ${index + 1}`,
  descripcion: 'Receta de prueba',
  ingredients: ['a'],
  steps: ['b'],
  images: ['img.jpg'],
  category: 'cena',
  user: { id: 'u1', username: 'chef' },
  likes: index,
  likedBy: [],
  comments: [],
}));

describe('Explore Component - paginacion e interacciones internas', () => {
  let component: Explore;
  let recipeSignal: any;
  let router: jasmine.SpyObj<Router>;
  let originalIntersectionObserver: typeof IntersectionObserver;
  const observerInstances: any[] = [];

  beforeEach(() => {
    originalIntersectionObserver = window.IntersectionObserver;
    observerInstances.length = 0;
    (window as any).IntersectionObserver = class {
      observe = jasmine.createSpy('observe');
      disconnect = jasmine.createSpy('disconnect');

      constructor(public callback: IntersectionObserverCallback) {
        observerInstances.push(this);
      }
    };

    recipeSignal = fakeSignal<Recipe[]>(RECIPES);
    router = jasmine.createSpyObj('Router', ['navigate']);
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
    spyOn(window, 'scrollTo');

    TestBed.configureTestingModule({
      imports: [Explore],
      providers: [
        { provide: RecipeService, useValue: { recipes: recipeSignal, toggleLike: jasmine.createSpy('toggleLike') } },
        { provide: Auth, useValue: { isLoged: jasmine.createSpy('isLoged').and.returnValue(true), getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue({ id: 'u1' }) } },
        { provide: Router, useValue: router },
        { provide: SearchService, useValue: { results: fakeSignal<Recipe[]>([]), clearFilters: jasmine.createSpy('clearFilters') } },
      ],
    });

    component = TestBed.createComponent(Explore).componentInstance;
  });

  afterEach(() => {
    (window as any).IntersectionObserver = originalIntersectionObserver;
  });

  it('EXP-C01: loadMore incrementa recetas visibles y vuelve a apagar loading', fakeAsync(() => {
    expect(component.recipesToShow().length).toBe(6);

    (component as any).loadMore();
    expect(component.isLoading()).toBeTrue();

    tick(500);
    flushMicrotasks();

    expect(component.visibleRecipeCount()).toBe(12);
    expect(component.recipesToShow().length).toBe(12);
    expect(component.isLoading()).toBeFalse();
  }));

  it('EXP-C02: loadMore no hace nada si ya se muestran todas las recetas', fakeAsync(() => {
    component.visibleRecipeCount.set(20);

    (component as any).loadMore();
    tick(500);
    flushMicrotasks();

    expect(component.visibleRecipeCount()).toBe(20);
    expect(component.isLoading()).toBeFalse();
  }));

  it('EXP-C03: handleNewRecipes pregunta y sube al inicio si confirma', async () => {
    (component as any).handleNewRecipes();
    await Promise.resolve();

    expect(Swal.fire).toHaveBeenCalled();
    expect(window.scrollTo).toHaveBeenCalled();
    expect((window.scrollTo as jasmine.Spy).calls.mostRecent().args[0]).toEqual({ top: 0, behavior: 'smooth' });
  });

  it('EXP-C04: showLoginAlert navega solo cuando el usuario confirma', async () => {
    (component as any).showLoginAlert('guardar una receta');
    await Promise.resolve();

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('EXP-C05: ngAfterViewInit observa el trigger y carga mas al intersectar', fakeAsync(() => {
    component.loadMoreTrigger = { nativeElement: document.createElement('div') };

    component.ngAfterViewInit();
    tick();

    expect(observerInstances.length).toBeGreaterThan(0);
    expect(observerInstances[0].observe).toHaveBeenCalledWith(component.loadMoreTrigger.nativeElement);

    observerInstances[0].callback([{ isIntersecting: true } as IntersectionObserverEntry], observerInstances[0]);
    tick(500);
    flushMicrotasks();

    expect(component.visibleRecipeCount()).toBe(12);
  }));
});
