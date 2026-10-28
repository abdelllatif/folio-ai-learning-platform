from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):
    """Object-level permission: only the owner of a resource may access it.

    Models expose their owner through an ``owner`` or ``user`` attribute.
    """

    def has_object_permission(self, request, view, obj):
        owner = getattr(obj, "owner", None) or getattr(obj, "user", None)
        return owner == request.user
