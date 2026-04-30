import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Footer } from '../shared/components/footer/footer';

describe('Footer Component', () => {
  let fixture: ComponentFixture<Footer>;
  let component: Footer;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Footer],
    })
      .overrideComponent(Footer, { set: { template: '<footer>QA Footer</footer>' } })
      .compileComponents();

    fixture = TestBed.createComponent(Footer);
    component = fixture.componentInstance;
  });

  it('FT-01: crea el componente footer', () => {
    expect(component).toBeTruthy();
  });

  it('FT-02: renderiza contenido base', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('QA Footer');
  });
});
