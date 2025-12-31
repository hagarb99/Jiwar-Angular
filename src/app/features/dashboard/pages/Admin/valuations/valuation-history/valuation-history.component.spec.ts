import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValuationHistoryComponent } from './valuation-history.component';

describe('ValuationHistoryComponent', () => {
  let component: ValuationHistoryComponent;
  let fixture: ComponentFixture<ValuationHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValuationHistoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ValuationHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
