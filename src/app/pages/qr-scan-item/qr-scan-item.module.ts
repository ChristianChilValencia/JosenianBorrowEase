import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { QrScanItemPageRoutingModule } from './qr-scan-item-routing.module';

import { QrScanItemPage } from './qr-scan-item.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    QrScanItemPageRoutingModule
  ],
  declarations: [QrScanItemPage]
})
export class QrScanItemPageModule {}
