import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ApproverPageRoutingModule } from './approver-routing.module';

import { ApproverPage } from './approver.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ApproverPageRoutingModule
  ],
  declarations: [ApproverPage]
})
export class ApproverPageModule {}
