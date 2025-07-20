from rest_framework import serializers
from .models import Resume, JobDescription, ResumeAnalysis, MockInterview, ChatMessage

class ResumeSerializer(serializers.ModelSerializer):
    """Serializer for Resume model"""
    class Meta:
        model = Resume
        fields = ['id', 'title', 'file_name', 'file_type', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class JobDescriptionSerializer(serializers.ModelSerializer):
    """Serializer for JobDescription model"""
    class Meta:
        model = JobDescription
        fields = ['id', 'title', 'company', 'file_name', 'file_type', 'created_at']
        read_only_fields = ['created_at']

class ResumeAnalysisSerializer(serializers.ModelSerializer):
    """Serializer for ResumeAnalysis model"""
    class Meta:
        model = ResumeAnalysis
        fields = [
            'id', 'resume', 'job_description', 'keywords_to_add', 
            'keywords_to_remove', 'format_suggestions', 
            'content_suggestions', 'match_score', 'created_at'
        ]
        read_only_fields = ['created_at']

class ResumeAnalysisResultSerializer(serializers.Serializer):
    """Serializer for resume analysis results"""
    keywordsToAdd = serializers.ListField(child=serializers.CharField())
    keywordsToRemove = serializers.ListField(child=serializers.CharField())
    formatSuggestions = serializers.ListField(child=serializers.CharField())
    contentSuggestions = serializers.ListField(child=serializers.CharField())
    matchScore = serializers.IntegerField()
    technicalSkillsMatch = serializers.DictField(required=False)
    softSkillsMatch = serializers.DictField(required=False)

class MockInterviewSerializer(serializers.ModelSerializer):
    """Serializer for MockInterview model"""
    job_description_title = serializers.SerializerMethodField()
    
    class Meta:
        model = MockInterview
        fields = [
            'id', 'title', 'transcript', 'audio_file_path', 'duration',
            'overall_score', 'created_at', 'job_description', 'job_description_title'
        ]
        read_only_fields = ['created_at', 'overall_score']
    
    def get_job_description_title(self, obj):
        """Get the job description title if available"""
        if obj.job_description:
            return obj.job_description.title
        return None

class InterviewAnalysisResultSerializer(serializers.Serializer):
    """Serializer for interview analysis results"""
    transcript = serializers.CharField()
    audio_analysis = serializers.DictField()
    content_analysis = serializers.DictField()
    feedback = serializers.DictField()
    
    # Optional fields
    error = serializers.CharField(required=False)

class InterviewFeedbackSerializer(serializers.Serializer):
    """Serializer for detailed interview feedback"""
    confidence = serializers.DictField()
    clarity = serializers.DictField()
    content = serializers.DictField()
    overall_score = serializers.DictField()
    improvement_points = serializers.ListField(child=serializers.CharField()) 
    
class ChatMessageSerializer(serializers.ModelSerializer):
    """Serializer for the ChatMessage model"""
    class Meta:
        model = ChatMessage
        fields = ['id', 'user', 'message', 'is_user', 'timestamp', 'session_id']
        read_only_fields = ['id', 'timestamp'] 