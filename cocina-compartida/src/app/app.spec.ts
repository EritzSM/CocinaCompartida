import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { KeepAliveService } from './shared/services/keep-alive.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App, RouterTestingModule, HttpClientTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should have as title "cocina-compartida"', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app['title']()).toEqual('cocina-compartida');
  });

  it('APP-03: oculta layout en rutas de autenticacion y formularios', () => {
    const events = new Subject<NavigationEnd>();
    const app = new App({ events } as unknown as Router, {} as KeepAliveService);

    events.next(new NavigationEnd(1, '/login', '/login'));
    expect(app.showLayout).toBeFalse();

    events.next(new NavigationEnd(2, '/recipe-upload', '/recipe-upload'));
    expect(app.showLayout).toBeFalse();
  });

  it('APP-04: muestra layout en rutas publicas principales', () => {
    const events = new Subject<NavigationEnd>();
    const app = new App({ events } as unknown as Router, {} as KeepAliveService);

    events.next(new NavigationEnd(1, '/home', '/home'));
    expect(app.showLayout).toBeTrue();

    events.next(new NavigationEnd(2, '/explore', '/explore'));
    expect(app.showLayout).toBeTrue();
  });
});
