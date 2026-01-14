import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { BehaviorSubject, Observable, tap, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { playBeep } from '../utils/beep-sound';
import { AuthService } from './auth.service';

export interface ChatMessage {
  senderId: string;
  senderName?: string;
  senderPhoto?: string;
  message?: string; // Standard text message field
  messageText?: string; // Rich text/content field
  messageType?: number; // 0=Text, 1=Image, 2=PDF/File
  sentDate: string;
  propertyId: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private hubConnection: HubConnection | null = null;

  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();

  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  public connectionStatus$ = this.connectionStatusSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  private messageReceivedSubject = new Subject<ChatMessage>();
  public messageReceived$ = this.messageReceivedSubject.asObservable();

  private pendingRoomJoin: number | null = null;

  private readonly hubUrl = `${environment.assetsBaseUrl}/chathub`;
  private readonly apiUrl = `${environment.apiBaseUrl}`;

  constructor() { }

  /**
   * Start SignalR connection and listen for messages
   */
  public startConnection(token: string, propertyId?: number): void {
    if (this.hubConnection) {
      this.hubConnection.stop();
    }

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(this.hubUrl, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    this.hubConnection.start()
      .then(() => {
        console.log('✅ Chat Hub connected');
        this.connectionStatusSubject.next(true);

        // Join pending room or the one passed in
        const roomToJoin = propertyId || this.pendingRoomJoin;
        if (roomToJoin) {
          this.joinChatRoom(roomToJoin);
          this.pendingRoomJoin = null;
        }
      })
      .catch(err => {
        console.error('❌ Chat Hub connection error:', err);
        this.connectionStatusSubject.next(false);
      });

    // Listen for real-time messages
    this.hubConnection.on('ReceiveMessage', (data: any) => {
      console.log('📩 New message received:', data);

      // Handle both old and new backend structures (PascalCase or camelCase)
      const newMessage: ChatMessage = {
        senderId: data.senderId || data.SenderId,
        senderName: data.senderName || data.SenderName,
        senderPhoto: data.senderPhoto || data.SenderPhoto,
        message: data.message || data.Message || data.messageText || data.MessageText,
        messageText: data.messageText || data.MessageText || data.message || data.Message,
        messageType: data.messageType ?? data.MessageType ?? 0,
        sentDate: data.sentDate || data.SentDate || new Date().toISOString(),
        propertyId: data.propertyId || data.PropertyId
      };

      const currentMessages = this.messagesSubject.getValue();

      // Update state
      this.messagesSubject.next([...currentMessages, newMessage]);

      // Check if message is from self using AuthService
      const currentUserId = this.authService.getUserId();

      console.log(`🔎 Checking notification: Sender=${newMessage.senderId}, Me=${currentUserId}`);

      // Only notify if message is from someone else
      // Note: Don't increment count here - ReceiveChatNotification will provide accurate count
      if (currentUserId && newMessage.senderId != currentUserId) {
        // Play sound notification
        playBeep();
        console.log('🔔 Sound notification played for incoming message');
      } else {
        console.log('🔕 Notification suppressed (Self message)');
      }


      // Notify subscribers (UI update)
      this.messageReceivedSubject.next(newMessage);
    });

    // Listen for global chat notifications (e.g. badge updates)
    this.hubConnection.on('ReceiveChatNotification', (data: any) => {
      console.log('🔔 Chat notification received:', data);
      if (data && typeof data.unreadCount === 'number') {
        this.updateUnreadCount(data.unreadCount);
      }
      // Also play sound if meaningful
      if (data.title || data.message) {
        playBeep();
      }
    });
  }

  /**
   * Join a specific property chat room
   */
  public joinChatRoom(propertyId: number): void {
    if (this.hubConnection && this.connectionStatusSubject.value) {
      console.log(`📡 [ChatService] Invoking JoinChat for room: ${propertyId}`);
      this.hubConnection.invoke('JoinChat', propertyId.toString())
        .then(() => console.log(`👥 [ChatService] Joined chat room for property: ${propertyId}`))
        .catch(err => console.error('❌ [ChatService] Failed to join chat room:', err));
    } else {
      console.log(`⏳ [ChatService] Connection not ready, queuing room join for property: ${propertyId}`);
      this.pendingRoomJoin = propertyId;
    }
  }

  /**
   * Join a room for a specific property (Owner View)
   * Currently maps to joinChatRoom with propertyID. Update if backend supports customer isolation.
   */
  public joinPropertyChatRoom(propertyId: number, customerId: string): void {
    this.joinChatRoom(propertyId);
  }

  /**
   * Send a message from Property Owner to Customer
   */
  public sendPropertyChatMessage(propertyId: number, message: string, receiverId: string): Observable<any> {
    const payload = {
      message,
      messageText: message,
      receiverId
    };
    // Endpoint for property chat messages
    return this.http.post(`${this.apiUrl}/Property/${propertyId}/chat/send`, payload);
  }

  /**
   * Send message via API (Preferred method as per backend spec)
   */
  /**  
   * Send message via DesignRequest API (Used in Project Workspace)
   */
  public sendMessageViaApi(requestId: number, message: string, senderId?: string): Observable<any> {
    // Send both casings to ensure backend model binding works regardless of configuration
    const payload = {
      messageText: message, // Explicitly sending messageText as requested
      message: message,
      senderId: senderId,
      Message: message,
      SenderId: senderId,
      DesignRequestId: requestId,
      designRequestId: requestId
    };
    return this.http.post(`${this.apiUrl}/DesignRequest/${requestId}/chat/send`, payload);
  }

  /**
   * Send message via Property API - DEPRECATED/REMOVED
   * This endpoint was moved to DesignRequestController.
   * Please use sendMessageViaApi with a valid RequestID.
   */
  // public sendPropertyMessageViaApi(propertyId: number, message: string): Observable<any> {
  //   return this.http.post(`${this.apiUrl}/Account/${propertyId}/chat/send`, { message });
  // }

  /**
   * Mark all messages in a conversation as read
   * @param propertyId The ID of the property/room to mark as read
   */
  public markAsRead(propertyId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/DesignRequest/chat/mark-read/${propertyId}`, {}).pipe(
      tap(() => {
        // After marking read, refresh the total count
        this.getTotalUnreadCount().subscribe();
      })
    );
  }

  /**
   * Get total unread messages count for current user
   */
  public getTotalUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/DesignRequest/chat/unread-count`).pipe(
      tap(res => {
        this.unreadCountSubject.next(res.count);
      })
    );
  }

  /**
   * Directly update the unread count subject (used by SignalR)
   */
  public updateUnreadCount(count: number): void {
    this.unreadCountSubject.next(count);
  }

  /**
   * Fast send via SignalR (Optional method)
   */
  public sendMessageViaSignalR(propertyId: number, senderId: string, message: string): void {
    if (this.hubConnection && this.connectionStatusSubject.value) {
      this.hubConnection.invoke('SendToRoom', propertyId, senderId, message)
        .catch(err => console.error('❌ Failed to send message via SignalR:', err));
    }
  }

  /**
   * Older signature for backward compatibility
   */
  public sendMessage(receiverId: string, senderId: string, message: string): void {
    // Note: This older method doesn't have propertyId, 
    // it will try to send but might be restricted by backend if room isn't joined.
    if (this.hubConnection && this.connectionStatusSubject.value) {
      this.hubConnection.invoke('SendMessage', receiverId, senderId, message)
        .catch(err => console.error('❌ Failed to send message:', err));
    }
  }

  /**
   * Stop connection when component destroyed
   */
  public stopConnection(): void {
    if (this.hubConnection) {
      this.hubConnection.stop().then(() => {
        console.log('⏹️ Chat Hub connection stopped');
        this.connectionStatusSubject.next(false);
      });
    }
  }

  /**
   * Reset unread count (called when user enters chat)
   */
  public resetUnreadCount(): void {
    this.unreadCountSubject.next(0);
  }

  /**
   * Clear local messages
   */
  public clearMessages(): void {
    this.messagesSubject.next([]);
  }
}
