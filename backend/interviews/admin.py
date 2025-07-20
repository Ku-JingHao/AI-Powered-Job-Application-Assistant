from django.contrib import admin
from .models import InterviewAnalysis

# Register your models here.
@admin.register(InterviewAnalysis)
class InterviewAnalysisAdmin(admin.ModelAdmin):
    list_display = ('id', 'created_at', 'question')
    list_filter = ('created_at',)
    search_fields = ('question', 'transcript')
    readonly_fields = ('id', 'created_at')
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'created_at', 'question', 'transcript')
        }),
        ('Analysis Results', {
            'fields': ('bert_analysis', 'relevant_keywords', 'missing_keywords', 
                      'suggestions', 'strengths', 'improvement_areas'),
            'classes': ('collapse',)
        }),
    )
