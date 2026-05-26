import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardHaideh } from './dashboard-haideh';

describe('DashboardHaideh', () => {
  let component: DashboardHaideh;
  let fixture: ComponentFixture<DashboardHaideh>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardHaideh],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardHaideh);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
