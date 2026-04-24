import logging
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import ChatSession, ChatMessage
from .serializers import (ChatSessionSerializer, ChatSessionListSerializer,
                           SendMessageSerializer, ChatMessageSerializer)
from .services import get_ai_response
from apps.core.permissions import IsRegularUser

logger = logging.getLogger(__name__)


class ChatSessionListView(generics.ListAPIView):
    serializer_class = ChatSessionListSerializer
    permission_classes = [IsRegularUser]

    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user)


class ChatSessionDetailView(generics.RetrieveAPIView):
    serializer_class = ChatSessionSerializer
    permission_classes = [IsRegularUser]

    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user)


class SendMessageView(APIView):
    permission_classes = [IsRegularUser]

    def post(self, request):
        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        message_text = serializer.validated_data['message'].strip()
        session_id = serializer.validated_data.get('session_id')

        if not message_text:
            return Response(
                {'error': 'Message cannot be empty.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user.ai_tokens < 1:
            return Response(
                {'error': 'You have no AI tokens remaining. Please upgrade your plan to continue.'},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        # Resolve or create session
        if session_id:
            try:
                session = ChatSession.objects.get(id=session_id, user=user)
            except ChatSession.DoesNotExist:
                return Response(
                    {'error': 'Chat session not found.'},
                    status=status.HTTP_404_NOT_FOUND,
                )
        else:
            session = ChatSession.objects.create(user=user, title=message_text[:50])

        # Persist user message
        user_msg = ChatMessage.objects.create(
            session=session, role='user', content=message_text, tokens_used=0
        )

        # Build conversation history (last 10 turns)
        total_msgs = session.messages.count()
        skip = max(0, total_msgs - 10)
        history = [
            {'role': msg.role, 'content': msg.content}
            for msg in session.messages.all().order_by('created_at')[skip:]
        ]

        # Attach birth chart context if available
        user_context = {}
        try:
            chart = user.birth_chart
            user_context = {
                'sun_sign': chart.sun_sign,
                'moon_sign': chart.moon_sign,
                'ascendant': chart.ascendant,
            }
        except Exception:
            pass

        # Call AI service
        try:
            ai_text, tokens_used = get_ai_response(history, user_context)
        except Exception as e:
            logger.exception('AI service error for user %s: %s', user.id, e)
            # Clean up the user message so they can retry
            user_msg.delete()
            return Response(
                {'error': str(e) if str(e) else 'The AI service is temporarily unavailable. Please try again.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        # Persist AI reply and deduct tokens
        ai_message = ChatMessage.objects.create(
            session=session, role='assistant', content=ai_text, tokens_used=tokens_used
        )
        user.ai_tokens = max(0, user.ai_tokens - tokens_used)
        user.save(update_fields=['ai_tokens'])

        return Response({
            'session_id': session.id,
            'message': ChatMessageSerializer(ai_message).data,
            'remaining_tokens': user.ai_tokens,
        })


class DeleteSessionView(APIView):
    permission_classes = [IsRegularUser]

    def delete(self, request, pk):
        try:
            session = ChatSession.objects.get(id=pk, user=request.user)
            session.delete()
            return Response({'message': 'Session deleted.'})
        except ChatSession.DoesNotExist:
            return Response(
                {'error': 'Chat session not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
