import { Routes } from '@angular/router';

export const CHAT_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./chat-list/chat-list.component').then(m => m.ChatListComponent),
        title: 'Messages'
    },
    {
        path: ':propertyId/:customerId',
        loadComponent: () => import('./chat-room/chat-room.component').then(m => m.ChatRoomComponent),
        title: 'Chat'
    }
];
