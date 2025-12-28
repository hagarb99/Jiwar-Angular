import { Component } from '@angular/core';
import { HeaderComponent } from "../header/header.component";
import { RouterOutlet } from "@angular/router";
import { SidebarComponent } from '../sidebar/sidebar.component';
@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [HeaderComponent, RouterOutlet, SidebarComponent],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.css'
})

export class DashboardLayoutComponent {}
