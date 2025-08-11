# from flask import Flask, jsonify, render_template, request
# import sqlite3
# import pandas as pd

# app = Flask(__name__)
# DATABASE = 'online_trends.db'

# def get_db_connection():
#     conn = sqlite3.connect(DATABASE)
#     conn.row_factory = sqlite3.Row
#     return conn

# @app.route('/')
# def landing_page(): return render_template('landing.html')

# @app.route('/login')
# def login_page(): return render_template('login.html')

# @app.route('/dashboard')
# def dashboard(): return render_template('dashboard.html')

# @app.route('/api/filters')
# def get_filters():
#     conn = get_db_connection()
#     categories = [row['category'] for row in conn.execute("SELECT DISTINCT category FROM weekly_trends ORDER BY category").fetchall()]
#     platforms = [row['platform'] for row in conn.execute("SELECT DISTINCT platform FROM weekly_trends ORDER BY platform").fetchall()]
#     conn.close()
#     return jsonify({"categories": categories, "platforms": platforms})

# @app.route('/api/detailed_trends')
# def get_detailed_trends():
#     category = request.args.get('category')
#     platform = request.args.get('platform')
#     base_query = "SELECT keyword, category, platform, interest_score, geoName AS region, fetch_date FROM weekly_trends WHERE 1=1"
#     params = []
#     if category:
#         base_query += " AND category = ?"
#         params.append(category)
#     if platform:
#         base_query += " AND platform = ?"
#         params.append(platform)
#     query_template = """
#         SELECT t1.* FROM ({sub_query}) AS t1
#         INNER JOIN (
#             SELECT keyword, region, MAX(fetch_date) AS max_date FROM ({sub_query})
#             GROUP BY keyword, region
#         ) AS t2 ON t1.keyword = t2.keyword AND t1.region = t2.region AND t1.fetch_date = t2.max_date
#         ORDER BY t1.interest_score DESC
#     """
#     final_query = query_template.format(sub_query=base_query)
#     conn = get_db_connection()
#     df = pd.read_sql_query(final_query, conn, params=params * 2)
#     conn.close()
#     return jsonify(df.to_dict(orient='records'))

# @app.route('/api/top_keywords')
# def get_top_keywords():
#     query = """
#         SELECT keyword, MAX(interest_score) as max_score FROM weekly_trends
#         WHERE fetch_date = (SELECT MAX(fetch_date) FROM weekly_trends)
#         GROUP BY keyword ORDER BY max_score DESC LIMIT 5
#     """
#     conn = get_db_connection()
#     top_keywords = [{"keyword": row['keyword'], "score": row['max_score']} for row in conn.execute(query).fetchall()]
#     conn.close()
#     return jsonify(top_keywords)

# @app.route('/api/keyword_history')
# def get_keyword_history():
#     keyword = request.args.get('keyword')
#     if not keyword: return jsonify({"error": "Keyword parameter is required"}), 400
#     query = """
#         SELECT fetch_date, AVG(interest_score) as avg_score FROM weekly_trends
#         WHERE keyword = ? GROUP BY fetch_date ORDER BY fetch_date ASC
#     """
#     conn = get_db_connection()
#     history = [{"date": row['fetch_date'], "score": row['avg_score']} for row in conn.execute(query, (keyword,)).fetchall()]
#     conn.close()
#     return jsonify(history)

# if __name__ == '__main__':
#     # Initialize the database table if it doesn't exist
#     conn = sqlite3.connect(DATABASE)
#     conn.execute('CREATE TABLE IF NOT EXISTS weekly_trends (geoName TEXT, keyword TEXT, interest_score INTEGER, fetch_date TEXT, category TEXT, platform TEXT, data_source TEXT)')
#     conn.close()
#     app.run(debug=True)

from flask import Flask, jsonify, render_template, request
import sqlite3
import pandas as pd
import os # To get the API key from environment variables
from serpapi import GoogleSearch

from dotenv import load_dotenv
load_dotenv() # To fetch images

app = Flask(__name__)
DATABASE = 'online_trends.db'

# --- Page Routes ---
@app.route('/')
def landing_page(): return render_template('landing.html')

@app.route('/login')
def login_page(): return render_template('login.html')

@app.route('/dashboard')
def dashboard(): return render_template('dashboard.html')

# --- NEW: Route for the Trend Detail Page ---
@app.route('/trend/<keyword>')
def trend_detail(keyword):
    # This page will show the deep-dive analysis for the given keyword.
    return render_template('trend_detail.html', keyword=keyword)

# --- API Routes ---
# get_filters, get_detailed_trends, get_top_keywords remain the same...
@app.route('/api/filters')
def get_filters():
    # ... (no changes to this function)
    conn = get_db_connection()
    categories = [row['category'] for row in conn.execute("SELECT DISTINCT category FROM weekly_trends ORDER BY category").fetchall()]
    platforms = [row['platform'] for row in conn.execute("SELECT DISTINCT platform FROM weekly_trends ORDER BY platform").fetchall()]
    conn.close()
    return jsonify({"categories": categories, "platforms": platforms})

@app.route('/api/detailed_trends')
def get_detailed_trends():
    # ... (no changes to this function)
    category = request.args.get('category')
    platform = request.args.get('platform')
    base_query = "SELECT keyword, category, platform, interest_score, geoName AS region, fetch_date FROM weekly_trends WHERE 1=1"
    params = []
    if category:
        base_query += " AND category = ?"
        params.append(category)
    if platform:
        base_query += " AND platform = ?"
        params.append(platform)
    query_template = """
        SELECT t1.* FROM ({sub_query}) AS t1
        INNER JOIN (
            SELECT keyword, region, MAX(fetch_date) AS max_date FROM ({sub_query})
            GROUP BY keyword, region
        ) AS t2 ON t1.keyword = t2.keyword AND t1.region = t2.region AND t1.fetch_date = t2.max_date
        ORDER BY t1.interest_score DESC
    """
    final_query = query_template.format(sub_query=base_query)
    conn = get_db_connection()
    df = pd.read_sql_query(final_query, conn, params=params * 2)
    conn.close()
    return jsonify(df.to_dict(orient='records'))

@app.route('/api/top_keywords')
def get_top_keywords():
    # ... (no changes to this function)
    query = """
        SELECT keyword, MAX(interest_score) as max_score FROM weekly_trends
        WHERE fetch_date = (SELECT MAX(fetch_date) FROM weekly_trends)
        GROUP BY keyword ORDER BY max_score DESC LIMIT 5
    """
    conn = get_db_connection()
    top_keywords = [{"keyword": row['keyword'], "score": row['max_score']} for row in conn.execute(query).fetchall()]
    conn.close()
    return jsonify(top_keywords)

# --- NEW: API Endpoint for the Detail Page ---
@app.route('/api/trend_details/<keyword>')
def get_trend_details(keyword):
    # 1. Fetch historical data from our local database
    conn = get_db_connection()
    history_query = "SELECT fetch_date, AVG(interest_score) as avg_score FROM weekly_trends WHERE keyword = ? GROUP BY fetch_date ORDER BY fetch_date ASC"
    history = [{"date": row['fetch_date'], "score": row['avg_score']} for row in conn.execute(history_query, (keyword,)).fetchall()]

    regional_query = "SELECT geoName, AVG(interest_score) as avg_score FROM weekly_trends WHERE keyword = ? AND fetch_date = (SELECT MAX(fetch_date) FROM weekly_trends WHERE keyword=?) GROUP BY geoName ORDER BY avg_score DESC"
    regional_data = [{"region": row['geoName'], "score": row['avg_score']} for row in conn.execute(regional_query, (keyword, keyword)).fetchall()]
    conn.close()

    # 2. Fetch image from SerpApi
    image_url = None
    try:
        params = {
            "q": keyword,
            "tbm": "isch", # tbm=isch means Google Image Search
            "api_key": os.getenv("SERPAPI_KEY") # Get key from environment
        }
        search = GoogleSearch(params)
        results = search.get_dict()
        if "images_results" in results and len(results["images_results"]) > 0:
            image_url = results["images_results"][0]["thumbnail"]
    except Exception as e:
        print(f"Could not fetch image for {keyword}. Error: {e}")
        image_url = "/static/placeholder.png" # Fallback image

    # 3. Combine all data and return as JSON
    return jsonify({
        "history": history,
        "regional_data": regional_data,
        "image_url": image_url
    })

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn



# if __name__ == '__main__':
#     if not os.getenv("SERPAPI_KEY"):
#         print("WARNING: SERPAPI_KEY environment variable not set. Image fetching will fail.")
#     conn = sqlite3.connect(DATABASE)
#     conn.execute('CREATE TABLE IF NOT EXISTS weekly_trends (geoName TEXT, keyword TEXT, interest_score INTEGER, fetch_date TEXT, category TEXT, platform TEXT, data_source TEXT)')
#     conn.close()
#     app.run(debug=True)

if __name__ == '__main__':
    # ADD THIS: Check if the API key was loaded successfully
    if not os.getenv("SERPAPI_KEY"):
        print("WARNING: SERPAPI_KEY environment variable not set. Image fetching will fail.")
    
    # ADD THIS: Creates the database table if it doesn't exist on startup
    conn = sqlite3.connect(DATABASE)
    conn.execute('CREATE TABLE IF NOT EXISTS weekly_trends (geoName TEXT, keyword TEXT, interest_score INTEGER, fetch_date TEXT, category TEXT, platform TEXT, data_source TEXT)')
    conn.close()
    
    app.run(debug=True)