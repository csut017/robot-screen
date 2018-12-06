import { Component, OnInit, Input, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { AbstractSyntaxTree, ASTNode } from './abstract-syntax-tree';
import { CallTable } from './call-table';

class CodeLine {
  constructor(public node: ASTNode,
    indent: number,
    private table: CallTable) {
    this.pretty = this.formatNode(node, '&nbsp;'.repeat(indent));
    this.updateCallCount();
    this.id = node.id;
  }

  id: string;
  isSelected: boolean = false;
  pretty: string;
  callCount: number = 0;
  callCountDisplay: string;

  updateCallCount(): void {
    this.callCount = this.table.get(this.node.id);
    this.callCountDisplay = this.callCount > 9 ? '*' : this.callCount.toString();
  }

  private formatNode(node: ASTNode, indent: string): string {
    let out = indent;
    switch (node.type) {
      case 'function': {
        out += this.func(node.token.value) +
          this.syntax('(');
        let args = (node.args || []).map(arg => this.formatNode(arg, ''));
        out += args.join(this.syntax(', '));
        if (node.children && node.children.length) {
          out += this.syntax('):');
        } else {
          out += this.syntax(')');
        }
      }
        break;

      case 'argument': {
        out += this.argument(node.token.value) +
          this.syntax('=');
        let args = (node.children || []).map(arg => this.formatNode(arg, ''));
        out += args.join(this.syntax(', '));
      }
        break;

      case 'constant':
        switch (node.token.type) {
          case 'text':
            out += this.text("'" + node.token.value + "'");
            break;

          case 'number':
          case 'boolean':
            out += this.num(node.token.value);
            break;

          default:
            console.log(`[CodeViewer] Unknown token type: ${node.token.value}`);
            out += this.syntax(node.token.value);
            break;
        }
        break;

      case 'duration':
        out += this.num(node.token.value + 's');
        break;

      case 'reference':
        out += this.reference("@" + node.token.value);
        break;

      default:
        out += this.syntax(node.token.value);
        console.log(`[CodeViewer] Unknown node type: ${node.type}`);
        break;
    }

    return out;
  }

  private func(text: string): string {
    return this.format(text, 'code-function');
  }

  private syntax(text: string): string {
    return this.format(text, 'code-syntax');
  }

  private argument(text: string): string {
    return this.format(text, 'code-argument');
  }

  private text(text: string): string {
    return this.format(text, 'code-string');
  }

  private num(text: string): string {
    return this.format(text, 'code-number');
  }

  private reference(text: string): string {
    return this.format(text, 'code-reference');
  }

  private format(text: string, className: string): string {
    return '<span class="' + className + '">' + text + '</span>';
  }
}

@Component({
  selector: 'app-code-viewer',
  templateUrl: './code-viewer.component.html',
  styleUrls: ['./code-viewer.component.css']
})
export class CodeViewerComponent implements OnInit, OnChanges, AfterViewInit {
  constructor() { }

  lines: CodeLine[];
  @Input() ast: AbstractSyntaxTree;
  @Input() callTable: CallTable;
  @Input() currentNodeID: string;
  @ViewChild('codeViewCanvas') canvasElementRef: ElementRef;
  @ViewChild('codeViewLines') linesElementRef: ElementRef;

  private canvasElement: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private lastAST: AbstractSyntaxTree;

  ngOnInit() {
  }

  ngAfterViewInit() {
    console.log('[CodeViewer] Children initialised');
    this.canvasElement = <HTMLCanvasElement>this.canvasElementRef.nativeElement;
    this.context = this.canvasElement.getContext('2d');
  }

  ngOnChanges(_: SimpleChanges): void {
    if (this.lastAST && (this.lastAST.name == this.ast.name)) {
      (this.lines || []).forEach(l => l.isSelected = l.id == this.currentNodeID);
      this.lastAST = this.ast;
      return;
    }

    this.lines = [];
    this.ast.nodes.forEach(node => this.loadNode(node, 0));
    this.lastAST = this.ast;
    this.lines.forEach(l => l.isSelected = l.id == this.currentNodeID);
  }

  private loadNode(node: ASTNode, level: number): void {
    this.lines.push(new CodeLine(node, level * 4, this.callTable));
    level++;
    (node.children || []).forEach(n => this.loadNode(n, level));
  }

}
