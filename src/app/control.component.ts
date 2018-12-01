import { Component, OnInit } from '@angular/core';
import { WebsocketService, WebsocketStatus, ScheduledEvent, ViewData, DebugMessage } from './websocket.service';
import * as moment from 'moment';
import { interval } from 'rxjs';

class ViewDataItem {
  constructor(public name: string,
    public value: string) { }
}

class DebugLine {
  constructor(public lineType: string,
    public value: string) { }

  details: any;
}

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
  textInput: string;
  selectedEvent: string;
  scheduledEvents: ScheduledEvent[] = [];
  viewData: ViewDataItem[] = [];
  logData: DebugLine[] = [];

  ngOnInit() {
    interval(1000).subscribe(_ => this.currentTime = moment().format("dddd, Do MMMM YYYY, h:mm a"));
    this.websocket.viewChanged.subscribe(screen => {
      this.currentView = screen || '<none>';
      this.websocket.fetchViewData()
        .subscribe(data => this.loadViewData(data));
    });
    this.websocket.debugChanged.subscribe(msg => this.addDebug(msg));
    this.connectToServer();
  }

  private addDebug(msg: DebugMessage): void {
    let name = 'error-standard',
      value = msg.type;
    switch (msg.type) {
      case 'FUN_CALL':
        name = 'redo';
        value = msg.details['function'];
        let args = [],
          argList = msg.details['arguments'];
        for (let key in argList) {
          let argVal = argList[key];
          args.push(`${key}='${argVal}'`);
        }
        value += '(' + args.join(', ') + ')';
        break;

      case 'RES_LOOKUP':
        name = 'search';
        value = `RESOURCE[${msg.details.type}]: ${msg.details.resource}`;
        break;

        case 'SCRIPT_START':
        name = 'play';
        value = `SCRIPT: ${msg.details.name}`;
        break;
      }

    let item = new DebugLine(name, value);
    item.details = msg.details;
    this.logData.splice(0, 0, item);
  }

  connectToServer(): void {
    this.websocket.initialise()
      .subscribe(info => {
        this.info = info;
        if (info.connected) {
          this.websocket.fetchCurrentView()
            .subscribe(view => this.currentView = view || '<none>');
          this.websocket.fetchViewData()
            .subscribe(data => this.loadViewData(data));
          this.refreshEvents();
          this.refreshDebugLog();
        }
      });
  }

  private loadViewData(data: ViewData): void {
    console.log('Loading view data');
    this.viewData = [];
    for (var key in data) {
      const value = data[key];
      this.viewData.push(new ViewDataItem(key, value));
    }
    this.viewData.sort((a, b) => a.name == b.name ? 0 : a.name > b.name ? 1 : -1);
  }

  changeScreen(): void {
    this.websocket.changeView(this.newScreen)
      .subscribe(result => {
        console.groupCollapsed('Handle result');
        console.log(result);
        console.groupEnd();
      });
  }

  sendInput(): void {
    this.websocket.sendInput(this.textInput)
      .subscribe(result => {
        console.groupCollapsed('Handle result');
        console.log(result);
        console.groupEnd();
      });
  }

  refreshEvents(): void {
    this.websocket.fetchScheduledEvents()
      .subscribe(result => {
        this.scheduledEvents = result || [];
        this.selectedEvent = null;
        if (this.scheduledEvents.length) this.selectedEvent = this.scheduledEvents[0].event_id.toString();
      });
  }

  refreshDebugLog(): void {
    this.websocket.fetchDebugLog()
      .subscribe(result => {
        let items = result || [];
        items.forEach(item => this.addDebug(item));
      });
  }

  triggerDownload(): void {
    this.websocket.downloadFromServer()
      .subscribe(result => {
        console.groupCollapsed('Handle result');
        console.log(result);
        console.groupEnd();
      });
  }

  resetExecution(): void {
    this.websocket.resetExecution()
      .subscribe(result => {
        console.groupCollapsed('Handle result');
        console.log(result);
        console.groupEnd();
      });
  }

  startScript(): void {
    this.websocket.startScript(parseInt(this.selectedEvent))
      .subscribe(result => {
        console.groupCollapsed('Handle result');
        console.log(result);
        console.groupEnd();
      });
  }
}
