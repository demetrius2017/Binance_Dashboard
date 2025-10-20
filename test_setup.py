#!/usr/bin/env python3
"""
Simple test script to verify Binance API connectivity
and basic functionality of the dashboard components
"""

import sys

def test_imports():
    """Test if all required modules can be imported"""
    print("Testing imports...")
    try:
        import flask
        print("✓ Flask imported successfully")
        
        import flask_socketio
        print("✓ Flask-SocketIO imported successfully")
        
        import binance
        print("✓ python-binance imported successfully")
        
        return True
    except ImportError as e:
        print(f"✗ Import error: {e}")
        print("\nPlease install dependencies:")
        print("  pip install -r requirements.txt")
        return False


def test_binance_connection():
    """Test connection to Binance API"""
    print("\nTesting Binance API connection...")
    try:
        from binance.client import Client
        
        # Test with public API (no credentials needed)
        client = Client("", "")
        
        # Try to fetch a ticker
        ticker = client.get_symbol_ticker(symbol="BTCUSDT")
        print(f"✓ Successfully fetched BTC/USDT price: ${ticker['price']}")
        
        # Try to fetch 24h stats
        stats = client.get_ticker(symbol="BTCUSDT")
        print(f"✓ 24h change: {stats['priceChangePercent']}%")
        
        return True
    except Exception as e:
        print(f"✗ Binance API error: {e}")
        print("\nThis might be a network issue or Binance API rate limiting.")
        return False


def test_file_structure():
    """Test if all required files exist"""
    print("\nChecking file structure...")
    import os
    
    required_files = [
        'app.py',
        'requirements.txt',
        'templates/index.html',
        'static/css/style.css',
        'static/js/dashboard.js',
    ]
    
    all_exist = True
    for file in required_files:
        if os.path.exists(file):
            print(f"✓ {file} exists")
        else:
            print(f"✗ {file} missing")
            all_exist = False
    
    return all_exist


def main():
    """Run all tests"""
    print("=" * 60)
    print("Binance Dashboard - System Test")
    print("=" * 60)
    
    tests_passed = 0
    total_tests = 3
    
    if test_imports():
        tests_passed += 1
    
    if test_file_structure():
        tests_passed += 1
    
    if test_binance_connection():
        tests_passed += 1
    
    print("\n" + "=" * 60)
    print(f"Tests passed: {tests_passed}/{total_tests}")
    print("=" * 60)
    
    if tests_passed == total_tests:
        print("\n✓ All tests passed! You can start the dashboard with:")
        print("  python app.py")
        return 0
    else:
        print("\n✗ Some tests failed. Please resolve the issues above.")
        return 1


if __name__ == '__main__':
    sys.exit(main())
