import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PortionAdjuster } from '../features/components/portion-adjuster/portion-adjuster';
import { PortionScalingService } from '../shared/services/portion-scaling.service';

describe('PortionAdjuster', () => {
  let fixture: ComponentFixture<PortionAdjuster>;
  let component: PortionAdjuster;
  let scalingService: jasmine.SpyObj<PortionScalingService>;

  beforeEach(async () => {
    scalingService = jasmine.createSpyObj<PortionScalingService>('PortionScalingService', [
      'scale',
    ]);
    scalingService.scale.and.resolveTo({
      recipeId: 'recipe-1',
      originalServings: 2,
      selectedServings: 3,
      scaleFactor: 1.5,
      ingredients: [
        { original: '200 g de pasta', adjusted: '300 g de pasta', scalable: true },
        { original: 'Sal al gusto', adjusted: 'Sal al gusto', scalable: false },
      ],
    });

    await TestBed.configureTestingModule({
      imports: [PortionAdjuster],
      providers: [{ provide: PortionScalingService, useValue: scalingService }],
    }).compileComponents();

    fixture = TestBed.createComponent(PortionAdjuster);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('recipeId', 'recipe-1');
    fixture.componentRef.setInput('originalServings', 2);
    fixture.componentRef.setInput('originalIngredients', ['200 g de pasta', 'Sal al gusto']);
    fixture.detectChanges();
  });

  it('muestra inicialmente las cantidades originales', () => {
    expect(component.selectedServings).toBe(2);
    expect(component.displayedIngredients.map((item) => item.adjusted)).toEqual([
      '200 g de pasta',
      'Sal al gusto',
    ]);
    expect(scalingService.scale).not.toHaveBeenCalled();
  });

  it('recalcula inmediatamente al aumentar las personas', async () => {
    component.increase();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(scalingService.scale).toHaveBeenCalledOnceWith('recipe-1', 3);
    expect(component.displayedIngredients[0].adjusted).toBe('300 g de pasta');
    expect(fixture.nativeElement.textContent).toContain('300 g de pasta');
    expect(fixture.nativeElement.textContent).toContain('Se mantiene sin cambios');
  });

  it('restaura las porciones y cantidades originales', async () => {
    component.increase();
    await fixture.whenStable();

    component.reset();
    fixture.detectChanges();

    expect(component.selectedServings).toBe(2);
    expect(component.isOriginal).toBeTrue();
    expect(component.displayedIngredients[0].adjusted).toBe('200 g de pasta');
  });

  it('limita el selector a valores enteros entre 1 y 100', async () => {
    component.onServingsChange(150);
    await fixture.whenStable();
    expect(component.selectedServings).toBe(100);

    component.onServingsChange(-4);
    await fixture.whenStable();
    expect(component.selectedServings).toBe(1);
  });

  it('restaura el valor original si el campo queda vacío', () => {
    component.selectedServings = 5;
    component.onServingsChange(null);

    expect(component.selectedServings).toBe(2);
    expect(component.displayedIngredients[0].adjusted).toBe('200 g de pasta');
  });
});
