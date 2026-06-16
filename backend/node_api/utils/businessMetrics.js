




import { register, Counter, Histogram, Gauge } from 'prom-client';
import logger from './logger.js';


const businessMetrics = {

  usersTotal: new Counter({
    name: 'business_users_total',
    help: 'Total number of registered users',
    labelNames: ['user_type', 'registration_period']
  }),

  usersActive: new Gauge({
    name: 'business_users_active',
    help: 'Number of active users',
    labelNames: ['user_type', 'time_period']
  }),

  userRegistrations: new Counter({
    name: 'business_user_registrations_total',
    help: 'Total user registrations',
    labelNames: ['user_type', 'source']
  }),


  vagasTotal: new Counter({
    name: 'business_vagas_total',
    help: 'Total number of job postings',
    labelNames: ['status', 'sector', 'contract_type']
  }),

  vagasActive: new Gauge({
    name: 'business_vagas_active',
    help: 'Number of active job postings',
    labelNames: ['sector', 'contract_type']
  }),

  vagasViews: new Counter({
    name: 'business_vagas_views_total',
    help: 'Total number of job posting views',
    labelNames: ['vaga_id', 'sector']
  }),


  curriculosTotal: new Counter({
    name: 'business_curriculos_total',
    help: 'Total number of resumes uploaded',
    labelNames: ['file_type', 'upload_period']
  }),

  curriculosProcessed: new Counter({
    name: 'business_curriculos_processed_total',
    help: 'Total number of resumes processed by IA',
    labelNames: ['processing_type', 'status']
  }),

  curriculosAnalyzed: new Counter({
    name: 'business_curriculos_analyzed_total',
    help: 'Total number of resumes analyzed',
    labelNames: ['analysis_type', 'result']
  }),


  candidaturasTotal: new Counter({
    name: 'business_candidaturas_total',
    help: 'Total number of job applications',
    labelNames: ['status', 'period']
  }),

  candidaturasByVaga: new Counter({
    name: 'business_candidaturas_by_vaga_total',
    help: 'Number of applications per job posting',
    labelNames: ['vaga_id', 'sector']
  }),

  matchScore: new Histogram({
    name: 'business_match_score_histogram',
    help: 'Distribution of match scores between candidates and jobs',
    labelNames: ['vaga_sector', 'experience_level'],
    buckets: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
  }),


  iaProcessingTime: new Histogram({
    name: 'business_ia_processing_duration_seconds',
    help: 'Time spent on IA processing',
    labelNames: ['processing_type', 'complexity'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 20, 30, 60]
  }),

  iaProcessingCost: new Counter({
    name: 'business_ia_processing_cost_total',
    help: 'Total cost of IA processing',
    labelNames: ['processing_type', 'provider']
  }),

  iaAccuracy: new Gauge({
    name: 'business_ia_accuracy_score',
    help: 'IA processing accuracy score',
    labelNames: ['processing_type', 'metric']
  }),


  sessionDuration: new Histogram({
    name: 'business_session_duration_seconds',
    help: 'Duration of user sessions',
    labelNames: ['user_type', 'device'],
    buckets: [30, 60, 120, 300, 600, 1800, 3600]
  }),

  pageViews: new Counter({
    name: 'business_page_views_total',
    help: 'Total page views',
    labelNames: ['page', 'user_type']
  }),

  featureUsage: new Counter({
    name: 'business_feature_usage_total',
    help: 'Usage of platform features',
    labelNames: ['feature', 'user_type', 'action']
  }),


  conversionRate: new Gauge({
    name: 'business_conversion_rate',
    help: 'Conversion rate for different funnels',
    labelNames: ['funnel', 'stage']
  }),

  revenue: new Counter({
    name: 'business_revenue_total',
    help: 'Total revenue',
    labelNames: ['revenue_type', 'period', 'currency']
  }),


  satisfactionScore: new Gauge({
    name: 'business_satisfaction_score',
    help: 'Customer satisfaction score',
    labelNames: ['user_type', 'metric_type']
  }),

  supportTickets: new Counter({
    name: 'business_support_tickets_total',
    help: 'Total support tickets',
    labelNames: ['priority', 'category', 'status']
  })
};


Object.values(businessMetrics).forEach(metric => {
  register.registerMetric(metric);
});


export const trackUserRegistration = (userType, source = 'direct') => {
  const period = getCurrentPeriod();
  businessMetrics.userRegistrations.labels(userType, source).inc();
  businessMetrics.usersTotal.labels(userType, period).inc();

  logger.info('User registration tracked', { userType, source, period });
};

export const trackUserActivity = (userType, timePeriod = 'daily') => {
  businessMetrics.usersActive.labels(userType, timePeriod).inc();

  logger.debug('User activity tracked', { userType, timePeriod });
};

export const trackVagaCreation = (sector, contractType, status = 'active') => {
  businessMetrics.vagasTotal.labels(status, sector, contractType).inc();
  if (status === 'active') {
    businessMetrics.vagasActive.labels(sector, contractType).inc();
  }

  logger.info('Vaga creation tracked', { sector, contractType, status });
};

export const trackVagaView = (vagaId, sector) => {
  businessMetrics.vagasViews.labels(vagaId, sector).inc();

  logger.debug('Vaga view tracked', { vagaId, sector });
};

export const trackCurriculoUpload = (fileType, uploadPeriod = 'current') => {
  businessMetrics.curriculosTotal.labels(fileType, uploadPeriod).inc();

  logger.info('Curriculo upload tracked', { fileType, uploadPeriod });
};

export const trackCurriculoProcessing = (processingType, status, duration) => {
  businessMetrics.curriculosProcessed.labels(processingType, status).inc();
  businessMetrics.iaProcessingTime.labels(processingType, 'standard').observe(duration);

  logger.info('Curriculo processing tracked', { processingType, status, duration });
};

export const trackCurriculoAnalysis = (analysisType, result, matchScore) => {
  businessMetrics.curriculosAnalyzed.labels(analysisType, result).inc();
  if (matchScore !== undefined) {
    businessMetrics.matchScore.labels('general', 'all').observe(matchScore);
  }

  logger.info('Curriculo analysis tracked', { analysisType, result, matchScore });
};

export const trackCandidatura = (status, vagaId, sector, period = 'current') => {
  businessMetrics.candidaturasTotal.labels(status, period).inc();
  businessMetrics.candidaturasByVaga.labels(vagaId, sector).inc();

  logger.info('Candidatura tracked', { status, vagaId, sector, period });
};

export const trackSessionDuration = (userType, device, duration) => {
  businessMetrics.sessionDuration.labels(userType, device).observe(duration);

  logger.debug('Session duration tracked', { userType, device, duration });
};

export const trackPageView = (page, userType) => {
  businessMetrics.pageViews.labels(page, userType).inc();

  logger.debug('Page view tracked', { page, userType });
};

export const trackFeatureUsage = (feature, userType, action) => {
  businessMetrics.featureUsage.labels(feature, userType, action).inc();

  logger.debug('Feature usage tracked', { feature, userType, action });
};

export const updateConversionRate = (funnel, stage, rate) => {
  businessMetrics.conversionRate.labels(funnel, stage).set(rate);

  logger.info('Conversion rate updated', { funnel, stage, rate });
};

export const trackRevenue = (revenueType, period, amount, currency = 'BRL') => {
  businessMetrics.revenue.labels(revenueType, period, currency).inc(amount);

  logger.info('Revenue tracked', { revenueType, period, amount, currency });
};

export const updateSatisfactionScore = (userType, metricType, score) => {
  businessMetrics.satisfactionScore.labels(userType, metricType).set(score);

  logger.info('Satisfaction score updated', { userType, metricType, score });
};

export const trackSupportTicket = (priority, category, status) => {
  businessMetrics.supportTickets.labels(priority, category, status).inc();

  logger.info('Support ticket tracked', { priority, category, status });
};


function getCurrentPeriod() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function getExperienceLevel(experienceYears) {
  if (experienceYears < 1) return 'junior';
  if (experienceYears < 3) return 'mid';
  if (experienceYears < 5) return 'senior';
  return 'expert';
}


export const getBusinessOverview = async () => {
  try {



    const overview = {
      users: {
        total: await getUsersTotal(),
        active: await getUsersActive(),
        new_this_month: await getNewUsersThisMonth()
      },
      vagas: {
        total: await getVagasTotal(),
        active: await getVagasActive(),
        new_this_month: await getNewVagasThisMonth()
      },
      curriculos: {
        total: await getCurriculosTotal(),
        processed_today: await getCurriculosProcessedToday(),
        success_rate: await getProcessingSuccessRate()
      },
      candidaturas: {
        total: await getCandidaturasTotal(),
        this_month: await getCandidaturasThisMonth(),
        average_match: await getAverageMatchScore()
      },
      revenue: {
        total: await getTotalRevenue(),
        this_month: await getMonthlyRevenue(),
        mrr: await getMRR()
      }
    };

    return overview;
  } catch (error) {
    logger.error('Failed to get business overview', { error: error.message });
    throw error;
  }
};


async function getUsersTotal() {

  return 1250;
}

async function getUsersActive() {

  return 850;
}

async function getNewUsersThisMonth() {

  return 75;
}

async function getVagasTotal() {

  return 320;
}

async function getVagasActive() {

  return 180;
}

async function getNewVagasThisMonth() {

  return 45;
}

async function getCurriculosTotal() {

  return 2100;
}

async function getCurriculosProcessedToday() {

  return 85;
}

async function getProcessingSuccessRate() {

  return 0.92;
}

async function getCandidaturasTotal() {

  return 5400;
}

async function getCandidaturasThisMonth() {

  return 320;
}

async function getAverageMatchScore() {

  return 73.5;
}

async function getTotalRevenue() {

  return 125000;
}

async function getMonthlyRevenue() {

  return 15000;
}

async function getMRR() {

  return 12000;
}


export { businessMetrics };


export const resetBusinessMetrics = () => {
  Object.values(businessMetrics).forEach(metric => {
    if (metric.reset) metric.reset();
  });

  logger.info('Business metrics reset');
};