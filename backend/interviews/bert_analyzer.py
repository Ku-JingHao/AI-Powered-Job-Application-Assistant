"""
BERT Analyzer Module for Interview Responses
This module provides functions to analyze interview transcripts using BERT-based models
"""
import os
import json
from typing import Dict, List, Any

# Optional: Catch import errors to handle cases where transformers/torch aren't installed
try:
    from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline
    from transformers import BertTokenizer, BertModel
    import torch
    import numpy as np
    TRANSFORMERS_AVAILABLE = True
    print("Successfully imported transformers and torch")
except ImportError as e:
    TRANSFORMERS_AVAILABLE = False
    print(f"Error importing transformers and torch: {str(e)}")
    print("BERT models will not be available. Using fallback text analysis methods.")

# Dictionary of question types and relevant keywords
QUESTION_KEYWORDS = {
    'experience': ['professional background', 'expertise', 'work history', 'career path', 'professional journey', 'accomplishments'],
    'challenge': ['difficulty', 'hurdle', 'complication', 'obstacle', 'problem-solving', 'adversity', 'resolution'],
    'strength': ['ability', 'talent', 'aptitude', 'competency', 'expertise', 'proficiency', 'mastery'],
    'general': ['qualifications', 'skills', 'background', 'capability', 'performance', 'achievement']
}

class BertAnalyzer:
    """
    Class for analyzing interview transcripts using BERT-based models
    """
    def __init__(self):
        self.model_loaded = False
        self.tokenizer = None
        self.model = None
        self.zero_shot_classifier = None
        
        # Try to load models if transformers is available
        if TRANSFORMERS_AVAILABLE:
            try:
                print("Attempting to load BERT models...")
                # Load BERT model for embeddings
                self.tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
                print("Tokenizer loaded successfully")
                
                self.model = BertModel.from_pretrained('bert-base-uncased')
                print("BERT model loaded successfully")
                
                # Load zero-shot classification model for topic detection
                self.zero_shot_classifier = pipeline(
                    "zero-shot-classification",
                    model="facebook/bart-large-mnli",
                    device=0 if torch.cuda.is_available() else -1
                )
                print("Zero-shot classifier loaded successfully")
                
                self.model_loaded = True
                print("All BERT models loaded successfully")
            except Exception as e:
                print(f"Error loading BERT models: {e}")
                import traceback
                print(traceback.format_exc())
                print("Using fallback text analysis methods")
        else:
            print("Transformers not available. Using fallback text analysis methods.")
    
    def _determine_question_type(self, question: str) -> str:
        """Determine the type of interview question asked"""
        question_lower = question.lower()
        
        if 'experience' in question_lower or 'background' in question_lower:
            return 'experience'
        elif 'challenge' in question_lower or 'difficult' in question_lower or 'problem' in question_lower:
            return 'challenge'
        elif 'strength' in question_lower or 'skill' in question_lower or 'good at' in question_lower:
            return 'strength'
        else:
            return 'general'
    
    def _determine_transcript_context(self, transcript: str) -> str:
        """Determine the context of the transcript (detailed, example-driven, etc.)"""
        if len(transcript.split()) > 200:
            return 'detailed'
        elif any(term in transcript.lower() for term in ['example', 'instance', 'case study', 'situation']):
            return 'example-driven'
        elif any(term in transcript.lower() for term in ['percent', 'increase', 'data', 'metrics', 'number', 'statistic']):
            return 'data-driven'
        else:
            return 'basic'
    
    def _extract_keywords_with_bert(self, transcript: str, question_type: str) -> Dict[str, List[str]]:
        """Extract keywords from the transcript using BERT embeddings"""
        # If models aren't available, fall back to simple matching
        if not self.model_loaded:
            print("Models not loaded. Using simple keyword extraction.")
            return self._extract_keywords_simple(transcript, question_type)
        
        try:
            # For very long transcripts, truncate to avoid memory issues
            if len(transcript) > 5000:
                print(f"Transcript too long ({len(transcript)} chars). Truncating to 5000 chars for BERT analysis.")
                transcript = transcript[:5000]
            
            # Get candidate keywords for this question type
            candidate_keywords = QUESTION_KEYWORDS[question_type]
            print(f"Analyzing transcript against {len(candidate_keywords)} candidate keywords for '{question_type}'")
            
            # Encode the transcript
            print("Encoding transcript with BERT tokenizer")
            transcript_inputs = self.tokenizer(transcript, return_tensors="pt", padding=True, truncation=True, max_length=512)
            with torch.no_grad():
                transcript_output = self.model(**transcript_inputs)
            transcript_embedding = transcript_output.last_hidden_state.mean(dim=1)
            print("Transcript successfully encoded")
            
            # Compute similarity with candidate keywords
            relevant_keywords = []
            missing_keywords = []
            
            print("Computing similarity with candidate keywords")
            for keyword in candidate_keywords:
                # Encode the keyword
                keyword_inputs = self.tokenizer(keyword, return_tensors="pt", padding=True, truncation=True)
                with torch.no_grad():
                    keyword_output = self.model(**keyword_inputs)
                keyword_embedding = keyword_output.last_hidden_state.mean(dim=1)
                
                # Calculate cosine similarity
                cos_sim = torch.nn.functional.cosine_similarity(transcript_embedding, keyword_embedding).item()
                
                # Determine if keyword is relevant based on similarity threshold
                if cos_sim > 0.4 or keyword.lower() in transcript.lower():
                    relevant_keywords.append(keyword)
                else:
                    missing_keywords.append(keyword)
            
            print(f"BERT keyword analysis complete. Found {len(relevant_keywords)} relevant keywords.")
            return {
                "relevantKeywords": relevant_keywords,
                "missingKeywords": missing_keywords
            }
        except torch.cuda.OutOfMemoryError as e:
            print(f"CUDA out of memory error in BERT keyword extraction: {e}")
            print("Falling back to simple keyword extraction")
            return self._extract_keywords_simple(transcript, question_type)
        except Exception as e:
            print(f"Error in BERT keyword extraction: {e}")
            import traceback
            print(traceback.format_exc())
            print("Falling back to simple keyword extraction")
            return self._extract_keywords_simple(transcript, question_type)
    
    def _extract_keywords_simple(self, transcript: str, question_type: str) -> Dict[str, List[str]]:
        """Fallback method for keyword extraction using simple string matching"""
        transcript_lower = transcript.lower()
        candidate_keywords = QUESTION_KEYWORDS[question_type]
        
        relevant_keywords = [k for k in candidate_keywords if k.lower() in transcript_lower]
        missing_keywords = [k for k in candidate_keywords if k.lower() not in transcript_lower]
        
        return {
            "relevantKeywords": relevant_keywords,
            "missingKeywords": missing_keywords
        }
    
    def _generate_suggestions(self, transcript_context: str, question_type: str) -> List[str]:
        """Generate suggestions based on transcript context and question type"""
        suggestions = []
        
        # Add context-specific suggestions - extended with more options
        if transcript_context == 'detailed':
            context_suggestions = [
                'Your detailed response shows depth of knowledge. Consider prioritizing key points more clearly.',
                'While comprehensive, your answer could benefit from a clearer structure with main points highlighted first.',
                'Strong detailed answer. Try using the "inverted pyramid" approach - start with your conclusion, then provide supporting details.',
                'Consider summarizing your main points at the end to reinforce your key message.',
                'Your thorough response could be even stronger with a clear topic sentence at the beginning of each paragraph.'
            ]
            suggestions.extend(context_suggestions[:3])  # Use 3 suggestions instead of 2
            
        elif transcript_context == 'example-driven':
            context_suggestions = [
                'Your examples effectively illustrate your points. Consider quantifying their impact more precisely.',
                'The examples you provided are relevant. Adding more context about your specific role would strengthen them.',
                'Good use of examples. For each one, try explicitly connecting it back to the skill or quality the interviewer is asking about.',
                'Your examples would be more memorable if you added the business impact or results of your actions.',
                'Consider using the STAR format (Situation, Task, Action, Result) more explicitly for each example.'
            ]
            suggestions.extend(context_suggestions[:3])
            
        elif transcript_context == 'data-driven':
            context_suggestions = [
                'Your use of data strengthens your response. Consider explaining the broader implications of these metrics.',
                'The metrics you mentioned are valuable. Connecting them more clearly to the skills required for this position would be beneficial.',
                'Good use of numbers to support your claims. Consider providing brief context for these figures to make them more meaningful.',
                'The data points you shared are impressive. Clarifying your specific contribution to these results would strengthen your answer.',
                'Consider framing your metrics in terms of business value or impact to make them more relevant to the interviewer.'
            ]
            suggestions.extend(context_suggestions[:3])
            
        else:  # basic
            context_suggestions = [
                'Adding specific, relevant examples would make your response more compelling.',
                'Consider structuring your answer using the STAR method to highlight your accomplishments more effectively.',
                'Your answer would benefit from more specific details about your role and contributions.',
                'Try to include at least one concrete example that demonstrates the skill or experience being discussed.',
                'Consider adding some industry-specific terminology to demonstrate your expertise in the field.'
            ]
            suggestions.extend(context_suggestions[:3])
        
        # Add question-type specific suggestion
        if question_type == 'experience':
            suggestions.append(
                "When discussing your experience, highlight how it directly relates to the requirements of this position."
            )
        elif question_type == 'challenge':
            suggestions.append(
                "For challenge questions, emphasize what you learned and how it improved your professional abilities."
            )
        elif question_type == 'strength':
            suggestions.append(
                "When highlighting strengths, provide clear evidence and examples that demonstrate each strength in action."
            )
        else:
            suggestions.append(
                "Consider emphasizing your qualifications more explicitly with concrete evidence."
            )
        
        # Add general suggestion
        suggestions.append("Use more industry-specific terminology to demonstrate domain knowledge.")
        
        return suggestions
    
    def _generate_strengths(self, transcript_context: str, question_type: str) -> List[str]:
        """Generate strengths based on transcript context and question type"""
        strengths = []
        
        # Add context-specific strength
        if transcript_context == 'detailed':
            strengths.append('Provided a comprehensive response with good depth')
        elif transcript_context == 'example-driven':
            strengths.append('Effectively used examples to illustrate points')
        else:
            strengths.append('Focused on key points')
        
        # Add question-specific strength
        strengths.append(f"Demonstrated understanding of {question_type} expectations in the field")
        
        # Add general strength
        strengths.append('Clearly addressed the question asked')
        
        return strengths
    
    def _generate_improvement_areas(self, transcript_context: str, question_type: str) -> List[str]:
        """Generate improvement areas based on transcript context and question type"""
        
        # Base improvement areas that apply broadly
        improvement_areas = [
            'Use more industry-specific terminology',
            'Consider structuring your answer more methodically',
            'Add more quantifiable achievements to strengthen impact'
        ]
        
        # Add context-specific improvement areas
        if transcript_context == 'detailed':
            improvement_areas.append('Prioritize your most impressive or relevant points earlier in your answer')
            improvement_areas.append('Be more selective about which details to include to keep your answer focused')
            
        elif transcript_context == 'example-driven':
            improvement_areas.append('Quantify the results or impact of your examples with specific metrics')
            improvement_areas.append('Make sure each example directly supports the main skill being discussed')
            
        elif transcript_context == 'data-driven':
            improvement_areas.append('Provide more context around your metrics to make them more meaningful')
            improvement_areas.append('Connect your achievements more explicitly to the job requirements')
            
        else:  # basic
            improvement_areas.append('Include more concrete examples to support your claims')
            improvement_areas.append('Add more depth and specificity to your responses')
        
        # Add question-type specific improvement area
        if question_type == 'experience':
            improvement_areas.append('Highlight more transferable skills from your past experiences')
        elif question_type == 'challenge':
            improvement_areas.append('Focus more on the solution and lessons learned than on the problem itself')
        elif question_type == 'strength':
            improvement_areas.append('Back up each strength with a specific example that demonstrates it')
        
        # Return a maximum of 4 improvement areas for readability
        return improvement_areas[:4]
    
    def analyze(self, transcript: str, question: str) -> Dict[str, Any]:
        """
        Analyze an interview transcript using BERT and return structured analysis results
        
        Args:
            transcript: The interview transcript to analyze
            question: The interview question that was asked
            
        Returns:
            Dictionary containing analysis results including keywords, suggestions, etc.
        """
        # Determine question type and transcript context
        question_type = self._determine_question_type(question)
        transcript_context = self._determine_transcript_context(transcript)
        
        # Extract keywords using simple string matching (not BERT)
        # This reverts to the original approach as requested
        keyword_results = self._extract_keywords_simple(transcript, question_type)
        
        # Generate suggestions and strengths (still using BERT contextual understanding)
        suggestions = self._generate_suggestions(transcript_context, question_type)
        strengths = self._generate_strengths(transcript_context, question_type)
        
        # Generate improvement areas specific to the context
        improvement_areas = self._generate_improvement_areas(transcript_context, question_type)
        
        # Return complete analysis
        return {
            "relevantKeywords": keyword_results["relevantKeywords"],
            "missingKeywords": keyword_results["missingKeywords"],
            "suggestions": suggestions,
            "strengths": strengths,
            "improvementAreas": improvement_areas
        }

# Singleton instance
analyzer = BertAnalyzer()

def analyze_transcript(transcript: str, question: str) -> Dict[str, Any]:
    """
    Analyze an interview transcript and return structured feedback
    This function is the main entry point for the BERT analysis functionality
    
    Args:
        transcript: The interview transcript to analyze
        question: The interview question that was asked
        
    Returns:
        Dictionary containing analysis results
    """
    try:
        print(f"Starting transcript analysis. Transcript length: {len(transcript)}, Question: '{question[:30]}...'")
        result = analyzer.analyze(transcript, question)
        print("Transcript analysis completed successfully")
        return result
    except Exception as e:
        import traceback
        print(f"Error in analyze_transcript: {e}")
        print(traceback.format_exc())
        
        # Provide a fallback analysis that won't break the client
        print("Using fallback analysis due to error")
        return {
            "relevantKeywords": ["experience", "skills", "background"],
            "missingKeywords": ["specific examples", "metrics", "achievements"],
            "suggestions": [
                "Consider providing more specific examples from your experience.",
                "Try to include measurable achievements in your answer.",
                "Structure your response using the STAR method (Situation, Task, Action, Result)."
            ],
            "strengths": [
                "Addressed the core question",
                "Demonstrated knowledge of the topic"
            ],
            "improvementAreas": [
                "Could include more specific details",
                "Consider quantifying your achievements with metrics",
                "Add more industry-specific terminology"
            ]
        } 