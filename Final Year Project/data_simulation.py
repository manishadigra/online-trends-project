import pandas as pd
import random
from datetime import datetime, timedelta # Added timedelta for generating past dates

def generate_simulated_data(fetch_date_str):
    """
    Generates a DataFrame of simulated weekly trends data.

    Args:
        fetch_date_str (str): The date for which to simulate data (e.g., 'YYYY-MM-DD').

    Returns:
        pd.DataFrame: A DataFrame with simulated trend data.
    """
    simulated_products = [
        {"keyword": "Maggi Noodles Zepto", "category": "Groceries", "platform": "Zepto"},
        {"keyword": "Amul Milk Blinkit", "category": "Groceries", "platform": "Blinkit"},
        {"keyword": "Britannia Biscuits Zepto", "category": "Groceries", "platform": "Zepto"},
        {"keyword": "Local Artisanal Coffee App", "category": "Food & Beverage", "platform": "LocalApp"},
        {"keyword": "Organic Vegetables LocalMart", "category": "Groceries", "platform": "LocalMart"},
        {"keyword": "Subscription Box Snacks", "category": "Food & Beverage", "platform": "SubscriptionService"},
        # Add more simulated products/services here for other categories you want to cover
        # that might not have strong Google Trends data, ensuring diverse categories/platforms.
    ]

    # Full list of Indian states/UTs for comprehensive simulation
    indian_states = [
        "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
        "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
        "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
        "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
        "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
        "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
        "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
    ]

    simulated_records = []
    for product_info in simulated_products:
        for state in indian_states:
            # Simulate interest score (can make this more sophisticated later, e.g., higher in specific states)
            interest = random.randint(1, 100) # Ensure no zeros for simulated data unless intended

            simulated_records.append({
                "geoName": state,
                "keyword": product_info["keyword"],
                "interest_score": interest,
                "fetch_date": fetch_date_str,
                "category": product_info["category"],
                "platform": product_info["platform"],
                "data_source": "Simulated"
            })

    return pd.DataFrame(simulated_records)

if __name__ == "__main__":
    # This block runs only if you execute data_simulation.py directly
    # Useful for testing the simulation module independently
    today_date = datetime.now().strftime('%Y-%m-%d')
    sim_df = generate_simulated_data(today_date)
    print("Sample Simulated Data:")
    print(sim_df.head())
    print(f"Generated {len(sim_df)} simulated records for {today_date}")