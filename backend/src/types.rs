use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use typeshare::typeshare;
use uuid::Uuid;

// Auth types
#[typeshare]
#[derive(Debug, Serialize, Deserialize)]
pub struct RequestMagicLinkRequest {
    pub email: String,
}

#[typeshare]
#[derive(Debug, Serialize, Deserialize)]
pub struct RequestMagicLinkResponse {
    pub success: bool,
}

#[typeshare]
#[derive(Debug, Serialize, Deserialize)]
pub struct VerifySessionRequest {
    pub session_id: String,
}

#[typeshare]
#[derive(Debug, Serialize, Deserialize)]
pub struct VerifySessionResponse {
    pub user_id: String,
}

// Profile types
#[typeshare]
#[derive(Debug, Serialize, Deserialize)]
pub struct QAPair {
    pub question_id: String,
    pub question_text: String,
    pub answer_text: String,
    pub answered_at: String,
}

#[typeshare]
#[derive(Debug, Serialize, Deserialize)]
pub struct Profile {
    pub user_id: String,
    pub qa_pairs: Vec<QAPair>,
}

#[typeshare]
#[derive(Debug, Serialize, Deserialize)]
pub struct FeedResponse {
    pub profiles: Vec<Profile>,
}

// Question types
#[typeshare]
#[derive(Debug, Serialize, Deserialize)]
pub struct AskQuestionRequest {
    pub question_text: String,
}

#[typeshare]
#[derive(Debug, Serialize, Deserialize)]
pub struct Question {
    pub question_id: String,
    pub question_text: String,
    pub created_at: String,
}

#[typeshare]
#[derive(Debug, Serialize, Deserialize)]
pub struct QuestionInboxResponse {
    pub questions: Vec<Question>,
}

#[typeshare]
#[derive(Debug, Serialize, Deserialize)]
pub struct AnswerQuestionRequest {
    pub answer_text: String,
}

#[typeshare]
#[derive(Debug, Serialize, Deserialize)]
pub struct MyProfileResponse {
    pub qa_pairs: Vec<QAPair>,
}

// Generic success response
#[typeshare]
#[derive(Debug, Serialize, Deserialize)]
pub struct SuccessResponse {
    pub success: bool,
}

// Meetup types
#[typeshare]
#[derive(Debug, Serialize, Deserialize)]
pub struct Match {
    pub user_id: String,
    pub qa_pairs: Vec<QAPair>,
}

#[typeshare]
#[derive(Debug, Serialize, Deserialize)]
pub struct MatchesResponse {
    pub matches: Vec<Match>,
}

#[typeshare]
#[derive(Debug, Serialize, Deserialize)]
pub struct ScheduleMeetupRequest {
    pub match_user_id: String,
}

#[typeshare]
#[derive(Debug, Serialize, Deserialize)]
pub struct ScheduleMeetupResponse {
    pub success: bool,
}

#[typeshare]
#[derive(Debug, Serialize, Deserialize)]
pub struct MatchInfo {
    pub email: String,
}

// Internal database types (not shared with frontend)
#[derive(Debug, sqlx::FromRow)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub created_at: NaiveDateTime,
}

#[derive(Debug, sqlx::FromRow)]
pub struct Session {
    pub id: Uuid,
    pub user_id: Uuid,
    pub created_at: NaiveDateTime,
}

#[derive(Debug, sqlx::FromRow)]
pub struct DbQuestion {
    pub id: Uuid,
    pub from_user_id: Uuid,
    pub to_user_id: Uuid,
    pub question_text: String,
    pub created_at: NaiveDateTime,
}

#[derive(Debug, sqlx::FromRow)]
pub struct DbAnswer {
    pub id: Uuid,
    pub question_id: Uuid,
    pub answer_text: String,
    pub answered_at: NaiveDateTime,
}

#[derive(Debug, sqlx::FromRow)]
pub struct DbQAPair {
    pub question_id: Uuid,
    pub question_text: String,
    pub answer_text: String,
    pub answered_at: NaiveDateTime,
}
