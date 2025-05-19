from flask import Flask, render_template, request, redirect, url_for, jsonify
from flask_mail import Mail, Message
from dotenv import load_dotenv
import os
import mysql.connector
import csv

# Load .env file
load_dotenv()

app = Flask(__name__)

# Email config
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = app.config['MAIL_USERNAME']
mail = Mail(app)

# MySQL connection
db = mysql.connector.connect(
    host=os.getenv("DB_HOST"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    database=os.getenv("DB_NAME")
)
cursor = db.cursor()

# Load chatbot data
qa_data = {}
try:
    with open('static/chatbot-dataset.csv', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            question = row['question'].lower().strip()
            answer = row['answer'].strip()
            qa_data[question] = answer
except Exception as e:
    print("❌ Failed to load chatbot CSV:", e)

# Homepage
@app.route('/')
def index():
    success = request.args.get('success')
    return render_template('index.html', success=success)

# Form submission
@app.route('/submit', methods=['POST'])
def submit():
    name = request.form['name']
    email = request.form['email']
    subject = request.form['subject']
    message = request.form['message']

    # Store in database
    query = "INSERT INTO hire_requests (name, email, message) VALUES (%s, %s, %s)"
    cursor.execute(query, (name, email, message))
    db.commit()

    # Email notification
    msg = Message(subject=f"New Hire Request from {name}",
                  sender=email,
                  recipients=[os.getenv("MAIL_USERNAME")])
    msg.body = f"""
    📩 New Message from Portfolio:

    Name: {name}
    Email: {email}
    Subject: {subject}
    Message: {message}
    """
    mail.send(msg)

    return redirect(url_for('index', success='true'))

# Admin login
@app.route('/admin-login', methods=['POST'])
def admin_login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if username == os.getenv("ADMIN_USERNAME") and password == os.getenv("ADMIN_PASSWORD"):
        cursor.execute("SELECT id, name, email, message, submitted_at FROM hire_requests ORDER BY submitted_at DESC")
        rows = cursor.fetchall()
        requests = [{
            'id': r[0],
            'name': r[1],
            'email': r[2],
            'message': r[3],
            'submitted_at': r[4].strftime('%Y-%m-%d %H:%M')
        } for r in rows]
        return jsonify(success=True, requests=requests)
    return jsonify(success=False)

# Chatbot
@app.route('/chat', methods=['POST'])
def chat():
    user_input = request.json.get('message', '').lower().strip()

    if any(greeting in user_input for greeting in ['hello', 'hi', 'hai', 'hey']):
        return jsonify({"response": "Hey! I'm Riya, Babu's Assistant. How can I help you today? 🤖"})

    for question in qa_data:
        if question in user_input:
            return jsonify({"response": qa_data[question]})

    return jsonify({"response": "I'm not sure about that yet. Try asking about skills, projects, or contact info!"})

# Project routes
@app.route('/projects/portfolio')
def show_portfolio_project():
    return render_template('projects/portfolio.html')

@app.route('/projects/ai-chatbot')
def show_aichatbot_project():
    return render_template('projects/ai-chatbot.html')

@app.route('/projects/ai-agent')
def show_aiagent_project():
    return render_template('projects/ai-agent.html')

# Run the app
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
