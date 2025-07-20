import os
from dotenv import load_dotenv
from azure.core.credentials import AzureKeyCredential
from azure.ai.textanalytics import TextAnalyticsClient
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from transformers import AutoTokenizer, AutoModel
import torch
import re

# Load environment variables
load_dotenv()

# Get Azure Language service credentials
key = os.getenv("AZURE_LANGUAGE_KEY")
endpoint = os.getenv("AZURE_LANGUAGE_ENDPOINT")

# Load BERT model for text similarity
try:
    tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")
    model = AutoModel.from_pretrained("bert-base-uncased")
except Exception as e:
    print(f"Error loading BERT model: {str(e)}")
    tokenizer = None
    model = None

# Initialize Azure Language Text Analytics client
def get_text_analytics_client():
    """
    Creates and returns an instance of the Azure Text Analytics client.
    """
    try:
        credential = AzureKeyCredential(key)
        text_analytics_client = TextAnalyticsClient(endpoint=endpoint, credential=credential)
        return text_analytics_client
    except Exception as e:
        print(f"Error initializing Text Analytics client: {str(e)}")
        return None

# Extract key phrases from text
def extract_key_phrases(text):
    """
    Extract key phrases from the provided text using Azure Language service.
    
    Args:
        text (str): The text to analyze
        
    Returns:
        list: A list of extracted key phrases
    """
    client = get_text_analytics_client()
    if not client:
        return []
    
    try:
        response = client.extract_key_phrases([text])[0]
        
        if not response.is_error:
            return response.key_phrases
        else:
            print(f"Error extracting key phrases: {response.error}")
            return []
    except Exception as e:
        print(f"Error calling key phrase extraction: {str(e)}")
        return []

# Analyze sentiment of text
def analyze_sentiment(text):
    """
    Analyze the sentiment of the provided text using Azure Language service.
    
    Args:
        text (str): The text to analyze
        
    Returns:
        dict: A dictionary containing sentiment value
    """
    client = get_text_analytics_client()
    default_result = {
        "sentiment": "neutral"
    }
    
    if not client:
        print("No client available for sentiment analysis")
        return default_result
    
    try:
        response = client.analyze_sentiment([text])[0]
        
        if not response.is_error:
            # Format the response with only sentiment value
            result = {
                "sentiment": response.sentiment
            }
            print("Formatted sentiment analysis result:", result)
            return result
        else:
            print(f"Error analyzing sentiment: {response.error}")
            return default_result
    except Exception as e:
        print(f"Error calling sentiment analysis: {str(e)}")
        return default_result

# Detect language of text
def detect_language(text):
    """
    Detect the language of the provided text using Azure Language service.
    
    Args:
        text (str): The text to analyze
        
    Returns:
        str: The detected language code
    """
    client = get_text_analytics_client()
    if not client:
        return "en"
    
    try:
        response = client.detect_language([text])[0]
        
        if not response.is_error:
            return response.primary_language.iso6391_name
        else:
            print(f"Error detecting language: {response.error}")
            return "en"
    except Exception as e:
        print(f"Error calling language detection: {str(e)}")
        return "en"

# Get BERT embeddings for text
def get_bert_embedding(text):
    """
    Get BERT embeddings for a text string using the pre-trained BERT model.
    
    Args:
        text (str): Text to embed
        
    Returns:
        numpy.ndarray: BERT embedding vector
    """
    if tokenizer is None or model is None:
        # Fallback to simple character-based embedding if BERT is not available
        return np.array([ord(c) for c in text[:20].ljust(20)])
    
    try:
        # Tokenize and prepare for BERT
        inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=128)
        
        # Get BERT embeddings
        with torch.no_grad():
            outputs = model(**inputs)
        
        # Use the [CLS] token embedding as the sentence embedding
        embeddings = outputs.last_hidden_state[:, 0, :].numpy()
        return embeddings[0]  # Return the first (and only) embedding
    except Exception as e:
        print(f"Error getting BERT embedding: {str(e)}")
        # Fallback to simple character-based embedding
        return np.array([ord(c) for c in text[:20].ljust(20)])

# Calculate contextual semantic similarity between texts using BERT
def calculate_text_similarity(text1, text2, is_tech_skill=False):
    """
    Calculate the semantic similarity between two texts using BERT embeddings.
    
    Args:
        text1 (str): First text
        text2 (str): Second text
        is_tech_skill (bool): Whether this is a technical skill comparison that needs special handling
        
    Returns:
        float: Similarity score between 0 and 1
    """
    # For technical skills, implement special handling
    if is_tech_skill:
        # Normalize technical terms for better comparison
        text1_norm = _normalize_tech_term(text1)
        text2_norm = _normalize_tech_term(text2)
        
        # Check for acronym matches (e.g., "CSS" and "Cascading Style Sheets")
        if _is_acronym_match(text1_norm, text2_norm):
            return 1.0
            
        # Check for common tech term variations
        if _are_tech_variants(text1_norm, text2_norm):
            return 0.9
    
    # Get BERT embeddings for both texts
    embedding1 = get_bert_embedding(text1)
    embedding2 = get_bert_embedding(text2)
    
    # Calculate cosine similarity
    embedding1_reshaped = embedding1.reshape(1, -1)
    embedding2_reshaped = embedding2.reshape(1, -1)
    similarity = cosine_similarity(embedding1_reshaped, embedding2_reshaped)[0][0]
    
    # Boost similarity scores for technology terms with partial matches
    if is_tech_skill:
        # Apply a boost factor for partial string matches in technical skills
        partial_match_score = _calculate_partial_match_score(text1, text2)
        # Weighted combination of BERT similarity and partial match
        similarity = 0.7 * similarity + 0.3 * partial_match_score
    
    # Normalize to 0-1 range
    similarity = float(min(max(0.0, similarity), 1.0))
    
    return similarity

def _normalize_tech_term(term):
    """
    Normalize a technical term by removing common prefixes/suffixes and standardizing format.
    """
    # Convert to lowercase for consistent comparison
    normalized = term.lower()
    
    # Remove common prefixes that don't affect the core meaning
    prefixes = ['ms ', 'microsoft ', 'google ', 'apache ', 'aws ', 'azure ', 'ibm ']
    for prefix in prefixes:
        if normalized.startswith(prefix):
            normalized = normalized[len(prefix):]
    
    # Remove version numbers and common suffixes
    normalized = re.sub(r'\s+\d+(\.\d+)*', '', normalized)  # Remove version numbers
    normalized = re.sub(r'\s+(framework|library|language|platform)$', '', normalized)  # Remove common tech suffixes
    
    # Remove special characters and extra spaces
    normalized = re.sub(r'[^\w\s]', '', normalized)
    normalized = re.sub(r'\s+', ' ', normalized).strip()
    
    return normalized

def _is_acronym_match(term1, term2):
    """
    Check if one term is an acronym of the other.
    """
    # If both are short, they need to match exactly
    if len(term1) <= 5 and len(term2) <= 5:
        return term1 == term2
    
    # Check if term1 is an acronym of term2
    if len(term1) <= 5 and len(term2) > 5:
        acronym = ''.join(word[0] for word in term2.split() if word)
        return term1 == acronym.lower()
    
    # Check if term2 is an acronym of term1
    if len(term2) <= 5 and len(term1) > 5:
        acronym = ''.join(word[0] for word in term1.split() if word)
        return term2 == acronym.lower()
    
    return False

def _are_tech_variants(term1, term2):
    """
    Check for common technology name variations.
    """
    # Technology name variants mapping
    tech_variants = {
        'javascript': ['js'],
        'typescript': ['ts'],
        'python': ['py'],
        'react': ['reactjs', 'react.js'],
        'node': ['nodejs', 'node.js'],
        'angular': ['angularjs', 'angular.js'],
        'vue': ['vuejs', 'vue.js'],
        'dotnet': ['dot net', '.net', 'net framework'],
        'csharp': ['c#', 'c sharp'],
        'cplusplus': ['c++', 'cpp'],
        'objective-c': ['objective c', 'objectivec'],
        'machine learning': ['ml'],
        'artificial intelligence': ['ai'],
        'natural language processing': ['nlp'],
        'kubernetes': ['k8s'],
        'database': ['db'],
    }
    
    # Normalize both terms further
    t1 = term1.replace('-', '').replace('.', '').replace(' ', '')
    t2 = term2.replace('-', '').replace('.', '').replace(' ', '')
    
    # Check direct mapping first
    for base, variants in tech_variants.items():
        base_norm = base.replace('-', '').replace('.', '').replace(' ', '')
        
        # If term1 is the base or a variant
        if t1 == base_norm or t1 in [v.replace('-', '').replace('.', '').replace(' ', '') for v in variants]:
            # Check if term2 is also the base or a variant
            if t2 == base_norm or t2 in [v.replace('-', '').replace('.', '').replace(' ', '') for v in variants]:
                return True
    
    return False

def _calculate_partial_match_score(text1, text2):
    """
    Calculate a score based on partial string matching, useful for technical terms.
    """
    # Convert to lowercase for comparison
    s1 = text1.lower()
    s2 = text2.lower()
    
    # If either string is a substring of the other, assign a high score
    if s1 in s2 or s2 in s1:
        return 0.85
    
    # Calculate Levenshtein (edit) distance
    try:
        import Levenshtein as lev
        max_len = max(len(s1), len(s2))
        if max_len == 0:
            return 0
        edit_distance = lev.distance(s1, s2)
        return 1.0 - (edit_distance / max_len)
    except ImportError:
        # Fallback if Levenshtein library is not available
        # Use SequenceMatcher from difflib (built-in)
        from difflib import SequenceMatcher
        return SequenceMatcher(None, s1, s2).ratio()

# Analyze text quality including passive voice detection
def analyze_text_quality(text):
    """
    Analyze text quality aspects like passive vs active voice using Azure Language services.
    
    Args:
        text (str): The text to analyze
        
    Returns:
        dict: Analysis results including passive voice ratio and examples
    """
    client = get_text_analytics_client()
    if not client:
        return {"passive_voice_ratio": 0, "passive_examples": []}
    
    try:
        # First, split text into sentences for analysis
        sentences = re.split(r'(?<=[.!?])\s+', text)
        
        # Initialize counters and result containers
        total_sentences = len(sentences)
        passive_sentences = 0
        passive_examples = []
        
        # Common passive voice indicators
        passive_indicators = [
            r'\b(?:am|is|are|was|were|be|being|been)\s+\w+ed\b',
            r'\b(?:has|have|had)\s+been\s+\w+ed\b',
            r'\b(?:will|shall|should|would|could|might|must)\s+be\s+\w+ed\b'
        ]
        
        for sentence in sentences:
            # Skip very short sentences
            if len(sentence.split()) < 3:
                total_sentences -= 1
                continue
                
            # Check for passive voice patterns
            is_passive = any(re.search(pattern, sentence, re.IGNORECASE) for pattern in passive_indicators)
            
            if is_passive:
                passive_sentences += 1
                
                # Generate an active voice alternative if possible
                if len(passive_examples) < 3:  # Limit examples to avoid large result
                    # Find the passive part of the sentence
                    for pattern in passive_indicators:
                        match = re.search(pattern, sentence, re.IGNORECASE)
                        if match:
                            passive_part = match.group(0)
                            
                            # Simple conversion of common passive phrases (very basic)
                            active_suggestion = sentence.replace(passive_part, "actively did")
                            
                            passive_examples.append({
                                "original": sentence,
                                "suggestion": active_suggestion
                            })
                            break
        
        # Calculate passive voice ratio
        passive_ratio = passive_sentences / total_sentences if total_sentences > 0 else 0
        
        return {
            "passive_voice_ratio": passive_ratio,
            "passive_examples": passive_examples
        }
        
    except Exception as e:
        print(f"Error analyzing text quality: {str(e)}")
        return {"passive_voice_ratio": 0, "passive_examples": []} 