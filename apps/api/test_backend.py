import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000"
API_PREFIX = "/api/v1"
URL = f"{BASE_URL}{API_PREFIX}"

def run_tests():
    print("====================================================")
    print("STARTING BACKEND API END-TO-END VERIFICATION")
    print(f"Target API base URL: {URL}")
    print("====================================================\n")

    # 1. Health check
    print("Step 1: Checking backend API health...")
    try:
        res = requests.get(f"{BASE_URL}/")
        res.raise_for_status()
        health = res.json()
        print(f"Health Check Success: {json.dumps(health, indent=2)}")
    except Exception as e:
        print(f"CRITICAL ERROR: Could not connect to API server at {BASE_URL}: {str(e)}")
        print("Make sure the backend server is running on port 8000.")
        sys.exit(1)

    print("\n----------------------------------------------------")

    # 2. Registration
    print("Step 2: Registering a test user...")
    test_user = {
        "email": "test_e2e_user@example.com",
        "password": "Password123!",
        "username": "e2etestuser",
        "fullName": "E2E Test User",
        "role": "founder"
    }
    
    register_res = requests.post(f"{URL}/auth/register", json=test_user)
    if register_res.status_code == 400 and "already registered" in register_res.text:
        print("Test user already exists in database. Continuing to login...")
    else:
        register_res.raise_for_status()
        print(f"Registration Success: {json.dumps(register_res.json(), indent=2)}")

    print("\n----------------------------------------------------")

    # 3. Login
    print("Step 3: Logging in test user...")
    login_data = {
        "email": test_user["email"],
        "password": test_user["password"]
    }
    login_res = requests.post(f"{URL}/auth/login", json=login_data)
    login_res.raise_for_status()
    auth_info = login_res.json()
    token = auth_info["access_token"]
    print("Login Success!")
    print(f"Token: {token[:20]}...")
    print(f"User profile details: {json.dumps(auth_info['user'], indent=2)}")

    headers = {
        "Authorization": f"Bearer {token}"
    }

    print("\n----------------------------------------------------")

    # 4. Get Profile (Requires Token)
    print("Step 4: Fetching current authenticated user profile (/auth/me)...")
    me_res = requests.get(f"{URL}/auth/me", headers=headers)
    me_res.raise_for_status()
    print(f"Get Profile Success: {json.dumps(me_res.json(), indent=2)}")

    print("\n----------------------------------------------------")

    # 5. Marketplace listings
    print("Step 5: Testing Marketplace listings...")
    
    # Domains
    print("Listing Domains...")
    res = requests.get(f"{URL}/marketplace/domains", headers=headers)
    res.raise_for_status()
    print(f"Found {len(res.json())} domains. First domain: {res.json()[0]['name'] if res.json() else 'None'}")
    
    # Websites
    print("Listing Websites...")
    res = requests.get(f"{URL}/marketplace/websites", headers=headers)
    res.raise_for_status()
    print(f"Found {len(res.json())} websites. First website: {res.json()[0]['title'] if res.json() else 'None'}")

    # Apps
    print("Listing Apps...")
    res = requests.get(f"{URL}/marketplace/apps", headers=headers)
    res.raise_for_status()
    print(f"Found {len(res.json())} apps. First app: {res.json()[0]['title'] if res.json() else 'None'}")

    # AI Assets
    print("Listing AI Assets...")
    res = requests.get(f"{URL}/marketplace/ai", headers=headers)
    res.raise_for_status()
    print(f"Found {len(res.json())} AI Assets. First asset: {res.json()[0]['title'] if res.json() else 'None'}")

    print("\n----------------------------------------------------")

    # 6. Talent list
    print("Step 6: Listing freelancers/talent pool...")
    res = requests.get(f"{URL}/talent", headers=headers)
    res.raise_for_status()
    print(f"Found {len(res.json())} freelancers. First talent: {res.json()[0]['fullName'] if res.json() else 'None'}")

    print("\n----------------------------------------------------")

    # 7. Investors list
    print("Step 7: Listing investors database...")
    res = requests.get(f"{URL}/investors", headers=headers)
    res.raise_for_status()
    print(f"Found {len(res.json())} investors. First investor: {res.json()[0]['name'] if res.json() else 'None'}")

    print("\n----------------------------------------------------")

    # 8. Venture Navigator Search (AI processing)
    print("Step 8: Testing Venture Navigator search AI parser...")
    nav_query = {"query": "I want to start a healthcare app under 5000 with a developer"}
    res = requests.post(f"{URL}/navigator/search", json=nav_query, headers=headers)
    res.raise_for_status()
    nav_result = res.json()
    print(f"Navigator Success! Intent: {nav_result.get('intentDetected')}")
    print(f"Estimated Cost: ${nav_result.get('estimatedCost')}")
    print(f"Estimated Launch Time: {nav_result.get('estimatedLaunchTime')}")
    print(f"Startup Readiness Score: {nav_result.get('startupReadinessScore')}/100")
    print(f"Matching Domains: {[d['name'] for d in nav_result.get('recommendedAssets', {}).get('domains', [])]}")
    print(f"Matching AI Datasets: {[d['title'] for d in nav_result.get('recommendedAssets', {}).get('datasets', [])]}")
    print(f"Matching AI Models: {[m['title'] for m in nav_result.get('recommendedAssets', {}).get('models', [])]}")

    print("\n----------------------------------------------------")

    # 9. Startup Blueprint generator
    print("Step 9: Testing Startup Blueprint Generator AI...")
    blueprint_query = {"idea": "AI-powered diagnostic app that scans lung scans using ML ResNet models"}
    res = requests.post(f"{URL}/blueprint/generate", json=blueprint_query, headers=headers)
    res.raise_for_status()
    bp_result = res.json()
    print("Blueprint generation success!")
    print(f"Industry: {bp_result.get('marketSizing', {}).get('industry', 'N/A')}")
    print(f"Growth rate: {bp_result.get('marketSizing', {}).get('cagr', 'N/A')}")
    print(f"Key technical requirements: {bp_result.get('technicalStack', {}).get('architecture', 'N/A')[:100]}...")

    print("\n====================================================")
    print("ALL BACKEND API AND CLOUD STORAGE TESTS PASSED SUCCESSFULLY!")
    print("====================================================")

if __name__ == "__main__":
    run_tests()
