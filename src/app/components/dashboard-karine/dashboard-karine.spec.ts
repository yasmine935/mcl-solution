import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardKarine } from './dashboard-karine';

describe('DashboardKarine', () => {
  let component: DashboardKarine;
  let fixture: ComponentFixture<DashboardKarine>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardKarine],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardKarine);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
