import { Component, OnInit, Input } from '@angular/core';
import { WebsocketStatus } from './websocket.service';
import { interval } from 'rxjs';
import * as moment from 'moment';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  constructor() { }

  currentTime: string = 'Initialising';
  
  @Input() info: WebsocketStatus;
  @Input() title: string = 'HealthBot';

  ngOnInit() {
    interval(500).subscribe(_ => {
      this.currentTime = moment().format("dddd, Do MMMM YYYY, h:mm a");
    });
  }

}
