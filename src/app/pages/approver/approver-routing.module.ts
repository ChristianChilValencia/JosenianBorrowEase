import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ApproverPage } from './approver.page';

const routes: Routes = [
  {
    path: '',
    component: ApproverPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ApproverPageRoutingModule {}
