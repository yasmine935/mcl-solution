import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardAydeh } from './dashboard-aydeh';

describe('DashboardAydeh', () => {
  let component: DashboardAydeh;
  let fixture: ComponentFixture<DashboardAydeh>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardAydeh],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardAydeh);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
