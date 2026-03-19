import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardOdile } from './dashboard-odile';

describe('DashboardOdile', () => {
  let component: DashboardOdile;
  let fixture: ComponentFixture<DashboardOdile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardOdile],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardOdile);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
