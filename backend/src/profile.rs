use crate::db::DbPool;
use crate::error::AppError;
use crate::types::*;
use axum::{
    extract::{Path, State, Extension},
    Json,
};
use uuid::Uuid;

pub async fn get_feed(
    State(pool): State<DbPool>,
    Extension(viewer_id): Extension<Uuid>,
) -> Result<Json<FeedResponse>, AppError> {

    // Get profiles that should appear in feed:
    // 1. Not viewed by me, OR
    // 2. Viewed by me BUT they've answered a question since I last viewed, OR
    // 3. Viewed by me BUT they've matched with me since I last viewed
    // Prioritize users who have matched with me
    let profiles = sqlx::query_as::<_, (Uuid, Option<bool>)>(
        r#"
        SELECT DISTINCT u.id,
               EXISTS(
                   SELECT 1 FROM matches m
                   WHERE (m.user_id_1 = $1 AND m.user_id_2 = u.id)
                      OR (m.user_id_2 = $1 AND m.user_id_1 = u.id)
               ) as has_matched
        FROM users u
        WHERE u.id != $1
          AND u.email != 'system@internal'
          AND (
              NOT EXISTS(SELECT 1 FROM profile_views pv WHERE pv.viewer_id = $1 AND pv.viewed_id = u.id)
              OR EXISTS(
                  SELECT 1 FROM answers a
                  JOIN questions q ON q.id = a.question_id
                  WHERE q.to_user_id = u.id
                    AND a.answered_at > (SELECT viewed_at FROM profile_views WHERE viewer_id = $1 AND viewed_id = u.id)
              )
              OR EXISTS(
                  SELECT 1 FROM matches m
                  WHERE ((m.user_id_1 = u.id AND m.user_id_2 = $1) OR (m.user_id_2 = u.id AND m.user_id_1 = $1))
                    AND m.matched_at > (SELECT viewed_at FROM profile_views WHERE viewer_id = $1 AND viewed_id = u.id)
              )
          )
        ORDER BY has_matched IS NULL, has_matched DESC, u.created_at DESC
        LIMIT 50
        "#
    )
    .bind(viewer_id)
    .persistent(false)
    .fetch_all(&pool)
    .await?;

    // For each profile, get their Q&A pairs
    let mut result_profiles = Vec::new();
    for (user_id, _) in profiles {
        let qa_pairs = sqlx::query_as::<_, DbQAPair>(
            r#"
            SELECT q.id as question_id, q.question_text, a.answer_text, a.answered_at
            FROM questions q
            JOIN answers a ON a.question_id = q.id
            WHERE q.to_user_id = $1
            ORDER BY a.answered_at DESC
            "#
        )
        .bind(user_id)
        .persistent(false)
        .fetch_all(&pool)
        .await?;

        result_profiles.push(Profile {
            user_id: user_id.to_string(),
            qa_pairs: qa_pairs.into_iter().map(|qa| QAPair {
                question_id: qa.question_id.to_string(),
                question_text: qa.question_text,
                answer_text: qa.answer_text,
                answered_at: qa.answered_at.format("%Y-%m-%dT%H:%M:%S%.fZ").to_string(),
            }).collect(),
        });
    }

    Ok(Json(FeedResponse {
        profiles: result_profiles,
    }))
}

pub async fn skip_profile(
    State(pool): State<DbPool>,
    Extension(viewer_id): Extension<Uuid>,
    Path(viewed_user_id): Path<String>,
) -> Result<Json<SuccessResponse>, AppError> {
    let viewed_id = Uuid::parse_str(&viewed_user_id)?;

    // Record view
    sqlx::query(
        r#"
        INSERT INTO profile_views (viewer_id, viewed_id, viewed_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (viewer_id, viewed_id)
        DO UPDATE SET viewed_at = CURRENT_TIMESTAMP
        "#
    )
    .bind(viewer_id)
    .bind(viewed_id)
    .persistent(false)
    .execute(&pool)
    .await?;

    Ok(Json(SuccessResponse { success: true }))
}

pub async fn match_profile(
    State(pool): State<DbPool>,
    Extension(user_id): Extension<Uuid>,
    Path(other_user_id): Path<String>,
) -> Result<Json<SuccessResponse>, AppError> {
    let other_id = Uuid::parse_str(&other_user_id)?;

    // Record view
    sqlx::query(
        r#"
        INSERT INTO profile_views (viewer_id, viewed_id, viewed_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (viewer_id, viewed_id)
        DO UPDATE SET viewed_at = CURRENT_TIMESTAMP
        "#
    )
    .bind(user_id)
    .bind(other_id)
    .persistent(false)
    .execute(&pool)
    .await?;

    // Create match (ensuring user_id_1 < user_id_2)
    let (user1, user2) = if user_id < other_id {
        (user_id, other_id)
    } else {
        (other_id, user_id)
    };

    sqlx::query(
        r#"
        INSERT INTO matches (user_id_1, user_id_2, matched_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id_1, user_id_2) DO NOTHING
        "#
    )
    .bind(user1)
    .bind(user2)
    .persistent(false)
    .execute(&pool)
    .await?;

    // Check if mutual match
    let is_mutual = sqlx::query_scalar::<_, bool>(
        "SELECT COUNT(*) = 2 FROM matches WHERE (user_id_1 = $1 AND user_id_2 = $2)"
    )
    .bind(user1)
    .bind(user2)
    .persistent(false)
    .fetch_one(&pool)
    .await
    .unwrap_or(false);

    if is_mutual {
        // Trigger no-op match handler
        handle_mutual_match(user_id, other_id).await;
    }

    Ok(Json(SuccessResponse { success: true }))
}

pub async fn ask_question(
    State(pool): State<DbPool>,
    Extension(from_user_id): Extension<Uuid>,
    Path(to_user_id): Path<String>,
    Json(payload): Json<AskQuestionRequest>,
) -> Result<Json<SuccessResponse>, AppError> {
    let to_id = Uuid::parse_str(&to_user_id)?;

    // Record view
    sqlx::query(
        r#"
        INSERT INTO profile_views (viewer_id, viewed_id, viewed_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (viewer_id, viewed_id)
        DO UPDATE SET viewed_at = CURRENT_TIMESTAMP
        "#
    )
    .bind(from_user_id)
    .bind(to_id)
    .persistent(false)
    .execute(&pool)
    .await?;

    // Create question
    let question_id = Uuid::new_v4();
    sqlx::query(
        "INSERT INTO questions (id, from_user_id, to_user_id, question_text) VALUES ($1, $2, $3, $4)"
    )
    .bind(question_id)
    .bind(from_user_id)
    .bind(to_id)
    .bind(&payload.question_text)
    .persistent(false)
    .execute(&pool)
    .await?;

    Ok(Json(SuccessResponse { success: true }))
}

pub async fn get_my_profile(
    State(pool): State<DbPool>,
    Extension(user_id): Extension<Uuid>,
) -> Result<Json<MyProfileResponse>, AppError> {

    let qa_pairs = sqlx::query_as::<_, DbQAPair>(
        r#"
        SELECT q.id as question_id, q.question_text, a.answer_text, a.answered_at
        FROM questions q
        JOIN answers a ON a.question_id = q.id
        WHERE q.to_user_id = $1
        ORDER BY a.answered_at DESC
        "#
    )
    .bind(user_id)
    .persistent(false)
    .fetch_all(&pool)
    .await?;

    Ok(Json(MyProfileResponse {
        qa_pairs: qa_pairs.into_iter().map(|qa| QAPair {
            question_id: qa.question_id.to_string(),
            question_text: qa.question_text,
            answer_text: qa.answer_text,
            answered_at: qa.answered_at.format("%Y-%m-%dT%H:%M:%S%.fZ").to_string(),
        }).collect(),
    }))
}

// No-op match handler (placeholder for future functionality)
async fn handle_mutual_match(_user1: Uuid, _user2: Uuid) {
    // TODO: Implement match handling (e.g., exchange contact info, set up date)
}
