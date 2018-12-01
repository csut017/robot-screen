import { Component, OnInit } from '@angular/core';
import { WebsocketService, WebsocketStatus, ScheduledEvent, ViewData, DebugMessage } from './websocket.service';
import { DebugLine } from './debug-line';

class ViewDataItem {
  constructor(public name: string,
    public value: string) { }
}

@Component({
  selector: 'app-control',
  templateUrl: './control.component.html',
  styleUrls: ['./control.component.css']
})
export class ControlComponent implements OnInit {

  constructor(public websocket: WebsocketService) { }

  info: WebsocketStatus = new WebsocketStatus('Initialising...');
  currentView: string;
  newScreen: string;
  textInput: string;
  selectedEvent: string;
  scheduledEvents: ScheduledEvent[] = [];
  viewData: ViewDataItem[] = [];
  logData: DebugLine[] = [];

  ngOnInit() {
    this.websocket.viewChanged.subscribe(screen => {
      this.currentView = screen;
      this.websocket.fetchViewData()
        .subscribe(data => this.loadViewData(data));
    });
    this.websocket.debugChanged.subscribe(msg => this.addDebug(msg));
    this.connectToServer();
  }

  connectToServer(): void {
    this.websocket.initialise()
      .subscribe(info => {
        this.info = info;
        if (info.connected) {
          this.websocket.fetchCurrentView()
            .subscribe(view => this.currentView = view);
          this.websocket.fetchViewData()
            .subscribe(data => this.loadViewData(data));
          this.refreshEvents();
          this.refreshDebugLog();
        }
      });
  }

  currentViewName(): string {
    return this.currentView || '<none>';
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

  private addDebug(msg: DebugMessage): void {
    this.logData.splice(0, 0, DebugLine.FromMessage(msg));
  }
}
