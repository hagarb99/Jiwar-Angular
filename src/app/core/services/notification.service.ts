import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
import { MessageService } from 'primeng/api';
import { AuthService } from './auth.service';

export interface NotificationDto {
    notificationID: number;
    title: string;
    message: string;
    notificationType: string;
    isRead: boolean; // Note: Backend DTO might use IsRead (PascalCase) or isRead (camelCase), adjust if necessary
    sentDate: string;
    timeAgo: string;
    link?: string;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService implements OnDestroy {
    private apiUrl = `${environment.apiBaseUrl}/Notification`;
    private hubConnection!: signalR.HubConnection;
    private connectionPromise: Promise<void> | null = null;
    private isDestroyed = false;
    private currentToken: string | null = null;
    private notificationSound: HTMLAudioElement = new Audio();

    // Observable for notifications list
    public notifications$ = new BehaviorSubject<NotificationDto[]>([]);

    // Observable for unread count
    public unreadCount$ = new BehaviorSubject<number>(0);

    constructor(
        private http: HttpClient,
        private messageService: MessageService,
        private authService: AuthService,
        private zone: NgZone
    ) {
        // Initialize Notification Sound
        this.notificationSound.src = 'https://www.soundjay.com/phone/sounds/sms-alert-1.mp3';
        this.notificationSound.volume = 1.0;
        this.notificationSound.load();

        // Unlock Audio Context
        this.unlockAudioContext();

        // Load initial state from storage
        this.loadFromStorage();
    }

    /**
     * Common trick to unlock audio on mobile/modern browsers
     */
    private unlockAudioContext(): void {
        const unlock = () => {
            if (this.notificationSound) {
                this.notificationSound.play().then(() => {
                    this.notificationSound.pause();
                    this.notificationSound.currentTime = 0;
                    document.removeEventListener('click', unlock);
                }).catch(e => {
                    // Ignore autoplay errors
                });
            }
        };
        document.addEventListener('click', unlock);
    }

    /**
     * Local Storage Helpers
     */
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
    public startConnection(token: string): Promise<void> {
        console.log('🚀 Starting SignalR connection...');

        if (this.isDestroyed) {
            return Promise.reject(new Error('Service destroyed'));
        }

        // Return existing connection if already connected with same token
        if (this.hubConnection &&
            this.hubConnection.state === signalR.HubConnectionState.Connected &&
            this.currentToken === token) {
            console.log('🔄 SignalR already connected with same token. Skipping start.');
            return Promise.resolve();
        }

        // Return existing connection promise if connection is in progress
        if (this.connectionPromise) {
            console.log('⏳ SignalR connection already in progress...');
            return this.connectionPromise;
        }

        // Store token
        this.currentToken = token;

        // Clean up existing connection if necessary (e.g. token changed)
        if (this.hubConnection) {
            console.log('🧹 Cleaning up old SignalR connection...');
            this.stopConnection();
        }

        // Update storage key for current user (in case of user switch)
        this.loadFromStorage();

        // Construct Hub URL
        const baseUrl = environment.apiBaseUrl.replace('/api', '');
        const hubUrl = `${baseUrl}/notificationHub`;

        // Build Connection
        this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, {
                accessTokenFactory: () => token,
                skipNegotiation: false,
                transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Information)
            .build();

        // Setup Listeners
        this.setupListeners();

        // Start Connection
        this.connectionPromise = this.hubConnection
            .start()
            .then(() => {
                console.log('✅ SignalR Connected');

                // Load initial notifications from API to sync
                this.loadNotifications().subscribe();
            })
            .catch(err => {
                console.error('❌ SignalR Connection Error:', err);
                this.connectionPromise = null;
                throw err;
            });

        return this.connectionPromise;
    }

    /**
     * Setup SignalR event listeners
     */
    private setupListeners(): void {
        if (!this.hubConnection) return;

        // Life-cycle events
        this.hubConnection.onreconnecting((error) => {
            console.warn('🔄 SignalR Reconnecting:', error);
        });

        this.hubConnection.onreconnected((connectionId) => {
            console.log('🔄 SignalR Reconnected');
            // Avoid calling loadNotifications() on every reconnect to prevent loops
            // The initial load plus real-time updates should be enough if connection was brief
        });

        this.hubConnection.onclose((error) => {
            console.error('❌ SignalR Connection Closed:', error);
            this.connectionPromise = null;
        });

        // Notification Event
        this.hubConnection.on('ReceiveNotification', (arg1: any, arg2?: string) => {
            this.handleNotification(arg1, arg2);
        });

        // Legacy/Alternative Event Support
        this.hubConnection.on('ReceiveNotificationObject', (data: any) => {
            this.handleNotification(data);
        });
    }

    /**
     * Centralized handler for incoming real-time notifications
     */
    private handleNotification(arg1: any, arg2?: string): void {
        // Play Sound
        this.playNotificationSound();

        let title = 'New Notification';
        let message = '';
        let type = 'Info';
        let data: any = {};

        if (typeof arg1 === 'string' && typeof arg2 === 'string') {
            title = arg1;
            message = arg2;
        } else if (typeof arg1 === 'object') {
            data = arg1;
            title = data.title || title;
            message = data.message || '';
            type = data.type || type;
        }

        // 1. Show Toast
        this.zone.run(() => {
            this.messageService.add({
                severity: type.toLowerCase() === 'success' ? 'success' : (type.toLowerCase() === 'error' ? 'error' : 'info'),
                summary: title,
                detail: message,
                life: 5000
            });

            // 2. Optimistic Update or Refresh
            // We'll create a temporary object to prepend immediately
            const newNotif: NotificationDto = {
                notificationID: (data && data.id) || Date.now(),
                title: title,
                message: message,
                notificationType: type,
                isRead: false,
                sentDate: new Date().toISOString(),
                timeAgo: 'Just now',
                link: data.link
            };

            const current = this.notifications$.value;
            const updated = [newNotif, ...current];

            this.notifications$.next(updated);
            this.unreadCount$.next(updated.filter(n => !n.isRead).length);
            this.saveToStorage(updated);

            // Optionally fetch from server to ensure full consistency
            // this.loadNotifications().subscribe(); 
        });
    }

    private playNotificationSound(): void {
        try {
            this.notificationSound.currentTime = 0;
            this.notificationSound.play().catch(() => { });
        } catch (e) {
            console.warn('Could not play notification sound');
        }
    }

    public stopConnection(): Promise<void> {
        if (this.hubConnection) {
            this.hubConnection.off('ReceiveNotification');
            this.hubConnection.off('ReceiveNotificationObject');

            return this.hubConnection.stop().then(() => {
                this.hubConnection = null as any;
                this.connectionPromise = null;
            }).catch(() => {
                this.hubConnection = null as any;
                this.connectionPromise = null;
            });
        }
        return Promise.resolve();
    }

    ngOnDestroy(): void {
        this.isDestroyed = true;
        this.stopConnection();
    }

    // =========================================================================
    // API Methods
    // =========================================================================

    public loadNotifications(): Observable<NotificationDto[]> {
        return this.http.get<NotificationDto[]>(this.apiUrl).pipe(
            tap(notifications => {
                this.zone.run(() => {
                    this.notifications$.next(notifications);
                    this.unreadCount$.next(notifications.filter(n => !n.isRead).length);
                    this.saveToStorage(notifications);
                });
            }),
            catchError(err => {
                console.error('Failed to load notifications', err);
                throw err;
            })
        );
    }

    public markAsRead(notificationId: number): Observable<any> {
        return this.http.put(`${this.apiUrl}/${notificationId}/read`, {}).pipe(
            tap(() => {
                this.zone.run(() => {
                    const current = this.notifications$.value;
                    const updated = current.map(n =>
                        n.notificationID === notificationId ? { ...n, isRead: true } : n
                    );
                    this.notifications$.next(updated);
                    this.unreadCount$.next(updated.filter(n => !n.isRead).length);
                    this.saveToStorage(updated);
                });
            })
        );
    }

    public markAllAsRead(): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/read-all`, {}).pipe(
            tap(() => {
                this.zone.run(() => {
                    const current = this.notifications$.value;
                    const updated = current.map(n => ({ ...n, isRead: true }));
                    this.notifications$.next(updated);
                    this.unreadCount$.next(0);
                    this.saveToStorage(updated);
                });
            })
        );
    }

    public getUnreadCount(): number {
        return this.unreadCount$.value;
    }
}
