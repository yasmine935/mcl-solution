import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardNaccera } from './dashboard-naccera';

describe('DashboardNaccera', () => {
  let component: DashboardNaccera;
  let fixture: ComponentFixture<DashboardNaccera>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardNaccera],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardNaccera);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
