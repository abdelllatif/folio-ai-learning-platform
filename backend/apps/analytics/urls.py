from django.urls import path

from . import views

urlpatterns = [
    path("dashboard/", views.dashboard, name="dashboard"),
    path("activity/", views.activity, name="activity"),
    path("progress/", views.progress, name="progress"),
    path("search/", views.search, name="global-search"),
]
