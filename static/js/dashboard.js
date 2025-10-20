// Dashboard JavaScript
let socket;
let priceChart;
let volumeChart;
let currentPairs = [];
let marketData = {};

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeWebSocket();
    initializeCharts();
    loadTradingPairs();
    setInterval(updateOrderBook, 10000); // Update orderbook every 10 seconds
});

// WebSocket Connection
function initializeWebSocket() {
    socket = io();
    
    socket.on('connect', function() {
        console.log('Connected to server');
        updateConnectionStatus(true);
    });
    
    socket.on('disconnect', function() {
        console.log('Disconnected from server');
        updateConnectionStatus(false);
    });
    
    socket.on('market_update', function(data) {
        marketData = data;
        updateDashboard(data);
    });
    
    socket.on('connection_response', function(data) {
        console.log('Connection response:', data);
    });
}

function updateConnectionStatus(connected) {
    const indicator = document.getElementById('connectionStatus');
    const text = document.getElementById('connectionText');
    
    if (connected) {
        indicator.classList.add('connected');
        text.textContent = 'Connected';
    } else {
        indicator.classList.remove('connected');
        text.textContent = 'Disconnected';
    }
}

// Load Trading Pairs
async function loadTradingPairs() {
    try {
        const response = await fetch('/api/pairs');
        const data = await response.json();
        currentPairs = data.pairs;
        updatePairsGrid();
    } catch (error) {
        console.error('Error loading trading pairs:', error);
    }
}

// Update Dashboard with Market Data
function updateDashboard(data) {
    updateSummaryCards(data);
    updatePairsGrid();
    updatePriceChart();
    updateVolumeChart();
    
    // Update last update time
    const now = new Date();
    document.getElementById('lastUpdate').textContent = now.toLocaleTimeString();
}

// Update Summary Cards
function updateSummaryCards(data) {
    let gainers = 0;
    let losers = 0;
    
    Object.values(data).forEach(pair => {
        if (pair.price_change_percent_24h > 0) gainers++;
        if (pair.price_change_percent_24h < 0) losers++;
    });
    
    document.getElementById('totalPairs').textContent = currentPairs.length;
    document.getElementById('gainers').textContent = gainers;
    document.getElementById('losers').textContent = losers;
}

// Update Pairs Grid
function updatePairsGrid() {
    const grid = document.getElementById('pairsGrid');
    grid.innerHTML = '';
    
    currentPairs.forEach(symbol => {
        const pairData = marketData[symbol] || {};
        const card = createPairCard(symbol, pairData);
        grid.appendChild(card);
    });
}

// Create Pair Card
function createPairCard(symbol, data) {
    const card = document.createElement('div');
    card.className = 'pair-card';
    card.onclick = () => selectPair(symbol);
    
    const price = data.price || 0;
    const change = data.price_change_percent_24h || 0;
    const changeClass = change >= 0 ? 'positive' : 'negative';
    const changeSymbol = change >= 0 ? '+' : '';
    
    card.innerHTML = `
        <div class="pair-header">
            <span class="pair-symbol">${symbol}</span>
            <button class="pair-remove" onclick="removePair('${symbol}'); event.stopPropagation();">×</button>
        </div>
        <div class="pair-price">$${price.toFixed(2)}</div>
        <div class="pair-change ${changeClass}">${changeSymbol}${change.toFixed(2)}%</div>
        <div class="pair-stats">
            <div class="stat-item">
                <span class="stat-label">24h High</span>
                <span class="stat-value">$${(data.high_24h || 0).toFixed(2)}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">24h Low</span>
                <span class="stat-value">$${(data.low_24h || 0).toFixed(2)}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">24h Volume</span>
                <span class="stat-value">${formatVolume(data.volume_24h || 0)}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Trades</span>
                <span class="stat-value">${formatNumber(data.trades_24h || 0)}</span>
            </div>
        </div>
    `;
    
    return card;
}

// Select Pair
function selectPair(symbol) {
    document.getElementById('selectedPair').textContent = symbol;
    document.getElementById('orderbookPair').textContent = symbol;
    updatePriceChart(symbol);
    updateOrderBook(symbol);
}

// Initialize Charts
function initializeCharts() {
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: '#848e9c'
                }
            },
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: '#848e9c'
                }
            }
        }
    };
    
    // Price Chart
    const priceCtx = document.getElementById('priceChart').getContext('2d');
    priceChart = new Chart(priceCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Price',
                data: [],
                borderColor: '#f0b90b',
                backgroundColor: 'rgba(240, 185, 11, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: chartOptions
    });
    
    // Volume Chart
    const volumeCtx = document.getElementById('volumeChart').getContext('2d');
    volumeChart = new Chart(volumeCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Volume',
                data: [],
                backgroundColor: 'rgba(240, 185, 11, 0.6)',
                borderColor: '#f0b90b',
                borderWidth: 1
            }]
        },
        options: chartOptions
    });
}

// Update Price Chart
async function updatePriceChart(symbol = 'BTCUSDT') {
    try {
        const response = await fetch(`/api/history/${symbol}`);
        const history = await response.json();
        
        if (history.length > 0) {
            const labels = history.map(h => new Date(h.time).toLocaleTimeString());
            const data = history.map(h => h.price);
            
            priceChart.data.labels = labels;
            priceChart.data.datasets[0].data = data;
            priceChart.update();
        }
    } catch (error) {
        console.error('Error updating price chart:', error);
    }
}

// Update Volume Chart
function updateVolumeChart() {
    const labels = [];
    const data = [];
    
    currentPairs.forEach(symbol => {
        if (marketData[symbol] && marketData[symbol].volume_24h) {
            labels.push(symbol);
            data.push(marketData[symbol].volume_24h);
        }
    });
    
    volumeChart.data.labels = labels;
    volumeChart.data.datasets[0].data = data;
    volumeChart.update();
}

// Update Order Book
async function updateOrderBook(symbol = 'BTCUSDT') {
    try {
        const response = await fetch(`/api/orderbook/${symbol}`);
        const orderbook = await response.json();
        
        if (orderbook.asks && orderbook.bids) {
            displayOrderBook(orderbook);
        }
    } catch (error) {
        console.error('Error updating orderbook:', error);
    }
}

// Display Order Book
function displayOrderBook(orderbook) {
    const asksElement = document.getElementById('asksBook');
    const bidsElement = document.getElementById('bidsBook');
    
    asksElement.innerHTML = '';
    bidsElement.innerHTML = '';
    
    // Display asks (reverse order for better UX)
    orderbook.asks.slice(0, 10).reverse().forEach(([price, amount]) => {
        const row = document.createElement('div');
        row.className = 'orderbook-row ask';
        row.innerHTML = `
            <span class="orderbook-price">${parseFloat(price).toFixed(2)}</span>
            <span class="orderbook-amount">${parseFloat(amount).toFixed(4)}</span>
        `;
        asksElement.appendChild(row);
    });
    
    // Display bids
    orderbook.bids.slice(0, 10).forEach(([price, amount]) => {
        const row = document.createElement('div');
        row.className = 'orderbook-row bid';
        row.innerHTML = `
            <span class="orderbook-price">${parseFloat(price).toFixed(2)}</span>
            <span class="orderbook-amount">${parseFloat(amount).toFixed(4)}</span>
        `;
        bidsElement.appendChild(row);
    });
}

// Add Pair Modal
function showAddPairModal() {
    document.getElementById('addPairModal').classList.add('show');
}

function closeAddPairModal() {
    document.getElementById('addPairModal').classList.remove('show');
    document.getElementById('newPairInput').value = '';
}

// Add Trading Pair
async function addPair() {
    const input = document.getElementById('newPairInput');
    const symbol = input.value.trim().toUpperCase();
    
    if (!symbol) {
        alert('Please enter a trading pair symbol');
        return;
    }
    
    try {
        const response = await fetch('/api/add_pair', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ symbol })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentPairs = data.pairs;
            updatePairsGrid();
            closeAddPairModal();
        } else {
            alert(data.error || 'Failed to add pair');
        }
    } catch (error) {
        console.error('Error adding pair:', error);
        alert('Failed to add pair');
    }
}

// Remove Trading Pair
async function removePair(symbol) {
    if (!confirm(`Remove ${symbol} from monitoring?`)) {
        return;
    }
    
    try {
        const response = await fetch('/api/remove_pair', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ symbol })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentPairs = data.pairs;
            updatePairsGrid();
        } else {
            alert(data.error || 'Failed to remove pair');
        }
    } catch (error) {
        console.error('Error removing pair:', error);
        alert('Failed to remove pair');
    }
}

// Utility Functions
function formatVolume(volume) {
    if (volume >= 1000000000) {
        return (volume / 1000000000).toFixed(2) + 'B';
    } else if (volume >= 1000000) {
        return (volume / 1000000).toFixed(2) + 'M';
    } else if (volume >= 1000) {
        return (volume / 1000).toFixed(2) + 'K';
    }
    return volume.toFixed(2);
}

function formatNumber(num) {
    return num.toLocaleString();
}

// Handle Enter key in add pair modal
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        const modal = document.getElementById('addPairModal');
        if (modal.classList.contains('show')) {
            addPair();
        }
    }
});
