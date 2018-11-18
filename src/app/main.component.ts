import { Component, OnInit } from '@angular/core';
import { interval } from 'rxjs';
import * as moment from 'moment';
import { ActivatedRoute } from '@angular/router';
import { WebsocketService, WebsocketStatus } from './websocket.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {

  constructor(private route: ActivatedRoute,
    public websocket: WebsocketService) { }

  info: WebsocketStatus = new WebsocketStatus('Initialising...');
  currentTime: string = 'Initialising';
  currentView: string = 'face';

  ngOnInit() {
    interval(1000).subscribe(_ => this.currentTime = moment().format("dddd, Do MMMM YYYY, h:mm a"));
    const id = this.route.snapshot.paramMap.get('id');
    let firstTime = true;
    this.websocket.initialise()
      .subscribe(info => {
        this.info = info;
        if (firstTime && info.connected) {
          this.currentView = id || 'face';
          if (!id) {
            this.websocket.fetchCurrentView()
              .subscribe(view => this.currentView = view || 'face');
          }
          firstTime = false;
        };
      });
    this.websocket.viewChanged.subscribe(screen => {
      screen = screen || 'face';
      console.log(`[Main] Changing screen to ${screen}`);
      this.currentView = screen
    });
  }
}
