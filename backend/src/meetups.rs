use crate::db::DbPool;
use crate::error::AppError;
use crate::types::*;
use axum::{
    extract::{State, Extension, Path},
    Json,
};
use uuid::Uuid;

// Get all mutual matches (no filtering by scheduled status)
pub async fn get_my_matches(
    State(pool): State<DbPool>,
    Extension(user_id): Extension<Uuid>,
) -> Result<Json<MatchesResponse>, AppError> {

    // Get all mutual matches where this user is involved
    let matches = sqlx::query_as::<_, (Uuid, Uuid)>(
        r#"
        SELECT m.user_id_1, m.user_id_2
        FROM matches m
        WHERE (m.user_id_1 = $1 OR m.user_id_2 = $1)
        ORDER BY m.matched_at DESC
        "#
    )
    .bind(user_id)
    .persistent(false)
    .fetch_all(&pool)
    .await?;

    // For each match, get the OTHER user's profile data (Q&A pairs)
    let mut result_matches = Vec::new();
    for (user_id_1, user_id_2) in matches {
        // Determine which user is the "other" user
        let other_user_id = if user_id_1 == user_id {
            user_id_2
        } else {
            user_id_1
        };

        // Get Q&A pairs for the other user
        let qa_pairs = sqlx::query_as::<_, DbQAPair>(
            r#"
            SELECT q.id as question_id, q.question_text, a.answer_text, a.answered_at
            FROM questions q
            JOIN answers a ON a.question_id = q.id
            WHERE q.to_user_id = $1
            ORDER BY a.answered_at DESC
            "#
        )
        .bind(other_user_id)
        .persistent(false)
        .fetch_all(&pool)
        .await?;

        result_matches.push(Match {
            user_id: other_user_id.to_string(),
            qa_pairs: qa_pairs.into_iter().map(|qa| QAPair {
                question_id: qa.question_id.to_string(),
                question_text: qa.question_text,
                answer_text: qa.answer_text,
                answered_at: qa.answered_at.format("%Y-%m-%dT%H:%M:%S%.fZ").to_string(),
            }).collect(),
        });
    }

    Ok(Json(MatchesResponse {
        matches: result_matches,
    }))
}

// Mark a match as having a scheduled meetup
pub async fn mark_meetup_scheduled(
    State(pool): State<DbPool>,
    Extension(current_user_id): Extension<Uuid>,
    Json(request): Json<ScheduleMeetupRequest>,
) -> Result<Json<ScheduleMeetupResponse>, AppError> {

    let other_user_id = Uuid::parse_str(&request.match_user_id)?;
    let user_id_1 = current_user_id;
    let user_id_2 = other_user_id;

    // Ensure user_id_1 < user_id_2 (same ordering as matches table)
    let (sorted_id_1, sorted_id_2) = if user_id_1 < user_id_2 {
        (user_id_1, user_id_2)
    } else {
        (user_id_2, user_id_1)
    };

    // Insert into meetups table
    sqlx::query(
        r#"
        INSERT INTO meetups (match_user_id_1, match_user_id_2)
        VALUES ($1, $2)
        ON CONFLICT (match_user_id_1, match_user_id_2) DO NOTHING
        "#
    )
    .bind(sorted_id_1)
    .bind(sorted_id_2)
    .persistent(false)
    .execute(&pool)
    .await?;

    Ok(Json(ScheduleMeetupResponse {
        success: true,
    }))
}

// Get user info (email) for calendar invite
pub async fn get_match_info(
    State(pool): State<DbPool>,
    Path(user_id): Path<String>,
) -> Result<Json<MatchInfo>, AppError> {
    let user_uuid = Uuid::parse_str(&user_id)?;

    let email = sqlx::query_scalar::<_, String>(
        "SELECT email FROM users WHERE id = $1"
    )
    .bind(user_uuid)
    .persistent(false)
    .fetch_one(&pool)
    .await?;

    Ok(Json(MatchInfo { email }))
}
