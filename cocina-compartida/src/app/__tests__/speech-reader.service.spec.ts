import { SpeechReaderService } from '../shared/services/speech-reader.service';

describe('SpeechReaderService', () => {
  let service: SpeechReaderService;
  let host: HTMLElement;

  beforeEach(() => {
    window.getSelection()?.removeAllRanges();
    host = document.createElement('div');
    host.setAttribute('data-test-host', 'speech-reader');
    document.body.appendChild(host);
    service = new SpeechReaderService();
  });

  afterEach(() => {
    service.stop(false);
    host.remove();
    window.getSelection()?.removeAllRanges();
  });

  it('convierte títulos, contenido y controles en una descripción comprensible', () => {
    const main = document.createElement('main');
    main.innerHTML = `
      <h1>Receta de pasta</h1>
      <p>Preparación sencilla para dos personas.</p>
      <button aria-label="Guardar receta">Icono</button>
      <p aria-hidden="true">Contenido oculto</p>
    `;
    host.appendChild(main);

    const text = service.extractReadableText(main);

    expect(text).toContain('Título principal: Receta de pasta');
    expect(text).toContain('Preparación sencilla para dos personas');
    expect(text).toContain('Botón: Guardar receta');
    expect(text).not.toContain('Contenido oculto');
  });

  it('prioriza el texto seleccionado por el usuario', () => {
    const paragraph = document.createElement('p');
    paragraph.textContent = 'Solo quiero escuchar esta recomendación';
    host.appendChild(paragraph);
    const range = document.createRange();
    range.selectNodeContents(paragraph);
    window.getSelection()?.addRange(range);

    expect(service.extractReadableText(document)).toBe(
      'Texto seleccionado. Solo quiero escuchar esta recomendación',
    );
  });

  it('informa cuando la página no tiene contenido legible', () => {
    const emptyMain = document.createElement('main');
    host.appendChild(emptyMain);

    expect(service.readPage(1, null)).toBeFalse();
    expect(service.extractReadableText(emptyMain)).toBe('');
    expect(service.status()).toContain('No encontré contenido');
  });
});
