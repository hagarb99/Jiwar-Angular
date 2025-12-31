import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountService } from '../../../../../core/services/account.service';

@Component({
  selector: 'app-profile',
   standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
 profileData: any;

  constructor(private accountService: AccountService) {}

  ngOnInit(): void {
    this.accountService.getMyProfile().subscribe(data => {
      this.profileData = data;
    });
  }
}
