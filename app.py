import sqlite3
from flask import Flask, request, redirect, url_for, render_template
import requests
from readability import Document

app = Flask(__name__)
DB_PATH = 'articles.db'

def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute(
            'CREATE TABLE IF NOT EXISTS articles ('
            'id INTEGER PRIMARY KEY AUTOINCREMENT, '
            'url TEXT NOT NULL, '
            'title TEXT NOT NULL, '
            'content TEXT NOT NULL)'
        )
        conn.commit()

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        url = request.form['url']
        resp = requests.get(url)
        doc = Document(resp.text)
        title = doc.short_title()
        content = doc.summary(html=True)
        with sqlite3.connect(DB_PATH) as conn:
            c = conn.cursor()
            c.execute(
                'INSERT INTO articles (url, title, content) VALUES (?, ?, ?)',
                (url, title, content)
            )
            article_id = c.lastrowid
            conn.commit()
        return redirect(url_for('article', article_id=article_id))

    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute('SELECT id, title FROM articles ORDER BY id DESC')
        articles = c.fetchall()
    return render_template('index.html', articles=articles)

@app.route('/article/<int:article_id>')
def article(article_id):
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute('SELECT title, content FROM articles WHERE id=?', (article_id,))
        row = c.fetchone()
    if row is None:
        return 'Article not found', 404
    title, content = row
    return render_template('article.html', title=title, content=content)

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
