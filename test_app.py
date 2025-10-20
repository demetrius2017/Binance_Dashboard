"""
Basic tests for Binance Dashboard
Run with: python -m pytest test_app.py
"""

import pytest
import json
from app import app, market_data, trading_pairs


@pytest.fixture
def client():
    """Create test client"""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


def test_index_route(client):
    """Test main dashboard route"""
    response = client.get('/')
    assert response.status_code == 200


def test_get_pairs(client):
    """Test getting trading pairs"""
    response = client.get('/api/pairs')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'pairs' in data
    assert isinstance(data['pairs'], list)


def test_get_market_data(client):
    """Test getting all market data"""
    response = client.get('/api/market')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, dict)


def test_get_market_data_symbol(client):
    """Test getting market data for specific symbol"""
    # First add some dummy data
    market_data['BTCUSDT'] = {'price': 50000, 'volume_24h': 1000}
    
    response = client.get('/api/market/BTCUSDT')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'price' in data


def test_get_market_data_invalid_symbol(client):
    """Test getting market data for invalid symbol"""
    response = client.get('/api/market/INVALIDSYMBOL')
    assert response.status_code == 404


def test_add_pair(client):
    """Test adding new trading pair"""
    response = client.post('/api/add_pair',
                          data=json.dumps({'symbol': 'XRPUSDT'}),
                          content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] == True


def test_add_duplicate_pair(client):
    """Test adding duplicate trading pair"""
    symbol = 'BTCUSDT'
    if symbol not in trading_pairs:
        trading_pairs.append(symbol)
    
    response = client.post('/api/add_pair',
                          data=json.dumps({'symbol': symbol}),
                          content_type='application/json')
    assert response.status_code == 400


def test_remove_pair(client):
    """Test removing trading pair"""
    symbol = 'TESTUSDT'
    if symbol not in trading_pairs:
        trading_pairs.append(symbol)
    
    response = client.post('/api/remove_pair',
                          data=json.dumps({'symbol': symbol}),
                          content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] == True


def test_remove_nonexistent_pair(client):
    """Test removing nonexistent trading pair"""
    response = client.post('/api/remove_pair',
                          data=json.dumps({'symbol': 'NONEXISTENT'}),
                          content_type='application/json')
    assert response.status_code == 404


def test_price_history(client):
    """Test getting price history"""
    response = client.get('/api/history/BTCUSDT')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
