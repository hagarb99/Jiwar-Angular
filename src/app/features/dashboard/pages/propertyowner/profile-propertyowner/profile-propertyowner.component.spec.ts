import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfilePropertyownerComponent } from './profile-propertyowner.component';

describe('ProfilePropertyownerComponent', () => {
  let component: ProfilePropertyownerComponent;
  let fixture: ComponentFixture<ProfilePropertyownerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfilePropertyownerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfilePropertyownerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
