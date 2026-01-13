import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
import { MessageService } from 'primeng/api';
import { playBeep } from '../utils/beep-sound';
import { ChatService } from './chat.service';

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

    // Subject to notify components to refresh their data
    public refresh$ = new Subject<void>();

    constructor(
        private http: HttpClient,
        private messageService: MessageService,
        private zone: NgZone,
        private chatService: ChatService,
        private router: Router
    ) {
        // Audio handled by playBeep() utility function
    }



    /**
     * Initialize SignalR connection with JWT token
     */
    public startConnection(token: string): void {
        const hubUrl = `${environment.assetsBaseUrl}/notificationHub`;

        // If connection already exists, check its state
        if (this.hubConnection) {
            if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
                console.log('✅ SignalR: Already connected');
                return;
            }
            if (this.hubConnection.state === signalR.HubConnectionState.Connecting ||
                this.hubConnection.state === signalR.HubConnectionState.Reconnecting) {
                console.log('⏳ SignalR: Connection in progress...');
                return;
            }
            // If disconnected, we can try to start it again
        } else {
            // Build connection if it doesn't exist
            this.hubConnection = new signalR.HubConnectionBuilder()
                .withUrl(hubUrl, {
                    accessTokenFactory: () => localStorage.getItem('token') || token,
                    skipNegotiation: false,
                    transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
                })
                .withAutomaticReconnect()
                .build();

            // Set up listeners BEFORE starting
            this.setupListeners();
        }

        console.log('🚀 SignalR: Starting connection to', hubUrl);
        this.hubConnection
            .start()
            .then(() => {
                console.log('✅ SignalR Connected to NotificationHub');
                // Load initial notifications to sync
                this.loadNotifications().subscribe();
            })
            .catch(err => {
                console.error('❌ SignalR Connection Error:', err);
                // Attempt to reconnect after delay if not already handled by automatic reconnect
                setTimeout(() => {
                    if (this.hubConnection.state === signalR.HubConnectionState.Disconnected) {
                        this.startConnection(token);
                    }
                }, 5000);
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
        // Remove existing listeners to avoid duplicates if re-setup
        this.hubConnection.off('ReceiveNotification');
        this.hubConnection.off('ReceiveChatNotification');

        this.hubConnection.on('ReceiveChatNotification', (data: any) => {
            console.log('💬 SignalR ReceiveChatNotification trigger:', data);

            this.zone.run(() => {
                // 1. Update the Chat Icon Badge directly from payload
                // Handle both camelCase and PascalCase
                const count = data.unreadCount !== undefined ? data.unreadCount : data.UnreadCount;
                if (count !== undefined) {
                    this.chatService.updateUnreadCount(count);
                }

                // 2. Play sound
                this.playNotificationSound();

                // 3. Show a specialized chat toast (ONLY if not currently in that specific chat room)
                const currentUrl = this.router.url;
                const workspaceUrl = `/dashboard/workspace/${data.relatedId}`;

                if (currentUrl !== workspaceUrl) {
                    this.messageService.add({
                        severity: 'info',
                        summary: data.title || 'New Message',
                        detail: data.message || 'You have a new message',
                        life: 5000,
                        icon: 'pi pi-comments',
                        data: { relatedId: data.relatedId, type: 'Chat' }
                    });
                }

                // 4. Trigger refresh for any subscribers (like the messages list)
                this.refresh$.next();
            });
        });

        this.hubConnection.on('ReceiveNotification', (arg1: any, arg2?: string) => {
            console.log('📬 SignalR ReceiveNotification trigger:', { arg1, arg2 });

            // Play sound based on backend playSound property
            const isObject = typeof arg1 === 'object' && arg1 !== null;
            const playSoundRequested = isObject && arg1.playSound === true;

            // If it's a simple string notification, we still play sound by default
            const shouldPlaySound = playSoundRequested || !isObject;

            if (shouldPlaySound) {
                this.playNotificationSound();
            }

            let title = 'New Notification';
            let message = '';
            let type = 'Info';
            let data = arg1;

            let relatedId = null;

            // Handle multiple argument formats from backend
            if (typeof arg1 === 'string' && typeof arg2 === 'string') {
                // Format: (title, message)
                title = arg1;
                message = arg2;
            } else if (typeof arg1 === 'object') {
                // Format: (dataObject)
                title = arg1.title || title;
                message = arg1.message || '';
                type = arg1.type || 'Info';
                relatedId = arg1.relatedId || arg1.RelatedId;
            }

            // 1. Show toast notification (EXCEPT for Chat type which is handled separately)
            if (type.toLowerCase() !== 'chat') {
                this.zone.run(() => {
                    this.messageService.add({
                        severity: type.toLowerCase() === 'success' ? 'success' : (type.toLowerCase() === 'error' ? 'error' : 'info'),
                        summary: title,
                        detail: message,
                        life: 6000,
                        data: { relatedId, type } // Pass ID and Type for click handling
                    });
                });
            }

            // 2. Refresh count and list from server to ensure data integrity
            this.loadNotifications().subscribe({
                next: (notifs) => {
                    this.zone.run(() => {
                        console.log('✅ Notifications refreshed after real-time update');
                        this.refresh$.next(); // Trigger reload in observers
                    });
                },
                error: (err) => {
                    // Fallback to local update if refresh fails
                    this.zone.run(() => {
                        const newNotif: NotificationDto = {
                            notificationID: (data && data.id) || Math.floor(Math.random() * 100000),
                            title,
                            message,
                            notificationType: type,
                            isRead: false,
                            sentDate: new Date().toISOString(),
                            timeAgo: 'Just now'
                        };
                        this.notifications$.next([newNotif, ...this.notifications$.value]);
                        this.unreadCount$.next(this.unreadCount$.value + 1);
                    });
                }
            });
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
     * Note: Backend automatically marks all as read when fetching
     */
    public loadNotifications(): Observable<NotificationDto[]> {
        return this.http.get<NotificationDto[]>(this.apiUrl).pipe(
            tap(notifications => {
                this.zone.run(() => {
                    this.notifications$.next(notifications);
                    // Backend auto-marks as read, so count should be 0 after fetching
                    const unreadCount = notifications.filter(n => !n.isRead).length;
                    this.unreadCount$.next(unreadCount);
                });
            })
        );
    }

    /**
     * Mark a single notification as read
     */
    public markAsRead(notificationId: number): Observable<any> {
        return this.http.put(`${this.apiUrl}/${notificationId}/read`, {}).pipe(
            tap(() => {
                this.zone.run(() => {
                    const notifications = this.notifications$.value.map(n =>
                        n.notificationID === notificationId ? { ...n, isRead: true } : n
                    );
                    this.notifications$.next(notifications);
                    const unreadCount = notifications.filter(n => !n.isRead).length;
                    this.unreadCount$.next(unreadCount);
                });
            })
        );
    }

    /**
     * Mark all notifications as read
     */
    public markAllAsRead(): Observable<any> {
        return this.http.put(`${this.apiUrl}/read-all`, {}).pipe(
            tap(() => {
                this.zone.run(() => {
                    const notifications = this.notifications$.value.map(n => ({ ...n, isRead: true }));
                    this.notifications$.next(notifications);
                    this.unreadCount$.next(0);
                });
            })
        );
    }

    /**
     * Play notification sound
     */
    private playNotificationSound(): void {
        console.log('🔔 NOTIFICATION RECEIVED - Playing beep...');
        playBeep();
    }

    /**
     * Get unread notifications count
     */
    public getUnreadCount(): number {
        return this.unreadCount$.value;
    }
}
