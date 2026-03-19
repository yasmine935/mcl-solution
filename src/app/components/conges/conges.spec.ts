import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Conges } from './conges';

describe('Conges', () => {
  let component: Conges;
  let fixture: ComponentFixture<Conges>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Conges],
    }).compileComponents();

    fixture = TestBed.createComponent(Conges);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
