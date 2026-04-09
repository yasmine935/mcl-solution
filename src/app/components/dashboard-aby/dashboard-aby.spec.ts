import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardAby } from './dashboard-aby';

describe('DashboardAby', () => {
  let component: DashboardAby;
  let fixture: ComponentFixture<DashboardAby>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardAby],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardAby);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
