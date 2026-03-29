use crate::db::DbPool;
use crate::error::AppError;
use crate::types::*;
use axum::{
    extract::{Path, State, Extension},
    Json,
};
use uuid::Uuid;

pub async fn get_question_inbox(
    State(pool): State<DbPool>,
    Extension(user_id): Extension<Uuid>,
) -> Result<Json<QuestionInboxResponse>, AppError> {

    // Get unanswered questions directed at this user
    let questions = sqlx::query_as::<_, DbQuestion>(
        r#"
        SELECT q.*
        FROM questions q
        WHERE q.to_user_id = $1
          AND NOT EXISTS(SELECT 1 FROM answers a WHERE a.question_id = q.id)
        ORDER BY q.created_at DESC
        "#
    )
    .bind(user_id)
    .persistent(false)
    .fetch_all(&pool)
    .await?;

    Ok(Json(QuestionInboxResponse {
        questions: questions.into_iter().map(|q| Question {
            question_id: q.id.to_string(),
            question_text: q.question_text,
            created_at: q.created_at.format("%Y-%m-%dT%H:%M:%S%.fZ").to_string(),
        }).collect(),
    }))
}

pub async fn answer_question(
    State(pool): State<DbPool>,
    Extension(user_id): Extension<Uuid>,
    Path(question_id): Path<String>,
    Json(payload): Json<AnswerQuestionRequest>,
) -> Result<Json<SuccessResponse>, AppError> {
    let q_id = Uuid::parse_str(&question_id)?;

    // Verify the question is directed at this user
    let question = sqlx::query_as::<_, DbQuestion>(
        "SELECT * FROM questions WHERE id = $1"
    )
    .bind(q_id)
    .persistent(false)
    .fetch_one(&pool)
    .await?;

    if question.to_user_id != user_id {
        return Err(anyhow::anyhow!("Forbidden: question not directed at this user").into());
    }

    // Create answer
    let answer_id = Uuid::new_v4();
    sqlx::query(
        "INSERT INTO answers (id, question_id, answer_text) VALUES ($1, $2, $3)"
    )
    .bind(answer_id)
    .bind(q_id)
    .bind(&payload.answer_text)
    .persistent(false)
    .execute(&pool)
    .await?;

    // Profile refresh happens automatically via the feed query logic
    // (users who viewed this profile will see it again because answered_at > viewed_at)

    Ok(Json(SuccessResponse { success: true }))
}

pub async fn decline_question(
    State(pool): State<DbPool>,
    Extension(user_id): Extension<Uuid>,
    Path(question_id): Path<String>,
) -> Result<Json<SuccessResponse>, AppError> {
    let q_id = Uuid::parse_str(&question_id)?;

    // Verify the question is directed at this user
    let question = sqlx::query_as::<_, DbQuestion>(
        "SELECT * FROM questions WHERE id = $1"
    )
    .bind(q_id)
    .persistent(false)
    .fetch_one(&pool)
    .await?;

    if question.to_user_id != user_id {
        return Err(anyhow::anyhow!("Forbidden: question not directed at this user").into());
    }

    // Delete the question (declining means we don't answer it)
    sqlx::query("DELETE FROM questions WHERE id = $1")
        .bind(q_id)
        .persistent(false)
        .execute(&pool)
        .await?;

    // No profile refresh happens when declining

    Ok(Json(SuccessResponse { success: true }))
}
