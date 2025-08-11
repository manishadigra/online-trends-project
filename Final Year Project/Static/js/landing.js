document.addEventListener('DOMContentLoaded', () => {
    const trendsContainer = document.getElementById('live-trends-container');

    const fetchTopTrends = async () => {
        try {
            // This API endpoint already exists in your app.py
            const response = await fetch('/api/top_keywords');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const topKeywords = await response.json();
            
            // Clear the loading placeholder
            trendsContainer.innerHTML = '';

            if (topKeywords.length === 0) {
                trendsContainer.innerHTML = '<p class="error-message">Could not load trends right now.</p>';
                return;
            }

            // Create a card for each trend
            topKeywords.forEach((trend, index) => {
                const trendCard = document.createElement('div');
                trendCard.className = 'live-trend-card';
                
                // Add an animation delay to make cards appear one by one
                trendCard.style.animationDelay = `${index * 0.1}s`;

                trendCard.innerHTML = `
                    <div class="trend-keyword">${trend.keyword}</div>
                    <div class="trend-score">
                        <span>${trend.score}</span>
                        <div class="score-label">Interest</div>
                    </div>
                `;

                // Make the card a clickable link to the dashboard
                trendCard.addEventListener('click', () => {
                    window.location.href = '/dashboard';
                });

                trendsContainer.appendChild(trendCard);
            });

        } catch (error) {
            console.error('Failed to fetch top trends:', error);
            trendsContainer.innerHTML = '<p class="error-message">Could not load trends right now.</p>';
        }
    };

    fetchTopTrends();
});