import { TestBed } from '@angular/core/testing';
import { RecipeDetail } from '../features/pages/recipe-detail/recipe-detail';
import { RecipeService } from '../shared/services/recipe';
import { Auth } from '../shared/services/auth';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { Recipe } from '../shared/interfaces/recipe';
import Swal from 'sweetalert2';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  RECIPE DETAIL COMPONENT – Pruebas Unitarias (Patrón AAA)
//  Funcionalidad: Ver detalle de receta, comentarios, navegación de
//  imágenes, edición, eliminación, descarga PDF/imagen
//
//  Tipos de Mocks usados:
//  1. Spy      – Verificación de llamadas a servicios
//  2. Stub     – Retornos fijos para simular estados
//  3. Mock     – Objetos completos simulando dependencias
//  4. Dummy    – Datos de prueba sin lógica
//  5. Fake     – Promesas controladas para async
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// --- Dummy Data ---
const DUMMY_RECIPE: Recipe = {
  id: 'r1',
  name: 'Pizza Margherita',
  descripcion: 'Pizza clásica italiana',
  ingredients: ['harina', 'tomate', 'mozzarella'],
  steps: ['Preparar masa', 'Agregar salsa', 'Hornear'],
  images: ['img1.jpg', 'img2.jpg', 'img3.jpg'],
  category: 'Italiana',
  user: { id: 'u1', username: 'chef_italiano', avatar: 'avatar.png' },
  likes: 42,
  likedBy: ['u2', 'u3'],
  comments: [
    { id: 'c1', message: 'Deliciosa!', user: { id: 'u2', username: 'foodie' }, createdAt: new Date(), updatedAt: new Date() }
  ]
};

describe('RecipeDetail Component – Pruebas Unitarias', () => {
  let component: RecipeDetail;
  let mockRecipeService: any;
  let mockAuth: any;
  let mockRouter: any;
  let mockActivatedRoute: any;

  beforeEach(() => {
    // Test Double (Mock): RecipeService completo
    mockRecipeService = {
      getRecipeById: jasmine.createSpy('getRecipeById').and.returnValue(Promise.resolve({ ...DUMMY_RECIPE })),
      addComment: jasmine.createSpy('addComment').and.returnValue(Promise.resolve()),
      deleteRecipe: jasmine.createSpy('deleteRecipe').and.returnValue(Promise.resolve(true)),
      downloadPDF: jasmine.createSpy('downloadPDF').and.returnValue(Promise.resolve()),
      downloadImage: jasmine.createSpy('downloadImage').and.returnValue(Promise.resolve())
    };

    // Test Double (Stub): Auth con retornos predefinidos
    mockAuth = {
      isLoged: jasmine.createSpy('isLoged').and.returnValue(true),
      getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue({ id: 'u1', username: 'chef_italiano' }),
      getUserProfile: jasmine.createSpy('getUserProfile').and.returnValue({ id: 'u1', username: 'chef_italiano' })
    };

    // Test Double (Stub): ActivatedRoute con paramMap fijo
    mockActivatedRoute = {
      snapshot: { paramMap: { get: jasmine.createSpy('get').and.returnValue('r1') } }
    };

    // Test Double (Spy): Router
    mockRouter = { navigate: jasmine.createSpy('navigate') };

    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: false } as any));

    TestBed.configureTestingModule({
      imports: [RecipeDetail],
      providers: [
        provideRouter([]),
        { provide: RecipeService, useValue: mockRecipeService },
        { provide: Auth, useValue: mockAuth },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter }
      ]
    });

    const fixture = TestBed.createComponent(RecipeDetail);
    component = fixture.componentInstance;
  });

  // ──────────────────────────────────────────────────────────
  //  RD-01 a RD-05: ngOnInit – Carga de receta
  // ──────────────────────────────────────────────────────────
  describe('ngOnInit – Carga de receta', () => {
    it('RD-01: carga receta exitosamente por ID de ruta (Mock + Spy)', async () => {
      // Arrange - ya configurado

      // Act
      await component.ngOnInit();

      // Assert
      expect(mockRecipeService.getRecipeById).toHaveBeenCalledWith('r1');
      expect(component.recipe).toBeDefined();
      expect(component.recipe!.id).toBe('r1');
      expect(component.isLoading).toBeFalse();
      expect(component.error).toBeNull();
    });

    it('RD-02: establece error cuando no hay ID en la URL (Stub)', async () => {
      // Arrange
      mockActivatedRoute.snapshot.paramMap.get.and.returnValue(null);

      // Act
      await component.ngOnInit();

      // Assert
      expect(component.error).toContain('No se encontró un ID');
      expect(component.isLoading).toBeFalse();
      expect(mockRecipeService.getRecipeById).not.toHaveBeenCalled();
    });

    it('RD-03: establece error cuando la receta no existe (Stub null)', async () => {
      // Arrange
      mockRecipeService.getRecipeById.and.returnValue(Promise.resolve(null));

      // Act
      await component.ngOnInit();

      // Assert
      expect(component.error).toContain('No se pudo encontrar la receta');
      expect(component.recipe).toBeUndefined();
    });

    it('RD-04: maneja error de red/excepción (Fake reject)', async () => {
      // Arrange
      mockRecipeService.getRecipeById.and.returnValue(Promise.reject(new Error('Network error')));
      spyOn(console, 'error');

      // Act
      await component.ngOnInit();

      // Assert
      expect(component.error).toContain('Hubo un problema al cargar');
      expect(component.isLoading).toBeFalse();
      expect(console.error).toHaveBeenCalled();
    });

    it('RD-05: isLoading se establece en true al inicio y false al final', async () => {
      // Arrange
      let loadingDuringCall = false;
      mockRecipeService.getRecipeById.and.callFake(async () => {
        loadingDuringCall = component.isLoading;
        return { ...DUMMY_RECIPE };
      });

      // Act
      await component.ngOnInit();

      // Assert
      expect(loadingDuringCall).toBeTrue();
      expect(component.isLoading).toBeFalse();
    });
  });

  // ──────────────────────────────────────────────────────────
  //  RD-06 a RD-08: getAvatarUrl
  // ──────────────────────────────────────────────────────────
  describe('getAvatarUrl', () => {
    it('RD-06: retorna default avatar cuando avatar es null (Dummy)', () => {
      // Arrange - sin avatar

      // Act
      const result = component.getAvatarUrl(null);

      // Assert
      expect(result).toBe('assets/logos/default-avatar.png');
    });

    it('RD-07: retorna default avatar cuando avatar es undefined', () => {
      // Arrange & Act
      const result = component.getAvatarUrl(undefined);

      // Assert
      expect(result).toBe('assets/logos/default-avatar.png');
    });

    it('RD-08: retorna URL absoluta sin modificar (Stub)', () => {
      // Arrange
      const absoluteUrl = 'https://example.com/avatar.png';

      // Act
      const result = component.getAvatarUrl(absoluteUrl);

      // Assert
      expect(result).toBe(absoluteUrl);
    });

    it('RD-09: retorna data URI sin modificar', () => {
      // Arrange
      const dataUri = 'data:image/png;base64,abc123';

      // Act
      const result = component.getAvatarUrl(dataUri);

      // Assert
      expect(result).toBe(dataUri);
    });

    it('RD-10: agrega slash al inicio si el path no lo tiene', () => {
      // Arrange
      const relativePath = 'uploads/avatar.png';

      // Act
      const result = component.getAvatarUrl(relativePath);

      // Assert
      expect(result).toBe('/uploads/avatar.png');
    });

    it('RD-11: no duplica slash si el path ya empieza con /', () => {
      // Arrange
      const pathWithSlash = '/uploads/avatar.png';

      // Act
      const result = component.getAvatarUrl(pathWithSlash);

      // Assert
      expect(result).toBe('/uploads/avatar.png');
    });
  });

  // ──────────────────────────────────────────────────────────
  //  RD-12 a RD-16: Navegación de imágenes
  // ──────────────────────────────────────────────────────────
  describe('Navegación de imágenes', () => {
    beforeEach(() => {
      component.recipe = { ...DUMMY_RECIPE }; // 3 imágenes
      component.currentIndex = 0;
    });

    it('RD-12: nextImage avanza al siguiente índice (Dummy)', () => {
      // Arrange - currentIndex = 0

      // Act
      component.nextImage();

      // Assert
      expect(component.currentIndex).toBe(1);
    });

    it('RD-13: nextImage vuelve a 0 al pasar del último', () => {
      // Arrange
      component.currentIndex = 2; // última imagen

      // Act
      component.nextImage();

      // Assert
      expect(component.currentIndex).toBe(0);
    });

    it('RD-14: prevImage retrocede al índice anterior', () => {
      // Arrange
      component.currentIndex = 2;

      // Act
      component.prevImage();

      // Assert
      expect(component.currentIndex).toBe(1);
    });

    it('RD-15: prevImage va al último desde el índice 0', () => {
      // Arrange
      component.currentIndex = 0;

      // Act
      component.prevImage();

      // Assert
      expect(component.currentIndex).toBe(2);
    });

    it('RD-16: nextImage no hace nada si no hay receta', () => {
      // Arrange
      component.recipe = undefined;
      component.currentIndex = 0;

      // Act
      component.nextImage();

      // Assert
      expect(component.currentIndex).toBe(0);
    });

    it('RD-17: prevImage no hace nada si no hay receta', () => {
      // Arrange
      component.recipe = undefined;
      component.currentIndex = 0;

      // Act
      component.prevImage();

      // Assert
      expect(component.currentIndex).toBe(0);
    });

    it('RD-18: nextImage no hace nada si images está vacío', () => {
      // Arrange
      component.recipe = { ...DUMMY_RECIPE, images: [] };

      // Act
      component.nextImage();

      // Assert
      expect(component.currentIndex).toBe(0);
    });
  });

  // ──────────────────────────────────────────────────────────
  //  RD-19 a RD-24: submitComment
  // ──────────────────────────────────────────────────────────
  describe('submitComment', () => {
    beforeEach(() => {
      component.recipe = { ...DUMMY_RECIPE };
    });

    it('RD-19: no hace nada si recipe es undefined', async () => {
      // Arrange
      component.recipe = undefined;

      // Act
      await component.submitComment();

      // Assert
      expect(mockRecipeService.addComment).not.toHaveBeenCalled();
    });

    it('RD-20: muestra alerta si usuario no está logueado (Stub + Mock Swal)', async () => {
      // Arrange
      mockAuth.isLoged.and.returnValue(false);

      // Act
      await component.submitComment();

      // Assert
      expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
        title: '¡Necesitas iniciar sesión!'
      }));
      expect(mockRecipeService.addComment).not.toHaveBeenCalled();
    });

    it('RD-21: muestra warning si comentario está vacío (Stub)', async () => {
      // Arrange
      component.newComment = '   ';

      // Act
      await component.submitComment();

      // Assert
      expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
        icon: 'warning',
        title: 'Escribe un comentario'
      }));
      expect(mockRecipeService.addComment).not.toHaveBeenCalled();
    });

    it('RD-22: envía comentario y refresca receta en éxito (Spy + Mock)', async () => {
      // Arrange
      component.newComment = 'Gran receta!';
      const updatedRecipe = { ...DUMMY_RECIPE, comments: [...(DUMMY_RECIPE.comments || []), { id: 'c2', message: 'Gran receta!' }] };
      mockRecipeService.getRecipeById.and.returnValue(Promise.resolve(updatedRecipe));

      // Act
      await component.submitComment();

      // Assert
      expect(mockRecipeService.addComment).toHaveBeenCalledWith('r1', { message: 'Gran receta!' });
      expect(mockRecipeService.getRecipeById).toHaveBeenCalledWith('r1');
      expect(component.newComment).toBe('');
      expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
        title: 'Comentario agregado',
        icon: 'success'
      }));
    });

    it('RD-23: maneja error al agregar comentario (Fake reject)', async () => {
      // Arrange
      component.newComment = 'Comentario fallido';
      mockRecipeService.addComment.and.returnValue(Promise.reject(new Error('Server error')));
      spyOn(console, 'error');

      // Act
      await component.submitComment();

      // Assert
      expect(console.error).toHaveBeenCalled();
      expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
        icon: 'error',
        title: 'Error'
      }));
    });

    it('RD-24: trimea el comentario antes de enviarlo', async () => {
      // Arrange
      component.newComment = '  Hola mundo  ';

      // Act
      await component.submitComment();

      // Assert
      expect(mockRecipeService.addComment).toHaveBeenCalledWith('r1', { message: 'Hola mundo' });
    });
  });

  // ──────────────────────────────────────────────────────────
  //  RD-25 a RD-29: canEdit y goToEdit
  // ──────────────────────────────────────────────────────────
  describe('canEdit y goToEdit', () => {
    it('RD-25: canEdit retorna true si el usuario es el dueño (Stub)', () => {
      // Arrange
      component.recipe = { ...DUMMY_RECIPE, user: { id: 'u1', username: 'chef' } };
      mockAuth.getUserProfile.and.returnValue({ id: 'u1' });

      // Act
      const result = component.canEdit();

      // Assert
      expect(result).toBeTrue();
    });

    it('RD-26: canEdit retorna false si el usuario no es el dueño', () => {
      // Arrange
      component.recipe = { ...DUMMY_RECIPE, user: { id: 'u99', username: 'otro' } };
      mockAuth.getUserProfile.and.returnValue({ id: 'u1' });

      // Act
      const result = component.canEdit();

      // Assert
      expect(result).toBeFalse();
    });

    it('RD-27: canEdit retorna false si no hay receta', () => {
      // Arrange
      component.recipe = undefined;

      // Act
      const result = component.canEdit();

      // Assert
      expect(result).toBeFalse();
    });

    it('RD-28: canEdit retorna false si no hay usuario', () => {
      // Arrange
      component.recipe = { ...DUMMY_RECIPE };
      mockAuth.getUserProfile.and.returnValue(null);

      // Act
      const result = component.canEdit();

      // Assert
      expect(result).toBeFalse();
    });

    it('RD-29: goToEdit navega a la ruta de edición (Spy)', () => {
      // Arrange
      component.recipe = { ...DUMMY_RECIPE, user: { id: 'u1', username: 'chef' } };
      mockAuth.getUserProfile.and.returnValue({ id: 'u1' });

      // Act
      component.goToEdit();

      // Assert
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/recipe', 'r1', 'edit']);
    });

    it('RD-30: goToEdit no navega si canEdit es false', () => {
      // Arrange
      component.recipe = { ...DUMMY_RECIPE, user: { id: 'u99', username: 'otro' } };
      mockAuth.getUserProfile.and.returnValue({ id: 'u1' });

      // Act
      component.goToEdit();

      // Assert
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('RD-31: goToEdit no navega si recipe es undefined', () => {
      // Arrange
      component.recipe = undefined;

      // Act
      component.goToEdit();

      // Assert
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────
  //  RD-32 a RD-37: deleteRecipe
  // ──────────────────────────────────────────────────────────
  describe('deleteRecipe', () => {
    beforeEach(() => {
      component.recipe = { ...DUMMY_RECIPE, user: { id: 'u1', username: 'chef' } };
      mockAuth.getUserProfile.and.returnValue({ id: 'u1' });
    });

    it('RD-32: no hace nada si recipe es undefined', async () => {
      // Arrange
      component.recipe = undefined;

      // Act
      await component.deleteRecipe();

      // Assert
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    it('RD-33: no hace nada si canEdit retorna false', async () => {
      // Arrange
      mockAuth.getUserProfile.and.returnValue({ id: 'otro-user' });

      // Act
      await component.deleteRecipe();

      // Assert
      expect(mockRecipeService.deleteRecipe).not.toHaveBeenCalled();
    });

    it('RD-34: muestra confirmación y elimina si el usuario confirma (Mock Swal)', async () => {
      // Arrange
      (Swal.fire as jasmine.Spy).and.returnValues(
        Promise.resolve({ isConfirmed: true } as any),
        Promise.resolve() // toast
      );

      // Act
      await component.deleteRecipe();

      // Assert
      expect(mockRecipeService.deleteRecipe).toHaveBeenCalledWith('r1');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/profile']);
    });

    it('RD-35: no elimina si el usuario cancela la confirmación', async () => {
      // Arrange
      (Swal.fire as jasmine.Spy).and.returnValue(Promise.resolve({ isConfirmed: false } as any));

      // Act
      await component.deleteRecipe();

      // Assert
      expect(mockRecipeService.deleteRecipe).not.toHaveBeenCalled();
    });

    it('RD-36: muestra error si deleteRecipe retorna false (Stub)', async () => {
      // Arrange
      (Swal.fire as jasmine.Spy).and.returnValue(Promise.resolve({ isConfirmed: true } as any));
      mockRecipeService.deleteRecipe.and.returnValue(Promise.resolve(false));

      // Act
      await component.deleteRecipe();

      // Assert
      expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
        icon: 'error',
        title: 'Error'
      }));
    });

    it('RD-37: muestra error de red si deleteRecipe lanza excepción (Fake)', async () => {
      // Arrange
      (Swal.fire as jasmine.Spy).and.returnValue(Promise.resolve({ isConfirmed: true } as any));
      mockRecipeService.deleteRecipe.and.returnValue(Promise.reject(new Error('Network')));
      spyOn(console, 'error');

      // Act
      await component.deleteRecipe();

      // Assert
      expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
        title: 'Error de Red'
      }));
    });
  });

  // ──────────────────────────────────────────────────────────
  //  RD-38 a RD-43: downloadImage
  // ──────────────────────────────────────────────────────────
  describe('downloadImage', () => {
    it('RD-38: no hace nada si recipe es undefined', async () => {
      // Arrange
      component.recipe = undefined;

      // Act
      await component.downloadImage();

      // Assert
      expect(mockRecipeService.downloadImage).not.toHaveBeenCalled();
    });

    it('RD-39: muestra warning si no hay imágenes (Stub)', async () => {
      // Arrange
      component.recipe = { ...DUMMY_RECIPE, images: [] };

      // Act
      await component.downloadImage();

      // Assert
      expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
        icon: 'warning',
        title: 'Sin imagen'
      }));
      expect(mockRecipeService.downloadImage).not.toHaveBeenCalled();
    });

    it('RD-40: muestra warning si images es undefined', async () => {
      // Arrange
      component.recipe = { ...DUMMY_RECIPE, images: undefined as any };

      // Act
      await component.downloadImage();

      // Assert
      expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
        icon: 'warning'
      }));
    });

    it('RD-41: descarga exitosa muestra toast de éxito (Spy)', async () => {
      // Arrange
      component.recipe = { ...DUMMY_RECIPE };

      // Act
      await component.downloadImage();

      // Assert
      expect(mockRecipeService.downloadImage).toHaveBeenCalledWith('r1');
      expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
        title: 'Imagen descargada',
        icon: 'success'
      }));
    });

    it('RD-42: error en descarga muestra swal error (Fake reject)', async () => {
      // Arrange
      component.recipe = { ...DUMMY_RECIPE };
      mockRecipeService.downloadImage.and.returnValue(Promise.reject(new Error('Fail')));
      spyOn(console, 'error');

      // Act
      await component.downloadImage();

      // Assert
      expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
        icon: 'error',
        title: 'Error'
      }));
    });
  });
});
