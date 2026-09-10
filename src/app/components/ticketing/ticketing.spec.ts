import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TicketingComponent } from './ticketing';

describe('TicketingComponent', () => {
  let component: TicketingComponent;
  let fixture: ComponentFixture<TicketingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicketingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TicketingComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
