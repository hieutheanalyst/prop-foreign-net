// State
let globalData = [];
let currentMetric = '20'; // Can be '1', '5', or '20'
let currentSortColumn = 'ForeignNet';
let currentSortDirection = 'desc'; // 'asc' or 'desc'
let searchQuery = '';

// Configuration for metrics mapping
const metricsConfig = {
    '1': {
        prop: 'PropNet',
        foreign: 'ForeignNet',
        title: 'Dòng tiền tổ chức',
    },
    '5': {
        prop: 'PropNet_5',
        foreign: 'ForeignNet_5',
        title: 'Dòng tiền tổ chức',
    },
    '20': {
        prop: 'PropNet_20',
        foreign: 'ForeignNet_20',
        title: 'Dòng tiền tổ chức',
    }
};

// Formatting Helper
const formatNumber = (num) => {
    const val = parseFloat(num);
    if (isNaN(val)) return '-';
    return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const getColorClass = (num) => {
    const val = parseFloat(num);
    if (val > 0) return 'text-positive';
    if (val < 0) return 'text-negative';
    return 'text-neutral';
};

// Initialize application
async function init() {
    await fetchAIComment();
    await fetchAndParseData();
    setupEventListeners();
}

// Fetch AI Comments
async function fetchAIComment() {
    const commentEl = document.getElementById('ai-comment-text');
    try {
        if (typeof aiCommentData !== 'undefined') {
            renderAIComment(aiCommentData, commentEl);
            commentEl.classList.remove('loading-text');
            return;
        }
        // Prevent caching for local dev
        const response = await fetch(`ai-comment.txt?t=${new Date().getTime()}`);
        if (!response.ok) throw new Error('File not found');
        const text = await response.text();
        renderAIComment(text, commentEl);
        commentEl.classList.remove('loading-text');
    } catch (error) {
        console.error('Error fetching AI comment:', error);
        commentEl.textContent = 'Không thể tải nhận định.';
        commentEl.classList.remove('loading-text');
    }
}

// Format text as bullet points with bold prefixes
function renderAIComment(text, container) {
    if (!text || text.trim() === '') {
        container.innerHTML = 'Không có nhận định nào.';
        return;
    }
    
    const lines = text.split('\n').filter(line => line.trim() !== '');
    
    let html = '<ul style="margin: 0; padding-left: 20px; line-height: 1.6;">';
    lines.forEach(line => {
        const colonIndex = line.indexOf(':');
        // If there is a colon and it's near the start of the line, treat as a heading
        if (colonIndex !== -1 && colonIndex < 80) {
            const boldPart = line.substring(0, colonIndex + 1);
            const restPart = line.substring(colonIndex + 1);
            html += `<li style="margin-bottom: 8px;"><strong>${boldPart}</strong>${restPart}</li>`;
        } else {
            html += `<li style="margin-bottom: 8px;">${line}</li>`;
        }
    });
    html += '</ul>';
    
    container.innerHTML = html;
}

// Fetch and Parse CSV Data
async function fetchAndParseData() {
    try {
        let csvText = '';
        if (typeof csvData !== 'undefined') {
            csvText = csvData;
        } else {
            const response = await fetch(`data.csv?t=${new Date().getTime()}`);
            csvText = await response.text();
        }
        
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                globalData = results.data;
                
                // Get most recent date from CSV and append 17:59:02
                if (globalData.length > 0 && globalData[0]['Date/Time']) {
                    const dateTimeStr = globalData[0]['Date/Time'];
                    const datePart = dateTimeStr.split(' ')[0]; // Extract the date part
                    const timeEl = document.getElementById('update-time');
                    if (timeEl) {
                        timeEl.textContent = `Dữ liệu cập nhật: ${datePart} 17:59:02`;
                    }
                }
                
                updateDashboard();
                renderTable(); // Initial render for table
            }
        });
    } catch (error) {
        console.error('Error fetching CSV:', error);
    }
}

// Update UI based on current state
function updateDashboard() {
    const config = metricsConfig[currentMetric];
    document.getElementById('chart-title').textContent = config.title;
    
    renderChart();
}

// Render Data Table
function renderTable() {
    const tbody = document.querySelector('#data-table tbody');
    
    // Filter by search query
    let filteredData = globalData;
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredData = globalData.filter(row => row.Ticker.toLowerCase().includes(query));
    }
    
    // Sort Data
    const sortedData = [...filteredData].sort((a, b) => {
        const valA = parseFloat(a[currentSortColumn]) || 0;
        const valB = parseFloat(b[currentSortColumn]) || 0;
        
        if (valA === valB) {
            return a.Ticker.localeCompare(b.Ticker);
        }
        
        if (currentSortDirection === 'asc') {
            return valA - valB;
        } else {
            return valB - valA;
        }
    });
    
    // Update sort headers UI
    document.querySelectorAll('.sortable').forEach(th => {
        th.classList.remove('asc', 'desc');
        if (th.getAttribute('data-sort') === currentSortColumn) {
            th.classList.add(currentSortDirection);
        }
    });
    
    tbody.innerHTML = '';
    
    sortedData.forEach(row => {
        const tr = document.createElement('tr');
        
        // Ticker
        const tdTicker = document.createElement('td');
        tdTicker.className = 'text-center font-bold';
        tdTicker.textContent = row.Ticker;
        tr.appendChild(tdTicker);
        
        // Data Columns
        const cols = ['PropNet', 'PropNet_5', 'PropNet_20', 'ForeignNet', 'ForeignNet_5', 'ForeignNet_20'];
        cols.forEach(col => {
            const td = document.createElement('td');
            const val = row[col];
            td.className = `text-center ${getColorClass(val)}`;
            td.textContent = formatNumber(val);
            tr.appendChild(td);
        });
        
        tbody.appendChild(tr);
    });
}

// Render Plotly Scatter Plot
function renderChart() {
    const config = metricsConfig[currentMetric];
    
    // Lọc top 20 theo tổng absolute (ForeignNet + PropNet) và loại bỏ Index
    const excludeTickers = ['VNINDEX', 'VN30', 'HNXINDEX', 'VN100', 'UPCOMINDEX'];
    const sortedForChart = [...globalData]
        .filter(row => !excludeTickers.includes(row.Ticker))
        .sort((a, b) => {
            const sumA = Math.abs(parseFloat(a[config.foreign]) || 0) + Math.abs(parseFloat(a[config.prop]) || 0);
            const sumB = Math.abs(parseFloat(b[config.foreign]) || 0) + Math.abs(parseFloat(b[config.prop]) || 0);
            return sumB - sumA;
        })
        .slice(0, 20);
    
    const xData = [];
    const yData = [];
    const textData = [];
    const hoverData = [];
    const markerColors = [];
    const markerSizes = [];

    sortedForChart.forEach(row => {
        const xVal = parseFloat(row[config.foreign]) || 0;
        const yVal = parseFloat(row[config.prop]) || 0;
        
        xData.push(xVal);
        yData.push(yVal);
        textData.push(row.Ticker);
        
        // Tooltip text
        hoverData.push(
            `<b>${row.Ticker}</b><br>` +
            `Tự doanh: ${formatNumber(yVal)}<br>` +
            `Khối ngoại: ${formatNumber(xVal)}`
        );
        
        // Determine color based on quadrants
        if (xVal > 0 && yVal > 0) {
            markerColors.push('#10b981'); // Green - Both buying
        } else if (xVal < 0 && yVal < 0) {
            markerColors.push('#dc2626'); // Red - Both selling
        } else if (xVal > 0 && yVal < 0) {
            markerColors.push('#2563eb'); // Blue - Foreign Buy, Prop Sell
        } else {
            markerColors.push('#f59e0b'); // Yellow - Foreign Sell, Prop Buy
        }
        
        // Size proportional to total absolute volume, minimum size 10, max size 35
        const totalVolume = Math.abs(xVal) + Math.abs(yVal);
        const size = Math.min(Math.max(Math.sqrt(totalVolume) * 2, 10), 35);
        markerSizes.push(size);
    });

    const trace = {
        x: xData,
        y: yData,
        text: textData,
        hovertext: hoverData,
        mode: 'markers+text',
        textposition: 'top center',
        hoverinfo: 'text',
        marker: {
            size: markerSizes,
            color: markerColors,
            opacity: 0.75,
            line: {
                width: 1,
                color: 'rgba(255, 255, 255, 0.8)'
            }
        },
        textfont: {
            family: 'Lexend, sans-serif',
            size: 11,
            color: '#1e293b'
        }
    };

    const layout = {
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        hovermode: 'closest',
        margin: { t: 10, r: 10, b: 80, l: 60 },
        font: {
            family: 'Lexend, sans-serif',
            color: '#475569'
        },
        xaxis: {
            title: 'Khối ngoại mua ròng',
            gridcolor: 'rgba(37, 99, 235, 0.1)',
            zerolinecolor: 'rgba(37, 99, 235, 0.3)',
            zerolinewidth: 2
        },
        yaxis: {
            title: 'Tự doanh mua ròng',
            gridcolor: 'rgba(37, 99, 235, 0.1)',
            zerolinecolor: 'rgba(37, 99, 235, 0.3)',
            zerolinewidth: 2
        },
        // Add shapes to divide quadrants
        shapes: [
            {
                type: 'line', x0: 0, x1: 0, y0: 0, y1: 1, yref: 'paper',
                line: { color: 'rgba(37,99,235,0.2)', width: 1 }
            },
            {
                type: 'line', x0: 0, x1: 1, xref: 'paper', y0: 0, y1: 0,
                line: { color: 'rgba(37,99,235,0.2)', width: 1 }
            }
        ]
    };

    const configOptions = {
        responsive: true,
        displayModeBar: false
    };

    Plotly.newPlot('scatter-plot', [trace], layout, configOptions);
}

// Setup Event Listeners
function setupEventListeners() {
    const buttons = document.querySelectorAll('.toggle-btn');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active from all
            buttons.forEach(b => b.classList.remove('active'));
            // Add active to clicked
            e.target.classList.add('active');
            
            // Update state and re-render
            currentMetric = e.target.getAttribute('data-metric');
            updateDashboard();
        });
    });

    // Handle window resize for plot
    window.addEventListener('resize', () => {
        const plotEl = document.getElementById('scatter-plot');
        if (plotEl && plotEl.data) {
            Plotly.Plots.resize(plotEl);
        }
    });

    // Search Input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderTable(); // Only re-render table, chart stays same
        });
    }

    // Sortable Headers
    const sortHeaders = document.querySelectorAll('.sortable');
    sortHeaders.forEach(th => {
        th.addEventListener('click', () => {
            const column = th.getAttribute('data-sort');
            if (currentSortColumn === column) {
                // Toggle direction
                currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortColumn = column;
                currentSortDirection = 'desc'; // Default to desc for new column
            }
            renderTable(); // Only re-render table
        });
    });
}

// Boot
document.addEventListener('DOMContentLoaded', init);
