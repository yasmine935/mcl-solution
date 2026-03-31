import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemonteesTerrain } from './remontees-terrain';

describe('RemonteesTerrain', () => {
  let component: RemonteesTerrain;
  let fixture: ComponentFixture<RemonteesTerrain>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RemonteesTerrain],
    }).compileComponents();

    fixture = TestBed.createComponent(RemonteesTerrain);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
