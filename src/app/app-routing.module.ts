import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './main.component';
import { ControlComponent } from './control.component';
import { DebuggerComponent } from './debugger.component';

const routes: Routes = [
  { path: '', component: MainComponent },
  { path: 'control', component: ControlComponent },
  { path: 'debug', component: DebuggerComponent },
  { path: ':id', component: MainComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule { }
