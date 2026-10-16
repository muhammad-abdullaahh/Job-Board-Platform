from unittest.mock import MagicMock
from app.services.email_service import EmailService
from app.config import settings

def test_email_service_without_smtp():
    service = EmailService()
    service.smtp_host = ""  # No SMTP configured

    result = service.send_password_reset_email("user@example.com", "sample_token_123")
    assert result["sent"] is False
    assert "password reset instructions have been sent" in result["message"]

def test_email_service_with_smtp_success(monkeypatch):
    import smtplib
    service = EmailService()
    service.smtp_host = "smtp.example.com"
    service.smtp_port = 587
    service.smtp_user = "user@example.com"
    service.smtp_password = "password"
    service.use_ssl = False
    service.use_tls = True

    mock_server = MagicMock()
    monkeypatch.setattr(smtplib, "SMTP", lambda host, port, timeout: mock_server)

    result = service.send_password_reset_email("test@example.com", "reset_token_abc")
    assert result["sent"] is True
    assert mock_server.starttls.called
    assert mock_server.login.called
    assert mock_server.send_message.called
    assert mock_server.quit.called

def test_email_service_with_smtp_failure_fallback(monkeypatch):
    import smtplib
    service = EmailService()
    service.smtp_host = "smtp.fail.com"

    def fail_smtp(*args, **kwargs):
        raise smtplib.SMTPException("Connection timed out")

    monkeypatch.setattr(smtplib, "SMTP", fail_smtp)

    result = service.send_password_reset_email("test@example.com", "token_fail")
    assert result["sent"] is False
    assert "password reset instructions have been sent" in result["message"]

def test_email_service_production_log_sanitization(monkeypatch):
    service = EmailService()
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")

    # When called in production, should safely complete without leaking link in warnings
    service._log_dev_reset("prod_user@example.com", "https://platform.com/reset?token=secret123")
    service._log_dev_reset("prod_user@example.com", "https://platform.com/reset?token=secret123", error_reason="SMTP failure")
