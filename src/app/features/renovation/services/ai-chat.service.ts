import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';

export enum ChatSender {
    User = 0,
    AI = 1
}

export enum ChatMessageType {
    Text = 0,
    Image = 1,
    Voice = 2,
    Video = 3
}

export interface ChatMessage {
    id?: number;
    renovationSimulationID?: number;
    userId?: string;
    sender: ChatSender;
    messageType: ChatMessageType;
    content: string;
    createdAt?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AiChatService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private readonly baseUrl = `${environment.apiBaseUrl}/ai-chat`;

    startChat(simulationId: number): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.baseUrl}/start`, null, {
            params: { simulationId: simulationId.toString() }
        });
    }

    sendMessage(simulationId: number, userMessage: string): Observable<{ response: string }> {
        const userId = this.authService.getUserId() || '';
        // API Contract: [HttpPost("send")] Send(int simulationId, string userId, [FromBody] string UserMessage)
        return this.http.post<{ response: string }>(
            `${this.baseUrl}/send`,
            JSON.stringify(userMessage),
            {
                params: {
                    simulationId: simulationId.toString(),
                    userId: userId
                },
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }

    uploadImage(simulationId: number, image: File): Observable<{ fileUrl: string }> {
        const formData = new FormData();
        formData.append('image', image);
        return this.http.post<{ fileUrl: string }>(`${this.baseUrl}/upload-image`, formData, {
            params: { simulationId: simulationId.toString() }
        });
    }

    sendVoice(simulationId: number, voiceFile: File): Observable<{ fileUrl: string }> {
        const formData = new FormData();
        formData.append('voiceFile', voiceFile);
        return this.http.post<{ fileUrl: string }>(`${this.baseUrl}/send-voice`, formData, {
            params: { simulationId: simulationId.toString() }
        });
    }

    generateImage(simulationId: number, prompt: string): Observable<{ imageUrl: string }> {
        return this.http.post<{ imageUrl: string }>(`${this.baseUrl}/generate-image`, JSON.stringify(prompt), {
            params: { simulationId: simulationId.toString() },
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Backend ChatRepository supports GetBySimulationIdAsync and GetByUserIdAsync
    // We should probably update the controller to expose these if needed, 
    // but the provided controller snippet doesn't show them.
    // Keeping this as a placeholder if historical context is needed.
    getHistory(simulationId: number): Observable<ChatMessage[]> {
        return this.http.get<ChatMessage[]>(`${this.baseUrl}/history`, {
            params: { simulationId: simulationId.toString() }
        });
    }
}
