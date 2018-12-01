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

  connecting: boolean;
  info: WebsocketStatus = new WebsocketStatus('Initialising...');
  currentView: string = 'face';
  firstTime: boolean = true;
  timeToConnect: moment.Moment;
  timeToConnectDisplay: string;
  private lastConnectionTime: number = 5;

  ngOnInit() {
    interval(500).subscribe(_ => {
      this.checkToConnect();
    });
    const id = this.route.snapshot.paramMap.get('id');
    this.connectToServer(id);
    this.websocket.viewChanged.subscribe(screen => {
      screen = screen || 'face';
      console.log(`[Main] Changing screen to ${screen}`);
      this.currentView = screen
    });
  }

  checkToConnect(): void {
    if (this.connecting || this.info.connected) return;
    const inSeconds = this.timeToConnect.diff(moment(), 'seconds');
    if (inSeconds >= 60) {
      this.timeToConnectDisplay = this.timeToConnect.fromNow();
    } else if (inSeconds == 1) {
      this.timeToConnectDisplay = `in 1 second`;
    } else {
      this.timeToConnectDisplay = `in ${inSeconds} seconds`;
    }
    if (this.timeToConnect.isSameOrBefore(moment())) this.connectToServer();
  }

  connectToServer(id?: string): void {
    console.log(`[Main] Connecting to websocket`);
    this.connecting = true;
    this.websocket.initialise()
      .subscribe(info => {
        this.connecting = info.status == 'Connecting...';
        this.info = info;
        if (this.connecting) return;

        if (this.firstTime && info.connected) {
          this.currentView = id || 'face';
          if (!id) {
            this.websocket.fetchCurrentView()
              .subscribe(view => this.currentView = view || 'face');
          }
          this.firstTime = false;
        };
        if (!info.connected) {
          this.lastConnectionTime *= 2;
          this.timeToConnect = moment().add(this.lastConnectionTime, 'seconds');
          console.log(`[Main] Unable to connect, trying again in ${this.lastConnectionTime}s`);
        } else {
          this.lastConnectionTime = 5;
        }
      });
  }
}
