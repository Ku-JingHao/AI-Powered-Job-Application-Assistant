# Generated by Django 5.1.7 on 2025-03-27 16:57

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('resume_api', '0002_chatmessage'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='InterviewFAQ',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('category', models.CharField(choices=[('software', 'Software Development'), ('data', 'Data Science/Analytics'), ('product', 'Product Management'), ('design', 'Design'), ('marketing', 'Marketing'), ('sales', 'Sales'), ('finance', 'Finance'), ('hr', 'Human Resources'), ('operations', 'Operations'), ('general', 'General')], max_length=50)),
                ('question', models.TextField()),
                ('difficulty', models.CharField(choices=[('basic', 'Basic'), ('intermediate', 'Intermediate'), ('advanced', 'Advanced')], default='intermediate', max_length=20)),
                ('suggested_answer', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'verbose_name_plural': 'Interview FAQs',
            },
        ),
        migrations.CreateModel(
            name='MockInterview',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=100)),
                ('transcript', models.TextField()),
                ('question', models.TextField(blank=True, null=True)),
                ('audio_file_path', models.CharField(blank=True, max_length=255, null=True)),
                ('duration', models.FloatField(default=0.0)),
                ('audio_analysis', models.JSONField(default=dict)),
                ('content_analysis', models.JSONField(default=dict)),
                ('feedback', models.JSONField(default=dict)),
                ('overall_score', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('job_description', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='mock_interviews', to='resume_api.jobdescription')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='mock_interviews', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name_plural': 'Mock Interviews',
            },
        ),
    ]
