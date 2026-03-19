import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardAurelien } from './dashboard-aurelien';

describe('DashboardAurelien', () => {
  let component: DashboardAurelien;
  let fixture: ComponentFixture<DashboardAurelien>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardAurelien],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardAurelien);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
