import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private hubConnection!: HubConnection;
  private messages = new BehaviorSubject<{ senderId: string, message: string }[]>([]);
  messages$ = this.messages.asObservable();

  constructor() { }

  public startConnection(token: string) {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl('https://localhost:5001/chathub', { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start()
      .then(() => console.log('✅ SignalR connected'))
      .catch((err: any) => console.error('❌ SignalR connection error:', err));

    // استقبال الرسائل
    this.hubConnection.on('ReceiveMessage', (senderId: string, message: string) => {
      const current = this.messages.getValue();
      this.messages.next([...current, { senderId, message }]);
    });
  }

  public sendMessage(receiverId: string, senderId: string, message: string) {
    this.hubConnection.invoke('SendMessage', receiverId, senderId, message)
      .catch((err: any) => console.error(err));
  }
}
