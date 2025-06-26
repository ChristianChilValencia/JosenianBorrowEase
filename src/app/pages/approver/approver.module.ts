import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ApproverPageRoutingModule } from './approver-routing.module';

import { ApproverPage } from './approver.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    ApproverPageRoutingModule
  ],
  declarations: [ApproverPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ApproverPageModule {}
