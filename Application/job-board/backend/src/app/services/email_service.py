import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, Any
from app.config import settings

logger = logging.getLogger("job_board.email_service")

class EmailService:
    def __init__(self):
        self.smtp_host = settings.SMTP_HOST.strip() if settings.SMTP_HOST else ""
        self.smtp_port = int(settings.SMTP_PORT) if settings.SMTP_PORT else 587
        self.smtp_user = settings.SMTP_USER.strip() if settings.SMTP_USER else ""
        self.smtp_password = settings.SMTP_PASSWORD.strip() if settings.SMTP_PASSWORD else ""
        self.from_email = settings.SMTP_FROM_EMAIL.strip() if settings.SMTP_FROM_EMAIL else (self.smtp_user or "noreply@job-board.com")
        self.from_name = settings.SMTP_FROM_NAME or "Job-Board Platform"
        self.use_tls = settings.SMTP_TLS
        self.use_ssl = settings.SMTP_SSL
        self.frontend_url = settings.FRONTEND_URL.rstrip("/")

    def send_password_reset_email(self, to_email: str, token: str) -> Dict[str, Any]:
        """
        Sends a password reset link to the user's email.
        If SMTP is configured in .env, sends via real SMTP server.
        If SMTP is not configured, logs the link to console and returns it for development/testing.
        """
        clean_email = to_email.strip().lower()
        reset_url = f"{self.frontend_url}/reset-password?token={token}"

        # 1. Check if SMTP is configured
        if self.smtp_host:
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = "Job-Board — Password Reset Instructions"
                msg["From"] = f"{self.from_name} <{self.from_email}>"
                msg["To"] = clean_email

                text_content = (
                    f"Hello,\n\n"
                    f"We received a request to reset your password for your Job-Board account.\n\n"
                    f"Reset your password using this link (valid for 15 minutes):\n"
                    f"{reset_url}\n\n"
                    f"If you did not make this request, you can safely ignore this email.\n\n"
                    f"Best regards,\n"
                    f"The Job-Board Team\n"
                )

                html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Your Password — Job-Board</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0A0D10; color: #F8FAFC; margin: 0; padding: 30px 15px;">
  <div style="max-width: 540px; margin: 0 auto; background-color: #131A21; border: 1px solid rgba(0, 230, 165, 0.25); border-radius: 12px; padding: 32px 28px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);">
    
    <!-- Brand Header -->
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="margin: 0; font-size: 26px; color: #FFFFFF; font-weight: 800; letter-spacing: -0.02em;">
        Job-<span style="color: #00E6A5;">Board</span>
      </h1>
      <p style="margin: 4px 0 0 0; font-size: 13px; color: #94A3B8; font-weight: 500;">
        Tech Careers &amp; Growth Platform
      </p>
    </div>

    <hr style="border: none; border-top: 1px solid rgba(255, 255, 255, 0.08); margin: 20px 0;">

    <!-- Email Content -->
    <h2 style="font-size: 19px; color: #F8FAFC; margin-top: 0; margin-bottom: 12px;">Password Reset Request</h2>
    <p style="font-size: 15px; line-height: 1.6; color: #CBD5E1; margin-bottom: 24px;">
      We received a request to reset the password for your registered email: <strong>{clean_email}</strong>.
    </p>

    <!-- Action Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="{reset_url}" style="background: linear-gradient(135deg, #00E6A5 0%, #00B584 100%); color: #0A0D10; text-decoration: none; padding: 14px 28px; font-weight: 700; font-size: 15px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 15px rgba(0, 230, 165, 0.35);">
        Reset Your Password &rarr;
      </a>
    </div>

    <p style="font-size: 13px; line-height: 1.5; color: #94A3B8; margin-top: 24px;">
      If the button above does not work, copy and paste the following URL into your browser:
    </p>
    <p style="font-size: 12px; word-break: break-all; color: #00D2FF; background: #0D1217; padding: 10px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.05);">
      {reset_url}
    </p>

    <p style="font-size: 12px; color: #64748B; margin-top: 24px; line-height: 1.4;">
      ⚠️ This link expires in <strong>15 minutes</strong>. If you did not request this password reset, no further action is required and your account remains secure.
    </p>

    <hr style="border: none; border-top: 1px solid rgba(255, 255, 255, 0.08); margin: 24px 0 16px 0;">

    <p style="font-size: 12px; text-align: center; color: #475569; margin: 0;">
      &copy; Job-Board Platform. All rights reserved.
    </p>
  </div>
</body>
</html>"""

                msg.attach(MIMEText(text_content, "plain"))
                msg.attach(MIMEText(html_content, "html"))

                if self.use_ssl:
                    server = smtplib.SMTP_SSL(self.smtp_host, self.smtp_port, timeout=10)
                else:
                    server = smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=10)
                    if self.use_tls:
                        server.starttls()

                if self.smtp_user and self.smtp_password:
                    server.login(self.smtp_user, self.smtp_password)

                server.send_message(msg)
                server.quit()

                logger.info(f"Password reset email sent via SMTP to {clean_email}")
                return {
                    "sent": True,
                    "reset_link": reset_url,
                    "message": f"Password reset instructions have been sent to {clean_email}."
                }

            except Exception as e:
                logger.error(f"Failed to send email via SMTP to {clean_email}: {e}")
                # Fallback to dev log output so the user is not completely locked out
                self._log_dev_reset(clean_email, reset_url, error_reason=str(e))
                return {
                    "sent": False,
                    "reset_link": reset_url,
                    "smtp_error": str(e),
                    "message": f"Could not connect to SMTP server: {e}. You can reset directly with the provided link."
                }

        # 2. If SMTP is not configured in .env
        self._log_dev_reset(clean_email, reset_url)
        return {
            "sent": False,
            "reset_link": reset_url,
            "smtp_configured": False,
            "message": f"SMTP is not configured in backend .env. Reset link generated for {clean_email}."
        }

    def _log_dev_reset(self, email: str, reset_url: str, error_reason: str = None):
        border = "=" * 80
        logger.warning(
            f"\n{border}\n"
            f"[JOB-BOARD EMAIL SERVICE] 📧 PASSWORD RESET DISPATCHED\n"
            f"Recipient: {email}\n"
            f"Reset URL: {reset_url}\n"
            + (f"SMTP Notice: Delivery failed ({error_reason})\n" if error_reason else "SMTP Notice: No SMTP_HOST configured in backend/.env\n")
            + f"Tip: Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD in backend/.env for real inbox delivery.\n"
            f"{border}\n"
        )

email_service = EmailService()
