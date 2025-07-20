import os
import time
import io
import tempfile
from dotenv import load_dotenv
from azure.cognitiveservices.vision.computervision import ComputerVisionClient
from azure.cognitiveservices.vision.computervision.models import OperationStatusCodes
from msrest.authentication import CognitiveServicesCredentials

# Load environment variables
load_dotenv()

# Get Azure Computer Vision credentials
key = os.getenv("AZURE_VISION_KEY")
endpoint = os.getenv("AZURE_VISION_ENDPOINT")

def get_vision_client():
    """
    Creates and returns an instance of the Azure Computer Vision client.
    """
    try:
        credential = CognitiveServicesCredentials(key)
        client = ComputerVisionClient(endpoint=endpoint, credentials=credential)
        return client
    except Exception as e:
        print(f"Error initializing Computer Vision client: {str(e)}")
        return None

def extract_text_from_image(image_data):
    """
    Extract text from an image using Azure Computer Vision's OCR.
    
    Args:
        image_data (bytes): The binary image data
        
    Returns:
        str: Extracted text from the image
    """
    client = get_vision_client()
    if not client:
        return "Error: Could not initialize Computer Vision client"
    
    try:
        # Call the API for text recognition (OCR)
        read_response = client.read_in_stream(io.BytesIO(image_data), raw=True)

        # Get the operation location (URL with an ID at the end)
        operation_location = read_response.headers["Operation-Location"]
        
        # Get the operation ID from the URL
        operation_id = operation_location.split("/")[-1]
        
        # Wait for the operation to complete
        max_retry = 10
        retry_delay = 1  # seconds
        retry_count = 0
        
        while retry_count < max_retry:
            read_result = client.get_read_result(operation_id)
            if read_result.status not in [OperationStatusCodes.running, OperationStatusCodes.not_started]:
                break
            time.sleep(retry_delay)
            retry_count += 1
        
        # Check the result
        if read_result.status == OperationStatusCodes.succeeded:
            text = ""
            for page in read_result.analyze_result.read_results:
                for line in page.lines:
                    text += line.text + "\n"
            return text
        else:
            return f"Error extracting text: Operation did not succeed, status: {read_result.status}"
    except Exception as e:
        return f"Error extracting text: {str(e)}"

def extract_text_from_pdf(pdf_data):
    """
    Extract text from a PDF file using Azure Computer Vision.
    
    Args:
        pdf_data (bytes): The binary PDF data
        
    Returns:
        str: Extracted text from the PDF
    """
    client = get_vision_client()
    if not client:
        return "Error: Could not initialize Computer Vision client"
    
    try:
        # Save the PDF to a temporary file (required for the API)
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_file:
            temp_file_path = temp_file.name
            temp_file.write(pdf_data)
        
        # Open the temporary file and read it in binary mode
        with open(temp_file_path, "rb") as pdf_file:
            pdf_content = pdf_file.read()
        
        # Call the same method used for images
        extracted_text = extract_text_from_image(pdf_content)
        
        # Clean up temporary file
        try:
            os.unlink(temp_file_path)
        except:
            pass
        
        return extracted_text
    except Exception as e:
        return f"Error extracting text from PDF: {str(e)}" 