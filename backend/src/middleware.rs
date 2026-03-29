use crate::db::DbPool;
use crate::error::AppError;
use crate::types::Session;
use axum::{
    body::Body,
    extract::{Request, State},
    middleware::Next,
    response::Response,
};
use uuid::Uuid;

pub async fn auth_middleware(
    State(pool): State<DbPool>,
    mut request: Request<Body>,
    next: Next,
) -> Result<Response, AppError> {
    // Extract Bearer token from Authorization header
    let token = request
        .headers()
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "))
        .ok_or_else(|| anyhow::anyhow!("Missing or invalid Authorization header"))?;

    // Parse session ID
    let session_id = Uuid::parse_str(token)?;

    // Verify session exists in database
    let session = sqlx::query_as::<_, Session>("SELECT * FROM sessions WHERE id = $1")
        .bind(session_id)
        .fetch_one(&pool)
        .await?;

    // Insert user_id into request extensions
    request.extensions_mut().insert(session.user_id);

    // Continue to the handler
    Ok(next.run(request).await)
}
