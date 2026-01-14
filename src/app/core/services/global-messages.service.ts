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
    private unreadCountSubject = new BehaviorSubject<number>(0);
    public unreadCount$ = this.unreadCountSubject.asObservable();

    private latestMessagesSubject = new BehaviorSubject<ChatNotification[]>([]);
    public latestMessages$ = this.latestMessagesSubject.asObservable();

    constructor() {
        this.initializeSignalR();
        this.loadInitialUnreadCount();
    }

    // 1️⃣ Initialize SignalR (Notification Hub)
    private initializeSignalR() {
        const token = this.authService.getToken();
        if (!token) return;

        // Use assetsBaseUrl based on existing patterns, or apiBaseUrl if specified. 
        // User said `${environment.apiUrl}/notificationHub`. 
        // Existing environment has `apiBaseUrl` and `assetsBaseUrl`.
        // I will use `assetsBaseUrl` if it's cleaner, but user code said `environment.apiUrl`.
        // In environment.ts: apiBaseUrl: 'https://localhost:5000/api', assetsBaseUrl: 'https://localhost:5000'
        // So `apiBaseUrl` includes `/api`. Hubs are usually at root or specific path.
        // User request: `${environment.apiUrl}/notificationHub` -> `.../api/notificationHub` ?? Unlikely for SignalR.
        // ChatService uses `${environment.assetsBaseUrl}/chathub`.
        // I will use `${environment.assetsBaseUrl}/notificationHub` to be safe/consistent with SignalR patterns at root.

        this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl(`${environment.assetsBaseUrl}/notificationHub`, {
                accessTokenFactory: () => token
            })
            .withAutomaticReconnect()
            .build();

        this.hubConnection.start()
            .then(() => console.log('🔔 Notification Hub Connected'))
            .catch(err => console.error('Notification Hub Error:', err));

        // 👂 Listen for Real-time Notifications
        this.hubConnection.on('ReceiveChatNotification', (data: ChatNotification) => {
            console.log('📨 New Notification Received:', data);

            // A. Update Badge Count
            if (data.unreadCount !== undefined) {
                this.unreadCountSubject.next(data.unreadCount);
            } else {
                this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
            }

            // B. Add to Dropdown List
            const currentMsgs = this.latestMessagesSubject.value;
            // Ensure sentDate is a Date object if needed, though JSON returns string usually
            this.latestMessagesSubject.next([data, ...currentMsgs].slice(0, 5)); // Keep last 5
        });
    }

    // 2️⃣ Load Initial State from API
    public loadInitialUnreadCount() {
        this.http.get<{ count: number }>(`${environment.apiBaseUrl}/DesignRequest/chat/unread-count`)
            .subscribe({
                next: (res) => this.unreadCountSubject.next(res.count),
                error: (err) => console.error('Failed to load unread count', err)
            });
    }

    // 3️⃣ Actions
    public markAsRead(relatedId: string) {
        // Optimistic Update: Re-fetch count or rely on backend to push new count.
        this.loadInitialUnreadCount();
    }
}
