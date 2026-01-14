import { Injectable, inject, signal, computed, DestroyRef, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel, HttpTransportType } from '@microsoft/signalr';
import { Observable, tap, catchError, of, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { MessageService } from 'primeng/api';
import {
    MessageDto,
    ChatThreadDto,
    SendMessageDto,
    ConnectionStatus,
    getChatGroupName
} from '../models/chat.models';

/**
 * Modern SignalR-based chat service for Customer-Property Owner communication.
 * Uses Angular Signals for reactive state management.
 * 
 * Hub Route: /customerPropertyChatHub
 * Group Logic: PropertyChat_{propertyId}_{customerId}
 * 
 * IMPORTANT: customerId should ALWAYS be the customer who made the booking,
 * regardless of whether Owner or Customer is viewing the chat.
 */
@Injectable({
    providedIn: 'root'
})
export class CustomerPropertyChatService {
    private readonly http = inject(HttpClient);
    private readonly authService = inject(AuthService);
    private readonly destroyRef = inject(DestroyRef);
    private readonly messageService = inject(MessageService);
    private readonly notificationService = inject(NotificationService);

    // SignalR Hub
    private hubConnection: HubConnection | null = null;
    private readonly hubUrl = 'https://localhost:5001/customerPropertyChatHub';
    private readonly apiUrl = `${environment.apiBaseUrl}/CustomerPropertyChat`;

    // ═══════════════════════════════════════════════════════════════════════════
    // SIGNALS - Reactive State Management
    // ═══════════════════════════════════════════════════════════════════════════

    /** Current connection status */
    private readonly _connectionStatus = signal<ConnectionStatus>('disconnected');
    public readonly connectionStatus = this._connectionStatus.asReadonly();

    /** Whether currently connected */
    public readonly isConnected = computed(() => this._connectionStatus() === 'connected');

    /** All messages for the current chat room */
    private readonly _messages = signal<MessageDto[]>([]);
    public readonly messages = this._messages.asReadonly();

    /** Chat threads (inbox) */
    private readonly _chatThreads = signal<ChatThreadDto[]>([]);
    public readonly chatThreads = this._chatThreads.asReadonly();

    /** Total unread count across all threads */
    public readonly totalUnreadCount = computed(() =>
        this._chatThreads().reduce((sum, thread) => sum + thread.unreadCount, 0)
    );

    /** Currently active chat room identifiers */
    private currentPropertyId: number | null = null;
    private currentCustomerId: string | null = null;

    /** Subject for new message events (for external subscribers) */
    private readonly _newMessage$ = new Subject<MessageDto>();
    public readonly newMessage$ = this._newMessage$.asObservable();

    /** Track if user is currently viewing a specific chat room */
    private isInChatRoom = false;

    // ═══════════════════════════════════════════════════════════════════════════
    // SIGNALR CONNECTION MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Initialize and start the SignalR connection.
     * Uses JWT token for authentication via accessTokenFactory.
     * 
     * IMPORTANT: Uses skipNegotiation + WebSockets to avoid .NET 9 negotiate issues
     */
    // Inject NgZone for SignalR callbacks
    private readonly ngZone = inject(NgZone);

    /**
     * Initialize and start the SignalR connection.
     * Uses JWT token for authentication via accessTokenFactory.
     * 
     * IMPORTANT: Uses skipNegotiation + WebSockets to avoid .NET 9 negotiate issues
     */
    public startConnection(): void {
        const token = this.authService.getToken();
        if (!token) {
            console.warn('🔴 [CustomerPropertyChat] No token available, cannot connect');
            return;
        }

        if (this.hubConnection?.state === HubConnectionState.Connected) {
            console.log('🟢 [CustomerPropertyChat] Already connected');
            return;
        }

        // Disconnect any existing connection first
        if (this.hubConnection) {
            this.hubConnection.stop().catch(() => { });
        }

        this._connectionStatus.set('connecting');

        // Build connection with skipNegotiation + WebSockets for .NET 9 compatibility
        this.hubConnection = new HubConnectionBuilder()
            .withUrl(this.hubUrl, {
                // IMPORTANT: Use a dynamic factory to always get the latest token
                accessTokenFactory: () => this.authService.getToken() || '',
                skipNegotiation: true,
                transport: HttpTransportType.WebSockets
            })
            .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
            .configureLogging(LogLevel.Information)
            .build();

        // Register event handlers BEFORE starting the connection
        this.registerHubEventHandlers();

        // Start the connection
        this.hubConnection.start()
            .then(() => {
                console.log('🟢 [CustomerPropertyChat] SignalR Connected via WebSockets');
                this._connectionStatus.set('connected');

                // Rejoin room if we were in one before reconnecting
                if (this.currentPropertyId && this.currentCustomerId) {
                    this.joinChat(this.currentPropertyId, this.currentCustomerId);
                }
            })
            .catch(err => {
                console.error('🔴 [CustomerPropertyChat] Connection error:', err);
                this._connectionStatus.set('disconnected');
            });

        // Handle reconnection events
        this.hubConnection.onreconnecting(() => {
            console.log('🟡 [CustomerPropertyChat] Reconnecting...');
            this._connectionStatus.set('reconnecting');
        });

        this.hubConnection.onreconnected(() => {
            console.log('🟢 [CustomerPropertyChat] Reconnected');
            this._connectionStatus.set('connected');
            // Rejoin the current room if we were in one
            if (this.currentPropertyId && this.currentCustomerId) {
                this.joinChat(this.currentPropertyId, this.currentCustomerId);
            }
        });

        this.hubConnection.onclose(() => {
            console.log('🔴 [CustomerPropertyChat] Connection closed');
            this._connectionStatus.set('disconnected');
        });
    }

    /**
     * Register SignalR event handlers for receiving messages
     */
    private registerHubEventHandlers(): void {
        if (!this.hubConnection) return;

        // Listen for incoming messages
        this.hubConnection.on('ReceiveMessage', (message: MessageDto) => {
            // Run inside Angular Zone to ensure Change Detection picks it up
            this.ngZone.run(() => {
                console.log('📩 [CustomerPropertyChat] Message received (SignalR):', message);

                // CRITICAL: Recalculate isMine to ensure correctness regardless of what Backend sent
                // This handles the case where Backend broadcasts the same DTO to everyone
                const currentUserId = this.authService.getUserId();
                message.isMine = message.senderId === currentUserId;

                // Add message to current messages array (Immutable update)
                this._messages.update(messages => {
                    // Avoid duplicates if simulated local echo exists
                    if (messages.some(m => m.id === message.id)) return messages;
                    return [...messages, message];
                });

                // Emit to external subscribers
                this._newMessage$.next(message);

                // If message is NOT mine (received from others)
                if (!message.isMine) {
                    // 1. Play Sound
                    try {
                        this.notificationService.playCustomSound();
                    } catch (e) {
                        console.warn('Sound play failed', e);
                    }

                    // 2. Add Notification to Navbar List
                    const currentRole = this.authService.userRole;
                    let link = '';
                    const customerId = currentRole === 'PropertyOwner'
                        ? message.senderId
                        : this.authService.getUserId();

                    // Ensure we have a valid propertyId before generating deep link
                    // Check if propertyId exists and is valid number
                    if (message.propertyId && !isNaN(Number(message.propertyId))) {
                        if (currentRole === 'PropertyOwner') {
                            link = `/dashboard/propertyowner/messages/property/${message.propertyId}/customer/${customerId}`;
                        } else if (currentRole === 'Customer') {
                            link = `/dashboard/customer/chat-room/${message.propertyId}/${customerId}`;
                        }
                    } else {
                        // Fallback to generic inbox
                        link = currentRole === 'PropertyOwner'
                            ? '/dashboard/propertyowner/messages'
                            : '/dashboard/messages';
                    }

                    this.notificationService.addLocalNotification({
                        notificationID: Date.now(),
                        title: `${message.senderName || 'New Message'}`,
                        message: message.messageText,
                        notificationType: 'PropertyChat',
                        isRead: false,
                        sentDate: new Date().toISOString(),
                        timeAgo: 'Just now',
                        link: link
                    });
                }

                // If user is NOT in the specific chat room, show a toast notification
                if (!this.isInChatRoom && !message.isMine) {
                    this.showNewMessageNotification(message);
                }

                // Refresh thread list to update last message and unread counts
                this.refreshChatThreads();
            });
        });

        // Listen for message read confirmations (optional)
        this.hubConnection.on('MessagesRead', (data: { propertyId: number; customerId: string }) => {
            this.ngZone.run(() => {
                console.log('✅ [CustomerPropertyChat] Messages marked as read:', data);
                this._messages.update(messages =>
                    messages.map(m => ({ ...m, isRead: true }))
                );
            });
        });

        // Listen for typing indicators
        this.hubConnection.on('UserTyping', (data: { senderId: string; senderName: string }) => {
            console.log('⌨️ [CustomerPropertyChat] User typing:', data);
        });
    }

    /**
     * Show toast notification for new message when user is not in chat room
     */
    private showNewMessageNotification(message: MessageDto): void {
        this.messageService.add({
            severity: 'info',
            summary: `New message from ${message.senderName || 'Someone'}`,
            detail: message.messageText.length > 50
                ? message.messageText.substring(0, 50) + '...'
                : message.messageText,
            life: 5000
        });
    }

    /**
     * Refresh chat threads based on user role
     */
    private refreshChatThreads(): void {
        const role = this.authService.userRole;
        if (role === 'PropertyOwner') {
            this.loadOwnerChats();
        } else {
            this.loadMyChats();
        }
    }

    /**
     * Stop the SignalR connection
     */
    public stopConnection(): void {
        if (this.hubConnection) {
            this.hubConnection.stop()
                .then(() => {
                    console.log('⏹️ [CustomerPropertyChat] Connection stopped');
                    this._connectionStatus.set('disconnected');
                })
                .catch(err => console.error('Error stopping connection:', err));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CHAT ROOM MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Join a specific chat room.
     * Group name format: PropertyChat_{propertyId}_{customerId}
     * 
     * IMPORTANT: customerId should ALWAYS be the customer who made the booking,
     * even if the Owner is the one viewing the chat.
     */
    public joinChat(propertyId: number, customerId: string): void {
        // Store for later even if not connected yet
        this.currentPropertyId = propertyId;
        this.currentCustomerId = customerId;
        this.isInChatRoom = true;

        if (!this.hubConnection || this._connectionStatus() !== 'connected') {
            console.warn('🟡 [CustomerPropertyChat] Not connected yet, will join when connected');
            return;
        }

        const groupName = getChatGroupName(propertyId, customerId);
        console.log(`📡 [CustomerPropertyChat] Joining group: ${groupName}`);

        this.hubConnection.invoke('JoinChat', propertyId, customerId)
            .then(() => {
                console.log(`👥 [CustomerPropertyChat] Joined room: ${groupName}`);
            })
            .catch(err => console.error('❌ [CustomerPropertyChat] Failed to join room:', err));
    }

    /**
     * Leave the current chat room.
     * IMPORTANT: Call this in OnDestroy to prevent memory leaks!
     */
    public leaveChat(propertyId: number, customerId: string): void {
        this.isInChatRoom = false;

        if (!this.hubConnection || this._connectionStatus() !== 'connected') {
            this.currentPropertyId = null;
            this.currentCustomerId = null;
            return;
        }

        const groupName = getChatGroupName(propertyId, customerId);
        console.log(`📡 [CustomerPropertyChat] Leaving group: ${groupName}`);

        this.hubConnection.invoke('LeaveChat', propertyId, customerId)
            .then(() => {
                console.log(`👋 [CustomerPropertyChat] Left room: ${groupName}`);
                this.currentPropertyId = null;
                this.currentCustomerId = null;
                this.clearMessages();
            })
            .catch(err => console.error('❌ [CustomerPropertyChat] Failed to leave room:', err));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // API CALLS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * GET /api/CustomerPropertyChat/my-chats
     * Load chat threads for the current Customer
     */
    public loadMyChats(): void {
        this.http.get<ChatThreadDto[]>(`${this.apiUrl}/my-chats`)
            .pipe(
                tap(threads => {
                    console.log('📋 [CustomerPropertyChat] My chats loaded:', threads);
                    this._chatThreads.set(threads || []);
                }),
                catchError(err => {
                    console.error('❌ [CustomerPropertyChat] Failed to load my chats:', err);
                    return of([]);
                }),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe();
    }

    /**
     * GET /api/CustomerPropertyChat/owner-chats
     * Load chat threads for the current Property Owner
     */
    public loadOwnerChats(): void {
        this.http.get<ChatThreadDto[]>(`${this.apiUrl}/owner-chats`)
            .pipe(
                tap(threads => {
                    console.log('📋 [CustomerPropertyChat] Owner chats loaded:', threads);
                    this._chatThreads.set(threads || []);
                }),
                catchError(err => {
                    console.error('❌ [CustomerPropertyChat] Failed to load owner chats:', err);
                    return of([]);
                }),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe();
    }

    /**
     * GET /api/CustomerPropertyChat/history?propertyId={id}&customerId={id}
     * Load message history for a specific chat room.
     * 
     * NOTE: The backend automatically marks messages as read when history is fetched,
     * so NO separate mark-read call is needed.
     */
    public loadChatHistory(propertyId: number, customerId: string): Observable<MessageDto[]> {
        return this.http.get<MessageDto[]>(`${this.apiUrl}/history`, {
            params: {
                propertyId: propertyId.toString(),
                customerId: customerId
            }
        }).pipe(
            tap(messages => {
                console.log('📜 [CustomerPropertyChat] History loaded:', messages);
                this._messages.set(messages || []);
            }),
            catchError(err => {
                console.error('❌ [CustomerPropertyChat] Failed to load history:', err);
                this._messages.set([]);
                return of([]);
            })
        );
    }

    /**
     * POST /api/CustomerPropertyChat/send
     * Send a new message
     */
    public sendMessage(dto: SendMessageDto): Observable<MessageDto> {
        // Construct payload with explicit types to ensure they match backend expectations
        const payload = {
            propertyId: Number(dto.propertyId), // Ensure Integer
            messageText: dto.messageText,
            // Include receiverId only if it exists (JSON.stringify will skip undefined, but being explicit helps debugging)
            receiverId: dto.receiverId
        };

        console.log('📤 [CustomerPropertyChat] Sending Message Payload:', payload);
        console.log('   - propertyId type:', typeof payload.propertyId);
        console.log('   - messageText length:', payload.messageText?.length);
        console.log('   - receiverId:', payload.receiverId);

        return this.http.post<MessageDto>(`${this.apiUrl}/send`, payload).pipe(
            tap(sentMessage => {
                console.log('✅ [CustomerPropertyChat] Message sent successfully:', sentMessage);

                // Optimistic / Instant update for sender
                // We add it locally to ensure UI updates immediately
                this.ngZone.run(() => {
                    this._messages.update(messages => {
                        // Prevent duplicates if SignalR already delivered it
                        if (messages.some(m => m.id === sentMessage.id)) return messages;

                        // Ensure isMine is true since we sent it
                        const msgWithFlag = { ...sentMessage, isMine: true };
                        return [...messages, msgWithFlag];
                    });
                });
            }),
            catchError(err => {
                console.error('❌ [CustomerPropertyChat] Send failed:', err);
                if (err.error?.errors) {
                    console.error('❌ [CustomerPropertyChat] Validation errors:', JSON.stringify(err.error.errors));
                }
                throw err;
            })
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UTILITY METHODS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Clear local messages state
     */
    public clearMessages(): void {
        this._messages.set([]);
    }

    /**
     * Clear all chat state (for logout)
     */
    public clearAll(): void {
        this.stopConnection();
        this._messages.set([]);
        this._chatThreads.set([]);
        this.currentPropertyId = null;
        this.currentCustomerId = null;
        this.isInChatRoom = false;
    }

    /**
     * Get the current user's ID
     */
    public getCurrentUserId(): string | null {
        return this.authService.getUserId();
    }

    /**
     * Get current active room info
     */
    public getActiveRoom(): { propertyId: number | null; customerId: string | null } {
        return {
            propertyId: this.currentPropertyId,
            customerId: this.currentCustomerId
        };
    }
}
