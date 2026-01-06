import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyOwnerPublicProfileComponent } from './property-owner-public-profile.component';

describe('PropertyOwnerPublicProfileComponent', () => {
  let component: PropertyOwnerPublicProfileComponent;
  let fixture: ComponentFixture<PropertyOwnerPublicProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyOwnerPublicProfileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PropertyOwnerPublicProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
