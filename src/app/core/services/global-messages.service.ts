import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface ChatNotification {
    title: string;
    message: string;
    sentDate: Date;
    relatedId: string; // RequestID or PropertyID
    type: string;
    unreadCount?: number;
}

@Injectable({
    providedIn: 'root'
})
export class GlobalMessagesService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private hubConnection: signalR.HubConnection | null = null;

    // 🟢 State Management
    // 1️⃣ Single Source of Truth for Unread Count
    private unreadMessagesCountSubject = new BehaviorSubject<number>(0);
    public unreadMessagesCount$ = this.unreadMessagesCountSubject.asObservable(); // Renamed to match requirements

    // 2️⃣ Single Source of Truth for Inbox Messages
    private inboxMessagesSubject = new BehaviorSubject<ChatNotification[]>([]);
    public inboxMessages$ = this.inboxMessagesSubject.asObservable(); // Renamed to match requirements

    // Alias for backward compatibility if any components still use old names (optional, can remove if refactoring all)
    public unreadCount$ = this.unreadMessagesCount$;
    public latestMessages$ = this.inboxMessages$;

    constructor() {
        this.initializeSignalR();
        this.loadInitialUnreadCount();
        // this.loadInitialInbox(); // TODO: Implement if API exists
    }

    // 1️⃣ Initialize SignalR (Notification Hub)
    private initializeSignalR() {
        const token = this.authService.getToken();
        if (!token) return;

        // ✅ FIX: Derive URL from apiBaseUrl to ensure protocol consistency (HTTPS)
        // Matches NotificationService logic
        const baseUrl = environment.apiBaseUrl.replace('/api', '');
        const hubUrl = `${baseUrl}/notificationHub`;

        this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, {
                accessTokenFactory: () => token
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Information)
            .build();

        this.hubConnection.start()
            .then(() => console.log('✅ [GlobalMessages] SignalR Connected'))
            .catch(err => console.error('❌ [GlobalMessages] Connection Error:', err));

        // 👂 Listen for Real-time Notifications
        this.hubConnection.on('ReceiveChatNotification', (data: any) => {
            console.log('📨 [GlobalMessages] Chat Notification:', data);

            // 1. Handle Case Sensitivity (PascalCase vs camelCase)
            const count = data.unreadCount !== undefined ? data.unreadCount : data.UnreadCount;
            const relatedId = data.relatedId || data.RelatedId;
            const title = data.title || data.Title;
            const message = data.message || data.Message;
            const sentDate = data.sentDate || data.SentDate || new Date();

            // 2. Update Badge Count
            if (count !== undefined && count !== null) {
                this.unreadMessagesCountSubject.next(count);
            } else {
                // Fallback: Increment locally
                this.unreadMessagesCountSubject.next(this.unreadMessagesCountSubject.value + 1);
            }

            // 3. Add to Inbox List
            const newMsg: ChatNotification = {
                title: title,
                message: message,
                sentDate: sentDate,
                relatedId: relatedId,
                type: 'Chat',
                unreadCount: count
            };

            const currentMsgs = this.inboxMessagesSubject.value;
            this.inboxMessagesSubject.next([newMsg, ...currentMsgs].slice(0, 10)); // Keep last 10
        });

        // 👂 Listen for Unread Count Update (Specific Event)
        this.hubConnection.on('ReceiveUnreadCountUpdated', (data: any) => {
            console.log('🔢 [GlobalMessages] Unread Count Updated:', data);
            const count = (typeof data === 'number') ? data : (data.totalUnreadCount || data.count);
            if (count !== undefined) {
                this.unreadMessagesCountSubject.next(count);
            }
        });
    }

    // 2️⃣ Load Initial State from API
    public loadInitialUnreadCount() {
        this.http.get<{ count: number }>(`${environment.apiBaseUrl}/DesignRequest/chat/unread-count`)
            .subscribe({
                next: (res) => this.unreadMessagesCountSubject.next(res.count),
                error: (err) => console.error('Failed to load unread count', err)
            });
    }

    // 3️⃣ Actions
    public markAsRead(relatedId: string) {
        // Optimistic Update
        // Logic depends on API side marking read. 
        // We re-fetch count to be sure.
        this.loadInitialUnreadCount();

        // Also simpler: decrement local count if we knew it was 1
        // But re-fetch is safer
    }
}
