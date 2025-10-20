// Binance Dashboard JavaScript (Standalone - no external dependencies)
// Handles real-time updates via polling and UI interactions

// State management
let currentPrices = {};
let currentMarketTab = 'gainers';
let updateInterval = null;

// DOM Elements
const connectionStatus = document.getElementById('connection-status');
const connectionText = document.getElementById('connection-text');
const pricesContainer = document.getElementById('prices-container');
const portfolioContainer = document.getElementById('portfolio-container');
const tradeHistoryContainer = document.getElementById('trade-history-container');
const tradeForm = document.getElementById('trade-form');
const marketContent = document.getElementById('market-content');

// Initialize the dashboard
function init() {
    setupEventListeners();
    fetchInitialData();
    startPriceUpdates();
    loadMarketOverview();
}

// Setup UI event listeners
function setupEventListeners() {
    // Trade form submission
    tradeForm.addEventListener('submit', handleTradeSubmit);

    // Market overview tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentMarketTab = e.target.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            loadMarketOverview();
        });
    });
}

// Start polling for price updates
function startPriceUpdates() {
    // Initial fetch
    fetchPrices();
    
    // Poll every 3 seconds
    updateInterval = setInterval(fetchPrices, 3000);
}

// Fetch current prices
async function fetchPrices() {
    try {
        const response = await fetch('/api/prices');
        const prices = await response.json();
        updatePrices(prices);
    } catch (error) {
        console.error('Error fetching prices:', error);
    }
}

// Update prices display
function updatePrices(prices) {
    currentPrices = prices;
    
    if (Object.keys(prices).length === 0) {
        pricesContainer.innerHTML = '<p class="placeholder">Loading prices...</p>';
        return;
    }
    
    pricesContainer.innerHTML = '';

    Object.values(prices).forEach(price => {
        const priceCard = createPriceCard(price);
        pricesContainer.appendChild(priceCard);
    });
}

// Create a price card element
function createPriceCard(priceData) {
    const card = document.createElement('div');
    card.className = 'price-card';
    
    const change = priceData.change_24h || 0;
    const changeClass = change >= 0 ? 'positive' : 'negative';
    const changeSymbol = change >= 0 ? '+' : '';

    card.innerHTML = `
        <div class="price-card-header">
            <span class="symbol">${priceData.symbol}</span>
            <span class="change ${changeClass}">${changeSymbol}${change.toFixed(2)}%</span>
        </div>
        <div class="price">$${parseFloat(priceData.price).toFixed(2)}</div>
        <div class="price-stats">
            <span>H: $${(priceData.high_24h || 0).toFixed(2)}</span>
            <span>L: $${(priceData.low_24h || 0).toFixed(2)}</span>
            <span>Vol: ${formatVolume(priceData.volume_24h || 0)}</span>
        </div>
    `;

    return card;
}

// Format volume for display
function formatVolume(volume) {
    if (volume >= 1000000) {
        return (volume / 1000000).toFixed(2) + 'M';
    } else if (volume >= 1000) {
        return (volume / 1000).toFixed(2) + 'K';
    }
    return volume.toFixed(2);
}

// Handle trade form submission
async function handleTradeSubmit(e) {
    e.preventDefault();

    const trade = {
        symbol: document.getElementById('symbol').value,
        side: document.getElementById('side').value,
        quantity: parseFloat(document.getElementById('quantity').value),
        price: parseFloat(document.getElementById('price').value)
    };

    try {
        const response = await fetch('/api/add_trade', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(trade)
        });

        const result = await response.json();
        
        if (result.status === 'success') {
            tradeForm.reset();
            await Promise.all([
                fetchPortfolio(),
                fetchAnalytics(),
                fetchTradeHistory()
            ]);
        }
    } catch (error) {
        console.error('Error adding trade:', error);
        alert('Failed to add trade. Please try again.');
    }
}

// Add trade to history display
function addTradeToHistory(trade) {
    if (tradeHistoryContainer.querySelector('.placeholder')) {
        tradeHistoryContainer.innerHTML = '';
    }

    const tradeItem = document.createElement('div');
    tradeItem.className = `trade-item ${trade.side.toLowerCase()}`;
    
    const timestamp = new Date(trade.timestamp).toLocaleString();

    tradeItem.innerHTML = `
        <div class="trade-header">
            <span class="trade-symbol">${trade.symbol}</span>
            <span class="trade-side ${trade.side.toLowerCase()}">${trade.side}</span>
        </div>
        <div class="trade-details">
            ${trade.quantity} @ $${trade.price.toFixed(2)} | ${timestamp}
        </div>
    `;

    tradeHistoryContainer.insertBefore(tradeItem, tradeHistoryContainer.firstChild);

    // Keep only last 10 trades visible
    const trades = tradeHistoryContainer.querySelectorAll('.trade-item');
    if (trades.length > 10) {
        trades[trades.length - 1].remove();
    }
}

// Update analytics display
function updateAnalytics(analytics) {
    const totalPnl = document.getElementById('total-pnl');
    const totalTrades = document.getElementById('total-trades');
    const winRate = document.getElementById('win-rate');
    const profitableTrades = document.getElementById('profitable-trades');

    totalPnl.textContent = `$${analytics.total_pnl.toFixed(2)}`;
    totalPnl.className = `stat-value ${analytics.total_pnl >= 0 ? 'positive' : 'negative'}`;
    
    totalTrades.textContent = analytics.total_trades;
    winRate.textContent = `${analytics.win_rate.toFixed(1)}%`;
    profitableTrades.textContent = analytics.profitable_trades;
}

// Fetch and display portfolio
async function fetchPortfolio() {
    try {
        const response = await fetch('/api/portfolio');
        const portfolio = await response.json();

        if (Object.keys(portfolio).length === 0) {
            portfolioContainer.innerHTML = '<p class="placeholder">No holdings yet. Add some trades!</p>';
            return;
        }

        portfolioContainer.innerHTML = '';

        Object.entries(portfolio).forEach(([symbol, holding]) => {
            if (holding.quantity > 0) {
                const currentPrice = currentPrices[symbol]?.price || holding.avg_price;
                const pnl = (currentPrice - holding.avg_price) * holding.quantity;
                const pnlPercent = ((currentPrice - holding.avg_price) / holding.avg_price) * 100;

                const item = document.createElement('div');
                item.className = 'portfolio-item';
                
                item.innerHTML = `
                    <div class="portfolio-header">
                        <span class="portfolio-symbol">${symbol}</span>
                        <span class="portfolio-pnl ${pnl >= 0 ? 'positive' : 'negative'}">
                            ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnlPercent.toFixed(2)}%)
                        </span>
                    </div>
                    <div class="portfolio-details">
                        Qty: ${holding.quantity.toFixed(8)} | Avg: $${holding.avg_price.toFixed(2)} | Current: $${currentPrice.toFixed(2)}
                    </div>
                `;

                portfolioContainer.appendChild(item);
            }
        });
    } catch (error) {
        console.error('Error fetching portfolio:', error);
    }
}

// Fetch and display analytics
async function fetchAnalytics() {
    try {
        const response = await fetch('/api/analytics');
        const analytics = await response.json();
        updateAnalytics(analytics);
    } catch (error) {
        console.error('Error fetching analytics:', error);
    }
}

// Fetch trade history
async function fetchTradeHistory() {
    try {
        const response = await fetch('/api/trades');
        const trades = await response.json();

        if (trades.length === 0) {
            tradeHistoryContainer.innerHTML = '<p class="placeholder">No trades yet.</p>';
            return;
        }

        tradeHistoryContainer.innerHTML = '';
        trades.reverse().slice(0, 10).forEach(trade => {
            addTradeToHistory(trade);
        });
    } catch (error) {
        console.error('Error fetching trade history:', error);
    }
}

// Load market overview data
async function loadMarketOverview() {
    try {
        const response = await fetch('/api/market_overview');
        const data = await response.json();

        if (data.error) {
            marketContent.innerHTML = '<p class="placeholder">Error loading market data</p>';
            return;
        }

        const items = data[currentMarketTab] || [];
        marketContent.innerHTML = '';

        items.forEach(item => {
            const marketItem = document.createElement('div');
            marketItem.className = 'market-item';
            
            const change = parseFloat(item.priceChangePercent);
            const changeClass = change >= 0 ? 'positive' : 'negative';

            marketItem.innerHTML = `
                <div class="market-symbol">${item.symbol}</div>
                <div class="market-change ${changeClass}">
                    ${change >= 0 ? '+' : ''}${change.toFixed(2)}%
                </div>
                <div class="market-price">
                    $${parseFloat(item.lastPrice).toFixed(2)}
                </div>
            `;

            marketContent.appendChild(marketItem);
        });
    } catch (error) {
        console.error('Error loading market overview:', error);
        marketContent.innerHTML = '<p class="placeholder">Error loading market data</p>';
    }
}

// Fetch initial data
async function fetchInitialData() {
    await Promise.all([
        fetchPortfolio(),
        fetchAnalytics(),
        fetchTradeHistory()
    ]);
}

// Initialize the dashboard when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Refresh market overview every 30 seconds
setInterval(loadMarketOverview, 30000);

// Also refresh portfolio periodically to update PnL with current prices
setInterval(fetchPortfolio, 5000);

