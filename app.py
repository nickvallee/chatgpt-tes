import re
import sqlite3
from contextlib import closing
from typing import List, Tuple

import requests
from bs4 import BeautifulSoup
from flask import Flask, redirect, render_template, request, url_for

app = Flask(__name__)
DB_PATH = "articles.db"


def init_db() -> None:
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS articles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                url TEXT NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL
            )
            """
        )
        conn.commit()


def normalise_url(url: str) -> str:
    url = url.strip()
    if not url:
        return url
    if not re.match(r"^https?://", url):
        return f"https://{url}"
    return url


def fetch_article(url: str) -> Tuple[str, List[str]]:
    response = requests.get(
        url,
        timeout=20,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"
            )
        },
    )
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html5lib")

    for tag in soup(["script", "style", "noscript", "iframe", "form"]):
        tag.decompose()

    for selector in [
        "[class*='advert']",
        "[class*='ad-']",
        "[id*='advert']",
        "[id*='ad-']",
        "[class*='subscribe']",
        "[id*='subscribe']",
        "[class*='promo']",
        "[id*='promo']",
        "[class*='social']",
        "[class*='breadcrumb']",
        "[class*='footer']",
        "[id*='footer']",
        "[class*='header']",
        "[id*='header']",
        "[class*='nav']",
        "[id*='nav']",
    ]:
        for element in soup.select(selector):
            if element.name not in {"article", "main"}:
                element.decompose()

    title = extract_title(soup)
    main_content = select_main_content(soup)
    paragraphs = to_paragraphs(main_content)

    if not paragraphs:
        raise ValueError("Could not extract readable text from the article.")

    return title, paragraphs


def extract_title(soup: BeautifulSoup) -> str:
    if soup.title and soup.title.string:
        return soup.title.string.strip()
    og_title = soup.find("meta", property="og:title")
    if og_title and og_title.get("content"):
        return og_title["content"].strip()
    twitter_title = soup.find("meta", attrs={"name": "twitter:title"})
    if twitter_title and twitter_title.get("content"):
        return twitter_title["content"].strip()
    return "Untitled article"


def select_main_content(soup: BeautifulSoup):
    for candidate in (soup.find("article"), soup.find("main")):
        if candidate:
            return candidate

    candidates = []
    for tag in soup.find_all(["section", "div"], recursive=True):
        text = tag.get_text(" ", strip=True)
        word_count = len(text.split())
        if word_count >= 120:
            candidates.append((word_count, tag))
    if candidates:
        candidates.sort(key=lambda item: item[0], reverse=True)
        return candidates[0][1]

    return soup.body or soup


def to_paragraphs(node) -> List[str]:
    paragraphs = [
        re.sub(r"\s+", " ", p.get_text(" ", strip=True))
        for p in node.find_all("p")
    ]
    paragraphs = [p for p in paragraphs if len(p) > 40]

    if not paragraphs:
        text = node.get_text("\n", strip=True)
        chunks = re.split(r"\n{2,}", text)
        paragraphs = [re.sub(r"\s+", " ", chunk).strip() for chunk in chunks if chunk.strip()]

    return paragraphs


@app.route("/", methods=["GET", "POST"])
def index():
    error = None
    if request.method == "POST":
        url = normalise_url(request.form.get("url", ""))
        if not url:
            error = "Please provide a valid URL."
        else:
            try:
                title, paragraphs = fetch_article(url)
            except requests.RequestException as exc:
                error = f"Failed to download article: {exc}"  # pragma: no cover
            except ValueError as exc:
                error = str(exc)
            else:
                content = "\n\n".join(paragraphs)
                with sqlite3.connect(DB_PATH) as conn:
                    cursor = conn.cursor()
                    cursor.execute(
                        "INSERT INTO articles (url, title, content) VALUES (?, ?, ?)",
                        (url, title, content),
                    )
                    article_id = cursor.lastrowid
                    conn.commit()
                return redirect(url_for("article", article_id=article_id))

    with closing(sqlite3.connect(DB_PATH)) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, title FROM articles ORDER BY id DESC")
        articles = cursor.fetchall()

    return render_template("index.html", articles=articles, error=error)


@app.route("/article/<int:article_id>")
def article(article_id: int):
    with closing(sqlite3.connect(DB_PATH)) as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT title, content FROM articles WHERE id = ?", (article_id,)
        )
        row = cursor.fetchone()

    if row is None:
        return "Article not found", 404

    title, content = row
    paragraphs = [p for p in content.split("\n\n") if p.strip()]
    return render_template("article.html", title=title, paragraphs=paragraphs)


init_db()

if __name__ == "__main__":
    app.run(debug=True)
