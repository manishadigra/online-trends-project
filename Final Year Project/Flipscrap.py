from pytrends.request import TrendReq
import pandas as pd

pytrends = TrendReq(hl='en-US', tz=330)

# 1. Fetch for Smartphones Flipkart
keywords_smartphones = ["iPhone 15 Flipkart", "Samsung Galaxy Flipkart", "OnePlus Flipkart"]
pytrends.build_payload(keywords_smartphones, cat=0, timeframe='today 3-m', geo='IN')
smartphones_region_df = pytrends.interest_by_region()
print("\nInterest By Region (Smartphones Flipkart Only):")
print(smartphones_region_df.head()) # You should now see non-zero values here if there's any search volume

# 2. Fetch for Groceries Zepto
keywords_groceries = ["Groceries Zepto"]
pytrends.build_payload(keywords_groceries, cat=0, timeframe='today 3-m', geo='IN')
groceries_region_df = pytrends.interest_by_region()
print("\nInterest By Region (Groceries Zepto Only):")
print(groceries_region_df.head()) # Expect non-zero values for regions where Zepto operates

# 3. Fetch for Netflix India (if you still want to see its standalone popularity)
keywords_netflix = ["Netflix India"]
pytrends.build_payload(keywords_netflix, cat=0, timeframe='today 3-m', geo='IN')
netflix_region_df = pytrends.interest_by_region()
print("\nInterest By Region (Netflix India Only):")
print(netflix_region_df.head())