from rest_framework import serializers

from .models import AttemptAnswer, Choice, Question, Quiz, QuizAttempt


class ChoicePlaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ("id", "text")


class QuestionPlaySerializer(serializers.ModelSerializer):
    """Questions as shown while playing: correct answers are never sent."""

    choices = ChoicePlaySerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ("id", "order", "kind", "prompt", "page", "choices")


class QuizListSerializer(serializers.ModelSerializer):
    document_title = serializers.CharField(source="document.title", read_only=True)
    question_count = serializers.IntegerField(read_only=True)
    attempt_count = serializers.IntegerField(read_only=True)
    best_percent = serializers.FloatField(read_only=True)
    last_percent = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = ("id", "title", "document", "document_title", "difficulty", "focus",
                  "time_limit_minutes", "generated_by", "question_count", "attempt_count",
                  "best_percent", "last_percent", "created_at")

    def get_last_percent(self, obj):
        last = obj.attempts.first()
        return last.percent if last else None


class QuizPlaySerializer(QuizListSerializer):
    questions = QuestionPlaySerializer(many=True, read_only=True)

    class Meta(QuizListSerializer.Meta):
        fields = QuizListSerializer.Meta.fields + ("questions",)


class GenerateQuizSerializer(serializers.Serializer):
    document = serializers.IntegerField()
    count = serializers.IntegerField(min_value=3, max_value=30, default=10)
    difficulty = serializers.ChoiceField(choices=Quiz.Difficulty.choices, default="moyen")
    kinds = serializers.ListField(child=serializers.ChoiceField(choices=["mcq", "true_false"]),
                                  required=False)
    focus = serializers.CharField(max_length=160, required=False, allow_blank=True, default="")
    time_limit_minutes = serializers.IntegerField(min_value=1, max_value=180, required=False,
                                                  allow_null=True)


class SubmitSerializer(serializers.Serializer):
    answers = serializers.DictField(child=serializers.IntegerField(allow_null=True))
    duration_seconds = serializers.IntegerField(min_value=0, default=0)
    mode = serializers.ChoiceField(choices=QuizAttempt.Mode.choices, default="full")


class AnswerReviewSerializer(serializers.ModelSerializer):
    question_id = serializers.IntegerField(source="question.id")
    prompt = serializers.CharField(source="question.prompt")
    kind = serializers.CharField(source="question.kind")
    explanation = serializers.CharField(source="question.explanation")
    page = serializers.IntegerField(source="question.page")
    chosen_choice = serializers.IntegerField(source="choice_id", allow_null=True)
    correct_choice = serializers.SerializerMethodField()
    choices = ChoicePlaySerializer(source="question.choices", many=True)

    class Meta:
        model = AttemptAnswer
        fields = ("question_id", "prompt", "kind", "choices", "chosen_choice", "correct_choice",
                  "is_correct", "explanation", "page")

    def get_correct_choice(self, obj):
        return next((c.id for c in obj.question.choices.all() if c.is_correct), None)


class AttemptSerializer(serializers.ModelSerializer):
    quiz_title = serializers.CharField(source="quiz.title", read_only=True)
    document = serializers.IntegerField(source="quiz.document_id", read_only=True)
    document_title = serializers.CharField(source="quiz.document.title", read_only=True)

    class Meta:
        model = QuizAttempt
        fields = ("id", "quiz", "quiz_title", "document", "document_title", "mode", "score",
                  "total", "percent", "duration_seconds", "completed_at")


class AttemptDetailSerializer(AttemptSerializer):
    answers = AnswerReviewSerializer(many=True, read_only=True)

    class Meta(AttemptSerializer.Meta):
        fields = AttemptSerializer.Meta.fields + ("answers",)
