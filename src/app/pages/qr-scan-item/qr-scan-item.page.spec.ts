import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QrScanItemPage } from './qr-scan-item.page';

describe('QrScanItemPage', () => {
  let component: QrScanItemPage;
  let fixture: ComponentFixture<QrScanItemPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(QrScanItemPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
