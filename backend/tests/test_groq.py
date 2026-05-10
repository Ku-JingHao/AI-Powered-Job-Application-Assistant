import os
import django
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.conf import settings
from groq import Groq

def test_groq_connection():
    """Test the Groq API connection with Llama 3"""
    print("\n=== Testing Groq API Connection with Llama 3 ===")
    
    # Get the API key
    api_key = settings.GROQ_API_KEY
    print(f"API Key: {api_key[:5]}...{api_key[-4:]}")
    
    # Initialize the client
    client = Groq(api_key=api_key)
    
    try:
        # Make a simple test request
        response = client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[
                {"role": "system", "content": "You are a helpful interview preparation assistant."},
                {"role": "user", "content": "What's a good answer to 'tell me about yourself'?"}
            ],
            max_tokens=200
        )
        
        # Print the response
        result = response.choices[0].message.content
        print(f"Response received:")
        print("---")
        print(result)
        print("---")
        print("✅ Groq API connection successful!")
        return True
    
    except Exception as e:
        print(f"❌ Error connecting to Groq: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_groq_connection()
    sys.exit(0 if success else 1) 