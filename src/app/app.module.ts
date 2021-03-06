import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { ClarityModule, ClrFormsNextModule } from '@clr/angular';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { ViewDisplayComponent } from './view-display.component';
import { AppRoutingModule } from './app-routing.module';
import { MainComponent } from './main.component';
import { ControlComponent } from './control.component';
import { FormsModule } from '@angular/forms';
import { DebuggerComponent } from './debugger.component';
import { HeaderComponent } from './header.component';
import { CodeViewerComponent } from './code-viewer.component';

@NgModule({
  declarations: [
    AppComponent,
    ViewDisplayComponent,
    MainComponent,
    ControlComponent,
    DebuggerComponent,
    HeaderComponent,
    CodeViewerComponent
  ],
  imports: [
    HttpClientModule,
    FormsModule,
    BrowserModule,
    ClrFormsNextModule,
    ClarityModule,
    BrowserAnimationsModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
