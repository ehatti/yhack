use crate::db::DbPool;
use crate::email::send_magic_link;
use crate::error::AppError;
use crate::starter_questions::STARTER_QUESTIONS;
use crate::types::*;
use axum::{
    extract::State,
    Json,
};
use uuid::Uuid;

pub async fn request_magic_link(
    State(pool): State<DbPool>,
    Json(payload): Json<RequestMagicLinkRequest>,
) -> Result<Json<RequestMagicLinkResponse>, AppError> {
    // Create or get user
    // SQLite doesn't support RETURNING with ON CONFLICT, so we need to split this into two operations
    let user_id = Uuid::new_v4();
    let result = sqlx::query(
        "INSERT INTO users (id, email) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING"
    )
    .persistent(false)
    .bind(user_id)
    .bind(&payload.email)
    .execute(&pool)
    .await?;

    // Check if this was a new user (rows_affected > 0 means INSERT succeeded)
    let is_new_user = result.rows_affected() > 0;

    // Fetch the user (either just created or already existing)
    let user = sqlx::query_as::<_, User>(
        "SELECT * FROM users WHERE email = $1"
    )
    .persistent(false)
    .bind(&payload.email)
    .fetch_one(&pool)
    .await?;

    // If this is a new user, seed starter questions
    if is_new_user {
        let system_user_id = get_or_create_system_user(&pool).await?;
        seed_starter_questions(&pool, user.id, system_user_id).await?;
    }

    // Create session
    let session_id = Uuid::new_v4();
    sqlx::query(
        "INSERT INTO sessions (id, user_id) VALUES ($1, $2)"
    )
    .persistent(false)
    .bind(session_id)
    .bind(user.id)
    .execute(&pool)
    .await?;

    // Send magic link email
    send_magic_link(&payload.email, &session_id.to_string()).await?;

    Ok(Json(RequestMagicLinkResponse { success: true }))
}

pub async fn verify_session(
    State(pool): State<DbPool>,
    Json(payload): Json<VerifySessionRequest>,
) -> Result<Json<VerifySessionResponse>, AppError> {
    let session_id = Uuid::parse_str(&payload.session_id)?;

    // Get session and verify it exists
    let session = sqlx::query_as::<_, Session>(
        "SELECT * FROM sessions WHERE id = $1"
    )
    .bind(session_id)
    .persistent(false)
    .fetch_one(&pool)
    .await?;

    Ok(Json(VerifySessionResponse {
        user_id: session.user_id.to_string(),
    }))
}

// Helper function to get or create the system user
async fn get_or_create_system_user(pool: &DbPool) -> Result<Uuid, AppError> {
    const SYSTEM_EMAIL: &str = "system@internal";

    // Try to get existing system user
    let existing_user = sqlx::query_as::<_, User>(
        "SELECT * FROM users WHERE email = $1"
    )
    .bind(SYSTEM_EMAIL)
    .persistent(false)
    .fetch_optional(pool)
    .await?;

    if let Some(user) = existing_user {
        return Ok(user.id);
    }

    // Create system user if it doesn't exist
    let system_user_id = Uuid::new_v4();
    sqlx::query(
        "INSERT INTO users (id, email) VALUES ($1, $2)"
    )
    .bind(system_user_id)
    .bind(SYSTEM_EMAIL)
    .persistent(false)
    .execute(pool)
    .await?;

    Ok(system_user_id)
}

// Seed starter questions for a new user
async fn seed_starter_questions(
    pool: &DbPool,
    user_id: Uuid,
    system_user_id: Uuid,
) -> Result<(), AppError> {
    for question_text in STARTER_QUESTIONS {
        let question_id = Uuid::new_v4();
        sqlx::query(
            "INSERT INTO questions (id, from_user_id, to_user_id, question_text) VALUES ($1, $2, $3, $4)"
        )
        .bind(question_id)
        .bind(system_user_id)
        .bind(user_id)
        .bind(question_text)
        .persistent(false)
        .execute(pool)
        .await?;
    }
    Ok(())
}
