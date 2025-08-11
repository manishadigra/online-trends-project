
// document.addEventListener('DOMContentLoaded', () => {
//     // References are the same...
//     const categoryFilter = document.getElementById('category-filter');
//     const platformFilter = document.getElementById('platform-filter');
//     const tableBody = document.getElementById('detailed-table-body');

//     // Main change is in this function
//     const fetchAndRenderTable = async () => {
//         const category = categoryFilter.value;
//         const platform = platformFilter.value;
//         tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading...</td></tr>';
//         try {
//             const response = await fetch(`/api/detailed_trends?category=${category}&platform=${platform}`);
//             const trends = await response.json();
//             tableBody.innerHTML = '';
//             trends.forEach(trend => {
//                 const row = document.createElement('tr');
//                 row.innerHTML = `<td>${trend.keyword}</td><td>${trend.category}</td><td>${trend.platform}</td><td><span class="score-bar" style="width: ${trend.interest_score}%"></span>${trend.interest_score}</td><td>${trend.region}</td>`;
                
//                 // --- THIS IS THE KEY CHANGE ---
//                 // When a row is clicked, go to the detail page for that keyword
//                 row.addEventListener('click', () => {
//                     window.location.href = `/trend/${encodeURIComponent(trend.keyword)}`;
//                 });
//                 // --- END OF CHANGE ---

//                 tableBody.appendChild(row);
//             });
//         } catch (error) { tableBody.innerHTML = '<tr><td colspan="5">Error loading data.</td></tr>'; }
//     };

//     // The rest of the functions (populateFilters, fetchTopKeywords, initDashboard) remain the same
//     const populateFilters = async () => {
//         try {
//             const response = await fetch('/api/filters');
//             const data = await response.json();
//             data.categories.forEach(cat => categoryFilter.add(new Option(cat, cat)));
//             data.platforms.forEach(plat => platformFilter.add(new Option(plat, plat)));
//         } catch (error) { console.error('Failed to load filters:', error); }
//     };
//     const fetchTopKeywords = async () => {
//         const topKeywordsList = document.getElementById('top-keywords-list');
//         try {
//             const response = await fetch('/api/top_keywords');
//             const keywords = await response.json();
//             topKeywordsList.innerHTML = keywords.map(kw => `<li>${kw.keyword} <span>${kw.score}</span></li>`).join('');
//         } catch (error) { console.error('Failed to load top keywords:', error); }
//     };
//     const initDashboard = async () => {
//         await populateFilters();
//         await fetchTopKeywords();
//         await fetchAndRenderTable();
//         categoryFilter.addEventListener('change', fetchAndRenderTable);
//         platformFilter.addEventListener('change', fetchAndRenderTable);
//     };

//     initDashboard();
// });

// document.addEventListener('DOMContentLoaded', () => {
//     // --- DOM Element References ---
//     const categoryFilter = document.getElementById('category-filter');
//     const platformFilter = document.getElementById('platform-filter');
//     const topKeywordsList = document.getElementById('top-keywords-list');
//     const tableBody = document.getElementById('detailed-table-body');
//     const chartPlaceholder = document.getElementById('chart-placeholder');
//     const chartCanvas = document.getElementById('historical-chart');
//     const compareBtn = document.getElementById('compare-btn');
//     const ctx = chartCanvas.getContext('2d');
    
//     let historicalChart = null;
//     let selectedKeywords = new Set(); // Use a Set for easy add/delete of unique keywords

//     // --- Chart Colors ---
//     const CHART_COLORS = ['#6a11cb', '#2575fc', '#f59e0b', '#10b981', '#ef4444'];

//     // --- Main Dashboard Initialization ---
//     const initDashboard = async () => {
//         await populateFilters();
//         await fetchTopKeywords();
//         await fetchAndRenderTable();

//         // Add event listeners
//         categoryFilter.addEventListener('change', fetchAndRenderTable);
//         platformFilter.addEventListener('change', fetchAndRenderTable);
//         compareBtn.addEventListener('click', fetchAndRenderCompareChart);
//     };

//     const updateCompareButton = () => {
//         const count = selectedKeywords.size;
//         if (count >= 2) {
//             compareBtn.disabled = false;
//             compareBtn.textContent = `Compare ${count} Items`;
//         } else {
//             compareBtn.disabled = true;
//             compareBtn.textContent = 'Compare Selected';
//         }
//     };

//     const fetchAndRenderTable = async () => {
//         const category = categoryFilter.value;
//         const platform = platformFilter.value;
//         tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Loading...</td></tr>';
//         try {
//             const response = await fetch(`/api/detailed_trends?category=${category}&platform=${platform}`);
//             const trends = await response.json();
//             tableBody.innerHTML = '';
//             trends.forEach(trend => {
//                 const row = document.createElement('tr');
//                 const uniqueId = `${trend.keyword.replace(/\s/g, '-')}-${trend.platform}-${trend.region}`;
//                 row.innerHTML = `
//                     <td class="checkbox-col"><input type="checkbox" data-keyword="${trend.keyword}" id="${uniqueId}"></td>
//                     <td><label for="${uniqueId}">${trend.keyword}</label></td>
//                     <td>${trend.category}</td>
//                     <td>${trend.platform}</td>
//                     <td><span class="score-bar" style="width: ${trend.interest_score}%"></span>${trend.interest_score}</td>
//                     <td>${trend.region}</td>
//                 `;
                
//                 const checkbox = row.querySelector('input[type="checkbox"]');
//                 // When a checkbox is changed, update our selection
//                 checkbox.addEventListener('change', (e) => {
//                     const keyword = e.target.dataset.keyword;
//                     if (e.target.checked) {
//                         selectedKeywords.add(keyword);
//                     } else {
//                         selectedKeywords.delete(keyword);
//                     }
//                     updateCompareButton();
//                 });

//                 // Also allow clicking the row to toggle the checkbox
//                 row.addEventListener('click', (e) => {
//                     if (e.target.type !== 'checkbox') {
//                         checkbox.checked = !checkbox.checked;
//                         // Manually trigger the change event
//                         checkbox.dispatchEvent(new Event('change'));
//                     }
//                 });

//                 tableBody.appendChild(row);
//             });
//         } catch (error) { tableBody.innerHTML = '<tr><td colspan="6">Error loading data.</td></tr>'; }
//     };

//     const fetchAndRenderCompareChart = async () => {
//         if (selectedKeywords.size < 2) return;
//         chartPlaceholder.style.display = 'none';

//         const keywordsQuery = Array.from(selectedKeywords).join(',');
//         try {
//             const response = await fetch(`/api/compare_trends?keywords=${encodeURIComponent(keywordsQuery)}`);
//             const data = await response.json();

//             if (historicalChart) { historicalChart.destroy(); }

//             const datasets = Object.keys(data).map((keyword, index) => {
//                 const history = data[keyword];
//                 return {
//                     label: keyword,
//                     data: history.map(item => ({ x: item.date, y: item.score })),
//                     borderColor: CHART_COLORS[index % CHART_COLORS.length],
//                     backgroundColor: CHART_COLORS[index % CHART_COLORS.length] + '1A', // Add transparency
//                     tension: 0.3,
//                     fill: true,
//                 };
//             });
            
//             historicalChart = new Chart(ctx, {
//                 type: 'line',
//                 data: { datasets: datasets },
//                 options: {
//                     responsive: true, maintainAspectRatio: false,
//                     scales: {
//                         x: { type: 'time', time: { unit: 'week' }, grid: { display: false } },
//                         y: { beginAtZero: true, max: 100, grid: { color: '#e2e8f0' } }
//                     },
//                     plugins: { legend: { position: 'top' } }
//                 }
//             });
//         } catch (error) { console.error('Failed to load comparison data:', error); }
//     };

//     const populateFilters = async () => {
//         try {
//             const response = await fetch('/api/filters');
//             const data = await response.json();
//             data.categories.forEach(cat => categoryFilter.add(new Option(cat, cat)));
//             data.platforms.forEach(plat => platformFilter.add(new Option(plat, plat)));
//         } catch (error) { console.error('Failed to load filters:', error); }
//     };

//     const fetchTopKeywords = async () => {
//         try {
//             const response = await fetch('/api/top_keywords');
//             const keywords = await response.json();
//             topKeywordsList.innerHTML = keywords.map(kw => `<li>${kw.keyword} <span>${kw.score}</span></li>`).join('');
//         } catch (error) { console.error('Failed to load top keywords:', error); }
//     };
    
//     initDashboard();
// });




document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const categoryFilter = document.getElementById('category-filter');
    const platformFilter = document.getElementById('platform-filter');
    const topKeywordsList = document.getElementById('top-keywords-list');
    const tableBody = document.getElementById('detailed-table-body');
    const chartPlaceholder = document.getElementById('chart-placeholder');
    const chartCanvas = document.getElementById('historical-chart');
    const compareBtn = document.getElementById('compare-btn');
    const ctx = chartCanvas.getContext('2d');
    
    let historicalChart = null;
    let selectedKeywords = new Set();

    const CHART_COLORS = ['#6a11cb', '#2575fc', '#f59e0b', '#10b981', '#ef4444'];

    const initDashboard = async () => {
        await populateFilters();
        await fetchTopKeywords();
        await fetchAndRenderTable();
        categoryFilter.addEventListener('change', fetchAndRenderTable);
        platformFilter.addEventListener('change', fetchAndRenderTable);
        compareBtn.addEventListener('click', fetchAndRenderCompareChart);
    };

    const updateCompareButton = () => {
        const count = selectedKeywords.size;
        if (count >= 2) {
            compareBtn.disabled = false;
            compareBtn.textContent = `Compare ${count} Items`;
        } else {
            compareBtn.disabled = true;
            compareBtn.textContent = 'Compare Selected';
        }
    };

    const fetchAndRenderTable = async () => {
        const category = categoryFilter.value;
        const platform = platformFilter.value;
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Loading...</td></tr>';
        try {
            const response = await fetch(`/api/detailed_trends?category=${category}&platform=${platform}`);
            const trends = await response.json();
            tableBody.innerHTML = '';
            trends.forEach(trend => {
                const row = document.createElement('tr');
                const uniqueId = `${trend.keyword.replace(/\s/g, '-')}-${trend.platform}-${trend.region}`;
                // We add a class to the keyword cell to make it clickable
                row.innerHTML = `
                    <td class="checkbox-col"><input type="checkbox" data-keyword="${trend.keyword}" id="${uniqueId}"></td>
                    <td class="keyword-cell" data-keyword="${trend.keyword}"><label for="${uniqueId}">${trend.keyword}</label></td>
                    <td>${trend.category}</td>
                    <td>${trend.platform}</td>
                    <td><span class="score-bar" style="width: ${trend.interest_score}%"></span>${trend.interest_score}</td>
                    <td>${trend.region}</td>
                `;
                
                const checkbox = row.querySelector('input[type="checkbox"]');
                const keywordCell = row.querySelector('.keyword-cell');

                // Event listener for the checkbox (for comparison)
                checkbox.addEventListener('change', () => {
                    if (checkbox.checked) {
                        selectedKeywords.add(trend.keyword);
                    } else {
                        selectedKeywords.delete(trend.keyword);
                    }
                    updateCompareButton();
                });

                // Event listener for the keyword cell (for opening detail page)
                keywordCell.addEventListener('click', () => {
                    // Open the detail page in a new tab
                    window.open(`/trend/${encodeURIComponent(trend.keyword)}`, '_blank');
                });

                tableBody.appendChild(row);
            });
        } catch (error) { tableBody.innerHTML = '<tr><td colspan="6">Error loading data.</td></tr>'; }
    };

    const fetchAndRenderCompareChart = async () => {
        if (selectedKeywords.size < 2) return;
        chartPlaceholder.style.display = 'none';
        const keywordsQuery = Array.from(selectedKeywords).join(',');
        try {
            const response = await fetch(`/api/compare_trends?keywords=${encodeURIComponent(keywordsQuery)}`);
            const data = await response.json();
            if (historicalChart) { historicalChart.destroy(); }
            const datasets = Object.keys(data).map((keyword, index) => ({
                label: keyword,
                data: data[keyword].map(item => ({ x: item.date, y: item.score })),
                borderColor: CHART_COLORS[index % CHART_COLORS.length],
                backgroundColor: CHART_COLORS[index % CHART_COLORS.length] + '1A',
                tension: 0.3,
                fill: true,
            }));
            historicalChart = new Chart(ctx, {
                type: 'line',
                data: { datasets: datasets },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: {
                        x: { type: 'time', time: { unit: 'week' }, grid: { display: false } },
                        y: { beginAtZero: true, max: 100, grid: { color: '#e2e8f0' } }
                    },
                    plugins: { legend: { position: 'top' } }
                }
            });
        } catch (error) { console.error('Failed to load comparison data:', error); }
    };

    const populateFilters = async () => {
        try {
            const response = await fetch('/api/filters');
            const data = await response.json();
            data.categories.forEach(cat => categoryFilter.add(new Option(cat, cat)));
            data.platforms.forEach(plat => platformFilter.add(new Option(plat, plat)));
        } catch (error) { console.error('Failed to load filters:', error); }
    };

    const fetchTopKeywords = async () => {
        try {
            const response = await fetch('/api/top_keywords');
            const keywords = await response.json();
            topKeywordsList.innerHTML = keywords.map(kw => `<li>${kw.keyword} <span>${kw.score}</span></li>`).join('');
        } catch (error) { console.error('Failed to load top keywords:', error); }
    };
    
    initDashboard();
});