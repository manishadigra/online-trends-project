from flask import Flask, jsonify, render_template, request
import sqlite3
import pandas as pd

app = Flask(__name__)

DATABASE = 'online_trends.db' # Your database file name

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row # This makes rows behave like dictionaries
    return conn

@app.route('/')
def home():
    # This tells Flask to find 'index.html' in the 'templates' folder
    return render_template('index.html')

@app.route('/api/trends')
def get_all_trends():
    conn = get_db_connection()
    # Fetch all data from the weekly_trends table
    # We'll order by fetch_date to ensure latest data is prominent
    query = "SELECT * FROM weekly_trends ORDER BY fetch_date DESC, geoName ASC, keyword ASC"
    df = pd.read_sql_query(query, conn)
    conn.close()

    # Convert DataFrame to a list of dictionaries (JSON format)
    return jsonify(df.to_dict(orient='records'))

@app.route('/api/trends/history')
def get_historical_trends():
    # Get query parameters from the request
    keyword = request.args.get('keyword')
    region = request.args.get('region')
    category = request.args.get('category')
    platform = request.args.get('platform')

    conn = get_db_connection()
    
    # Base query
    query = "SELECT geoName, keyword, interest_score, fetch_date, category, platform, data_source FROM weekly_trends WHERE 1=1"
    params = []

    # Add filters based on provided parameters
    if keyword:
        query += " AND keyword = ?"
        params.append(keyword)
    if region:
        query += " AND geoName = ?"
        params.append(region)
    if category:
        query += " AND category = ?"
        params.append(category)
    if platform:
        query += " AND platform = ?"
        params.append(platform)

    # Order by fetch_date to see trends over time
    query += " ORDER BY fetch_date ASC"

    df = pd.read_sql_query(query, conn, params=params)
    conn.close()

    if df.empty:
        # Return a more descriptive message for 404
        return jsonify({"message": "No historical data found for the given criteria. Try broader terms or ensure data exists."}), 404
    
    return jsonify(df.to_dict(orient='records'))

if __name__ == '__main__':
    app.run(debug=True) # debug=True is good for development, shows errors in browser