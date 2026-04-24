from django.urls import path
from .views import ChatSessionListView, ChatSessionDetailView, SendMessageView, DeleteSessionView

urlpatterns = [
    path('sessions/', ChatSessionListView.as_view(), name='chat_sessions'),
    path('sessions/<int:pk>/', ChatSessionDetailView.as_view(), name='chat_session_detail'),
    path('sessions/<int:pk>/delete/', DeleteSessionView.as_view(), name='delete_session'),
    path('send/', SendMessageView.as_view(), name='send_message'),
]
