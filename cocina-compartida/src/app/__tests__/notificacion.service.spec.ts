import { TestBed } from '@angular/core/testing';
import { NotificationService } from '../shared/services/notificacion.service';
import Swal from 'sweetalert2';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  NOTIFICATION SERVICE – Pruebas Unitarias (Patrón AAA)
//  Mock Type: Spy (Swal.fire interceptado)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('NotificationService – Pruebas Unitarias', () => {
  let service: NotificationService;

  beforeEach(() => {
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
    TestBed.configureTestingModule({ providers: [NotificationService] });
    service = TestBed.inject(NotificationService);
  });

  describe('showToast', () => {
    it('NS-01: muestra toast de success (Spy)', () => {
      // Act
      service.showToast('success', 'Operación exitosa');

      // Assert
      expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
        toast: true, icon: 'success', title: 'Operación exitosa', timer: 3000
      }));
    });

    it('NS-02: muestra toast de error', () => {
      service.showToast('error', 'Algo salió mal');
      expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
        icon: 'error', title: 'Algo salió mal'
      }));
    });

    it('NS-03: muestra toast de warning', () => {
      service.showToast('warning', 'Cuidado');
      expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
        icon: 'warning', title: 'Cuidado'
      }));
    });
  });

  describe('showConfirmation', () => {
    it('NS-04: muestra diálogo de confirmación', async () => {
      // Act
      await service.showConfirmation('Eliminar', '¿Estás seguro?');

      // Assert
      expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
        title: 'Eliminar', text: '¿Estás seguro?', icon: 'warning', showCancelButton: true
      }));
    });
  });
});
