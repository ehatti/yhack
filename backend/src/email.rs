use crate::error::AppError;
use reqwest;
use serde_json::json;
use std::env;

pub async fn send_magic_link(to_email: &str, session_id: &str) -> Result<(), AppError> {
    // Get Resend API key from environment
    let api_key = env::var("RESEND_API_KEY")?;
    let from_email = env::var("FROM_EMAIL").unwrap_or_else(|_| "onboarding@resend.dev".to_string());
    let frontend_url = env::var("FRONTEND_URL").unwrap_or_else(|_| "http://localhost:5173".to_string());

    // Construct magic link
    let magic_link = format!("{}/auth/verify?session_id={}", frontend_url, session_id);

    // Create HTTP client
    let client = reqwest::Client::new();

    // Send email via Resend API
    let response = client
        .post("https://api.resend.com/emails")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&json!({
            "from": from_email,
            "to": [to_email],
            "subject": "Your magic link to sign in",
            "html": format!("<p>Click this link to sign in:</p><p><a href=\"{}\">Sign In</a></p>", magic_link),
        }))
        .send()
        .await?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(anyhow::anyhow!("Resend API error {}: {}", status, body).into());
    }

    Ok(())
}
