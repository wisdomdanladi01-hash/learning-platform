class ConflictError(Exception):
    """An operation conflicts with existing platform records."""


class NotFoundError(Exception):
    """A requested record does not exist or is not visible to the caller."""


class PolicyError(Exception):
    """A requested operation violates a business or authorization rule."""
