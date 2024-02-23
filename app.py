from flask import Flask, request, render_template_string
import requests
from bs4 import BeautifulSoup
from collections import Counter, defaultdict

app = Flask(__name__)

HTML = '''
<!doctype html>
<html>
<head>
    <title>Webpage Analyzer</title>
</head>
<body>
<h1>Enter URL to analyze heading tags, their words, and duplicate H1 content</h1>
<form method="post">
    <input type="text" name="url" placeholder="https://example.com" required>
    <input type="submit" value="Analyze">
</form>
{% if headings %}
    <h2>Heading Tags Analysis</h2>
    {% for tag, count in headings.items() %}
        <p>{{ tag.upper() }}: {{ count }} {{ 'tag found' if count == 1 else 'tags found' }}</p>
        {% if words_in_tags[tag] %}
            <p>Words in {{ tag.upper() }}:</p>
            <ul>
            {% for word in words_in_tags[tag] %}
                <li>{{ word }}</li>
            {% endfor %}
            </ul>
        {% endif %}
    {% endfor %}
{% endif %}
{% if duplicate_h1 %}
    <h2 style="color: red;">Duplicate H1 Tags Detected</h2>
    <p>Duplicate words in H1 tags:</p>
    <ul>
    {% for word in duplicate_words %}
        <li>{{ word }}</li>
    {% endfor %}
    </ul>
{% elif duplicate_h1 == False %}
    <h2>No Duplicate H1 Tags</h2>
{% endif %}
</body>
</html>
'''

@app.route('/', methods=['GET', 'POST'])
def analyze():
    if request.method == 'POST':
        url = request.form['url']
        # Ensure the URL includes the scheme
        if not url.startswith(('http://', 'https://')):
            url = 'http://' + url

        try:
            page_content = requests.get(url).text
            soup = BeautifulSoup(page_content, 'html.parser')
            
            # Initialize structures for counting and tracking words in headings
            headings_count = {f'h{i}': 0 for i in range(1, 7)}
            words_in_tags = defaultdict(list)
            h1_texts = []
            
            # Process each heading
            for i in range(1, 7):
                tag = f'h{i}'
                tags = soup.find_all(tag)
                headings_count[tag] = len(tags)
                
                # Extract words from each tag if not empty
                for t in tags:
                    text = t.get_text().strip()
                    if text:  # Ensure text is not empty
                        words = text.split()
                        words_in_tags[tag].extend(words)
                        if i == 1:
                            h1_texts.append(text)
            
            # Check for duplicate H1 tags and words
            duplicate_h1 = headings_count['h1'] > 1
            duplicate_words = []
            if duplicate_h1:
                word_counts = Counter(' '.join(h1_texts).split())
                duplicate_words = [word for word, count in word_counts.items() if count > 1]
            
            return render_template_string(HTML, headings=headings_count, duplicate_h1=duplicate_h1, duplicate_words=duplicate_words, words_in_tags=words_in_tags)
        except requests.exceptions.RequestException as e:
            return render_template_string(HTML, error=str(e), headings=None, duplicate_h1=None, words_in_tags=None)

    return render_template_string(HTML, headings=None, duplicate_h1=None, words_in_tags=None)

if __name__ == '__main__':
    app.run(debug=True)
