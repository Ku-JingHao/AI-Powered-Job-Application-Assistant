import os
import json
import openai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Azure OpenAI settings
# Update to ensure compatibility with current OpenAI package
openai.api_type = "azure"
openai.api_base = os.getenv("AZURE_OPENAI_ENDPOINT")
openai.api_key = os.getenv("AZURE_OPENAI_API_KEY")
openai.api_version = "2023-05-15"  # Update this to the latest version as needed
DEPLOYMENT_NAME = os.getenv("AZURE_OPENAI_DEPLOYMENT")

class AzureOpenAIClient:
    """
    Client for Azure OpenAI services to generate enhanced interview feedback
    """
    def __init__(self):
        if not all([openai.api_base, openai.api_key, DEPLOYMENT_NAME]):
            print("Warning: Azure OpenAI credentials not fully configured.")
            print("Please set AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, and AZURE_OPENAI_DEPLOYMENT in .env file")
    
    def generate_interview_suggestions(self, transcript, question):
        """
        Generate personalized interview improvement suggestions based on
        the transcript and question using Azure OpenAI
        
        Args:
            transcript (str): The interview response transcript
            question (str): The interview question
            
        Returns:
            dict: Suggestions and feedback from the AI model
        """
        try:
            # Check if Azure OpenAI is properly configured
            if not all([openai.api_base, openai.api_key, DEPLOYMENT_NAME]):
                print("OpenAI credentials not configured, using fallback suggestions")
                return self._generate_fallback_suggestions(transcript, question)
            
            # Prepare the prompt for the OpenAI model
            prompt = self._create_feedback_prompt(transcript, question)
            
            try:
                # Call Azure OpenAI API
                response = openai.Completion.create(
                    engine=DEPLOYMENT_NAME,
                    prompt=prompt,
                    max_tokens=500,
                    temperature=0.7,
                    top_p=0.95,
                    frequency_penalty=0.5,
                    presence_penalty=0.5,
                    stop=None
                )
                
                # Parse and return the response
                try:
                    suggestions_text = response.choices[0].text.strip()
                    # Try to parse as JSON if it's in that format
                    try:
                        return json.loads(suggestions_text)
                    except json.JSONDecodeError:
                        # If it's not JSON, process the text response
                        return self._process_text_response(suggestions_text)
                except Exception as e:
                    print(f"Error parsing OpenAI response: {e}")
                    return self._generate_fallback_suggestions(transcript, question)
            except Exception as e:
                print(f"Error calling Azure OpenAI API: {e}")
                return self._generate_fallback_suggestions(transcript, question)
                
        except Exception as e:
            print(f"Error calling Azure OpenAI: {e}")
            return self._generate_fallback_suggestions(transcript, question)
    
    def _create_feedback_prompt(self, transcript, question):
        """Create a prompt for the OpenAI model to generate interview feedback"""
        return f"""
        You are an expert interview coach analyzing a job interview response.
        
        The interview question was: "{question}"
        
        The candidate's response was:
        "{transcript}"
        
        Please provide:
        1. A list of 5 specific, actionable suggestions for improving this interview response
        2. Three strengths demonstrated in this response
        3. Three areas for improvement
        4. A better way to phrase or structure this response
        
        Format your response as JSON with the following structure:
        {{
            "suggestions": ["suggestion1", "suggestion2", ...],
            "strengths": ["strength1", "strength2", "strength3"],
            "improvement_areas": ["area1", "area2", "area3"],
            "better_response": "A concise example of a better response"
        }}
        """
    
    def _process_text_response(self, text):
        """Process a text response from OpenAI into structured feedback"""
        # Simple processing when the response isn't valid JSON
        sections = text.split('\n\n')
        
        suggestions = []
        strengths = []
        improvement_areas = []
        better_response = ""
        
        current_section = None
        
        for section in sections:
            section = section.strip()
            if 'suggestion' in section.lower() or 'improve' in section.lower():
                current_section = 'suggestions'
            elif 'strength' in section.lower():
                current_section = 'strengths'
            elif 'improvement' in section.lower():
                current_section = 'improvement_areas'
            elif 'better' in section.lower() or 'example' in section.lower():
                current_section = 'better_response'
            
            # Extract numbered or bulleted items
            if current_section in ['suggestions', 'strengths', 'improvement_areas']:
                items = []
                for line in section.split('\n'):
                    line = line.strip()
                    # Remove numbers, bullets, etc.
                    if line and (line[0].isdigit() or line[0] in ['•', '-', '*']):
                        item = line.split('.', 1)[-1].split(':', 1)[-1].strip()
                        if item:
                            items.append(item)
                
                if current_section == 'suggestions':
                    suggestions.extend(items)
                elif current_section == 'strengths':
                    strengths.extend(items)
                elif current_section == 'improvement_areas':
                    improvement_areas.extend(items)
            elif current_section == 'better_response':
                better_response = section.strip()
        
        return {
            'suggestions': suggestions[:5],  # Limit to 5
            'strengths': strengths[:3],      # Limit to 3
            'improvement_areas': improvement_areas[:3],  # Limit to 3
            'better_response': better_response
        }
    
    def _generate_fallback_suggestions(self, transcript, question):
        """Generate fallback suggestions when Azure OpenAI is unavailable"""
        # Analyze basic metrics
        word_count = len(transcript.split())
        sentence_count = len([s for s in transcript.split('.') if s.strip()])
        avg_words_per_sentence = word_count / max(sentence_count, 1)
        
        suggestions = [
            "Use the STAR method (Situation, Task, Action, Result) to structure your response more clearly.",
            "Quantify your achievements with specific metrics to add credibility.",
            "Connect your experience directly to the skills required for the position.",
            "Use industry-specific terminology to demonstrate expertise.",
            "Include a brief concluding statement to summarize your main points."
        ]
        
        strengths = []
        if word_count > 150:
            strengths.append("Provided a substantial amount of information")
        if "example" in transcript.lower() or "instance" in transcript.lower():
            strengths.append("Included specific examples to illustrate points")
        if "result" in transcript.lower() or "outcome" in transcript.lower():
            strengths.append("Mentioned outcomes of your actions")
        if not strengths:
            strengths = [
                "Addressed the question directly",
                "Showed willingness to share your experience",
                "Demonstrated communication skills"
            ]
        
        improvement_areas = []
        if avg_words_per_sentence > 25:
            improvement_areas.append("Shorten sentences for better clarity")
        if word_count < 100:
            improvement_areas.append("Expand your answer with more details and examples")
        if not any(x in transcript.lower() for x in ["therefore", "because", "result", "this led to"]):
            improvement_areas.append("Include cause-effect relationships to strengthen your narrative")
        if not improvement_areas:
            improvement_areas = [
                "Add more specificity to your examples",
                "Include metrics to quantify your achievements",
                "Connect your experience more explicitly to the job requirements"
            ]
        
        return {
            'suggestions': suggestions,
            'strengths': strengths[:3],
            'improvement_areas': improvement_areas[:3],
            'better_response': ""
        }

# Singleton instance
azure_openai_client = AzureOpenAIClient() 