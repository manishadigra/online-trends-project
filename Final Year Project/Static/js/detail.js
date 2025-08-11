document.addEventListener('DOMContentLoaded', () => {
    const keyword = document.getElementById('keyword-title').innerText;
    const loader = document.getElementById('loader');
    const contentWrapper = document.getElementById('content-wrapper');
    
    const productImage = document.getElementById('product-image');
    const investmentSignal = document.getElementById('investment-signal');
    const keyMetricsContainer = document.getElementById('key-metrics-container');
    const historyCtx = document.getElementById('historical-chart').getContext('2d');
    const regionalCtx = document.getElementById('regional-chart').getContext('2d');

    let historyChart = null;
    let regionalChart = null;

    const analyzeTrend = (history) => {
        if (history.length < 2) return { signal: 'New', momentum: 'Stable', peakScore: 0, peakDate: 'N/A', duration: 0 };
        
        const firstDate = new Date(history[0].date);
        const lastDate = new Date(history[history.length - 1].date);
        const duration = Math.round((lastDate - firstDate) / (1000 * 60 * 60 * 24));

        const lastScore = history[history.length - 1].score;
        const prevScore = history[history.length - 2].score;
        let momentum = 'Stable';
        if (lastScore > prevScore) momentum = 'Rising';
        if (lastScore < prevScore) momentum = 'Fading';

        let peakScore = 0;
        let peakDate = 'N/A';
        history.forEach(item => {
            if (item.score > peakScore) {
                peakScore = item.score;
                peakDate = item.date;
            }
        });

        let signal = 'Mature';
        if (duration < 30 && momentum === 'Rising') signal = 'Emerging';
        if (peakScore > 75 && momentum !== 'Fading') signal = 'Peaking';
        if (momentum === 'Fading') signal = 'Fading';

        return { signal, momentum, peakScore, peakDate, duration };
    };

    const fetchDetails = async () => {
        try {
            const response = await fetch(`/api/trend_details/${encodeURIComponent(keyword)}`);
            const data = await response.json();

            // Populate Image
            productImage.src = data.image_url || '/static/placeholder.png';
            
            // Analyze and Populate Metrics
            const analysis = analyzeTrend(data.history);
            investmentSignal.textContent = analysis.signal;
            investmentSignal.className = `signal-badge ${analysis.signal.toLowerCase()}`;
            keyMetricsContainer.innerHTML = `
                <div><strong>Peak Interest:</strong> ${analysis.peakScore} <span>(on ${analysis.peakDate})</span></div>
                <div><strong>Momentum:</strong> ${analysis.momentum}</div>
                <div><strong>Trend Duration:</strong> ${analysis.duration} days</div>
            `;

            // Render Charts
            renderHistoryChart(data.history);
            renderRegionalChart(data.regional_data);

            // Show content
            loader.style.display = 'none';
            contentWrapper.style.display = 'block';

        } catch (error) {
            console.error('Failed to load trend details:', error);
            loader.innerText = 'Error loading data.';
        }
    };
    
    const renderHistoryChart = (history) => {
        if(historyChart) historyChart.destroy();
        historyChart = new Chart(historyCtx, {
            type: 'line', data: { labels: history.map(d=>d.date), datasets: [{ data: history.map(d=>d.score), borderColor: '#6a11cb', tension: 0.1, fill: true }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    };

    const renderRegionalChart = (regionalData) => {
        if(regionalChart) regionalChart.destroy();
        regionalChart = new Chart(regionalCtx, {
            type: 'bar', data: { labels: regionalData.map(r=>r.region), datasets: [{ data: regionalData.map(r=>r.score), backgroundColor: '#2575fc' }] },
            options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } } }
        });
    };

    fetchDetails();
});