import pandas as pd
import sqlite3
from datetime import datetime
from data_simulation import generate_simulated_data_for_date

def collect_data():
    today_date_str = datetime.now().strftime('%Y-%m-%d')
    db_path = 'online_trends.db'
    print(f"--- Generating simulated data for {today_date_str} ---")
    simulated_df_today = generate_simulated_data_for_date(today_date_str)
    
    if not simulated_df_today.empty:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        # Delete old entries for today to avoid duplicates
        cursor.execute("DELETE FROM weekly_trends WHERE fetch_date = ?", (today_date_str,))
        conn.commit()
        # Append the new data
        simulated_df_today.to_sql('weekly_trends', conn, if_exists='append', index=False)
        print(f"Successfully saved {len(simulated_df_today)} new records to the database.")
        conn.close()
    else:
        print("No new data was generated or fetched to save.")

if __name__ == "__main__":
    collect_data()