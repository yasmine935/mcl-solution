import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardKia } from './dashboard-kia';

describe('DashboardKia', () => {
  let component: DashboardKia;
  let fixture: ComponentFixture<DashboardKia>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardKia],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardKia);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
