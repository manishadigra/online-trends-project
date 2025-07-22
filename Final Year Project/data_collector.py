from pytrends.request import TrendReq
import pandas as pd
import time
import sqlite3
from datetime import datetime, timedelta # Added timedelta for generating past dates

# --- Import your simulation module ---
from data_simulation import generate_simulated_data # Assuming data_simulation.py is in the same folder

# --- Helper function to infer category and platform ---
def infer_details(keyword):
    keyword_lower = keyword.lower()
    category = "Other"
    platform = "Other"

    # Infer Platform
    if "flipkart" in keyword_lower: platform = "Flipkart"
    elif "amazon" in keyword_lower: platform = "Amazon"
    elif "zepto" in keyword_lower: platform = "Zepto"
    elif "blinkit" in keyword_lower: platform = "Blinkit"
    elif "netflix" in keyword_lower: platform = "Netflix"
    elif "hotstar" in keyword_lower: platform = "Hotstar"
    elif "prime video" in keyword_lower: platform = "Prime Video"
    elif "myntra" in keyword_lower: platform = "Myntra"
    elif "zomato" in keyword_lower: platform = "Zomato" # Added Zomato
    elif "paytm" in keyword_lower: platform = "Paytm" # Added Paytm
    elif "ola" in keyword_lower: platform = "Ola" # Added Ola

    # Infer Category (add more specific rules as needed)
    if any(p in keyword_lower for p in ["iphone", "samsung", "redmi", "smartphone", "laptop", "tv", "earbud", "headphone", "electronics"]):
        category = "Electronics"
    elif any(g in keyword_lower for g in ["maggi", "milk", "biscuit", "grocery", "food delivery", "atta", "oil", "rice", "vegetable", "fruit"]):
        category = "Groceries"
    elif any(s in keyword_lower for s in ["subscription", "movie", "show", "series", "ott", "play dth"]):
        category = "Streaming"
    elif any(f in keyword_lower for f in ["shoes", "dress", "jeans", "fashion", "kurti", "t-shirt", "apparel"]):
        category = "Fashion"
    elif any(t in keyword_lower for t in ["payment", "paytm", "gpay", "phonepe", "upi", "fintech"]):
        category = "Fintech"
    elif any(r in keyword_lower for r in ["ride", "cab", "ola", "uber"]):
        category = "Ride-Hailing" # Example category
    elif any(m in keyword_lower for m in ["zomato gold", "dining", "restaurant"]):
        category = "Food & Dining" # Another example

    return category, platform
# -------------------------------------------------------------------------------------------------


pytrends = TrendReq(hl='en-US', tz=330)

# Define your keyword groups for Google Trends fetching
# Keep 'geo='IN'' for India wide
google_trends_keyword_groups = [
    ["iPhone 15 Flipkart", "Samsung Galaxy S24 Amazon", "Redmi Note 13 Flipkart"],
    ["Netflix India", "Hotstar Premium", "Amazon Prime Video India"], # Example streaming services
    # Add other high/medium volume keywords here that work well in groups
]

# Define individual keywords that might be low volume but you still want to try fetching
# These are the ones that might show low volume or no data when grouped.
google_trends_individual_keywords = [
    "OnePlus Nord CE 3 Lite Flipkart",
    "Tata Play DTH subscription",
    "Zomato Gold membership",
    "Paytm Wallet offer", # Example for Fintech
    "Ola electric scooter booking", # Example for Ride-Hailing
]

all_processed_data = [] # List to store all processed dataframes (from Trends and Simulation)
today_date_str = datetime.now().strftime('%Y-%m-%d')


# --- PART 1: Generate Simulated Data for PAST DATES (for testing historical trends) ---
# IMPORTANT: ONLY USE THIS BLOCK FOR INITIAL DATABASE POPULATION FOR HISTORICAL TRENDS
# AFTER INITIAL POPULATION, COMMENT THIS OUT FOR REGULAR WEEKLY RUNS (or delete if already run enough)
print("\nGenerating simulated data for past dates for testing historical trends...")
for i in range(1, 4): # Generate data for last 3 weeks
    past_date_str = (datetime.now() - timedelta(weeks=i)).strftime('%Y-%m-%d')
    simulated_df_past = generate_simulated_data(past_date_str)
    all_processed_data.append(simulated_df_past)
    print(f"Added simulated data for {past_date_str} to collection.")
# --- END OF PAST DATE SIMULATION BLOCK ---


# --- PART 2: Fetch data from Google Trends for CURRENT DATE ---

# Loop for keyword groups
for keywords in google_trends_keyword_groups:
    print(f"\nFetching grouped data for keywords: {keywords}")
    try:
        pytrends.build_payload(keywords, cat=0, timeframe='today 3-m', geo='IN') # 'today 3-m' is fine
        interest_by_region_df = pytrends.interest_by_region(resolution='REGION')

        if not interest_by_region_df.empty:
            df_long = interest_by_region_df.reset_index().melt(id_vars=['geoName'], var_name='keyword', value_name='interest_score')
            df_long['fetch_date'] = today_date_str
            df_long['category'], df_long['platform'] = zip(*df_long['keyword'].apply(infer_details))
            df_long['data_source'] = "Google_Trends"
            all_processed_data.append(df_long)
            print(f"Fetched grouped regional data for {keywords}:")
            print(df_long.head())
        else:
            print(f"No regional data found for grouped keywords {keywords}. Consider individual fetching or simulation.")

    except Exception as e:
        print(f"Error fetching grouped data for {keywords}: {e}")
    finally:
        time.sleep(5) # Pause to avoid rate limits

# Loop for individual keywords
for keyword in google_trends_individual_keywords:
    print(f"\nFetching individual data for keyword: ['{keyword}']")
    try:
        pytrends.build_payload([keyword], cat=0, timeframe='today 3-m', geo='IN')
        interest_by_region_df = pytrends.interest_by_region(resolution='REGION')

        if not interest_by_region_df.empty and interest_by_region_df[keyword].sum() > 0: # Check if there's any data
            df_long = interest_by_region_df.reset_index().melt(id_vars=['geoName'], var_name='keyword', value_name='interest_score')
            df_long['fetch_date'] = today_date_str
            df_long['category'], df_long['platform'] = zip(*df_long['keyword'].apply(infer_details))
            df_long['data_source'] = "Google_Trends"
            all_processed_data.append(df_long)
            print(f"Fetched individual regional data for ['{keyword}']:")
            print(df_long.head())
        else:
            print(f"No significant regional data found for ['{keyword}']. This term might be too niche for Google Trends.")

    except Exception as e:
        print(f"Error fetching individual data for ['{keyword}']: {e}")
    finally:
        time.sleep(5) # Pause to avoid rate limits


# --- PART 3: Generate Simulated Data for CURRENT DATE ---
print(f"\nGenerating simulated data for {today_date_str}...")
simulated_df_current = generate_simulated_data(today_date_str)
all_processed_data.append(simulated_df_current)
print("Sample Simulated Data added to collection (current date):")
print(simulated_df_current.head())


# --- PART 4: Combine and Save All Data to SQLite ---
if all_processed_data:
    combined_final_df = pd.concat(all_processed_data, ignore_index=True) # ignore_index=True is important for clean concatenation
    print("\n--- Final Combined & Processed Data (Ready for DB) ---")
    print(combined_final_df.head(20))

    # Save to SQLite
    db_path = 'online_trends.db' # Name of your SQLite database file
    conn = sqlite3.connect(db_path) # Connect to the database (creates if doesn't exist)

    # Save the DataFrame to a SQL table
    # 'append' adds new rows, 'replace' overwrites (use 'append' for weekly updates)
    combined_final_df.to_sql('weekly_trends', conn, if_exists='append', index=False)
    print(f"\nSuccessfully saved {len(combined_final_df)} rows to '{db_path}' table 'weekly_trends'.")

    # Optional: Verify data in DB
    # cursor = conn.cursor()
    # cursor.execute("SELECT * FROM weekly_trends LIMIT 5;")
    # print("\nData from DB:")
    # for row in cursor.fetchall():
    #     print(row)

    conn.close() # Close the database connection
else:
    print("No data was successfully fetched or processed to save.")