import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ReadingAssistant } from '../shared/components/reading-assistant/reading-assistant';
import { DEFAULT_ACCESSIBILITY_PREFERENCES } from '../shared/interfaces/accessibility-preferences';
import { AccessibilityPreferencesService } from '../shared/services/accessibility-preferences.service';
import { SpeechReaderService } from '../shared/services/speech-reader.service';

describe('ReadingAssistant', () => {
  let fixture: ComponentFixture<ReadingAssistant>;
  let component: ReadingAssistant;
  let reader: jasmine.SpyObj<SpeechReaderService> & Record<string, unknown>;
  let preferences: jasmine.SpyObj<AccessibilityPreferencesService> & Record<string, unknown>;
  const preferenceSignal = signal({ ...DEFAULT_ACCESSIBILITY_PREFERENCES });

  beforeEach(async () => {
    preferenceSignal.set({ ...DEFAULT_ACCESSIBILITY_PREFERENCES });
    reader = jasmine.createSpyObj('SpeechReaderService', [
      'initialize',
      'readPage',
      'pause',
      'resume',
      'stop',
    ]) as typeof reader;
    Object.assign(reader, {
      state: signal<'idle' | 'reading' | 'paused'>('idle'),
      status: signal('Asistente listo para leer.'),
      voices: signal<SpeechSynthesisVoice[]>([]),
      supported: true,
    });

    preferences = jasmine.createSpyObj('AccessibilityPreferencesService', [
      'load',
      'update',
    ]) as typeof preferences;
    Object.assign(preferences, { preferences: preferenceSignal });
    preferences.load.and.resolveTo({ ...DEFAULT_ACCESSIBILITY_PREFERENCES });
    preferences.update.and.callFake(async (changes) => {
      preferenceSignal.update((current) => ({ ...current, ...changes }));
      return preferenceSignal();
    });

    await TestBed.configureTestingModule({
      imports: [ReadingAssistant],
      providers: [
        provideRouter([]),
        { provide: SpeechReaderService, useValue: reader },
        { provide: AccessibilityPreferencesService, useValue: preferences },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReadingAssistant);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('permanece cerrado y en silencio hasta una acción del usuario', () => {
    expect(component.expanded()).toBeFalse();
    expect(reader.readPage).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Escuchar página');
  });

  it('activa el panel y guarda la elección', async () => {
    await component.open();
    fixture.detectChanges();

    expect(component.expanded()).toBeTrue();
    expect(preferences.update).toHaveBeenCalledWith({ readingAssistantEnabled: true });
    expect(fixture.nativeElement.textContent).toContain('Asistente de lectura');
  });

  it('lee usando la velocidad y voz preferidas', () => {
    preferenceSignal.set({
      ...DEFAULT_ACCESSIBILITY_PREFERENCES,
      speechRate: 1.5,
      preferredVoice: 'Voz española',
    });

    component.readPage();

    expect(reader.readPage).toHaveBeenCalledWith(1.5, 'Voz española');
  });

  it('ofrece atajos de teclado para abrir, leer y detener', async () => {
    component.handleKeyboardShortcut(new KeyboardEvent('keydown', { altKey: true, key: 'l' }));
    await fixture.whenStable();
    component.handleKeyboardShortcut(new KeyboardEvent('keydown', { altKey: true, key: 'r' }));

    expect(component.expanded()).toBeTrue();
    expect(reader.readPage).toHaveBeenCalled();
  });
});
