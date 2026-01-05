import { Component, OnInit } from '@angular/core';
import { ChatService } from '../../../core/services/chat.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit {
  messages: { senderId: string, message: string }[] = [];
  messageText = '';
  receiverId = 'some-user-id'; // هتجيبها حسب الـ profile

  constructor(private chatService: ChatService) { }

  ngOnInit(): void {
    const token = localStorage.getItem('token') || '';
    this.chatService.startConnection(token);

    this.chatService.messages$.subscribe(msgs => {
      this.messages = msgs;
    });
  }

  sendMessage() {
    const senderId = 'my-user-id'; // تجيبها من التوكن أو profile
    this.chatService.sendMessage(this.receiverId, senderId, this.messageText);
    this.messageText = '';
  }
}
