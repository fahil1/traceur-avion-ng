import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs-compat';
import { WebsocketService } from './websocket.service';


@Injectable({
  providedIn: 'root'
})
export class RealTimeMappingService {
  ADSB_URL = 'ws://127.0.0.1:32000/';
  public messages: Subject<any[]>;

  constructor(wsService: WebsocketService) {
    this.messages = <Subject<any[]>>wsService.connect(this.ADSB_URL)
      .map((response: MessageEvent): any[] => {
        const data = JSON.parse(response.data);
        return data;
    });
  }
}
