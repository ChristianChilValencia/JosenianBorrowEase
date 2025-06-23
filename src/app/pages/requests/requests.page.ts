import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-requests',
  templateUrl: './requests.page.html',
  styleUrls: ['./requests.page.scss'],
  standalone: false
})
export class RequestsPage implements OnInit {
  requestStatus: string = 'waiting';

  constructor() { }

  ngOnInit() {
  }

}
