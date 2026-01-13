import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, catchError } from 'rxjs/operators';
import { BehaviorSubject, Observable, Subject, throwError } from 'rxjs';
import { Router } from '@angular/router';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
import { MessageService } from 'primeng/api';
import { AuthService } from './auth.service';
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
    private notificationSound: HTMLAudioElement = new Audio();

    // Observable for notifications list
    public notifications$ = new BehaviorSubject<NotificationDto[]>([]);

    // Observable for unread count
    public unreadCount$ = new BehaviorSubject<number>(0);

    // Subject to notify components to refresh their data
    public refresh$ = new Subject<void>();

    constructor(
        private http: HttpClient,
        private messageService: MessageService,
        private authService: AuthService,
        private zone: NgZone,
        private chatService: ChatService,
        private router: Router
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

        // Return existing connection promise if connection is in progress
        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        // If connection already exists, check its state
        if (this.hubConnection) {
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
            this.loadNotifications().subscribe();
        });

        this.hubConnection.onclose((error) => {
            console.error('❌ SignalR Connection Closed:', error);
            this.connectionPromise = null;
        });

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
        console.log('📬 SignalR ReceiveNotification trigger:', { arg1, arg2 });

        let title = 'New Notification';
        let message = '';
        let type = 'Info';
        let data: any = {};

        // Handle multiple argument formats from backend
        if (typeof arg1 === 'string' && typeof arg2 === 'string') {
            // Format: (title, message)
            title = arg1;
            message = arg2;
        } else if (typeof arg1 === 'object') {
            // Format: (dataObject)
            data = arg1;
            title = data.title || title;
            message = data.message || '';
            type = data.type || type;
        }

        const relatedId = data.relatedId || data.RelatedId;

        // Custom Sound check (if payload has playSound=true)
        const isObject = typeof arg1 === 'object' && arg1 !== null;
        if (isObject && arg1.playSound === true) {
            this.playNotificationSound();
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

        // 2. Optimistic Update or Refresh
        this.zone.run(() => {
            // Create a temporary object to prepend immediately
            const newNotif: NotificationDto = {
                notificationID: (data && data.id) || Date.now(),
                title: title,
                message: message,
                notificationType: type,
                isRead: false,
                sentDate: new Date().toISOString(),
                timeAgo: 'Just now',
                link: data?.link
            };

            const current = this.notifications$.value;
            const updated = [newNotif, ...current];

            this.notifications$.next(updated);
            this.unreadCount$.next(updated.filter(n => !n.isRead).length);
            this.saveToStorage(updated);
        });
    }

    private playNotificationSound(): void {
        try {
            // Use local beeper util as primary
            console.log('🔔 NOTIFICATION RECEIVED - Playing beep...');
            playBeep();
        } catch (e) {
            console.warn('Could not play notification sound');
        }
    }

    /**
     * Stop SignalR connection (call on logout)
     */
    public stopConnection(): Promise<void> {
        if (this.hubConnection) {
            this.hubConnection.off('ReceiveNotification');
            this.hubConnection.off('ReceiveNotificationObject');
            this.hubConnection.off('ReceiveChatNotification');

            return this.hubConnection.stop().then(() => {
                this.hubConnection = null as any;
                this.connectionPromise = null;
                console.log('SignalR Disconnected');
            }).catch((err) => {
                console.error('Error stopping connection:', err);
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

    /**
     * Load all notifications from API
     */
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
                return throwError(() => err);
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

    /**
     * Mark all notifications as read
     */
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

    /**
     * Get unread notifications count
     */
    public getUnreadCount(): number {
        return this.unreadCount$.value;
    }
}
