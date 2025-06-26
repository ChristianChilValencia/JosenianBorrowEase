import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApproverPage } from './approver.page';

describe('ApproverPage', () => {
  let component: ApproverPage;
  let fixture: ComponentFixture<ApproverPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ApproverPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
