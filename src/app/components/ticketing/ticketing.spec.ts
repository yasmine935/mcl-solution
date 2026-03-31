import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Ticketing } from './ticketing';

describe('Ticketing', () => {
  let component: Ticketing;
  let fixture: ComponentFixture<Ticketing>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Ticketing],
    }).compileComponents();

    fixture = TestBed.createComponent(Ticketing);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
