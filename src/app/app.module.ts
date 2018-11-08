import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { ClarityModule } from '@clr/angular';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { ViewDisplayComponent } from './view-display.component';
import { AppRoutingModule } from './app-routing.module';
import { MainComponent } from './main.component';

@NgModule({
  declarations: [
    AppComponent,
    ViewDisplayComponent,
    MainComponent
  ],
  imports: [
    HttpClientModule,
    BrowserModule,
    ClarityModule,
    BrowserAnimationsModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
