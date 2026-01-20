// market.js - STM Market Price Chart and Analytics

export class MarketManager {
    constructor() {
        this.chart = null;
        this.currentPrice = 0.00025; 
        this.priceHistory = [];
        this.updateInterval = null;
        this.initializePriceHistory();
    }

    initializePriceHistory() {
        const now = Date.now();
        const hoursAgo = 24;
        
        for (let i = hoursAgo; i >= 0; i--) {
            const timestamp = now - (i * 60 * 60 * 1000);
            const basePrice = 0.00025;
            
            // Simulate realistic price movements with some volatility
            const volatility = 0.15; // 15% volatility
            const randomChange = (Math.random() - 0.5) * volatility;
            const trendFactor = (hoursAgo - i) / hoursAgo * 0.1; // Slight upward trend
            
            const price = basePrice * (1 + randomChange + trendFactor);
            
            this.priceHistory.push({
                timestamp,
                price: Math.max(0.0001, price) // Ensure positive price
            });
        }
        
        // Set current price to latest in history
        this.currentPrice = this.priceHistory[this.priceHistory.length - 1].price;
    }
    initializeChart() {
        const ctx = document.getElementById('priceChart');
        if (!ctx) return;

        const labels = this.priceHistory.map(item => {
            const date = new Date(item.timestamp);
            return date.getHours() + ':00';
        });

        const prices = this.priceHistory.map(item => item.price);

        // Determine chart color based on trend
        const firstPrice = prices[0];
        const lastPrice = prices[prices.length - 1];
        const isPositive = lastPrice >= firstPrice;
        const chartColor = isPositive ? '#5cb85c' : '#d9534f';

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'STM Price (ETH)',
                    data: prices,
                    borderColor: chartColor,
                    backgroundColor: isPositive 
                        ? 'rgba(92, 184, 92, 0.1)' 
                        : 'rgba(217, 83, 79, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: chartColor,
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#66c0f4',
                        bodyColor: '#c7d5e0',
                        borderColor: '#3d5a75',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return 'Price: ' + context.parsed.y.toFixed(8) + ' ETH';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(61, 90, 117, 0.2)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#8f98a0',
                            maxRotation: 0,
                            autoSkipPadding: 20
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(61, 90, 117, 0.2)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#8f98a0',
                            callback: function(value) {
                                return value.toFixed(6);
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    /**
     * Update current price display
     */
    updatePriceDisplay() {
        const currentPriceEl = document.getElementById('currentPrice');
        const stmEthRateEl = document.getElementById('stmEthRate');
        
        if (currentPriceEl) {
            currentPriceEl.textContent = this.currentPrice.toFixed(8) + ' ETH';
        }
        
        if (stmEthRateEl) {
            stmEthRateEl.textContent = this.currentPrice.toFixed(8) + ' ETH';
        }
    }

    /**
     * Calculate and display 24h price change
     */
    updatePriceChange() {
        if (this.priceHistory.length < 2) return;

        const oldPrice = this.priceHistory[0].price;
        const newPrice = this.currentPrice;
        const changePercent = ((newPrice - oldPrice) / oldPrice * 100);

        const priceChangeEl = document.getElementById('priceChange');
        const priceChangeContainer = document.getElementById('priceChangeContainer');
        
        if (priceChangeEl) {
            const isPositive = changePercent >= 0;
            priceChangeEl.textContent = (isPositive ? '+' : '') + changePercent.toFixed(2) + '%';
            priceChangeEl.className = 'stat-value ' + (isPositive ? 'positive' : 'negative');
        }
    }

    /**
     * Update portfolio value based on user's STM balance
     */
    updatePortfolioValue(stmBalance) {
        const portfolioValueEl = document.getElementById('portfolioValue');
        
        if (portfolioValueEl && stmBalance) {
            const balanceNum = parseFloat(stmBalance);
            const portfolioInEth = balanceNum * this.currentPrice;
            portfolioValueEl.textContent = portfolioInEth.toFixed(6) + ' ETH';
        }
    }

    /**
     * Simulate real-time price updates
     */
    startPriceUpdates() {
        // Update price every 30 seconds
        this.updateInterval = setInterval(() => {
            this.simulatePriceMovement();
        }, 30000);
    }

    /**
     * Simulate realistic price movement
     */
    simulatePriceMovement() {
        // Simulate price change (-2% to +2% per update)
        const changePercent = (Math.random() - 0.5) * 0.04;
        const newPrice = this.currentPrice * (1 + changePercent);
        
        // Keep price in reasonable range
        this.currentPrice = Math.max(0.0001, Math.min(0.001, newPrice));
        
        // Add to history
        this.priceHistory.push({
            timestamp: Date.now(),
            price: this.currentPrice
        });
        
        // Keep only last 24 hours
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        this.priceHistory = this.priceHistory.filter(item => item.timestamp > oneDayAgo);
        
        // Update displays
        this.updatePriceDisplay();
        this.updatePriceChange();
        this.updateChart();
    }

    /**
     * Update chart with new data
     */
    updateChart() {
        if (!this.chart) return;

        const labels = this.priceHistory.map(item => {
            const date = new Date(item.timestamp);
            return date.getHours() + ':' + String(date.getMinutes()).padStart(2, '0');
        });

        const prices = this.priceHistory.map(item => item.price);

        // Update chart colors based on trend
        const firstPrice = prices[0];
        const lastPrice = prices[prices.length - 1];
        const isPositive = lastPrice >= firstPrice;
        const chartColor = isPositive ? '#5cb85c' : '#d9534f';

        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = prices;
        this.chart.data.datasets[0].borderColor = chartColor;
        this.chart.data.datasets[0].backgroundColor = isPositive 
            ? 'rgba(92, 184, 92, 0.1)' 
            : 'rgba(217, 83, 79, 0.1)';
        this.chart.data.datasets[0].pointHoverBackgroundColor = chartColor;

        this.chart.update('none'); // Update without animation for smooth updates
    }

    /**
     * Get current STM price in ETH
     */
    getCurrentPrice() {
        return this.currentPrice;
    }

    /**
     * Calculate profit/loss for a given amount
     */
    calculateProfitLoss(stmAmount, purchasePrice) {
        const currentValue = stmAmount * this.currentPrice;
        const purchaseValue = stmAmount * purchasePrice;
        const profitLoss = currentValue - purchaseValue;
        const profitLossPercent = (profitLoss / purchaseValue) * 100;

        return {
            profitLoss,
            profitLossPercent,
            currentValue,
            purchaseValue
        };
    }

    /**
     * Stop price updates
     */
    stopPriceUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Initialize all market features
     */
    initialize() {
        this.initializeChart();
        this.updatePriceDisplay();
        this.updatePriceChange();
        this.startPriceUpdates();
    }

    /**
     * Cleanup
     */
    cleanup() {
        this.stopPriceUpdates();
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }
}