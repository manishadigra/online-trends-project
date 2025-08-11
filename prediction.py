import pandas as pd
from prophet import Prophet

def get_db_connection():
    # This is a placeholder. In a real app, you might have a shared db connection module.
    import sqlite3
    conn = sqlite3.connect('online_trends.db')
    conn.row_factory = sqlite3.Row
    return conn

def prepare_data_for_prophet(keyword, region=None, category=None, platform=None):
    """
    Fetches and prepares historical data for a given keyword for Prophet.
    """
    conn = get_db_connection()
    
    query = "SELECT fetch_date, interest_score FROM weekly_trends WHERE keyword = ?"
    params = [keyword]

    if region:
        query += " AND geoName = ?"
        params.append(region)
    if category:
        query += " AND category = ?"
        params.append(category)
    if platform:
        query += " AND platform = ?"
        params.append(platform)
        
    query += " ORDER BY fetch_date ASC"
    
    df = pd.read_sql_query(query, conn, params=tuple(params))
    conn.close()

    if df.empty:
        return None

    # Prophet requires columns to be named 'ds' (datestamp) and 'y' (value)
    df_prophet = df.rename(columns={'fetch_date': 'ds', 'interest_score': 'y'})
    
    # Convert 'ds' to datetime objects
    df_prophet['ds'] = pd.to_datetime(df_prophet['ds'])
    
    return df_prophet

def predict_future_trends(keyword, region=None, category=None, platform=None, periods=52):
    """
    Predicts future trends for a given keyword using Prophet.
    'periods' is the number of periods to forecast forward. Default is 52 weeks (1 year).
    """
    df_prophet = prepare_data_for_prophet(keyword, region, category, platform)

    if df_prophet is None or len(df_prophet) < 2:
        # Not enough data to make a forecast
        return None, None

    # Initialize and fit the model
    model = Prophet(yearly_seasonality=True, weekly_seasonality=False, daily_seasonality=False,
                    seasonality_mode='multiplicative',  # More appropriate for interest scores
                    changepoint_prior_scale=0.05)
    
    model.fit(df_prophet)

    # Create a future dataframe to hold predictions
    future = model.make_future_dataframe(periods=periods, freq='W') # 'W' for weekly predictions
    
    # Get predictions
    forecast = model.predict(future)

    # Return the historical data and the forecast
    return df_prophet, forecast
