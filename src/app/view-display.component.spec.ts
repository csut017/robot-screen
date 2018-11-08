import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewDisplayComponent } from './view-display.component';

describe('ViewDisplayComponent', () => {
  let component: ViewDisplayComponent;
  let fixture: ComponentFixture<ViewDisplayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewDisplayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
