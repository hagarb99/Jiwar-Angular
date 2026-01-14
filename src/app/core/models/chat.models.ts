/**
 * DTO for individual chat messages
 * Maps to backend MessageDto
 */
export interface MessageDto {
    id: number;
    senderId: string;
    senderName: string;
    messageText: string;
    createdAt: string;
    isRead: boolean;
    isMine: boolean;
    propertyId?: number;
}

/**
 * DTO for chat thread summary (inbox view)
 * Maps to backend ChatThreadDto
 */
export interface ChatThreadDto {
    propertyId: number;
    propertyTitle: string;
    propertyImage: string;
    customerId: string;
    customerName: string;
    lastMessage: string;
    lastMessageDate: string;
    unreadCount: number;
}

/**
 * DTO for sending a new message
 */
export interface SendMessageDto {
    propertyId: number;
    messageText: string;
    receiverId?: string;
}

/**
 * Connection status for SignalR
 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

/**
 * Group name format: PropertyChat_{propertyId}_{customerId}
 */
export function getChatGroupName(propertyId: number, customerId: string): string {
    return `PropertyChat_${propertyId}_${customerId}`;
}
