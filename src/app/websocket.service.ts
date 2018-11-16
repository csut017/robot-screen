import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export class WebsocketStatus {

  constructor(public status: string,
    public connected?: boolean) { }
}

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  private socket: any;
  private lastId: number = 0;
  private responseHandlers: { [index: number]: any } = {};
  private pending = [];
  private isOpen = false;

  constructor() { }

  initialise(): Observable<WebsocketStatus> {
    const obs = Observable.create(emitter => {
      emitter.next(new WebsocketStatus('Connecting...'));
      console.log('[WebSocket] Opening websocket');
      this.socket = new WebSocket(environment.wsURL);

      let me = this;
      this.socket.onopen = function () {
        console.log('[WebSocket] Websocket opened');
        emitter.next(new WebsocketStatus('Connected', true));
        me.isOpen = true;
        me.pending.forEach(req => me.socket.send(req));
        me.pending = [];
      };
      this.socket.onmessage = function (evt) {
        console.groupCollapsed('[WebSocket] Message received');
        try {
          console.log(evt.data);
          var msg = JSON.parse(evt.data);
          console.log(msg);
        } finally {
          console.groupEnd();
        }
        if (msg.id) {
          const msgId = 'i' + msg.id;
          let handler = me.responseHandlers[msgId];
          if (handler) {
            handler.next(msg);
            delete me.responseHandlers[msgId];
          } else {
            console.log('[WebSocket] Message has already been handled');
          }
        }
      };
      this.socket.onclose = function () {
        console.log('[WebSocket] Websocket closed');
        this.socket = undefined;
        emitter.next(new WebsocketStatus('Disconnected'));
      };
      this.socket.onerror = function (evt) {
        console.groupCollapsed('[WebSocket] Error received');
        try {
          console.log(evt);
        } finally {
          console.groupEnd();
        }
      };
    });

    return obs;
  }

  fetchViewData(): Observable<ViewData> {
    console.log('[WebSocket] Fetching view data');
    return this.sendToServer('viewData', {})
      .pipe(
        map<any, ViewData>(msg => msg.data)
      );
  }

  sendText(text: string): Observable<CommandStatus> {
    console.log(`[WebSocket] Sending text to server: ${text}`);
    return this.sendToServer('input', {
      text: text
    });
  }

  private sendToServer<T>(msgType: string, data: any): Observable<T> {
    const obs = Observable.create(e => {
      this.lastId++;
      let req = {
        id: this.lastId,
        type: msgType,
        data: data
      };
      const msgId = 'i' + this.lastId;
      this.responseHandlers[msgId] = e;
      const reqData = JSON.stringify(req);
      if (this.isOpen) {
        this.socket.send(reqData);
      } else {
        this.pending.push(reqData);
      }
    });
    return obs;
  }
}

export type ViewData = { [index: string]: any };

export interface CommandStatus {
  status: string;
}