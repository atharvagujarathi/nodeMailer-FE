import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component } from '@angular/core';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-email-sender',
  templateUrl: './email-sender.component.html',
  styleUrls: ['./email-sender.component.css']
})
export class EmailSenderComponent {
  subject: string = 'Your Scheduled Email';
  body: string = `Dear recipient,

This is a scheduled email.

For more details, visit <a href="https://www.example.com" target="_blank">this link</a>.

Best regards,
Your Team`;

  file: File | null = null;
  isLoading: boolean = false;
  emailStatuses: { email: string; progress: number; status: string | null }[] = [];
  emailList: string[] = []; // To store email list

  constructor(private http: HttpClient, private cdRef: ChangeDetectorRef) {}

  // Function to handle file selection
  onFileSelected(event: any) {
    this.file = event.target.files[0];

    if (this.file) {
      this.readFile(this.file);
    }
  }

  // Function to read the Excel file and extract emails
  readFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      // Assuming first sheet contains the email addresses
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      // Extract emails from the sheet (assuming 'Email' is the column name)
      const emails = jsonData.map((row: any) => row.Email).filter((email: string) => email && email.trim());

      if (emails.length === 0) {
        alert('No valid email addresses found in the uploaded file.');
      } else {
        this.emailList = emails; // Save email list to display
        alert('Email list: ' + this.emailList.join(', '));
      }
    };

    reader.readAsArrayBuffer(file); // Read the file as ArrayBuffer
  }

  // Function to simulate email sending (add your actual sending logic)
  sendEmails() {
    if (!this.file) {
      alert('Please select an Excel file!');
      return;
    }
  
    this.isLoading = true;
    this.emailStatuses = []; // Clear previous statuses
  
    const formData = new FormData();
    formData.append('file', this.file);
    formData.append('subject', this.subject);
    formData.append('body', this.body);
  
    this.http.post('http://localhost:3000/upload', formData, { responseType: 'json' }).subscribe(
      (response: any) => {
        const emails = response.emails;
        this.emailList = emails; // Save email list to display
        emails.forEach((email: string) => {
          // Initialize email status and progress
          this.emailStatuses.push({ email, progress: 0, status: 'In Progress' });
        });
  
        // Simulate progress bar updates for each email
        this.emailStatuses.forEach((status, index) => {
          const interval = setInterval(() => {
            if (status.progress < 100) {
              status.progress += 10; // Increment progress
            } else {
              clearInterval(interval);
              // Simulate status update (Success/Failed)
              status.status = Math.random() > 0.2 ? 'Success' : 'Failed'; // Random status for simulation
              if (index === emails.length - 1) {
                this.isLoading = false; // Stop loading after last email
              }
            }
          }, 500); // 500ms per progress increment
        });
      },
      (error) => {
        console.error('Error processing file:', error);
        this.isLoading = false;
        alert('Failed to upload file.');
      }
    );
  }
  

  showEmailList() {
    if (!this.file) {
      alert('No file uploaded yet. Please upload a file first.');
      return;
    }
  
    // Construct the file path for querying the API (this assumes the file is uploaded and you know its path)
    const filePath = 'uploads/' + this.file.name; // Adjust based on how the file is saved on the server
  
    this.http.get(`http://localhost:3000/users?filePath=${filePath}`).subscribe(
      (response: any) => {
        if (response.emails && response.emails.length > 0) {
          // alert('Email list: ' + response.emails.join(', '));
        } else {
          alert('No valid email addresses found in the file.');
        }
      },
      (error) => {
        console.error('Error fetching emails:', error);
        alert('Failed to fetch email list.');
      }
    );
  }
  

  cancelEmails() {
    this.http.post('http://localhost:3000/cancel', {}).subscribe(
      () => {
        alert('Email sending canceled');
        this.isLoading = false; // Stop loading spinner
  
        // Loop through each email status and mark them as failed with progress 100%
        this.emailStatuses.forEach((status) => {
          if (status.status === 'In Progress') {
            status.progress = 100; // Set progress to 100%
            status.status = 'Failed'; // Mark status as failed
          }
        });
  
        // Manually trigger change detection to update the UI
        this.cdRef.detectChanges(); // Ensure the view updates with the changed status
      },
      (error) => {
        console.error('Failed to cancel email sending:', error);
      }
    );
  }
  
  
  
}
