"""Alembic environment — async SQLAlchemy setup for UPI Sentinel.

Usage:
  # Generate initial migration (offline, using declared metadata):
  python -m alembic revision --autogenerate -m "initial_schema"

  # Apply migrations:
  python -m alembic upgrade head

  # Roll back one step:
  python -m alembic downgrade -1

Notes:
  - When DATABASE_URL is not set, migrations target the SQLite fallback DB.
  - When DATABASE_URL points to PostgreSQL, ensure Postgres is running before
    running alembic commands.
"""
from __future__ import annotations

import asyncio
import os
from logging.config import fileConfig

from sqlalchemy import pool, text
from sqlalchemy.ext.asyncio import create_async_engine

from alembic import context

# ─── Alembic config ───────────────────────────────────────────────────────────
config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ─── Models & metadata ────────────────────────────────────────────────────────
from app.database.models import Base  # noqa: E402

target_metadata = Base.metadata


# ─── Database URL resolution ──────────────────────────────────────────────────

def get_url() -> str:
    """
    Resolve the database URL for migrations.

    Priority:
      1. DATABASE_URL environment variable (set in .env)
      2. sqlite+aiosqlite:///./upi_sentinel.db (safe offline default)
    """
    db_url = os.environ.get("DATABASE_URL", "")
    if db_url:
        return db_url
    # Safe fallback — SQLite works without a running server
    return "sqlite+aiosqlite:///./upi_sentinel.db"


# ─── Offline mode (generates SQL without connecting) ─────────────────────────

def run_migrations_offline() -> None:
    """
    Run migrations in 'offline' mode.
    Generates SQL to stdout/file without requiring a live DB connection.
    """
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=True,  # required for SQLite ALTER support
    )

    with context.begin_transaction():
        context.run_migrations()


# ─── Online mode (applies migrations against live DB) ────────────────────────

def do_run_migrations(connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        render_as_batch=True,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Create an async engine and apply pending migrations."""
    url = get_url()
    connectable = create_async_engine(url, poolclass=pool.NullPool)

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


# ─── Entry point ─────────────────────────────────────────────────────────────

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
