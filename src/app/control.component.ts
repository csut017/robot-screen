import { Component, OnInit } from '@angular/core';
import { WebsocketService, WebsocketStatus } from './websocket.service';
import * as moment from 'moment';
import { interval } from 'rxjs';

@Component({
  selector: 'app-control',
  templateUrl: './control.component.html',
  styleUrls: ['./control.component.css']
})
export class ControlComponent implements OnInit {

  constructor(public websocket: WebsocketService) { }

  info: WebsocketStatus = new WebsocketStatus('Initialising...');
  currentTime: string = 'Initialising';
  currentView: string = '<none>';
  newScreen: string;

  ngOnInit() {
    interval(1000).subscribe(_ => this.currentTime = moment().format("dddd, Do MMMM YYYY, h:mm a"));
    this.websocket.initialise()
      .subscribe(info => {
        this.info = info;
        this.websocket.fetchCurrentView()
          .subscribe(view => this.currentView = view || '<none>');
      });
    this.websocket.viewChanged.subscribe(screen => this.currentView = screen || '<none>');
  }

  changeScreen(): void {
    this.websocket.changeView(this.newScreen)
      .subscribe(result => {
        console.groupCollapsed('Handle result');
        console.log(result);
        console.groupEnd();
      });
  }
}
