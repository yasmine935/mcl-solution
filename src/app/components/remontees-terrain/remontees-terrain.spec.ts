import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemonteesTerrainComponent } from './remontees-terrain';

describe('RemonteesTerrainComponent', () => {
  let component: RemonteesTerrainComponent;
  let fixture: ComponentFixture<RemonteesTerrainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RemonteesTerrainComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RemonteesTerrainComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
