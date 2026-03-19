import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardEssan } from './dashboard-essan';

describe('DashboardEssan', () => {
  let component: DashboardEssan;
  let fixture: ComponentFixture<DashboardEssan>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardEssan],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardEssan);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
