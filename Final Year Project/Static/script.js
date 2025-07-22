document.addEventListener('DOMContentLoaded', () => {
    fetchDataAndDisplay(false);

    document.getElementById('apply-filters').addEventListener('click', () => {
        fetchDataAndDisplay(true);
    });

    document.getElementById('show-trend-button').addEventListener('click', fetchAndRenderHistoricalTrend);

    document.getElementById('toggleRawDataButton').addEventListener('click', toggleRawDataTable);
});

// Store fetched data globally so filters can work without re-fetching
let allFetchedData = [];

// --- IMPORTANT: REPLACE THIS WITH YOUR CURRENT NGROK PUBLIC URL ---
// You will need to update this every time your ngrok URL changes
// For LOCAL testing:
const BASE_API_URL = 'http://127.0.0.1:5000';// --- END NGROK URL ---


const serviceTypeMapping = {
    "Flipkart": "E-commerce",
    "Amazon": "E-commerce",
    "Myntra": "E-commerce",
    "Zepto": "Quick Commerce",
    "Blinkit": "Quick Commerce",
    "Netflix": "Streaming",
    "Hotstar": "Streaming",
    "Prime Video": "Streaming",
    "Tata Play DTH subscription": "Streaming",
    "Zomato": "Food & Dining",
    "Ola": "Ride-Hailing",
    "Paytm": "Fintech",
    "LocalApp": "Hyperlocal Services",
    "LocalMart": "Hyperlocal Services",
    "SubscriptionService": "Subscription Services",
    "Other": "Other Services"
};


async function fetchDataAndDisplay(applyFilters = false) {
    try {
        if (!applyFilters || allFetchedData.length === 0) {
            // --- UPDATED FETCH URL ---
            const response = await fetch(`${BASE_API_URL}/api/trends`);
            const data = await response.json();

            allFetchedData = data;

            console.log("Data fetched:", allFetchedData);

            populateFilterDropdowns(allFetchedData);
        }

        let dataToDisplay = allFetchedData;

        const selectedRegion = document.getElementById('region-select').value;
        const selectedCategory = document.getElementById('category-select').value;
        const selectedPlatform = document.getElementById('platform-select').value;
        const selectedServiceType = document.getElementById('service-type-select').value;

        if (applyFilters) {
            if (selectedRegion) {
                dataToDisplay = dataToDisplay.filter(item => item.geoName === selectedRegion);
            }
            if (selectedCategory) {
                dataToDisplay = dataToDisplay.filter(item => item.category === selectedCategory);
            }
            if (selectedPlatform) {
                dataToDisplay = dataToDisplay.filter(item => item.platform === selectedPlatform);
            }
            if (selectedServiceType) {
                dataToDisplay = dataToDisplay.filter(item => (serviceTypeMapping[item.platform] || "Other Services") === selectedServiceType);
            }

            if (selectedRegion === "" && selectedCategory === "" && selectedPlatform === "" && selectedServiceType === "") {
                dataToDisplay = allFetchedData;
            } else if (dataToDisplay.length === 0) {
                document.getElementById('data-display').innerHTML = '<p style="color: grey; text-align: center;">No data found for the selected filters. Please adjust your filters.</p>';
                renderDataTable([]);
                renderTopKeywordsChart([]);
                document.getElementById('rawDataContainer').style.display = 'none';
                document.getElementById('toggleRawDataButton').textContent = 'Show Raw Data';
                return;
            }
        }

        renderDataTable(dataToDisplay);
        renderTopKeywordsChart(dataToDisplay);
        
    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('data-display').innerHTML = '<p style="color: red;">Error loading data. Please ensure the backend is running and data is available.</p>';
    }
}

function populateFilterDropdowns(data) {
    const regionSelect = document.getElementById('region-select');
    const categorySelect = document.getElementById('category-select');  
    const trendKeywordSelect = document.getElementById('trend-keyword-select');
    const trendRegionSelect = document.getElementById('trend-region-select');
    const platformSelect = document.getElementById('platform-select'); // Check this line
    const serviceTypeSelect = document.getElementById('service-type-select'); // Check this line

    if (regionSelect.options.length <= 1) {
        regionSelect.innerHTML = '<option value="">Select Region</option>';
        trendRegionSelect.innerHTML = '<option value="">Select Region for Trend</option>';
        const uniqueRegions = [...new Set(data.map(item => item.geoName))].sort();
        uniqueRegions.forEach(region => {
            const option1 = document.createElement('option');
            option1.value = region;
            option1.textContent = region;
            regionSelect.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = region;
            option2.textContent = region;
            trendRegionSelect.appendChild(option2);
        });
    }

    if (categorySelect.options.length <= 1) {
        categorySelect.innerHTML = '<option value="">Select Category</option>';
        const uniqueCategories = [...new Set(data.map(item => item.category))].sort();
        uniqueCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    }

    if (trendKeywordSelect.options.length <= 1) {
        trendKeywordSelect.innerHTML = '<option value="">Select Keyword for Trend</option>';
        const uniqueKeywords = [...new Set(data.map(item => item.keyword))].sort();
        uniqueKeywords.forEach(keyword => {
            const option = document.createElement('option');
            option.value = keyword;
            option.textContent = keyword;
            trendKeywordSelect.appendChild(option);
        });
    }

    if (platformSelect.options.length <= 1) {
        platformSelect.innerHTML = '<option value="">Select Platform</option>';
        const uniquePlatforms = [...new Set(data.map(item => item.platform))].sort();
        uniquePlatforms.forEach(platform => {
            const option = document.createElement('option');
            option.value = platform;
            option.textContent = platform;
            platformSelect.appendChild(option);
        });
    }

    if (serviceTypeSelect.options.length <= 1) {
        serviceTypeSelect.innerHTML = '<option value="">Select Service Type</option>';
        const uniqueServiceTypes = [...new Set(data.map(item => serviceTypeMapping[item.platform] || "Other Services"))].sort();
        uniqueServiceTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            serviceTypeSelect.appendChild(option);
        });
    }
}

function renderDataTable(dataToDisplay) {
    const dataTableBody = document.querySelector('#dataTable tbody');
    dataTableBody.innerHTML = '';

    if (dataToDisplay.length === 0) {
        const row = dataTableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 7;
        cell.textContent = "No data available for the selected filters.";
        cell.style.textAlign = "center";
        return;
    }

    dataToDisplay.forEach(item => {
        const row = dataTableBody.insertRow();
        row.insertCell().textContent = item.keyword;
        row.insertCell().textContent = item.geoName;
        row.insertCell().textContent = item.interest_score;
        row.insertCell().textContent = item.category;
        row.insertCell().textContent = item.platform;
        row.insertCell().textContent = item.data_source;
        row.insertCell().textContent = item.fetch_date;
    });
}

let topKeywordsChartInstance = null;

function renderTopKeywordsChart(dataToDisplay) {
    const ctx = document.getElementById('topKeywordsChart').getContext('2d');

    if (topKeywordsChartInstance) {
        topKeywordsChartInstance.destroy();
    }

    if (dataToDisplay.length === 0) {
        return;
    }

    const topKeywords = {};
    dataToDisplay.forEach(item => {
        if (topKeywords[item.keyword]) {
            topKeywords[item.keyword] += item.interest_score;
        } else {
            topKeywords[item.keyword] = item.interest_score;
        }
    });

    const sortedKeywords = Object.entries(topKeywords)
        .sort(([,a],[,b]) => b - a)
        .slice(0, 10);

    const chartLabels = sortedKeywords.map(item => item[0]);
    const chartData = sortedKeywords.map(item => item[1]);

    const barColors = [
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)',
        'rgba(255, 159, 64, 0.8)',
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(201, 203, 207, 0.8)',
        'rgba(255, 205, 86, 0.8)',
        'rgba(102, 255, 102, 0.8)',
        'rgba(255, 102, 204, 0.8)',
        'rgba(0, 128, 128, 0.8)'
    ];
    const borderColors = [
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)',
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(201, 203, 207, 1)',
        'rgba(255, 205, 86, 1)',
        'rgba(102, 255, 102, 1)',
        'rgba(255, 102, 204, 1)',
        'rgba(0, 128, 128, 1)'
    ];

    topKeywordsChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Total Search Interest Score',
                data: chartData,
                backgroundColor: barColors,
                borderColor: borderColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

let historicalTrendsChartInstance = null;

async function fetchAndRenderHistoricalTrend() {
    const keyword = document.getElementById('trend-keyword-select').value;
    const region = document.getElementById('trend-region-select').value;
    const platform = document.getElementById('platform-select').value; // Get platform filter
    const serviceType = document.getElementById('service-type-select').value; // Get service type filter

    if (!keyword && !region && !platform && !serviceType) { // Updated condition to include new filters
        alert("Please select at least a Keyword, Region, Platform, or Service Type for the trend.");
        return;
    }

    let apiUrl = 'http://127.0.0.1:5000/api/trends/history?';
    if (keyword) {
        apiUrl += `keyword=${encodeURIComponent(keyword)}&`;
    }
    if (region) {
        apiUrl += `region=${encodeURIComponent(region)}&`;
    }
    if (platform) { // Add platform to API URL
        apiUrl += `platform=${encodeURIComponent(platform)}&`;
    }
    // Note: serviceType is not directly a column in DB, so it's filtered client-side or needs backend logic
    // For now, if serviceType is selected, we'll fetch all matching platforms and filter client-side if needed.
    // Or, if you want serviceType to filter the API call, you'd need to modify app.py to handle it.

    if (apiUrl.endsWith('&')) {
        apiUrl = apiUrl.slice(0, -1);
    }

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            if (response.status === 404) {
                 alert('No historical data found for the selected criteria. Please try a different combination or ensure your database has historical data.');
                 if (historicalTrendsChartInstance) {
                     historicalTrendsChartInstance.destroy();
                     historicalTrendsChartInstance = null;
                 }
                 return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        let historicalData = await response.json(); // Use 'let' because we might filter it

        console.log("Historical data fetched:", historicalData);

        // --- NEW: Client-side filtering for serviceType if selected ---
        if (serviceType) {
            historicalData = historicalData.filter(item => (serviceTypeMapping[item.platform] || "Other Services") === serviceType);
        }
        // --- END NEW CLIENT-SIDE FILTERING ---

        if (historicalData.length === 0) { // Check again after client-side filter
            alert('No historical data found after applying service type filter. Please try a different combination.');
            if (historicalTrendsChartInstance) {
                historicalTrendsChartInstance.destroy();
                historicalTrendsChartInstance = null;
            }
            return;
        }

        const aggregatedData = {};
        historicalData.forEach(item => {
            const date = item.fetch_date;
            if (!aggregatedData[date]) {
                aggregatedData[date] = 0;
            }
            aggregatedData[date] += item.interest_score;
        });

        const chartLabels = Object.keys(aggregatedData).sort();
        const chartData = chartLabels.map(date => aggregatedData[date]);

        const ctx = document.getElementById('historicalTrendsChart').getContext('2d');

        if (historicalTrendsChartInstance) {
            historicalTrendsChartInstance.destroy();
        }

        const lineChartColor = 'rgba(0, 123, 255, 1)';
        const lineChartFillColor = 'rgba(0, 123, 255, 0.2)';

        historicalTrendsChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: `Interest Trend for ${keyword || 'Selected Criteria'} in ${region || 'All Regions'}`,
                    data: chartData,
                    borderColor: lineChartColor,
                    backgroundColor: lineChartFillColor,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'category',
                        labels: chartLabels,
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Interest Score'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                }
            }
        });

    } catch (error) {
        console.error('Error fetching historical data:', error);
        alert('Failed to load historical data. Check console for details or ensure backend is running.');
    }
}

function toggleRawDataTable() {
    const rawDataContainer = document.getElementById('rawDataContainer');
    const toggleButton = document.getElementById('toggleRawDataButton');

    if (rawDataContainer.style.display === 'none') {
        rawDataContainer.style.display = 'block';
        toggleButton.textContent = 'Hide Raw Data';
    } else {
        rawDataContainer.style.display = 'none';
        toggleButton.textContent = 'Show Raw Data';
    }
}