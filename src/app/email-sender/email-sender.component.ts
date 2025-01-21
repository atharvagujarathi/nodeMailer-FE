import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-email-sender',
  templateUrl: './email-sender.component.html',
  styleUrls: ['./email-sender.component.css']
})
export class EmailSenderComponent {
  file: File | null = null;

  constructor(private http: HttpClient) {}

  onFileSelected(event: any) {
    this.file = event.target.files[0];
  }

  sendEmails() {
    if (!this.file) {
      alert('Please select an Excel file!');
      return;
    }

    // Static values from the HTML
    const subject = 'Your Scheduled Email'; 
    const body = `Dear recipient, <br><br>This is a scheduled email. <br><br>For more details, visit <a href="https://www.example.com" target="_blank">this link</a>. <br><br>Best regards, <br>Your Team`;

    const formData = new FormData();
    formData.append('file', this.file);
    formData.append('subject', subject);
    formData.append('body', body);

    this.http.post('http://localhost:3000/upload', formData).subscribe(
      (response) => {
        alert('Emails are being sent!');
      },
      (error) => {
        console.error('Error sending emails', error);
        alert('Failed to send emails.');
      }
    );
  }
}
