import { Component, OnInit } from '@angular/core';
import { WebsocketStatus, WebsocketService, DebugMessage } from './websocket.service';
import { DebugLine } from './debug-line';
import { AbstractSyntaxTree } from './abstract-syntax-tree';
import { CallTable } from './call-table';

@Component({
  selector: 'app-debugger',
  templateUrl: './debugger.component.html',
  styleUrls: ['./debugger.component.css']
})
export class DebuggerComponent implements OnInit {

  constructor(private websocket: WebsocketService) { }

  info: WebsocketStatus = new WebsocketStatus('Initialising...');
  logData: DebugLine[] = [];
  ast: AbstractSyntaxTree;
  callTable: CallTable = new CallTable();

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

  processItem(item: DebugLine): void {
    item.isOpen = !item.isOpen;
    if (item.details.ast) {
      console.groupCollapsed('[Debugger] Opening script');
      const ast = new AbstractSyntaxTree(item.details.name, item.details.ast);
      console.log(ast);
      this.ast = ast;
      console.groupEnd();
    }
  }

  refreshDebugLog(): void {
    this.websocket.fetchDebugLog()
      .subscribe(result => {
        let items = result || [];
        items.forEach(item => this.addDebug(item));
      });
  }

  private addDebug(msg: DebugMessage): void {
    this.callTable.increment(msg.details.node_id);
    this.logData.splice(0, 0, DebugLine.FromMessage(msg));
  }
}
