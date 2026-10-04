export interface SampleEmail {
  id: string;
  label: 'LEGITIMATE' | 'PHISHING';
  category: string;
  sender: string;
  subject: string;
  body: string;
  attachment_name: string;
}

export const sampleEmails: SampleEmail[] = [
  {
    id: 'phish-verify',
    label: 'PHISHING',
    category: 'Fake Account Verification',
    sender: '"Security Team" <security-alert@account-check.invalid.test>',
    subject: 'URGENT: Verify Your Account Immediately!!!',
    body: `Dear Valued Customer,

Your account has been flagged for suspicious activity. You must verify your account immediately or your account will be suspended within 24 hours!

Please click the link below to confirm your identity and reset your password:

http://198.51.100.10/verify-account?id=xyz

Act now to avoid permanent account closure. This is your final notice.

If you do not verify your personal details within 24 hours, your account will be permanently deactivated.

Thank you,
Account Security Team`,
    attachment_name: '',
  },
  {
    id: 'phish-invoice',
    label: 'PHISHING',
    category: 'Fake Invoice',
    sender: '"Billing Department" <billing@invoices-payable.example.net>',
    subject: 'Overdue Invoice - Immediate Payment Required',
    body: `Dear Customer,

We have an outstanding payment on your account. Invoice #INV-2024-8847 is now overdue.

Please review the attached invoice and process your wire transfer immediately to avoid legal action and account termination.

The amount due is $4,250.00. Please confirm your bank details so we can process this charge.

Download invoice: http://203.0.113.55/invoice/download

Do not ignore this notice - consequences will follow.

Best regards,
Billing Team`,
    attachment_name: 'invoice_2024.pdf.exe',
  },
  {
    id: 'phish-prize',
    label: 'PHISHING',
    category: 'Fake Prize',
    sender: '"Lottery Notifications" <winner@mega-prize.example.org>',
    subject: 'CONGRATULATIONS!!! You Have Won $500,000!!!',
    body: `Dear Lucky Winner,

CONGRATULATIONS!!! You have been selected as the winner of our international lottery sweepstakes!!!

You have won $500,000 USD!!! To claim your prize, please confirm your personal details immediately:

- Full name
- Date of birth
- Home address
- Phone number
- Bank account number for transfer of prize money

Click here to claim your reward: http://198.51.100.20/claim-prize

You must respond within 24 hours or your prize will be forfeited!!!

Congratulations again!
Lottery Claims Department`,
    attachment_name: '',
  },
  {
    id: 'phish-password',
    label: 'PHISHING',
    category: 'Fake Password Expiration',
    sender: '"IT Support" <it-support@account-security.invalid.test>',
    subject: 'Password Expiration Notice - Action Required Today',
    body: `Dear User,

Your password will expire today at midnight. You must re-authenticate and reset your password immediately.

Please validate your credentials by visiting: http://203.0.113.88/reset-password

Enter your username and current password to confirm your identity. Failure to validate will result in your account being locked.

This is an automated security notice. Do not ignore.

IT Department`,
    attachment_name: '',
  },
  {
    id: 'phish-delivery',
    label: 'PHISHING',
    category: 'Fake Delivery',
    sender: '"Package Delivery" <noreply@parcel-tracking.example.com>',
    subject: 'Failed Delivery Attempt - Confirm Your Address',
    body: `Dear Customer,

We attempted to deliver your package but could not reach you. Please confirm your personal details to reschedule delivery.

Update your delivery information here: https://bit.ly/parcel-update-xyz

Please provide your full address and a valid phone number. There is a small outstanding payment for redelivery.

Track your package: https://track.parcel-notreal.click/track?id=88472

Thank you,
Delivery Services`,
    attachment_name: '',
  },
  {
    id: 'phish-hr',
    label: 'PHISHING',
    category: 'Fake HR Request',
    sender: '"HR Director" <hr.director@company-update.example.net>',
    subject: 'URGENT: Update Your Direct Deposit Information',
    body: `Dear Employee,

We need you to update your direct deposit information immediately. Our payroll system requires you to confirm your bank account details.

Please provide:
- Bank name
- Account number
- Routing number
- Social security number for verification

Reply to this email with your details or click here: http://198.51.100.44/payroll-update

This must be completed today to ensure your next paycheck is deposited correctly.

HR Department`,
    attachment_name: 'direct_deposit_form.docm',
  },
  {
    id: 'phish-exec',
    label: 'PHISHING',
    category: 'Fake Executive Request (BEC)',
    sender: '"CEO Office" <ceo@executive-mails.invalid.test>',
    subject: 'Re: Urgent Request',
    body: `Hi,

Are you available? I need you to handle something urgent for me right away. I'm in a meeting and can't talk.

I need you to process a wire transfer of $15,000 to a vendor immediately. Please confirm your bank details so I can send the account information.

Do not discuss this with anyone else. This is confidential.

Send me a quick reply so I know you got this.

Thanks,
Chief Executive Officer`,
    attachment_name: '',
  },
  {
    id: 'phish-subdomain',
    label: 'PHISHING',
    category: 'Lookalike Domain',
    sender: '"Microsoft Account Team" <noreply@verify.account.update.security.microsoft.com.invalid.test>',
    subject: 'Microsoft Account Verification Required',
    body: `Dear User,

Your Microsoft account requires immediate verification. Please sign in to confirm your identity.

Visit: https://login.micr0soft-verify.invalid.test/auth

Enter your password and complete the verification process. Your account will be suspended if not verified.

Microsoft Account Protection Team`,
    attachment_name: '',
  },

  // Legitimate emails
  {
    id: 'legit-training',
    label: 'LEGITIMATE',
    category: 'University Notice',
    sender: 'training@example.org',
    subject: 'Cybersecurity Workshop Reminder',
    body: `Hello everyone,

This is a reminder that the cybersecurity workshop will be held this Thursday at 2:00 PM in Room 204.

The session will cover phishing awareness, password security, and safe browsing practices. No prerequisites are required.

Please bring your laptop if you have one. Materials will be distributed during the session.

If you have any questions, feel free to reply to this email.

Best regards,
Training Coordinator`,
    attachment_name: 'workshop_agenda.pdf',
  },
  {
    id: 'legit-hr',
    label: 'LEGITIMATE',
    category: 'HR Update',
    sender: 'hr@example.com',
    subject: 'New Employee Onboarding Schedule - October',
    body: `Hi team,

Please find the October onboarding schedule below. New team members will be joining us across three departments.

Orientation dates:
- October 7: Engineering (3 new hires)
- October 14: Marketing (2 new hires)
- October 21: Operations (1 new hire)

Please welcome our new colleagues and help them get settled.

Thanks,
HR Team`,
    attachment_name: '',
  },
  {
    id: 'legit-meeting',
    label: 'LEGITIMATE',
    category: 'Meeting Reminder',
    sender: 'calendar@example.com',
    subject: 'Reminder: Project Review Meeting Tomorrow',
    body: `Hi,

This is an automated reminder about the project review meeting scheduled for tomorrow at 10:00 AM.

We will review the current sprint progress and discuss the roadmap for the next two weeks.

Meeting link: https://meet.example.com/abc-defg-hij

Agenda will be shared 15 minutes before the meeting starts.

See you there!`,
    attachment_name: '',
  },
  {
    id: 'legit-shopping',
    label: 'LEGITIMATE',
    category: 'Shopping Confirmation',
    sender: 'orders@store.example.com',
    subject: 'Your Order #10245 Has Been Confirmed',
    body: `Dear Customer,

Thank you for your order! Your order #10245 has been confirmed and is being processed.

Order summary:
- 2x Wireless Headphones - $79.99 each
- 1x Phone Case - $19.99
- Total: $179.97

Expected delivery: October 8-10

You can track your order at: https://store.example.com/track/10245

If you have any questions, please contact our support team at support@store.example.com.

Thank you for shopping with us!`,
    attachment_name: '',
  },
  {
    id: 'legit-newsletter',
    label: 'LEGITIMATE',
    category: 'Newsletter',
    sender: 'newsletter@example.org',
    subject: 'October Tech Newsletter - Latest in Cybersecurity',
    body: `Hello subscriber,

Welcome to the October edition of our technology newsletter!

In this issue:
1. The state of email security in 2024
2. How AI is improving threat detection
3. Best practices for remote work security
4. Upcoming webinars and events

We hope you find these articles informative. As always, feel free to reach out with questions or topic suggestions.

To unsubscribe, visit: https://newsletter.example.org/unsubscribe

Best,
The Newsletter Team`,
    attachment_name: '',
  },
  {
    id: 'legit-password',
    label: 'LEGITIMATE',
    category: 'Password Change Confirmation',
    sender: 'noreply@accounts.example.com',
    subject: 'Your Password Was Successfully Changed',
    body: `Hi,

Your account password was successfully changed on October 4, 2024 at 3:42 PM.

If you made this change, no further action is required.

If you did NOT make this change, please contact our support team immediately at support@example.com or call 1-800-555-0100.

For your security, we recommend enabling two-factor authentication in your account settings.

Account Security Team`,
    attachment_name: '',
  },
  {
    id: 'legit-bank',
    label: 'LEGITIMATE',
    category: 'Bank Notification (Fictional)',
    sender: 'notifications@first-example-bank.example.com',
    subject: 'Your Monthly Statement Is Available',
    body: `Dear Account Holder,

Your September monthly statement is now available for review.

Statement period: September 1 - September 30, 2024
Account ending in: 4521

You can view your full statement by logging into your account at: https://www.first-example-bank.example.com

If you have any questions about your statement, please contact customer service at 1-800-555-0199.

Thank you for banking with First Example Bank.`,
    attachment_name: '',
  },
];
