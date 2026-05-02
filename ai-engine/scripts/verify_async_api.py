
import requests
import io

def test_generate_course():
    # 1. Setup Dummy Data
    base_url = "http://127.0.0.1:8000"
    url = f"{base_url}/api/generate-course/"
    
    syllabus_content = "This is a syllabus for an Introduction to Async Python course."
    material_content = "AsyncIO allows parallel execution of IO-bound tasks in Python."
    
    files = {
        'syllabus': ('syllabus.pdf', io.BytesIO(syllabus_content.encode('utf-8')), 'application/pdf'),
        'materials': ('material1.pdf', io.BytesIO(material_content.encode('utf-8')), 'application/pdf')
    }
    
    print(f"Testing POST {url}...")
    try:
        response = requests.post(url, files=files)
        
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("Success! Response:")
            import json
            print(json.dumps(data, indent=2))
            
            # Basic validation
            if "course_structure" in data and "course_id" in data:
                print("\n[PASS] API returned valid structure map and course_id.")
            else:
                print("\n[FAIL] Missing structure map or course_id.")
        else:
            print(f"[FAIL] Error Response: {response.text}")
            
    except Exception as e:
        print(f"[FAIL] Exception: {e}")

if __name__ == "__main__":
    test_generate_course()
