class BusinessError(Exception):

    def __init__(self, message, status_code=400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class ValidationError(BusinessError):

    def __init__(self, message):
        super().__init__(message, 422)


class NotFoundError(BusinessError):

    def __init__(self, resource):
        super().__init__(f'{resource} não encontrado(a)', 404)


class UnauthorizedError(BusinessError):

    def __init__(self, message="Acesso não autorizado"):
        super().__init__(message, 401)


class ForbiddenError(BusinessError):

    def __init__(self, message="Acesso proibido"):
        super().__init__(message, 403)