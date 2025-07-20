from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from .models import InterviewAnalysis
from .serializers import InterviewAnalysisSerializer
from .bert_analyzer import analyze_transcript
from django.conf import settings

# Create your views here.

@api_view(['POST'])
def bert_analysis(request):
    """
    API endpoint for BERT-based analysis of interview transcripts
    """
    # Extract transcript and question from request
    transcript = request.data.get('transcript', '')
    question = request.data.get('question', '')
    
    if not transcript:
        return Response(
            {'error': 'Interview transcript is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Perform BERT analysis
        print(f"Starting BERT analysis for transcript of length: {len(transcript)}")
        analysis_result = analyze_transcript(transcript, question)
        print("BERT analysis completed successfully")
        
        # Optionally save the analysis to database
        try:
            analysis = InterviewAnalysis(
                transcript=transcript,
                question=question
            )
            analysis.set_bert_analysis(analysis_result)
            analysis.save()
            print(f"Analysis saved with ID: {analysis.id}")
        except Exception as save_error:
            # If saving fails, we'll still return the analysis result
            print(f"Error saving analysis: {str(save_error)}")
        
        # Return analysis results
        return Response(analysis_result, status=status.HTTP_200_OK)
        
    except Exception as e:
        # More detailed error logging
        import traceback
        error_detail = traceback.format_exc()
        print(f"BERT analysis error: {str(e)}")
        print(f"Error details: {error_detail}")
        
        return Response(
            {
                'error': f'Analysis failed: {str(e)}',
                'detail': error_detail if settings.DEBUG else "Enable DEBUG mode for more details"
            }, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

class InterviewAnalysisViewSet(viewsets.ModelViewSet):
    """
    API endpoint for CRUD operations on interview analyses
    """
    queryset = InterviewAnalysis.objects.all().order_by('-created_at')
    serializer_class = InterviewAnalysisSerializer
    
    @action(detail=False, methods=['post'])
    def analyze(self, request):
        """
        Analyze an interview transcript and save the results
        """
        transcript = request.data.get('transcript', '')
        question = request.data.get('question', '')
        
        if not transcript:
            return Response(
                {'error': 'Interview transcript is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Perform BERT analysis
            analysis_result = analyze_transcript(transcript, question)
            
            # Save the analysis to database
            analysis = InterviewAnalysis(
                transcript=transcript,
                question=question
            )
            analysis.set_bert_analysis(analysis_result)
            analysis.save()
            
            # Return analysis results with serializer
            serializer = self.get_serializer(analysis)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Analysis failed: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
