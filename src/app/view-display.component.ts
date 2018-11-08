import { Component, OnInit, ViewContainerRef, ComponentRef, ViewChild, Compiler, ComponentFactory, NgModule, ModuleWithComponentFactories, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';

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
  @ViewChild('container', { read: ViewContainerRef }) container: ViewContainerRef;
  private componentRef: ComponentRef<{}>;

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

    let factory = this.createComponentFactorySync(this.compiler, metadata, null);
    if (this.componentRef) {
      this.componentRef.destroy();
      this.componentRef = null;
    }

    this.container.clear();
    this.componentRef = this.container.createComponent(factory);
  }

  private createComponentFactorySync(compiler: Compiler, metadata: Component, componentClass: any): ComponentFactory<any> {
    const cmpClass = componentClass || class RuntimeComponent { name: string = 'Denys' };
    const decoratedCmp = Component(metadata)(cmpClass);

    @NgModule({ imports: [CommonModule], declarations: [decoratedCmp] })
    class RuntimeComponentModule { }

    let module: ModuleWithComponentFactories<any> = compiler.compileModuleAndAllComponentsSync(RuntimeComponentModule);
    return module.componentFactories.find(f => f.componentType === decoratedCmp);
  }
}
