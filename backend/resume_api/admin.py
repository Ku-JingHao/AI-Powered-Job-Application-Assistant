from django.contrib import admin
from .models import Resume, JobDescription, ResumeAnalysis

@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'file_type', 'created_at')
    list_filter = ('file_type', 'created_at')
    search_fields = ('title', 'user__username')

@admin.register(JobDescription)
class JobDescriptionAdmin(admin.ModelAdmin):
    list_display = ('title', 'company', 'user', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('title', 'company', 'user__username')

@admin.register(ResumeAnalysis)
class ResumeAnalysisAdmin(admin.ModelAdmin):
    list_display = ('resume', 'job_description', 'match_score', 'created_at')
    list_filter = ('created_at', 'match_score')
    search_fields = ('resume__title', 'job_description__title', 'user__username')
