from rest_framework import serializers
from .models import InterviewAnalysis

class InterviewAnalysisSerializer(serializers.ModelSerializer):
    """
    Serializer for the InterviewAnalysis model
    """
    bert_analysis = serializers.JSONField(required=False)
    relevant_keywords = serializers.JSONField(required=False)
    missing_keywords = serializers.JSONField(required=False)
    suggestions = serializers.JSONField(required=False)
    strengths = serializers.JSONField(required=False)
    improvement_areas = serializers.JSONField(required=False)
    
    class Meta:
        model = InterviewAnalysis
        fields = ['id', 'created_at', 'question', 'transcript', 
                 'bert_analysis', 'relevant_keywords', 'missing_keywords',
                 'suggestions', 'strengths', 'improvement_areas']
        read_only_fields = ['id', 'created_at'] 