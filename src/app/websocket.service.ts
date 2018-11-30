import { Injectable, Output, EventEmitter } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export class WebsocketStatus {

  constructor(public status: string,
    public connected?: boolean) { }
}

export interface DebugMessage {
  type: string;
  details: any;
}

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  
  @Output() debugChanged: EventEmitter<DebugMessage> = new EventEmitter<DebugMessage>();
  @Output() viewChanged: EventEmitter<string> = new EventEmitter<string>();

  private socket: any;
  private lastId: number = 0;
  private responseHandlers: { [index: number]: any } = {};
  private pending = [];
  private isOpen = false;

  constructor() { }

  isConnected(): boolean {
    return this.isOpen;
  }

  initialise(): Observable<WebsocketStatus> {
    const obs = Observable.create(emitter => {
      emitter.next(new WebsocketStatus('Connecting...'));
      console.groupCollapsed('[WebSocket] Opening websocket');
      try {
        var socketURL = environment.wsURL;
        if (!socketURL.startsWith('ws://') && !socketURL.startsWith('wss://')) {
          socketURL = (location.protocol == 'https:' ? 'wss://' : 'ws://') +
            location.hostname + (location.port ? ':' + location.port : '') +
            (environment.wsURL.startsWith('/') ? '' : '/') +
            environment.wsURL;
        }
        console.log(`[WebSocket] Connecting to ${socketURL}`);
        this.socket = new WebSocket(socketURL);
      } finally {
        console.groupEnd();
      }

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
        } else {
          switch (msg.type) {
            case 'changeScreen':
              me.viewChanged.emit(msg.data.screen);
              break;

            case 'debug':
              me.debugChanged.emit(msg.data);
              break;
          }
        }
      };
      this.socket.onclose = function () {
        console.log('[WebSocket] Websocket closed');
        me.isOpen = false;
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

  fetchCurrentView(): Observable<string> {
    console.log('[WebSocket] Fetching current view');
    return this.sendToServer('getScreen', {})
      .pipe(
        map<any, string>(msg => msg.data.screen)
      );
  }

  fetchScheduledEvents(): Observable<ScheduledEvent[]> {
    console.log('[WebSocket] Fetching scheduled events');
    return this.sendToServer('getEvents', {})
      .pipe(
        map<any, ScheduledEvent[]>(msg => msg.data ? msg.data.events : null)
      );
  }

  sendInput(text: string): Observable<CommandStatus> {
    console.log(`[WebSocket] Sending input to server: ${text}`);
    return this.sendToServer('input', {
      text: text
    });
  }

  startScript(eventId: number): Observable<CommandStatus> {
    console.log(`[WebSocket] Triggering script with ID=${eventId}`);
    return this.sendToServer('startEvent', {
      eventId: eventId
    });
  }

  downloadFromServer(): Observable<CommandStatus> {
    console.log(`[WebSocket] Sending download trigger to server`);
    return this.sendToServer('download', {
    });
  }

  changeView(screen: string): Observable<CommandStatus> {
    console.log(`[WebSocket] Sending changeScreen to server: ${screen}`);
    return this.sendToServer('changeScreen', {
      screen: screen || null
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

export interface ScheduledEvent {
  event_id: number;
  script: string;
}