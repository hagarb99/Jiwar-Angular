import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PropertyService, BookingCreateDTO } from '../../../core/services/property.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { TextareaModule } from 'primeng/textarea';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-notification-test',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ToastModule,
    ButtonModule,
    InputTextModule,
    CalendarModule,
    TextareaModule,
    CardModule
  ],
  templateUrl: './notification-test.component.html',
  styleUrls: ['./notification-test.component.css']
})
export class NotificationTestComponent implements OnInit, OnDestroy {
  testResults: any[] = [];
  isTestRunning = false;
  
  // Test booking data
  testBooking = {
    propertyId: 1,
    name: 'Test Customer',
    email: 'customer@test.com',
    phone: '+20123456789',
    startDate: new Date(),
    message: 'Test booking for notification system'
  };

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private propertyService: PropertyService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.addTestResult('INIT', 'Test component initialized', 'info');
    this.checkAuthStatus();
  }

  ngOnDestroy(): void {
    this.addTestResult('CLEANUP', 'Test component destroyed', 'info');
  }

  private checkAuthStatus(): void {
    const isLoggedIn = this.authService.isLoggedIn();
    const userEmail = this.authService.getUserEmail();
    const userId = this.authService.getUserId();
    const userRole = this.authService.userRole;
    
    this.addTestResult('AUTH_CHECK', `Logged in: ${isLoggedIn}, User: ${userEmail}, ID: ${userId}, Role: ${userRole}`, 
                      isLoggedIn ? 'success' : 'warning');
  }

  private addTestResult(step: string, message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    const result = {
      timestamp: new Date().toISOString(),
      step,
      message,
      type,
      details: {
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    };
    
    this.testResults.push(result);
    console.log(`🧪 [${step}] ${message}`, result);
  }

  async testNotificationFlow(): Promise<void> {
    this.isTestRunning = true;
    this.testResults = [];
    
    try {
      // Step 1: Check authentication
      this.addTestResult('STEP_1', 'Checking authentication status...', 'info');
      if (!this.authService.isLoggedIn()) {
        this.addTestResult('STEP_1_ERROR', 'User not authenticated', 'error');
        return;
      }
      this.addTestResult('STEP_1_SUCCESS', 'User authenticated successfully', 'success');

      // Step 2: Check existing notifications
      this.addTestResult('STEP_2', 'Checking existing notifications...', 'info');
      this.notificationService.loadNotifications().subscribe({
        next: (notifications) => {
          this.addTestResult('STEP_2_SUCCESS', `Found ${notifications.length} existing notifications`, 'success');
          this.addTestResult('STEP_2_DETAIL', `Unread count: ${notifications.filter(n => !n.isRead).length}`, 'info');
        },
        error: (err) => {
          this.addTestResult('STEP_2_ERROR', `Failed to load notifications: ${err.message}`, 'error');
        }
      });

      // Step 3: Check SignalR connection
      this.addTestResult('STEP_3', 'Checking SignalR connection...', 'info');
      const token = this.authService.getToken();
      if (!token) {
        this.addTestResult('STEP_3_ERROR', 'No authentication token found', 'error');
        return;
      }
      
      // Restart SignalR connection to ensure fresh connection
      this.notificationService.stopConnection();
      setTimeout(() => {
        this.notificationService.startConnection(token).then(() => {
          this.addTestResult('STEP_3_SUCCESS', 'SignalR connection established', 'success');
        }).catch(err => {
          this.addTestResult('STEP_3_ERROR', `SignalR connection failed: ${err.message}`, 'error');
        });
      }, 1000);

      // Step 4: Wait for SignalR to connect
      this.addTestResult('STEP_4', 'Waiting for SignalR connection...', 'info');
      await this.sleep(3000);

      // Step 5: Create test booking
      this.addTestResult('STEP_5', 'Creating test booking to trigger notification...', 'info');
      const bookingPayload: BookingCreateDTO = {
        propertyID: this.testBooking.propertyId,
        name: this.testBooking.name,
        email: this.testBooking.email,
        phone: this.testBooking.phone,
        startDate: this.testBooking.startDate.toISOString(),
        message: this.testBooking.message,
        offerID: null
      };

      this.addTestResult('STEP_5_DETAIL', `Booking payload: ${JSON.stringify(bookingPayload)}`, 'info');

      this.propertyService.createBooking(bookingPayload).subscribe({
        next: (response) => {
          this.addTestResult('STEP_5_SUCCESS', `Booking created successfully: ${JSON.stringify(response)}`, 'success');
          
          // Step 6: Check notifications immediately after booking
          setTimeout(() => {
            this.addTestResult('STEP_6', 'Checking for new notifications after booking...', 'info');
            this.notificationService.loadNotifications().subscribe({
              next: (notifications) => {
                const newNotifications = notifications.filter(n => 
                  n.title?.includes('Booking') || n.message?.includes('booking') || n.notificationType === 'proposal'
                );
                this.addTestResult('STEP_6_RESULT', `Found ${newNotifications.length} booking-related notifications`, 'info');
                
                if (newNotifications.length > 0) {
                  this.addTestResult('STEP_6_SUCCESS', '✅ NOTIFICATION DETECTED - System working!', 'success');
                  newNotifications.forEach((notif, index) => {
                    this.addTestResult(`NOTIF_${index + 1}`, `Title: ${notif.title}, Message: ${notif.message}, Type: ${notif.notificationType}`, 'success');
                  });
                } else {
                  this.addTestResult('STEP_6_WARNING', '⚠️ No new notifications found - Backend may not be sending notifications', 'warning');
                }
              },
              error: (err) => {
                this.addTestResult('STEP_6_ERROR', `Failed to check notifications: ${err.message}`, 'error');
              }
            });
          }, 2000); // Wait 2 seconds for backend to process

          // Step 7: Wait for real-time SignalR notification
          this.addTestResult('STEP_7', 'Waiting for real-time SignalR notification...', 'info');
          setTimeout(() => {
            this.addTestResult('STEP_7_COMPLETE', 'SignalR notification waiting period completed', 'info');
            this.isTestRunning = false;
          }, 10000); // Wait 10 seconds for SignalR
        },
        error: (err) => {
          this.addTestResult('STEP_5_ERROR', `Booking creation failed: ${err.message} (Status: ${err.status})`, 'error');
          this.isTestRunning = false;
        }
      });

    } catch (error) {
      this.addTestResult('TEST_ERROR', `Unexpected error: ${error}`, 'error');
      this.isTestRunning = false;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  clearResults(): void {
    this.testResults = [];
    this.addTestResult('CLEARED', 'Test results cleared', 'info');
  }

  testManualNotification(): void {
    this.addTestResult('MANUAL_TEST', 'Testing manual notification creation...', 'info');
    
    // Simulate the expected notification format
    const testNotification = {
      title: "New Booking Request",
      message: "You have a new booking request for Property #" + this.testBooking.propertyId,
      type: "proposal",
      link: "/owner/bookings"
    };
    
    this.addTestResult('MANUAL_FORMAT', `Expected notification format: ${JSON.stringify(testNotification)}`, 'info');
    
    // Test if SignalR receives this notification
    console.log('🧪 Testing manual notification reception...');
    console.log('📨 Expected notification:', testNotification);
    
    this.addTestResult('MANUAL_COMPLETE', 'Manual test completed - Check console for SignalR logs', 'info');
  }

  checkBackendNotifications(): void {
    this.addTestResult('BACKEND_CHECK', 'Checking backend notifications API...', 'info');
    
    this.notificationService.loadNotifications().subscribe({
      next: (notifications) => {
        this.addTestResult('BACKEND_SUCCESS', `Backend returned ${notifications.length} notifications`, 'success');
        
        // Analyze notification types
        const bookingNotifications = notifications.filter(n => 
          n.title?.toLowerCase().includes('booking') || 
          n.message?.toLowerCase().includes('booking') || 
          n.notificationType === 'proposal'
        );
        
        this.addTestResult('BACKEND_ANALYSIS', `Found ${bookingNotifications.length} booking-related notifications`, 'info');
        
        if (bookingNotifications.length > 0) {
          bookingNotifications.forEach((notif, index) => {
            this.addTestResult(`BACKEND_NOTIF_${index + 1}`, 
              `ID: ${notif.notificationID}, Title: ${notif.title}, Type: ${notif.notificationType}, Read: ${notif.isRead}`, 
              'success');
          });
        } else {
          this.addTestResult('BACKEND_WARNING', 'No booking notifications found in backend', 'warning');
        }
      },
      error: (err) => {
        this.addTestResult('BACKEND_ERROR', `Backend API error: ${err.message} (Status: ${err.status})`, 'error');
      }
    });
  }

  exportResults(): void {
    const dataStr = JSON.stringify(this.testResults, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `notification-test-${new Date().toISOString().slice(0, 19)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    this.addTestResult('EXPORT', 'Test results exported', 'success');
  }

  getResultsByType(type: string): any[] {
    return this.testResults.filter(result => result.type === type);
  }

  getSuccessCount(): number {
    return this.getResultsByType('success').length;
  }

  getErrorCount(): number {
    return this.getResultsByType('error').length;
  }
}
