


from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from flask import Flask, Response
import time
from functools import wraps


http_request_duration = Histogram(
    'flask_http_request_duration_seconds',
    'Duration of HTTP requests in seconds',
    ['method', 'endpoint', 'status_code'],
    buckets=[0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
)

http_request_total = Counter(
    'flask_http_requests_total',
    'Total number of HTTP requests',
    ['method', 'endpoint', 'status_code']
)

ia_processing_duration = Histogram(
    'flask_ia_processing_duration_seconds',
    'Duration of IA processing in seconds',
    ['operation'],
    buckets=[0.5, 1, 2, 5, 10, 20, 30]
)

ia_processing_total = Counter(
    'flask_ia_processing_total',
    'Total number of IA processing operations',
    ['operation', 'status']
)

curriculum_analysis_duration = Histogram(
    'flask_curriculum_analysis_duration_seconds',
    'Duration of curriculum analysis in seconds',
    buckets=[1, 2, 5, 10, 15, 20, 30]
)

skills_extraction_duration = Histogram(
    'flask_skills_extraction_duration_seconds',
    'Duration of skills extraction in seconds',
    buckets=[0.5, 1, 2, 3, 5, 7, 10]
)

text_processing_size = Histogram(
    'flask_text_processing_size_bytes',
    'Size of processed text in bytes',
    buckets=[100, 500, 1000, 5000, 10000, 50000, 100000]
)

def setup_metrics_endpoint(app: Flask):


    @app.route('/metrics')
    def metrics_endpoint():

        return Response(generate_latest(), mimetype=CONTENT_TYPE_LATEST)

def track_request_metrics(f):

    @wraps(f)
    def request_metrics_wrapper(*args, **kwargs):
        from flask import request, g

        start_time = time.time()

        try:
            response = f(*args, **kwargs)
            status_code = getattr(response, 'status_code', 200)


            duration = time.time() - start_time
            endpoint = request.endpoint or request.path

            http_request_duration.labels(
                method=request.method,
                endpoint=endpoint,
                status_code=str(status_code)
            ).observe(duration)

            http_request_total.labels(
                method=request.method,
                endpoint=endpoint,
                status_code=str(status_code)
            ).inc()

            return response

        except Exception as e:
            duration = time.time() - start_time
            endpoint = request.endpoint or request.path

            http_request_duration.labels(
                method=request.method,
                endpoint=endpoint,
                status_code='500'
            ).observe(duration)

            http_request_total.labels(
                method=request.method,
                endpoint=endpoint,
                status_code='500'
            ).inc()

            raise

    return request_metrics_wrapper

def track_ia_metrics(operation: str):

    def decorator(f):
        @wraps(f)
        def ia_metrics_wrapper(*args, **kwargs):
            start_time = time.time()

            try:
                result = f(*args, **kwargs)


                duration = time.time() - start_time
                ia_processing_duration.labels(operation=operation).observe(duration)
                ia_processing_total.labels(operation=operation, status='success').inc()

                return result

            except Exception as e:
                duration = time.time() - start_time
                ia_processing_duration.labels(operation=operation).observe(duration)
                ia_processing_total.labels(operation=operation, status='error').inc()

                raise

        return ia_metrics_wrapper
    return decorator

def track_text_size(text_data: str):

    size_bytes = len(text_data.encode('utf-8'))
    text_processing_size.observe(size_bytes)

def track_curriculum_analysis():

    def decorator(f):
        @wraps(f)
        def curriculum_analysis_wrapper(*args, **kwargs):
            start_time = time.time()

            try:
                result = f(*args, **kwargs)


                duration = time.time() - start_time
                curriculum_analysis_duration.observe(duration)

                return result

            except Exception as e:
                duration = time.time() - start_time
                curriculum_analysis_duration.observe(duration)

                raise

        return curriculum_analysis_wrapper
    return decorator

def track_skills_extraction():

    def decorator(f):
        @wraps(f)
        def skills_extraction_wrapper(*args, **kwargs):
            start_time = time.time()

            try:
                result = f(*args, **kwargs)


                duration = time.time() - start_time
                skills_extraction_duration.observe(duration)

                return result

            except Exception as e:
                duration = time.time() - start_time
                skills_extraction_duration.observe(duration)

                raise

        return skills_extraction_wrapper
    return decorator