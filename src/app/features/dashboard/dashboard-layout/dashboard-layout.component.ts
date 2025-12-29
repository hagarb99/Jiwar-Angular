import { Component } from '@angular/core';
import { RouterOutlet } from "@angular/router";
import { SidebarComponent } from '../sidebar/sidebar.component';
import { NavbarComponent } from "../../../shared/components/navbar/navbar.component";
import { FooterComponent } from "../../../shared/components/footer/footer.component";
import { CommonModule } from "@angular/common";
@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [ RouterOutlet, SidebarComponent, NavbarComponent, FooterComponent],
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.css']
})

export class DashboardLayoutComponent { }
