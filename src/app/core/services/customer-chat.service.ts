import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { BehaviorSubject, Observable, Subject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface CustomerChatMessage {
    senderId: string;
    senderName?: string;
    senderPhoto?: string;
    message: string;
    sentDate: string;
    propertyId: number;
    customerId?: string; // Helpful for context
    isSelf?: boolean;
}

export interface OwnerInboxItem {
    propertyId: number;
    customerId: string;
    customerName: string;
    propertyName: string;
    lastMessage: string;
    lastMessageDate: string;
    unreadCount: number;
}

@Injectable({
    providedIn: 'root'
})
export class CustomerChatService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);

    private hubConnection: HubConnection | null = null;
    private readonly hubUrl = `${environment.assetsBaseUrl}/chathub`; // Assuming same hub, different event
    private readonly apiUrl = `${environment.apiBaseUrl}/Property`;

    // Message Stream (for active chat)
    private messageReceivedSubject = new Subject<CustomerChatMessage>();
    public messageReceived$ = this.messageReceivedSubject.asObservable();

    // Inbox State (for owner list)
    private inboxSubject = new BehaviorSubject<OwnerInboxItem[]>([]);
    public inbox$ = this.inboxSubject.asObservable();

    constructor() { }

    /**
     * 1️⃣ Start Isolated SignalR Connection
     * Listens ONLY to 'ReceiveCustomerMessage'
     */
    public startConnection(): void {
        const token = this.authService.getToken();
        if (!token || this.hubConnection) return;

        this.hubConnection = new HubConnectionBuilder()
            .withUrl(this.hubUrl, {
                accessTokenFactory: () => token
            })
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Information)
            .build();

        console.log('[SignalR] Starting connection...'); // REQUESTED LOG
        this.hubConnection.start()
            .then(() => console.log('🟢 [CustomerChatService] SignalR Connected'))
            .catch(err => console.error('🔴 [CustomerChatService] Connection Error:', err));

        // Listen ONLY to the Customer-specific event
        this.hubConnection.on('ReceiveCustomerMessage', (data: any) => {
            console.log('[SignalR] ReceiveCustomerMessage', data); // REQUESTED LOG
            console.log('📩 [CustomerChat] New Message:', data);

            const msg: CustomerChatMessage = {
                senderId: data.senderId,
                senderName: data.senderName,
                senderPhoto: data.senderPhoto,
                message: data.message || data.messageText,
                sentDate: data.sentDate,
                propertyId: data.propertyId,
                customerId: data.senderId // If sender is customer
            };

            // Notify Active Chat Component
            this.messageReceivedSubject.next(msg);

            // Refresh Inbox if we are the owner
            // Optimistic or Fetch? Let's fetch to be safe on unread counts.
            this.refreshInbox();
        });
    }

    public stopConnection(): void {
        if (this.hubConnection) {
            this.hubConnection.stop();
            this.hubConnection = null;
        }
    }

    /**
     * 2️⃣ API: Get Owner Inbox
     */
    public getOwnerInbox(): Observable<OwnerInboxItem[]> {
        return this.http.get<OwnerInboxItem[]>(`${this.apiUrl}/GetOwnerChatInbox`).pipe(
            tap(data => this.inboxSubject.next(data))
        );
    }

    private refreshInbox() {
        this.getOwnerInbox().subscribe();
    }

    /**
     * 3️⃣ API: Get Chat History (Specific to Customer-Owner pair)
     */
    public getChatHistory(propertyId: number, customerId: string): Observable<CustomerChatMessage[]> {
        return this.http.get<CustomerChatMessage[]>(`${this.apiUrl}/${propertyId}/chat/history/${customerId}`);
    }

    /**
     * 4️⃣ API: Send Message
     * Used by both Customer and Owner
     */
    public sendMessage(propertyId: number, message: string, receiverId?: string): Observable<any> {
        const payload: any = { messageText: message };
        if (receiverId) {
            payload.receiverId = receiverId;
        }
        return this.http.post(`${this.apiUrl}/${propertyId}/chat/send`, payload);
    }
}
