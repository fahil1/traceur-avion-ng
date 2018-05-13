import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs-compat';
import { WebsocketService } from './websocket.service';


@Injectable({
  providedIn: 'root'
})
export class RealTimeMappingService {
  CHAT_URL = 'ws://localhost:32000/';
  public messages: Subject<any[]>;

  constructor(wsService: WebsocketService) {
    this.messages = <Subject<any[]>>wsService.connect(this.CHAT_URL)
      .map((response: MessageEvent): any[] => {
        const data = JSON.parse(response.data);
        return data;
    });
  }

}
