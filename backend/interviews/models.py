from django.db import models
import uuid
import json

class InterviewAnalysis(models.Model):
    """
    Model for storing interview analysis results, including BERT-based analysis
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Basic interview data
    question = models.TextField()
    transcript = models.TextField()
    
    # Analysis results
    audio_analysis = models.JSONField(null=True, blank=True)
    content_analysis = models.JSONField(null=True, blank=True)
    bert_analysis = models.JSONField(null=True, blank=True)
    
    # Fields for BERT analysis specifically
    relevant_keywords = models.JSONField(null=True, blank=True)
    missing_keywords = models.JSONField(null=True, blank=True)
    suggestions = models.JSONField(null=True, blank=True)
    strengths = models.JSONField(null=True, blank=True)
    improvement_areas = models.JSONField(null=True, blank=True)
    
    def __str__(self):
        return f"Interview Analysis {self.id}"
    
    def set_bert_analysis(self, bert_result):
        """
        Set the BERT analysis results from a dictionary
        """
        try:
            # Ensure bert_result is a dictionary
            if not isinstance(bert_result, dict):
                print(f"Warning: bert_result is not a dict but {type(bert_result)}")
                # Try to convert if possible, otherwise use an empty dict
                try:
                    bert_result = dict(bert_result)
                except:
                    print("Could not convert bert_result to dict, using empty dict")
                    bert_result = {}
            
            # Convert to JSON string and save
            self.bert_analysis = json.dumps(bert_result)
            
            # Also store in individual fields for easier querying
            for field, key in [
                ('relevant_keywords', 'relevantKeywords'),
                ('missing_keywords', 'missingKeywords'),
                ('suggestions', 'suggestions'),
                ('strengths', 'strengths'),
                ('improvement_areas', 'improvementAreas')
            ]:
                try:
                    value = bert_result.get(key, [])
                    setattr(self, field, json.dumps(value))
                except Exception as e:
                    print(f"Error setting {field} from {key}: {e}")
                    setattr(self, field, json.dumps([]))
        except Exception as e:
            print(f"Error in set_bert_analysis: {e}")
            import traceback
            print(traceback.format_exc())
            # Set default values to prevent saving errors
            self.bert_analysis = json.dumps({})
            self.relevant_keywords = json.dumps([])
            self.missing_keywords = json.dumps([])
            self.suggestions = json.dumps([])
            self.strengths = json.dumps([])
            self.improvement_areas = json.dumps([])
        
    def get_bert_analysis(self):
        """
        Get the BERT analysis results as a dictionary
        """
        if self.bert_analysis:
            return json.loads(self.bert_analysis)
        return {
            'relevantKeywords': json.loads(self.relevant_keywords) if self.relevant_keywords else [],
            'missingKeywords': json.loads(self.missing_keywords) if self.missing_keywords else [],
            'suggestions': json.loads(self.suggestions) if self.suggestions else [],
            'strengths': json.loads(self.strengths) if self.strengths else [],
            'improvementAreas': json.loads(self.improvement_areas) if self.improvement_areas else []
        }
