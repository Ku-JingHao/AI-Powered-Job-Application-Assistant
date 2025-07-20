from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView, TokenObtainPairView
from . import views

urlpatterns = [
    # Regular Django views
    path('register/', views.register_view, name='register'),
    path('profile/', views.profile_view, name='profile'),
    
    # API endpoints for JWT auth and user management
    path('api/register/', views.RegisterAPIView.as_view(), name='api-register'),
    path('api/login/', TokenObtainPairView.as_view(), name='api-token'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='api-token-refresh'),
    path('api/profile/', views.profile_api_view, name='api-profile'),
    path('api/change-password/', views.change_password, name='api-change-password'),
    path('api/logout/', views.logout_view, name='api-logout'),
] 