import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyownerDashboardComponent } from './propertyowner-dashboard.component';

describe('PropertyownerDashboardComponent', () => {
  let component: PropertyownerDashboardComponent;
  let fixture: ComponentFixture<PropertyownerDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyownerDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PropertyownerDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
