import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiseAuTravail } from './mise-au-travail';

describe('MiseAuTravail', () => {
  let component: MiseAuTravail;
  let fixture: ComponentFixture<MiseAuTravail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiseAuTravail],
    }).compileComponents();

    fixture = TestBed.createComponent(MiseAuTravail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
