import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../dashboard/sidebar/sidebar.component';
import { RouterOutlet } from "@angular/router";
@Component({
  selector: 'app-propertyowner-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    RouterOutlet
  ],
  templateUrl: './propertyowner-dashboard.component.html',
  styleUrls: ['./propertyowner-dashboard.component.css']
})
export class PropertyownerDashboardComponent { }