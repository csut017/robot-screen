import { Component, OnInit } from '@angular/core';
import { interval } from 'rxjs';
import * as moment from 'moment';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {

  constructor(private route: ActivatedRoute) { }

  currentTime: string = 'Initialising';
  status: string = 'Initialising';
  currentView: string = 'face';

  ngOnInit(){
    interval(1000).subscribe(_ => this.currentTime = moment().format("dddd, Do MMMM YYYY, h:mm a"));
    const id = this.route.snapshot.paramMap.get('id');
    this.currentView = id || 'face';
  }

}
