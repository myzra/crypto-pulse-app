import requests
import json

def test_push_notification():
    """Test sending a push notification using your actual push token"""
    
    # Your push token from the database
    push_token = "ExponentPushToken[?]"
    
    # Expo push notification endpoint
    url = "https://exp.host/--/api/v2/push/send"
    
    # Create the notification message
    message = {
        "to": push_token,
        "title": "🚀 Crypto Pulse Test",
        "body": "Push notifications are working! This is a test message.",
        "sound": "default",
        "data": {
            "type": "test",
            "timestamp": "2025-08-21T18:09:38.792+00:00",
            "custom_data": "Hello from Python!"
        }
    }
    
    headers = {
        "Accept": "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
    }
    
    try:
        print("Sending push notification...")
        print(f"Token: {push_token}")
        print(f"Message: {json.dumps(message, indent=2)}")
        
        response = requests.post(url, headers=headers, json=[message])  # Note: send as array
        response.raise_for_status()
        
        result = response.json()
        print("\n✅ SUCCESS!")
        print(f"Response: {json.dumps(result, indent=2)}")
        
        # Check for any errors in the response
        if result.get('data') and len(result['data']) > 0:
            ticket = result['data'][0]
            if ticket.get('status') == 'error':
                print(f"\n❌ Error in ticket: {ticket.get('message', 'Unknown error')}")
            elif ticket.get('status') == 'ok':
                print(f"\n🎉 Notification sent successfully! Ticket ID: {ticket.get('id')}")
        
        return result
        
    except requests.exceptions.RequestException as e:
        print(f"\n❌ Error sending push notification: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Response status: {e.response.status_code}")
            print(f"Response body: {e.response.text}")
        return None

def test_crypto_price_notification():
    """Test sending a crypto price alert"""
    
    push_token = "ExponentPushToken[?]"
    url = "https://exp.host/--/api/v2/push/send"
    
    # Bitcoin price alert example
    message = {
        "to": push_token,
        "title": "₿ Bitcoin Price Alert",
        "body": "Bitcoin is up 5.2% to $45,000.00",
        "sound": "default",
        "data": {
            "type": "price_alert",
            "crypto": "Bitcoin",
            "symbol": "BTC",
            "price": 45000.00,
            "change_percent": 5.2,
            "action": "view_details"
        }
    }
    
    headers = {
        "Accept": "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
    }
    
    try:
        print("\n" + "="*50)
        print("Sending crypto price alert...")
        
        response = requests.post(url, headers=headers, json=[message])
        response.raise_for_status()
        
        result = response.json()
        print("✅ Crypto alert sent!")
        print(f"Response: {json.dumps(result, indent=2)}")
        
        return result
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error sending crypto alert: {e}")
        return None

def test_multiple_notifications():
    """Test sending multiple types of notifications"""
    
    push_token = "ExponentPushToken[?]"
    url = "https://exp.host/--/api/v2/push/send"
    
    # Multiple messages
    messages = [
        {
            "to": push_token,
            "title": "📈 Portfolio Update",
            "body": "Your portfolio is up 12.5% today!",
            "sound": "default",
            "data": {"type": "portfolio", "change": 12.5}
        },
        {
            "to": push_token,
            "title": "🔔 Price Alert Set",
            "body": "Alert set for Bitcoin at $50,000",
            "sound": "default",
            "data": {"type": "alert_set", "crypto": "BTC", "target_price": 50000}
        },
        {
            "to": push_token,
            "title": "💰 Market News",
            "body": "Major crypto news: New regulations announced",
            "sound": "default",
            "data": {"type": "news", "category": "regulation"}
        }
    ]
    
    headers = {
        "Accept": "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
    }
    
    try:
        print("\n" + "="*50)
        print("Sending multiple notifications...")
        
        response = requests.post(url, headers=headers, json=messages)
        response.raise_for_status()
        
        result = response.json()
        print("✅ Multiple notifications sent!")
        print(f"Response: {json.dumps(result, indent=2)}")
        
        return result
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error sending multiple notifications: {e}")
        return None

if __name__ == "__main__":
    print("🧪 Testing Push Notifications for Crypto Pulse")
    print("=" * 50)
    
    # Test 1: Basic notification
    result1 = test_push_notification()
    
    # Wait a moment between tests
    import time
    time.sleep(2)
    
    # Test 2: Crypto price alert
    result2 = test_crypto_price_notification()
    
    # Wait a moment between tests
    time.sleep(2)
    
    # Test 3: Multiple notifications
    result3 = test_multiple_notifications()
    
    print("\n" + "="*50)
    print("🏁 All tests completed!")
    print("Check your phone for notifications!")
    print("="*50)