



import logging
import json
import sys
import os
from datetime import datetime
from functools import wraps
from pathlib import Path
from typing import Dict, Any, Optional

class StructuredLogger:


    def __init__(self, name: str = "flask-api"):
        self.name = name
        self.logger = self._setup_logger()

    def _setup_logger(self) -> logging.Logger:

        logger = logging.getLogger(self.name)
        logger.setLevel(getattr(logging, os.getenv('LOG_LEVEL', 'INFO')))


        logger.handlers.clear()


        log_dir = Path(__file__).parent.parent / "logs"
        log_dir.mkdir(exist_ok=True)


        class JSONFormatter(logging.Formatter):
            def format(self, record):
                log_entry = {
                    'timestamp': datetime.utcnow().isoformat(),
                    'level': record.levelname,
                    'logger': record.name,
                    'message': record.getMessage(),
                    'service': 'plataforma-curriculos-ia',
                    'version': '2.0.0'
                }


                if hasattr(record, 'user_id'):
                    log_entry['user_id'] = record.user_id
                if hasattr(record, 'request_id'):
                    log_entry['request_id'] = record.request_id
                if hasattr(record, 'ip'):
                    log_entry['ip'] = record.ip
                if hasattr(record, 'duration'):
                    log_entry['duration'] = record.duration
                if hasattr(record, 'extra'):
                    log_entry.update(record.extra)


                if record.exc_info:
                    log_entry['stack_trace'] = self.formatException(record.exc_info)

                return json.dumps(log_entry)


        error_handler = logging.FileHandler(log_dir / "error.log")
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(JSONFormatter())
        logger.addHandler(error_handler)


        file_handler = logging.FileHandler(log_dir / "combined.log")
        file_handler.setFormatter(JSONFormatter())
        logger.addHandler(file_handler)


        if os.getenv('FLASK_ENV') != 'production':
            console_handler = logging.StreamHandler(sys.stdout)
            console_formatter = logging.Formatter(
                '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
            )
            console_handler.setFormatter(console_formatter)
            logger.addHandler(console_handler)

        return logger

    def _log(self, level: str, message: str, **kwargs):

        extra = {}

        for key in list(kwargs.keys()):
            if key in ['user_id', 'request_id', 'ip', 'duration']:
                setattr(self.logger, key, kwargs[key])
                del kwargs[key]
            else:
                extra[key] = kwargs[key]
                del kwargs[key]

        if extra:
            kwargs['extra'] = {'extra': extra}

        getattr(self.logger, level)(message, **kwargs)

    def debug(self, message: str, **kwargs):
        self._log('debug', message, **kwargs)

    def info(self, message: str, **kwargs):
        self._log('info', message, **kwargs)

    def warning(self, message: str, **kwargs):
        self._log('warning', message, **kwargs)

    def error(self, message: str, **kwargs):
        self._log('error', message, **kwargs)

    def critical(self, message: str, **kwargs):
        self._log('critical', message, **kwargs)


    def auth(self, action: str, user_id: Optional[str] = None, **kwargs):

        self.info('Auth Event', 
                 event_type='auth',
                 action=action,
                 user_id=user_id,
                 **kwargs)

    def ia_processing(self, action: str, curriculum_text_length: int = 0, 
                      requirements_count: int = 0, **kwargs):

        self.info('IA Processing',
                 event_type='ia',
                 action=action,
                 curriculum_text_length=curriculum_text_length,
                 requirements_count=requirements_count,
                 **kwargs)

    def api_request(self, method: str, endpoint: str, status_code: int = None,
                    duration: float = None, **kwargs):

        self.info('API Request',
                 event_type='api',
                 method=method,
                 endpoint=endpoint,
                 status_code=status_code,
                 duration=f"{duration}ms" if duration else None,
                 **kwargs)

    def security(self, event: str, severity: str = 'medium', **kwargs):

        level = 'warning' if severity == 'low' else 'error' if severity == 'high' else 'warning'
        self._log(level, 'Security Event',
                 event_type='security',
                 security_event=event,
                 severity=severity,
                 **kwargs)

    def performance(self, operation: str, duration: float, **kwargs):

        self.info('Performance',
                 event_type='performance',
                 operation=operation,
                 duration=f"{duration}ms",
                 **kwargs)



logger = StructuredLogger()


def log_performance(operation_name: str = None):

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            import time
            start_time = time.time()

            try:
                result = func(*args, **kwargs)
                duration = (time.time() - start_time) * 1000

                name = operation_name or f"{func.__module__}.{func.__name__}"
                logger.performance(name, duration)

                return result
            except Exception as e:
                duration = (time.time() - start_time) * 1000
                name = operation_name or f"{func.__module__}.{func.__name__}"
                logger.performance(name, duration, error=str(e))
                raise

        return wrapper
    return decorator


def api_request(method, endpoint, status_code, **details):

    log_level = 'error' if status_code >= 400 else 'info'

    getattr(logger, log_level)(
        'API Request',
        {
            'event': 'api_request',
            'method': method,
            'endpoint': endpoint,
            'status_code': status_code,
            **details
        }
    )