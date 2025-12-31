import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnerMyPropertiesComponent } from './owner-my-properties.component';

describe('OwnerMyPropertiesComponent', () => {
  let component: OwnerMyPropertiesComponent;
  let fixture: ComponentFixture<OwnerMyPropertiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnerMyPropertiesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OwnerMyPropertiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
