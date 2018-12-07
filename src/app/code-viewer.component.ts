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
    this.callCountDisplay = this.callCount > 9 ? '+' : this.callCount.toString();
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

        case 'template':
        out += this.template('"' + node.token.value + '"');
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

  private template(text: string): string {
    return this.format(text, 'code-template');
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
  @Input() previousNodeID: string;
  @ViewChild('codeViewCanvas') canvasElementRef: ElementRef;
  @ViewChild('codeViewLines') linesElementRef: ElementRef;

  private canvasElement: HTMLCanvasElement;
  private linesElement: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private lastAST: AbstractSyntaxTree;
  private isLinked: boolean;

  ngOnInit() {
  }

  ngAfterViewInit() {
    console.log('[CodeViewer] Children initialised');
    this.canvasElement = <HTMLCanvasElement>this.canvasElementRef.nativeElement;
    this.linesElement = <HTMLCanvasElement>this.linesElementRef.nativeElement;
    this.context = this.canvasElement.getContext('2d');
    this.setCanvasSize();
  }

  ngOnChanges(_: SimpleChanges): void {
    if (this.lastAST && (this.lastAST.name == this.ast.name)) {
      this.displayCurrentNodeAndLink();
      this.lastAST = this.ast;
      return;
    }

    this.lines = [];
    this.ast.nodes.forEach(node => this.loadNode(node, 0));
    if (this.context && this.linesElement) {
      setTimeout(this.setCanvasSize, 1);
    }
    this.lastAST = this.ast;
    this.displayCurrentNodeAndLink();

    if (!this.isLinked) {
      this.callTable.updated.subscribe(id => (this.lines || []).forEach(l => l.updateCallCount()));
      this.isLinked = true;
    }
  }

  private setCanvasSize() {
    const rect = this.linesElement.getBoundingClientRect();
    if (this.canvasElement.width != rect.width) this.canvasElement.width = rect.width;
    if (this.canvasElement.height != rect.height) this.canvasElement.height = rect.height;
  }

  private displayCurrentNodeAndLink(delayed?: boolean): void {
    if (this.context) {
      if (this.linesElement) this.setCanvasSize();
      this.context.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    }
    (this.lines || []).forEach(l => l.isSelected = l.id == this.currentNodeID);
    if (!this.previousNodeID || !this.currentNodeID) return;

    const el = document.getElementById(this.currentNodeID),
      prevEl = document.getElementById(this.previousNodeID);
    if (!el || !prevEl) {
      if (!delayed) setTimeout(() => this.displayCurrentNodeAndLink(true), 1);
      return;
    }

    const elRect = el.getBoundingClientRect(),
      prevElRect = prevEl.getBoundingClientRect(),
      parent = el.parentElement,
      parentRect = parent.getBoundingClientRect(),
      elTop = elRect.top - parentRect.top,
      prevElTop = prevElRect.top - parentRect.top,
      elWidth = this.getLineWidth(el),
      prevWidth = this.getLineWidth(prevEl),
      width = elWidth - prevWidth,
      height = elTop - prevElTop,
      offset = elRect.height / 2;
    let xDist = elRect.height,
      yDist = 0;

    // Draw the arrow line
    this.context.strokeStyle = '#003D79';
    this.context.lineWidth = 3;
    this.context.lineCap = 'round';
    this.context.beginPath();
    const startX = elWidth + offset,
      startY = elTop + offset,
      endX = startX - width,
      endY = startY - height;
    this.context.moveTo(endX, endY);
    this.context.bezierCurveTo(endX + xDist, endY - yDist, startX + xDist, startY + yDist, startX, startY);
    this.context.stroke();

    // Draw the arrow head
    this.context.lineWidth = 1;
    this.context.beginPath();
    this.context.moveTo(startX - 10, startY);
    this.context.lineTo(startX, startY + 5);
    this.context.lineTo(startX, startY - 5);
    this.context.fill();
  }

  selectItem(evt: any): void {
    console.log(evt);
  }

  private getLineWidth(el: HTMLElement): number {
    let width = 0,
      left = el.getBoundingClientRect().left,
      child = el.firstElementChild;
    while (child) {
      let rect = child.getBoundingClientRect(),
        right = rect.right - left;
      if (right > width) width = right;
      child = child.nextElementSibling;
    }
    return width;
  }

  private loadNode(node: ASTNode, level: number): void {
    this.lines.push(new CodeLine(node, level * 4, this.callTable));
    level++;
    (node.children || []).forEach(n => this.loadNode(n, level));
  }

}
