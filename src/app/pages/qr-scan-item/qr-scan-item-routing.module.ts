import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { QrScanItemPage } from './qr-scan-item.page';

const routes: Routes = [
  {
    path: '',
    component: QrScanItemPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class QrScanItemPageRoutingModule {}
