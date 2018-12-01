import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { WebsocketService } from './websocket.service';
import { AbstractSyntaxTree, ASTNode } from './abstract-syntax-tree';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

class CodeLine {
  constructor(sanitizer: DomSanitizer,
    public node: ASTNode,
    indent: number) {
    this.pretty = sanitizer.bypassSecurityTrustHtml(this.formatNode(node, '&nbsp;'.repeat(indent)));
  }

  pretty: SafeHtml;

  private formatNode(node: ASTNode, indent: string): string {
    let out = indent;
    switch (node.type) {
      case 'function': {
        out += this.func(node.token.value, node.id) +
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
            out += this.num(node.token.value);
            break;

          default:
            console.log(`[CodeViewer] Unknown token type: ${node.type}`);
            out += this.syntax(node.token.value);
            break;
        }
        break;

      case 'reference':
        out += this.reference("@" + node.token.value, node.id);
        break;

      default:
        out += this.syntax(node.token.value);
        console.log(`[CodeViewer] Unknown node type: ${node.type}`);
        break;
    }

    return out;
  }

  private func(text: string, id: string): string {
    return this.format(text, 'code-function', id);
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

  private reference(text: string, id: string): string {
    return this.format(text, 'code-reference', id);
  }

  private format(text: string, className: string, id?: string): string {
    return '<span class="' + className + (id ? '" data-id="' + id : '') + '">' + text + '</span>';
  }
}

@Component({
  selector: 'app-code-viewer',
  templateUrl: './code-viewer.component.html',
  styleUrls: ['./code-viewer.component.css']
})
export class CodeViewerComponent implements OnInit, OnChanges {
  constructor(private websocket: WebsocketService,
    private sanitizer: DomSanitizer) { }

  lines: CodeLine[];
  @Input() ast: AbstractSyntaxTree;

  ngOnInit() {
  }

  ngOnChanges(_: SimpleChanges): void {
    this.lines = [];
    this.ast.nodes.forEach(node => this.loadNode(node, 0));
  }

  private loadNode(node: ASTNode, level: number): void {
    this.lines.push(new CodeLine(this.sanitizer, node, level * 4));
    level++;
    (node.children || []).forEach(n => this.loadNode(n, level));
  }

}
