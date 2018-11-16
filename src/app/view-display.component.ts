import { Component, OnInit, ViewContainerRef, ComponentRef, ViewChild, Compiler, ComponentFactory, NgModule, ModuleWithComponentFactories, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { WebsocketService } from './websocket.service';

@Component({
  selector: 'app-view-display',
  templateUrl: './view-display.component.html',
  styleUrls: ['./view-display.component.css']
})
export class ViewDisplayComponent implements OnInit, OnChanges {

  constructor(private http: HttpClient,
    private compiler: Compiler) { }

  isLoading: boolean = false;
  error: string;
  @Input() currentView: string;
  @Input() websocket: WebsocketService;
  @ViewChild('container', { read: ViewContainerRef }) container: ViewContainerRef;
  private componentRef: ComponentRef<{}>;
  private viewData = {};

  ngOnInit() {
  }

  ngOnChanges(_: SimpleChanges) {
    this.loadView();
  }

  private loadView(): void {
    if (!this.currentView) {
      console.log('[View] No view to download');
      return;
    }

    console.log(`[View] Retrieving view ${this.currentView}`);
    this.isLoading = true;
    const safeView = encodeURI(this.currentView);
    const url = `${environment.baseURL}${safeView}`;
    this.error = undefined;
    this.websocket.fetchViewData()
      .subscribe(data => {
        console.groupCollapsed('[View] Setting view data');
        console.log(data);
        console.groupEnd();
        for (var key in data) {
          const keys = key.split('.'),
            value = data[key];
          let count = keys.length;
          let parent = this.viewData;
          for (let id of keys) {
            count--;
            if (count) {
              let item = parent[id];
              if (!item) {
                item = {};
                parent[id] = item;
              }
              parent = item;
            } else {
              parent[id] = value;
            }
          }
        }
      });
    this.http.get(url, { responseType: 'text' as 'text' })
      .pipe(
        tap(data => {
          console.groupCollapsed(`[View] View ${this.currentView} retrieved`);
          console.log(data);
          console.groupEnd();
        }),
        catchError(err => {
          this.error = `${err.message}`;
          console.groupCollapsed(`[View] Unable to retrieve ${this.currentView}`);
          console.log(err);
          console.groupEnd();
          return of('');
        })
      )
      .subscribe(data => {
        this.compileTemplate(data);
        this.isLoading = false;
      });
  }

  private compileTemplate(content: string) {
    let metadata = {
      selector: `view-display-content`,
      template: content
    };

    let factory = this.createComponentFactorySync(this.compiler, metadata);
    if (this.componentRef) {
      this.componentRef.destroy();
      this.componentRef = null;
    }

    this.container.clear();
    this.componentRef = this.container.createComponent(factory);
  }

  private createComponentFactorySync(compiler: Compiler, metadata: Component): ComponentFactory<any> {
    let me = this;
    const cmpClass: any = class RuntimeComponent {
      data: any = me.viewData;
      websocket: WebsocketService = me.websocket;
      private resources: { [index: string]: string } = {};

      resolve(resource: string): string {
        let resolved = this.resources[resource];
        if (resolved) return resolved;

        console.log(`[View] Resolving resource ${resource}`);
        resolved = `/static/media/${resource}`;
        this.resources[resource] = resolved;
        return resolved;
      }

      publish(text: string): void {
        console.log(`[View] Sending ${text} to robot`);
        this.websocket.sendText(text)
          .subscribe(info => {
            if (info.status != 'OK') {
              alert('Send failed');
            }
          });
      }
    };
    const decoratedCmp = Component(metadata)(cmpClass);
    @NgModule({ imports: [CommonModule], declarations: [decoratedCmp] })
    class RuntimeComponentModule { }

    let module: ModuleWithComponentFactories<any> = compiler.compileModuleAndAllComponentsSync(RuntimeComponentModule);
    return module.componentFactories.find(f => f.componentType === decoratedCmp);
  }
}
