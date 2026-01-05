import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NotificationMessage {
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    type?: 'proposal' | 'acceptance' | 'info';
    link?: string;
}

@Injectable({
    providedIn: 'root'
})
export class SignalRService {
    private hubConnection!: signalR.HubConnection;
    public notifications$ = new BehaviorSubject<NotificationMessage[]>([]);
    private notifications: NotificationMessage[] = [];

    constructor() {
        this.startConnection();
        // Load persisted notifications?
        const saved = localStorage.getItem('notifications');
        if (saved) {
            try {
                this.notifications = JSON.parse(saved);
                this.notifications$.next(this.notifications);
            } catch (e) { console.error('Error loading notifications', e); }
        }
    }

    public startConnection = () => {
        // Construct Hub URL (removing /api if present to get base root)
        const baseUrl = environment.apiBaseUrl.replace('/api', '');
        const hubUrl = `${baseUrl}/notificationHub`;

        this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, {
                skipNegotiation: true,
                transport: signalR.HttpTransportType.WebSockets
            })
            .withAutomaticReconnect()
            .build();

        this.hubConnection
            .start()
            .then(() => console.log('Connection started'))
            .catch((err: any) => console.log('Error while starting connection: ' + err));

        this.addNotificationListener();
    }

    public addNotificationListener = () => {
        this.hubConnection.on('ReceiveNotification', (user: string, message: string, title: string = 'Notification') => {
            console.log('Notification received:', message);
            this.addNotification({
                title: title,
                message: message,
                timestamp: new Date(),
                read: false
            });
        });

        // Listen for structure object if backend sends objects
        this.hubConnection.on('ReceiveNotificationObject', (data: any) => {
            this.addNotification({
                title: data.title || 'Notification',
                message: data.message || data.body,
                timestamp: new Date(),
                read: false,
                link: data.link,
                type: data.type
            });
        });
    }

    // For simulation if backend is not ready
    public simulateNotification(title: string, message: string) {
        this.addNotification({
            title,
            message,
            timestamp: new Date(),
            read: false
        });
    }

    private addNotification(notification: NotificationMessage) {
        this.notifications.unshift(notification);
        this.notifications$.next(this.notifications);
        this.saveNotifications();
    }

    public markAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.notifications$.next(this.notifications);
        this.saveNotifications();
    }

    private saveNotifications() {
        localStorage.setItem('notifications', JSON.stringify(this.notifications));
    }
}
