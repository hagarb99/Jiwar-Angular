import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
import { MessageService } from 'primeng/api';
import { AuthService } from './auth.service';

export interface NotificationDto {
    notificationID: number;
    title: string;
    message: string;
    notificationType: string;
    isRead: boolean;
    sentDate: string;
    timeAgo: string;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private apiUrl = `${environment.apiBaseUrl}/Notification`;
    private hubConnection!: signalR.HubConnection;

    // Observable for notifications list
    public notifications$ = new BehaviorSubject<NotificationDto[]>([]);

    // Observable for unread count
    public unreadCount$ = new BehaviorSubject<number>(0);

    constructor(
        private http: HttpClient,
        private messageService: MessageService,
        private authService: AuthService
    ) {
        // Load from local storage immediately on startup
        this.loadFromStorage();
    }

    private getStorageKey(): string {
        const userEmail = this.authService.getUserEmail() || 'guest';
        return `jiwar_notifications_${userEmail}`;
    }

    private saveToStorage(notifications: NotificationDto[]): void {
        try {
            localStorage.setItem(this.getStorageKey(), JSON.stringify(notifications));
        } catch (e) {
            console.warn('Could not save notifications to local storage', e);
        }
    }

    private loadFromStorage(): void {
        try {
            const saved = localStorage.getItem(this.getStorageKey());
            if (saved) {
                const notifications = JSON.parse(saved);
                this.notifications$.next(notifications);
                const unreadCount = notifications.filter((n: NotificationDto) => !n.isRead).length;
                this.unreadCount$.next(unreadCount);
            }
        } catch (e) {
            console.warn('Could not load notifications from local storage', e);
        }
    }

    /**
     * Initialize SignalR connection with JWT token
     */
    public startConnection(token: string): void {
        this.loadFromStorage(); // Refresh for current user
        if (this.hubConnection) {
            return; // Already connected
        }

        const baseUrl = environment.apiBaseUrl.replace('/api', '');
        const hubUrl = `${baseUrl}/notificationHub`;

        this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, {
                accessTokenFactory: () => token,
                skipNegotiation: false,
                transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
            })
            .withAutomaticReconnect()
            .build();

        this.hubConnection
            .start()
            .then(() => {
                console.log('✅ SignalR Connected to NotificationHub');
                this.setupListeners();
                // Load initial notifications
                this.loadNotifications().subscribe();
            })
            .catch(err => {
                console.error('❌ SignalR Connection Error:', err);
            });

        // Handle reconnection
        this.hubConnection.onreconnected(() => {
            console.log('🔄 SignalR Reconnected');
            this.loadNotifications().subscribe();
        });
    }

    /**
     * Setup SignalR event listeners
     */
    private setupListeners(): void {
        this.hubConnection.on('ReceiveNotification', (title: string, message: string) => {
            console.log('📬 New Notification:', title, message);

            // Show toast notification
            this.messageService.add({
                severity: 'info',
                summary: title,
                detail: message,
                life: 5000
            });

            // Refresh the notification list
            this.loadNotifications().subscribe();
        });
    }

    /**
     * Stop SignalR connection (call on logout)
     */
    public stopConnection(): void {
        if (this.hubConnection) {
            this.hubConnection.stop()
                .then(() => console.log('SignalR Disconnected'))
                .catch(err => console.error('Error stopping connection:', err));
        }
    }

    /**
     * Load all notifications from API
     */
    public loadNotifications(): Observable<NotificationDto[]> {
        return this.http.get<NotificationDto[]>(this.apiUrl).pipe(
            tap(notifications => {
                this.notifications$.next(notifications);
                const unreadCount = notifications.filter(n => !n.isRead).length;
                this.unreadCount$.next(unreadCount);
                this.saveToStorage(notifications);
            })
        );
    }

    /**
     * Mark a single notification as read
     */
    public markAsRead(notificationId: number): Observable<any> {
        return this.http.put(`${this.apiUrl}/${notificationId}/read`, {}).pipe(
            tap(() => {
                // Update local state
                const notifications = this.notifications$.value.map(n =>
                    n.notificationID === notificationId ? { ...n, isRead: true } : n
                );
                this.notifications$.next(notifications);
                const unreadCount = notifications.filter(n => !n.isRead).length;
                this.unreadCount$.next(unreadCount);
                this.saveToStorage(notifications);
            })
        );
    }

    /**
     * Mark all notifications as read
     */
    public markAllAsRead(): Observable<any> {
        return this.http.put(`${this.apiUrl}/read-all`, {}).pipe(
            tap(() => {
                // Update local state
                const notifications = this.notifications$.value.map(n => ({ ...n, isRead: true }));
                this.notifications$.next(notifications);
                this.unreadCount$.next(0);
                this.saveToStorage(notifications);
            })
        );
    }

    /**
     * Get unread notifications count
     */
    public getUnreadCount(): number {
        return this.unreadCount$.value;
    }
}
