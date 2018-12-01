import { Component, OnInit } from '@angular/core';
import { WebsocketStatus, WebsocketService, DebugMessage } from './websocket.service';
import { DebugLine } from './debug-line';

@Component({
  selector: 'app-debugger',
  templateUrl: './debugger.component.html',
  styleUrls: ['./debugger.component.css']
})
export class DebuggerComponent implements OnInit {

  constructor(private websocket: WebsocketService) { }

  info: WebsocketStatus = new WebsocketStatus('Initialising...');
  logData: DebugLine[] = [];

  ngOnInit() {
    this.websocket.debugChanged.subscribe(msg => this.addDebug(msg));
    this.connectToServer();
  }

  connectToServer(): void {
    this.websocket.initialise()
      .subscribe(info => {
        this.info = info;
        if (info.connected) {
          this.refreshDebugLog();
        }
      });
  }

  refreshDebugLog(): void {
    this.websocket.fetchDebugLog()
      .subscribe(result => {
        let items = result || [];
        items.forEach(item => this.addDebug(item));
      });
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
}
