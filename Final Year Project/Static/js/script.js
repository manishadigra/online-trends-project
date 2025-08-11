document.addEventListener('DOMContentLoaded', () => {
    let allData = [];
    let topTrendsChart, historicalDataChart;

    const categoryFilter = document.getElementById('category-filter');
    const platformFilter = document.getElementById('platform-filter');
    const tableBody = document.getElementById('trends-table-body');

    // Fetch initial data from the backend
    fetchData();

    // Add event listeners to filters
    categoryFilter.addEventListener('change', () => filterAndRender(allData));
    platformFilter.addEventListener('change', () => filterAndRender(allData));

    async function fetchData() {
        try {
            const response = await fetch('/api/trends');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allData = await response.json();
            
            populateFilters(allData);
            filterAndRender(allData);

        } catch (error) {
            console.error("Failed to fetch initial trend data:", error);
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4">Failed to load data.</td></tr>`;
        }
    }

    function populateFilters(data) {
        const categories = [...new Set(data.map(item => item.category))];
        const platforms = [...new Set(data.map(item => item.platform))];

        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categoryFilter.appendChild(option);
        });

        platforms.forEach(plat => {
            const option = document.createElement('option');
            option.value = plat;
            option.textContent = plat;
            platformFilter.appendChild(option);
        });
    }

    function filterAndRender(data) {
        const selectedCategory = categoryFilter.value;
        const selectedPlatform = platformFilter.value;

        const filteredData = data.filter(item => {
            const categoryMatch = selectedCategory === 'All' || item.category === selectedCategory;
            const platformMatch = selectedPlatform === 'All' || item.platform === selectedPlatform;
            return categoryMatch && platformMatch;
        });

        renderTable(filteredData);
        renderTopTrendsChart(filteredData);
        // Initialize historical chart with the first keyword of the filtered data
        if (filteredData.length > 0) {
            fetchAndRenderHistoricalChart(filteredData[0].keyword, filteredData[0].platform);
        } else {
            // Clear historical chart if no data
            if (historicalDataChart) historicalDataChart.destroy();
        }
    }

    function renderTable(data) {
        tableBody.innerHTML = '';
        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4">No data available for the selected filters.</td></tr>`;
            return;
        }

        data.forEach(item => {
            const row = `
                <tr class="hover:bg-gray-700">
                    <td class="px-6 py-4 whitespace-nowrap">${item.keyword}</td>
                    <td class="px-6 py-4 whitespace-nowrap">${item.category}</td>
                    <td class="px-6 py-4 whitespace-nowrap">${item.platform}</td>
                    <td class="px-6 py-4 whitespace-nowrap">${item.interest_score}</td>
                    <td class="px-6 py-4 whitespace-nowrap">${item.geoName}</td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    }

    function renderTopTrendsChart(data) {
        const keywordScores = {};
        data.forEach(item => {
            if (keywordScores[item.keyword]) {
                keywordScores[item.keyword] += item.interest_score;
            } else {
                keywordScores[item.keyword] = item.interest_score;
            }
        });

        const sortedKeywords = Object.entries(keywordScores)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10);

        const labels = sortedKeywords.map(item => item[0]);
        const scores = sortedKeywords.map(item => item[1]);

        const ctx = document.getElementById('topTrendsChart').getContext('2d');
        if (topTrendsChart) {
            topTrendsChart.destroy();
        }
        topTrendsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Interest Score',
                    data: scores,
                    backgroundColor: 'rgba(79, 70, 229, 0.8)',
                    borderColor: 'rgba(79, 70, 229, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                indexAxis: 'y',
                scales: {
                    x: { ticks: { color: '#d1d5db' } },
                    y: { ticks: { color: '#d1d5db' } }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    async function fetchAndRenderHistoricalChart(keyword, platform) {
        try {
            const response = await fetch(`/api/trends/history?keyword=${keyword}&platform=${platform}`);
            if (!response.ok) throw new Error('Failed to fetch historical data');
            
            const historyData = await response.json();
            const labels = historyData.map(d => d.fetch_date);
            const data = historyData.map(d => d.interest_score);

            const ctx = document.getElementById('historicalDataChart').getContext('2d');
            if (historicalDataChart) {
                historicalDataChart.destroy();
            }
            historicalDataChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: `Interest for ${keyword}`,
                        data: data,
                        borderColor: 'rgba(16, 185, 129, 1)',
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        fill: true,
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        x: { ticks: { color: '#d1d5db' } },
                        y: { ticks: { color: '#d1d5db' } }
                    },
                    plugins: {
                        legend: { labels: { color: '#d1d5db' } }
                    }
                }
            });

        } catch (error) {
            console.error("Failed to render historical chart:", error);
        }
    }
});