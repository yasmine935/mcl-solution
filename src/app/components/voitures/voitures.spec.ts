import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Voitures } from './voitures';

describe('Voitures', () => {
  let component: Voitures;
  let fixture: ComponentFixture<Voitures>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Voitures],
    }).compileComponents();

    fixture = TestBed.createComponent(Voitures);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
