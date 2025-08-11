import pandas as pd
import random
import math
from datetime import datetime, timedelta

SIMULATED_PRODUCTS = [
    {"keyword": "AI Fitness Coach App", "category": "Fitness Tech", "platform": "AppStore", "peak_day_offset": 5, "sharpness": 0.1},
    {"keyword": "Sustainable Coffee Pods", "category": "Groceries", "platform": "Zepto", "peak_day_offset": 10, "sharpness": 0.2},
    {"keyword": "Vintage Style Myntra", "category": "Fashion", "platform": "Myntra", "peak_day_offset": -2, "sharpness": 0.15},
    {"keyword": "Noise Smart Ring", "category": "Electronics", "platform": "Flipkart", "peak_day_offset": 20, "sharpness": 0.08},
    {"keyword": "Zomato Everyday Plan", "category": "Food & Dining", "platform": "Zomato", "peak_day_offset": 0, "sharpness": 0.3},
]
INDIAN_STATES = ["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal", "Gujarat"]
PROJECT_START_DATE = datetime.now() - timedelta(days=15)

def get_trend_value(day_index, peak_day, sharpness, max_interest=100):
    exponent = -sharpness * ((day_index - peak_day) ** 2)
    if exponent < -50: return 0
    value = max_interest * math.exp(exponent)
    return int(value)

def generate_simulated_data_for_date(target_date_str):
    target_date = datetime.strptime(target_date_str, '%Y-%m-%d')
    day_index = (target_date - PROJECT_START_DATE).days
    simulated_records = []
    for product in SIMULATED_PRODUCTS:
        base_interest = get_trend_value(day_index, product['peak_day_offset'], product['sharpness'])
        if base_interest > 1:
            for state in INDIAN_STATES:
                interest_with_noise = base_interest + random.randint(-5, 5)
                final_interest = max(0, min(100, interest_with_noise))
                if final_interest > 0:
                    simulated_records.append({
                        "geoName": state, "keyword": product["keyword"], "interest_score": final_interest,
                        "fetch_date": target_date_str, "category": product["category"],
                        "platform": product["platform"], "data_source": "Simulated"
                    })
    return pd.DataFrame(simulated_records)