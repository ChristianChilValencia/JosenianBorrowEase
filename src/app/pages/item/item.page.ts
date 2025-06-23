import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-item',
  templateUrl: './item.page.html',
  styleUrls: ['./item.page.scss'],
  standalone: false
})
export class ItemPage implements OnInit {
  eventDate: string = '';
  returnDate: string = '';
  dateLabel: string = '';

  constructor() { }

  ngOnInit() {
  }

  updateDateLabel() {
    if (this.eventDate && this.returnDate) {
      this.dateLabel = `Event: ${this.formatDate(this.eventDate)} until Return: ${this.formatDate(this.returnDate)}`;
    } else if (this.eventDate) {
      this.dateLabel = `Event: ${this.formatDate(this.eventDate)}`;
    } else if (this.returnDate) {
      this.dateLabel = `Return: ${this.formatDate(this.returnDate)}`;
    } else {
      this.dateLabel = '';
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }
}
