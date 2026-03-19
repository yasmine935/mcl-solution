import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardTechnicien } from './dashboard-technicien';

describe('DashboardTechnicien', () => {
  let component: DashboardTechnicien;
  let fixture: ComponentFixture<DashboardTechnicien>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardTechnicien],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardTechnicien);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
