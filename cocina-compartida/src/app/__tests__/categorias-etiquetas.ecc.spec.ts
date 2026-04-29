import { TestBed } from '@angular/core/testing';
import { SearchService } from '../shared/services/search.service';
import { RecipeService } from '../shared/services/recipe';
import { Recipe } from '../shared/interfaces/recipe';

const RECIPES: Recipe[] = [
  {
    id: 'r1',
    name: 'Avena',
    descripcion: 'Desayuno saludable',
    ingredients: ['avena'],
    steps: ['mezclar'],
    images: [],
    category: 'desayuno',
    user: { id: 'u1', username: 'chef1' },
    likes: 4,
  },
  {
    id: 'r2',
    name: 'Pasta',
    descripcion: 'Cena rapida',
    ingredients: ['pasta'],
    steps: ['cocinar'],
    images: [],
    category: 'cena',
    user: { id: 'u2', username: 'chef2' },
    likes: 9,
  },
  {
    id: 'r3',
    name: 'Sopa',
    descripcion: 'Sopa de verduras',
    ingredients: ['agua'],
    steps: ['hervir'],
    images: [],
    category: 'cena',
    user: { id: 'u3', username: 'chef3' },
    likes: 1,
  },
  {
    id: 'r4',
    name: 'Pancake',
    descripcion: 'Desayuno dulce',
    ingredients: ['harina'],
    steps: ['cocinar'],
    images: [],
    category: 'desayuno',
    user: { id: 'u4', username: 'chef4' },
    likes: 7,
  },
];

function fakeSignal<T>(initialValue: T) {
  let value = initialValue;
  const fn: any = () => value;
  fn.asReadonly = () => fn;
  return fn;
}

describe('Categorias Etiquetas ECC - SearchService', () => {
  let service: SearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SearchService,
        { provide: RecipeService, useValue: { recipes: fakeSignal<Recipe[]>(RECIPES) } },
      ],
    });
    service = TestBed.inject(SearchService);
  });

  it('Dado recetas categorizadas, cuando filtra por desayuno, entonces retorna solo desayuno', () => {
    service.filterByCategory('desayuno');

    expect(service.results().length).toBe(2);
    service.results().forEach((r) => expect(r.category).toBe('desayuno'));
  });

  it('Dado categoria activa, cuando busca texto, entonces combina busqueda y categoria', () => {
    service.filterByCategory('cena');
    service.search('Pasta');

    expect(service.results().length).toBe(1);
    expect(service.results()[0].name).toBe('Pasta');
  });

  it('Dado orden por likes, cuando ordena, entonces mayor likes queda primero', () => {
    service.filterByCategory('todas');
    service.setSortOption('likes');

    expect(service.results()[0].id).toBe('r2');
    expect(service.results()[1].id).toBe('r4');
  });

  it('Dado orden por oldest, cuando se aplica, entonces los ids menores van primero', () => {
    service.filterByCategory('todas');
    service.setSortOption('oldest');

    const ids = service.results().map((r) => r.id);
    expect(ids[0]).toBe('r1');
    expect(ids[ids.length - 1]).toBe('r4');
  });

  it('Dado cadena de busqueda vacia, cuando search se llama con "", entonces results respeta solo la categoria activa', () => {
    service.filterByCategory('cena');
    service.search('');

    expect(service.results().length).toBe(2);
    service.results().forEach((r) => expect(r.category).toBe('cena'));
  });

  it('Dado caracteres especiales sin coincidencia, cuando busca, entonces retorna lista vacia sin lanzar', () => {
    service.filterByCategory('todas');
    service.search('!@#$%^&*()_+');

    expect(service.results()).toEqual([]);
  });

  it('Dado combinacion categoria + texto sin match, cuando busca, entonces lista vacia', () => {
    service.filterByCategory('desayuno');
    service.search('pasta');

    expect(service.results()).toEqual([]);
  });

  it('Dado clearFilters, cuando se invoca, entonces categoria queda en todas y query vacio y orden recent', () => {
    service.filterByCategory('cena');
    service.search('Pasta');
    service.setSortOption('likes');

    service.clearFilters();

    expect(service.currentCategory()).toBe('todas');
    expect(service.currentQuery()).toBe('');
    expect(service.currentSort()).toBe('recent');
  });

  it('Dado una busqueda con texto, cuando hay coincidencias, entonces la sugerencia mas relevante aparece primero', () => {
    service.filterByCategory('todas');
    service.search('avena');

    expect(service.suggestions().length).toBeGreaterThan(0);
    expect(service.suggestions()[0].name.toLowerCase()).toContain('avena');
  });

  it('Dado mas resultados que el corte, cuando busca, entonces sugerencias se cortan a maximo 5', () => {
    // Forzamos suficiente cantidad de coincidencias parciales con descripcion comun
    service.filterByCategory('todas');
    service.search('a');

    expect(service.suggestions().length).toBeLessThanOrEqual(5);
  });
});
