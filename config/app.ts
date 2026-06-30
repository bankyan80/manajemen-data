export const appConfig = {
  name: 'TIMKER BIDIK 360',
  shortName: 'TIMKER',
  description: 'AI-Powered Educational Command Center',
  domain: 'https://timker-bidik.online',

  api: {
    prefix: '/api/v2',
    version: '2.0',
  },

  cache: {
    ttl: 60_000,
    dashboardTtl: 30_000,
  },

  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },

  map: {
    center: [-7.0, 108.5] as [number, number],
    zoom: 12,
    defaultStyle: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  },

  colors: {
    primary: '#2563EB',
    secondary: '#4F46E5',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    purple: '#8B5CF6',
  },
}
