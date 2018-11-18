import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './main.component';
import { ControlComponent } from './control.component';

const routes: Routes = [
  { path: '', component: MainComponent },
  { path: 'control', component: ControlComponent },
  { path: ':id', component: MainComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule { }
