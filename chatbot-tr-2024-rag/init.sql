CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS documents (
  id INT PRIMARY KEY,
  content text,
  title text,
  post_date date,
  article_url text
);

CREATE TABLE IF NOT EXISTS embeddings (
  id INT,
  embedding vector(1024)
);