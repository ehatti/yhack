mod auth;
mod db;
mod email;
mod error;
mod meetups;
mod middleware;
mod profile;
mod questions;
mod starter_questions;
mod types;

use axum::{
    middleware as axum_middleware,
    routing::{get, post},
    Router,
};
use tower_http::cors::{Any, CorsLayer};

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    // Load environment variables
    dotenvy::dotenv().ok();

    // Create database pool
    let pool = db::create_pool()
        .await
        .expect("Failed to create database pool");

    // Set up CORS
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Public routes (no authentication required)
    let public_routes = Router::new()
        .route("/auth/request-magic-link", post(auth::request_magic_link))
        .route("/auth/verify", post(auth::verify_session));

    // Protected routes (authentication required)
    let protected_routes = Router::new()
        .route("/feed", get(profile::get_feed))
        .route("/profile/me", get(profile::get_my_profile))
        .route("/profile/:user_id/skip", post(profile::skip_profile))
        .route("/profile/:user_id/match", post(profile::match_profile))
        .route("/profile/:user_id/ask", post(profile::ask_question))
        .route("/questions/inbox", get(questions::get_question_inbox))
        .route("/questions/:question_id/answer", post(questions::answer_question))
        .route("/questions/:question_id/decline", post(questions::decline_question))
        .route("/meetups", get(meetups::get_my_matches))
        .route("/meetups/schedule", post(meetups::mark_meetup_scheduled))
        .route("/users/:user_id/info", get(meetups::get_match_info))
        .layer(axum_middleware::from_fn_with_state(
            pool.clone(),
            middleware::auth_middleware,
        ));

    // Combine routes
    let app = Router::new()
        .route("/", get(|| async { "Service healthy" }))
        .nest("/public", public_routes)
        .nest("/protected", protected_routes)
        .layer(cors)
        .with_state(pool);

    // Start server
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000")
        .await
        .expect("Failed to bind to port 3000");

    println!("Server running on http://0.0.0.0:3000");

    axum::serve(listener, app)
        .await
        .expect("Failed to start server");
}
