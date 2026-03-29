use sqlx::{sqlite::SqlitePoolOptions, Pool, Sqlite};
use std::env;

pub type DbPool = Pool<Sqlite>;

pub async fn create_pool() -> Result<DbPool, sqlx::Error> {
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    SqlitePoolOptions::new()
        .max_connections(1)
        .connect(&database_url)
        .await
}
