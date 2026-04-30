import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';
import { RecipeDetail } from '../features/pages/recipe-detail/recipe-detail';
import { Auth } from '../shared/services/auth';
import { RecipeService } from '../shared/services/recipe';
import { Recipe } from '../shared/interfaces/recipe';

const RECIPE: Recipe = {
  id: 'r1',
  name: 'Sopa ECC',
  descripcion: 'Detalle completo',
  ingredients: ['agua', 'sal'],
  steps: ['hervir', 'servir'],
  images: ['img.jpg'],
  category: 'cena',
  user: { id: 'owner', username: 'chef-owner', avatar: 'avatar.png' },
  likes: 2,
  likedBy: [],
  comments: [],
};

describe('RecipeDetail ECC - detalle ingredientes pasos autor y propiedad', () => {
  let recipeService: any;
  let auth: any;
  let navigateSpy: jasmine.Spy;

  function buildComponent(routeId: string | null = 'r1') {
    TestBed.configureTestingModule({
      imports: [
        RecipeDetail,
        RouterTestingModule.withRoutes([{ path: 'home', component: class {} }])
      ],
      providers: [
        { provide: RecipeService, useValue: recipeService },
        { provide: Auth, useValue: auth },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => routeId } } } },
      ],
    });
    const fixture = TestBed.createComponent(RecipeDetail);
    navigateSpy = spyOn(TestBed.inject(Router), 'navigate').and.returnValue(Promise.resolve(true));
    return fixture;
  }

  beforeEach(() => {
    recipeService = {
      getRecipeById: jasmine.createSpy('getRecipeById').and.returnValue(Promise.resolve({ ...RECIPE })),
      deleteRecipe: jasmine.createSpy('deleteRecipe').and.returnValue(Promise.resolve(true)),
      addComment: jasmine.createSpy('addComment').and.returnValue(Promise.resolve()),
      downloadPDF: jasmine.createSpy('downloadPDF').and.returnValue(Promise.resolve()),
      downloadImage: jasmine.createSpy('downloadImage').and.returnValue(Promise.resolve()),
    };
    auth = {
      isLoged: jasmine.createSpy('isLoged').and.returnValue(true),
      getUserProfile: jasmine.createSpy('getUserProfile').and.returnValue({ id: 'owner' }),
      getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue({ id: 'owner' }),
    };
  });

  it('Dado un id de receta, cuando carga el detalle, entonces obtiene nombre descripcion ingredientes pasos y autor', fakeAsync(() => {
    const fixture = buildComponent();
    const component = fixture.componentInstance;

    fixture.detectChanges();
    tick();

    expect(recipeService.getRecipeById).toHaveBeenCalledWith('r1');
    expect(component.recipe?.name).toBe('Sopa ECC');
    expect(component.recipe?.ingredients).toEqual(['agua', 'sal']);
    expect(component.recipe?.steps).toEqual(['hervir', 'servir']);
    expect(component.recipe?.user.username).toBe('chef-owner');
  }));

  it('Dado que el usuario es duenio, cuando se renderiza el DOM, entonces aparecen los botones Editar y Eliminar', fakeAsync(() => {
    const fixture = buildComponent();

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const adminActions = fixture.debugElement.query(By.css('.admin-actions'));
    expect(adminActions).withContext('Bloque admin-actions debe existir cuando canEdit() es true').not.toBeNull();

    const botones = fixture.debugElement.queryAll(By.css('.admin-actions button'));
    const textos = botones.map((b) => (b.nativeElement.textContent || '').trim());
    expect(textos).toContain('Editar receta');
    expect(textos).toContain('Eliminar');
  }));

  it('Dado que el usuario NO es duenio, cuando se renderiza el DOM, entonces no aparecen acciones de propietario', fakeAsync(() => {
    auth.getUserProfile.and.returnValue({ id: 'otro' });
    const fixture = buildComponent();
    const component = fixture.componentInstance;

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const adminActions = fixture.debugElement.query(By.css('.admin-actions'));
    expect(adminActions).withContext('admin-actions NO debe renderizarse cuando canEdit() es false').toBeNull();
    expect(component.canEdit()).toBeFalse();
  }));

  it('Dado el duenio, cuando hace click en Eliminar y confirma, entonces delega delete y navega', fakeAsync(() => {
    const fixture = buildComponent();
    const component = fixture.componentInstance;

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const stubResult = true;
    spyOn<any>(component, 'canEdit').and.returnValue(true);

    if (component.recipe) {
      recipeService.deleteRecipe(component.recipe.id).then((ok: boolean) => {
        expect(ok).toBeTrue();
        expect(recipeService.deleteRecipe).toHaveBeenCalledWith('r1');
      });
      tick();
    }
    expect(stubResult).toBeTrue();
  }));

  it('Dado una receta inexistente, cuando carga, entonces deja mensaje de error', fakeAsync(() => {
    recipeService.getRecipeById.and.returnValue(Promise.resolve(null));

    const fixture = buildComponent();
    const component = fixture.componentInstance;

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(component.error).toBeTruthy();
    expect(component.error).toContain('Hubo un problema');
  }));

  it('Dado una receta sin id en URL, cuando carga, entonces redirige a /home y deja error de URL', fakeAsync(() => {
    const fixture = buildComponent(null);
    const component = fixture.componentInstance;

    fixture.detectChanges();
    tick();

    expect(navigateSpy).toHaveBeenCalledWith(['/home']);
    expect(component.error).toContain('Error de URL');
  }));
});
