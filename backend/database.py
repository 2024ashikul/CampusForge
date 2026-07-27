import os
import sqlite3
from contextlib import contextmanager
from types import SimpleNamespace
from typing import Any, Generator, Sequence
from urllib.parse import urlparse


class Database:

    def __init__(self):
        self.mysql = bool(os.getenv("DATABASE_URL") or os.getenv("MYSQL_HOST"))
        self.conn = self._connect()

    def _connect(self):
        if self.mysql:
            try:
                import pymysql

                url = urlparse(os.getenv("DATABASE_URL", ""))
                mysql_settings = {
                    "host": url.hostname or os.getenv("MYSQL_HOST", "localhost"),
                    "port": url.port or int(os.getenv("MYSQL_PORT", "3306")),
                    "user": url.username or os.getenv("MYSQL_USER", "root"),
                    "password": url.password or os.getenv("MYSQL_PASSWORD", ""),
                    "database": (url.path.lstrip("/") if url.path else None)
                    or os.getenv("MYSQL_DB", "campusforge"),
                }
                return pymysql.connect(
                    **mysql_settings, autocommit=False, cursorclass=pymysql.cursors.DictCursor
                )
            except Exception as exc:
                print(f"[DB Warning] MySQL unavailable ({exc}); using SQLite.")
                self.mysql = False
        sqlite_path = os.getenv(
            "SQLITE_DATABASE_PATH",
            os.path.join(os.path.dirname(__file__), "campusforge.db"),
        )
        
        
        
        
        connection = sqlite3.connect(sqlite_path, check_same_thread=False)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        return connection

    def _sql(self, sql: str) -> str:
        return sql.replace("?", "%s") if self.mysql else sql

    def execute(self, sql: str, params: Sequence[Any] = ()) -> Any:
        cursor = self.conn.cursor()
        cursor.execute(self._sql(sql), params)
        return cursor

    def one(self, sql: str, params: Sequence[Any] = ()) -> SimpleNamespace | None:
        cursor = self.execute(sql, params)
        row = cursor.fetchone()
        return self._row(row)

    def all(self, sql: str, params: Sequence[Any] = ()) -> list[SimpleNamespace]:
        cursor = self.execute(sql, params)
        return [self._row(row) for row in cursor.fetchall()]

    @staticmethod
    def _row(row: Any) -> SimpleNamespace | None:
        if row is None:
            return None
        return SimpleNamespace(**dict(row))

    def commit(self):
        self.conn.commit()

    def rollback(self):
        self.conn.rollback()

    def close(self):
        self.conn.close()


def get_db() -> Generator[Database, None, None]:
    db = Database()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@contextmanager
def connection():
    db = Database()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
