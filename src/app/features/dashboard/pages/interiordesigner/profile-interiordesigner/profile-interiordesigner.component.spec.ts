import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileInteriordesignerComponent } from './profile-interiordesigner.component';

describe('ProfileInteriordesignerComponent', () => {
  let component: ProfileInteriordesignerComponent;
  let fixture: ComponentFixture<ProfileInteriordesignerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileInteriordesignerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileInteriordesignerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
