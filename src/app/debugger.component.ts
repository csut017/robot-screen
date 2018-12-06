import { Component, OnInit } from '@angular/core';
import { WebsocketStatus, WebsocketService, DebugMessage } from './websocket.service';
import { DebugLine } from './debug-line';
import { AbstractSyntaxTree, ASTNode } from './abstract-syntax-tree';
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
  currentNodeID: string;
  private scriptMap: { [index: string]: AbstractSyntaxTree } = {};

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
    this.currentNodeID = item.details.node_id;
    let ast = item.details.ast;
    if (ast) {
      console.groupCollapsed('[Debugger] Opening script');
      const ast = new AbstractSyntaxTree(item.details.name, item.details.ast);
      console.log(ast);
      this.ast = ast;
      console.groupEnd();
    }

    if (!ast && this.currentNodeID) {
      ast = this.scriptMap[this.currentNodeID];
      if (ast) {
        console.groupCollapsed('[Debugger] Opening script for line');
        console.log(ast);
        this.ast = ast;
        console.groupEnd();

        var element = document.getElementById(this.currentNodeID);
        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "center"
          });
        }
      }
    }
  }

  refreshDebugLog(): void {
    this.websocket.fetchDebugLog()
      .subscribe(result => {
        let items = result || [];
        this.scriptMap = {};
        items.forEach(item => this.addDebug(item));
      });
  }

  private addDebug(msg: DebugMessage): void {
    this.callTable.increment(msg.details.node_id);
    this.logData.splice(0, 0, DebugLine.FromMessage(msg));
    if (msg.details.ast) {
      const ast = new AbstractSyntaxTree(msg.details.name, msg.details.ast);
      ast.nodes.forEach(child => {
        this.mapNode(ast, child);
      });
    }
  }

  private mapNode(ast: AbstractSyntaxTree, node: ASTNode) {
    this.scriptMap[node.id] = ast;
    (node.children || []).forEach(n => this.mapNode(ast, n));
    (node.args || []).forEach(n => this.mapNode(ast, n));
  }
}
