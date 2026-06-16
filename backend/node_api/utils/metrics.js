


import client from 'prom-client';


const register = new client.Registry();


client.collectDefaultMetrics({ register });


const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeConnections = new client.Gauge({
  name: 'websocket_connections_active',
  help: 'Number of active WebSocket connections'
});

const databaseConnections = new client.Gauge({
  name: 'database_connections_active',
  help: 'Number of active database connections'
});

const iaProcessingDuration = new client.Histogram({
  name: 'ia_processing_duration_seconds',
  help: 'Duration of IA processing in seconds',
  labelNames: ['operation'],
  buckets: [0.5, 1, 2, 5, 10, 20, 30]
});

const iaProcessingTotal = new client.Counter({
  name: 'ia_processing_total',
  help: 'Total number of IA processing operations',
  labelNames: ['operation', 'status']
});

const curriculumUploads = new client.Counter({
  name: 'curriculum_uploads_total',
  help: 'Total number of curriculum uploads',
  labelNames: ['status', 'file_type']
});

const userRegistrations = new client.Counter({
  name: 'user_registrations_total',
  help: 'Total number of user registrations',
  labelNames: ['user_type']
});

const authenticationAttempts = new client.Counter({
  name: 'authentication_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['status', 'method']
});


register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(activeConnections);
register.registerMetric(databaseConnections);
register.registerMetric(iaProcessingDuration);
register.registerMetric(iaProcessingTotal);
register.registerMetric(curriculumUploads);
register.registerMetric(userRegistrations);
register.registerMetric(authenticationAttempts);


const metricsMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;

    httpRequestDuration
      .labels(req.method, route, res.statusCode.toString())
      .observe(duration);

    httpRequestTotal
      .labels(req.method, route, res.statusCode.toString())
      .inc();
  });

  next();
};


const metrics = {
  httpRequestDuration,
  httpRequestTotal,
  activeConnections,
  databaseConnections,
  iaProcessingDuration,
  iaProcessingTotal,
  curriculumUploads,
  userRegistrations,
  authenticationAttempts
};

export { register, metrics, metricsMiddleware };