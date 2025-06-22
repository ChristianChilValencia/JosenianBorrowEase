import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      
  {
    path: 'home',
    loadChildren: () => import('../pages/home/home.module').then( m => m.HomePageModule)
  },
  {
    path: 'item',
    loadChildren: () => import('../pages/item/item.module').then( m => m.ItemPageModule)
  },
  {
    path: 'requests',
    loadChildren: () => import('../pages/requests/requests.module').then( m => m.RequestsPageModule)
  },
  {
    path: 'qr-scan-item',
    loadChildren: () => import('../pages/qr-scan-item/qr-scan-item.module').then( m => m.QrScanItemPageModule)
  },
  {
    path: 'notifications',
    loadChildren: () => import('../pages/notifications/notifications.module').then( m => m.NotificationsPageModule)
  },
  {
    path: 'profile',
    loadChildren: () => import('../pages/profile/profile.module').then( m => m.ProfilePageModule)
  },
      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: '/tabs/home',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class TabsPageRoutingModule {}
