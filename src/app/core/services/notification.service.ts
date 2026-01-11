import { Injectable, NgZone } from '@angular/core';
import { OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
import { MessageService } from 'primeng/api';

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

    constructor(
        private http: HttpClient,
        private messageService: MessageService,
        private zone: NgZone
    ) {
        // Classic Nokia SMS notification tone - simple and familiar
        this.notificationSound.src = 'https://www.soundjay.com/phone/sounds/sms-alert-1.mp3';
        this.notificationSound.volume = 1.0;
        this.notificationSound.load();

        // Browser Autoplay Policy: Audio must be "unlocked" by a user gesture
        this.unlockAudioContext();
    }

    /**
     * Common trick to unlock audio on mobile/modern browsers
     */
    private unlockAudioContext(): void {
        const unlock = () => {
            this.notificationSound.play().then(() => {
                this.notificationSound.pause();
                this.notificationSound.currentTime = 0;
                document.removeEventListener('click', unlock);
                console.log('🔊 Audio context unlocked by user interaction');
            }).catch(e => {
                // If it fails, we wait for next click
            });
        };
        document.addEventListener('click', unlock);
    }

    /**
     * Initialize SignalR connection with JWT token
     */
    public startConnection(token: string): Promise<void> {
        console.log('🚀 Starting SignalR connection...');
        console.log('🔑 Token exists:', !!token);
        console.log('👤 User Email:', this.authService.getUserEmail());
        console.log('🆔 User ID:', this.authService.getUserId());

        if (this.isDestroyed) {
            console.warn('⚠️ Service destroyed, cannot start connection');
            return Promise.reject(new Error('Service destroyed'));
        }

        // Return existing connection promise if connection is in progress
        if (this.connectionPromise) {
            console.log('⚠️ Connection already in progress, returning existing promise');
            return this.connectionPromise;
        }

        // Clean up existing connection
        if (this.hubConnection) {
            console.log('🔄 Cleaning up existing connection...');
            this.stopConnection();
        }

        this.loadFromStorage(); // Refresh for current user

        const baseUrl = environment.apiBaseUrl.replace('/api', '');
        const hubUrl = `${baseUrl}/notificationHub`;

        console.log('🔗 Hub URL:', hubUrl);

        // Setup listeners before connecting
        this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, {
                accessTokenFactory: () => {
                    console.log('🔑 Providing access token for SignalR');
                    return token;
                },
                skipNegotiation: false,
                transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Information)
            .build();
    public startConnection(token: string): void {
        const hubUrl = `${environment.assetsBaseUrl}/notificationhub`;

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

            // Setup listeners before connecting
            this.setupListeners();

            this.connectionPromise = this.hubConnection
                .start()
                .then(() => {
                    console.log('✅ SignalR Connected to NotificationHub at', new Date().toISOString());
                    console.log('🆔 Connection ID:', this.hubConnection.connectionId);

                    // Verify user identity
                    const userId = this.authService.getUserId();
                    console.log('👤 Connected User ID:', userId);

                    // Load initial notifications
                    this.loadNotifications().subscribe();
                })
                .catch(err => {
                    console.error('❌ SignalR Connection Error:', err);
                    console.error('🔍 Error details:', err.toString());
                    this.connectionPromise = null;
                    throw err;
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

            return this.connectionPromise;
        }

    /**
     * Setup SignalR event listeners
     */
    private setupListeners(): void {
        // Remove existing listeners to avoid duplicates if re-setup
        this.hubConnection.off('ReceiveNotification');

        this.hubConnection.on('ReceiveNotification', (arg1: any, arg2?: string) => {
            // CRITICAL: Play sound FIRST with zero delay
            this.playNotificationSound();

            console.log('📬 SignalR ReceiveNotification trigger:', { arg1, arg2 });

            let title = 'New Notification';
            let message = '';
            let type = 'Info';
            let data = arg1;

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
            }

            // 1. Show toast notification
            this.zone.run(() => {
                this.messageService.add({
                    severity: type.toLowerCase() === 'success' ? 'success' : (type.toLowerCase() === 'error' ? 'error' : 'info'),
                    summary: title,
                    detail: message,
                    life: 6000
                });
            });
   private setupListeners(): void {
            if(!this.hubConnection) {
            console.error('❌ Cannot setup listeners - no hub connection');
            return;
        }

        console.log('🔧 Setting up SignalR listeners...');

        // Clear any existing listeners to prevent duplicates
        this.hubConnection.off('ReceiveNotificationObject');
        this.hubConnection.off('close');
        this.hubConnection.off('reconnecting');
        this.hubConnection.off('reconnected');

        this.hubConnection.on('ReceiveNotificationObject', (data: any) => {
            console.log('📨 Received notification via SignalR:', data);
            console.log('📅 Timestamp:', new Date().toISOString());
            console.log('👤 Current User:', this.authService.getUserEmail());
            console.log('🆔 Current User ID:', this.authService.getUserId());
            console.log('🔗 Notification Link:', data.link);

            // Validate notification data
            if (!data || typeof data !== 'object') {
                console.error('❌ Invalid notification data received:', data);
                return;
            }

            // Show toast notification
            this.messageService.add({
                severity: 'info',
                summary: data.title || 'New Notification',
                detail: data.message || 'You have a new notification',
                life: 5000
            });

            // 2. Refresh count and list from server to ensure data integrity
            this.loadNotifications().subscribe({
                next: (notifs) => {
                    this.zone.run(() => {
                        console.log('✅ Notifications refreshed after real-time update');
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
    // Refresh notifications from server
    // this.loadNotifications().subscribe({
    //     error: (err) => console.error('❌ Failed to refresh notifications:', err)
    // });
    const currentNotifications = this.notifications$.value;

    const newNotification: NotificationDto = {
        notificationID: Date.now(), // مؤقت لو الـ backend بيرجع ID استخدميه
        title: data.title,
        message: data.message,
        notificationType: data.type || 'booking',
        isRead: false,
        sentDate: new Date().toISOString(),
        timeAgo: 'just now'
    };

// Prepend الجديد للأعلى
this.notifications$.next([newNotification, ...currentNotifications]);

// Update unread count
const unreadCount = [newNotification, ...currentNotifications].filter(n => !n.isRead).length;
this.unreadCount$.next(unreadCount);

// Save to localStorage
this.saveToStorage([newNotification, ...currentNotifications]);

    });

this.hubConnection.onreconnecting((error) => {
    console.warn('🔄 SignalR Reconnecting:', error);
});

this.hubConnection.onreconnected((connectionId) => {
    console.log('🔄 SignalR Reconnected with ID:', connectionId);
    console.log('👤 Reconnected User ID:', this.authService.getUserId());
    this.loadNotifications().subscribe();
});

this.hubConnection.onclose((error) => {
    console.error('❌ SignalR Connection Closed:', error);
    console.log('🔍 Connection close reason:', error?.message || 'Unknown');
    this.connectionPromise = null;
});

console.log('✅ SignalR listeners setup complete');
}


    /**
     * Stop SignalR connection (call on logout)
     */
    public stopConnection(): Promise < void> {
    console.log('🛑 Stopping SignalR connection...');

    if(this.hubConnection) {
    // Clear all listeners first
    this.hubConnection.off('ReceiveNotificationObject');
    this.hubConnection.off('close');
    this.hubConnection.off('reconnecting');
    this.hubConnection.off('reconnected');

    return this.hubConnection.stop()
        .then(() => {
            console.log('✅ SignalR Disconnected successfully');
            this.hubConnection = null as any;
            this.connectionPromise = null;
        })
        .catch(err => {
            console.error('❌ Error stopping connection:', err);
            this.hubConnection = null as any;
            this.connectionPromise = null;
        });
}

return Promise.resolve();
}

ngOnDestroy(): void {
    console.log('💀 NotificationService destroyed');
    this.isDestroyed = true;
    this.stopConnection();
}

    /**
     * Load all notifications from API
     */
    public loadNotifications(): Observable < NotificationDto[] > {
    console.log('📋 Loading notifications from API...');
    return this.http.get<NotificationDto[]>(this.apiUrl).pipe(
        tap(notifications => {
            console.log('📋 Loaded notifications:', notifications);
            console.log('📊 Notifications count:', notifications.length);
            console.log('🔢 Unread count:', notifications.filter(n => !n.isRead).length);

            this.notifications$.next(notifications);
            const unreadCount = notifications.filter(n => !n.isRead).length;
            this.unreadCount$.next(unreadCount);
            this.saveToStorage(notifications);
        }),
        tap({
            error: (error) => {
                console.error('❌ Failed to load notifications:', error);
                console.error('🔍 Error status:', error.status);
                console.error('📝 Error message:', error.message);
            }
                this.zone.run(() => {
                this.notifications$.next(notifications);
                const unreadCount = notifications.filter(n => !n.isRead).length;
                this.unreadCount$.next(unreadCount);
            });
        })
    );
}

    /**
     * Mark a single notification as read
     */
    public markAsRead(notificationId: number): Observable < any > {
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
    public markAllAsRead(): Observable < any > {
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
     * Play notification sound with zero delay
     */
    private playNotificationSound(): void {
    try {
        this.notificationSound.volume = 1.0; // Boost to maximum
        this.notificationSound.currentTime = 0;
        this.notificationSound.play().catch(err => {
            console.warn('🔇 Audio play prevented (User interaction required):', err);
        });
    } catch(e) {
        console.error('🔊 Error playing sound:', e);
    }
}

    /**
     * Get unread notifications count
     */
    public getUnreadCount(): number {
    return this.unreadCount$.value;
}
}
