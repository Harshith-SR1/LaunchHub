const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

export async function apiFetch(path: string, init?: RequestInit) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('launchhub_token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((init?.headers as Record<string, string>) || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || 'Request failed');
  }

  return res.json();
}

// -------------------------------------------------------------
// MODULE API MODULES
// -------------------------------------------------------------

export const authApi = {
  register: (body: any) => 
    apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => 
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => 
    apiFetch('/auth/me'),
  updateProfile: (body: any) => 
    apiFetch('/auth/me', { method: 'PATCH', body: JSON.stringify(body) }),
};

export const marketplaceApi = {
  // Domains
  getDomains: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/marketplace/domains${qs}`);
  },
  createDomain: (body: any) => 
    apiFetch('/marketplace/domains', { method: 'POST', body: JSON.stringify(body) }),

  // Websites
  getWebsites: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/marketplace/websites${qs}`);
  },
  createWebsite: (body: any) => 
    apiFetch('/marketplace/websites', { method: 'POST', body: JSON.stringify(body) }),

  // Apps
  getApps: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/marketplace/apps${qs}`);
  },
  createApp: (body: any) => 
    apiFetch('/marketplace/apps', { method: 'POST', body: JSON.stringify(body) }),

  // AI Assets
  getAIAssets: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/marketplace/ai${qs}`);
  },
  createAIAsset: (body: any) => 
    apiFetch('/marketplace/ai', { method: 'POST', body: JSON.stringify(body) }),
};

export const talentApi = {
  getTalent: (role?: string) => {
    const qs = role ? `?role=${encodeURIComponent(role)}` : '';
    return apiFetch(`/talent${qs}`);
  },
  registerTalent: (body: any) => 
    apiFetch('/talent', { method: 'POST', body: JSON.stringify(body) }),
  hireTalent: (userId: string, body: any) => 
    apiFetch(`/talent/${userId}/hire`, { method: 'POST', body: JSON.stringify(body) }),
};

export const startupsApi = {
  getStartups: (stage?: string) => {
    const qs = stage ? `?stage=${encodeURIComponent(stage)}` : '';
    return apiFetch(`/startups${qs}`);
  },
  createStartup: (body: any) => 
    apiFetch('/startups', { method: 'POST', body: JSON.stringify(body) }),
  interact: (id: string, action: string) => 
    apiFetch(`/startups/${id}/interact?action=${action}`, { method: 'POST' }),
  apply: (id: string, body: any) => 
    apiFetch(`/startups/${id}/apply`, { method: 'POST', body: JSON.stringify(body) }),
  getCofounders: () => 
    apiFetch('/cofounder'),
  registerCofounder: (body: any) => 
    apiFetch('/cofounder', { method: 'POST', body: JSON.stringify(body) }),
};

export const investorsApi = {
  getInvestors: () => 
    apiFetch('/investors'),
  registerInvestor: (body: any) => 
    apiFetch('/investors', { method: 'POST', body: JSON.stringify(body) }),
  expressInterest: (body: any) => 
    apiFetch('/investors/interest', { method: 'POST', body: JSON.stringify(body) }),
};

export const messagingApi = {
  getConversations: () => 
    apiFetch('/messages/conversations'),
  getMessages: (convId: string) => 
    apiFetch(`/messages/conversations/${convId}/messages`),
  sendMessage: (body: any) => 
    apiFetch('/messages', { method: 'POST', body: JSON.stringify(body) }),
};

export const verificationApi = {
  getStatus: () => 
    apiFetch('/verification/status'),
  submitVerification: (body: any) => 
    apiFetch('/verification/submit', { method: 'POST', body: JSON.stringify(body) }),
  adminReview: (userId: string, body: any) => 
    apiFetch(`/verification/admin/review/${userId}`, { method: 'POST', body: JSON.stringify(body) }),
};

export const aiApi = {
  searchNavigator: (query: string) => 
    apiFetch('/navigator/search', { method: 'POST', body: JSON.stringify({ query }) }),
  generateBlueprint: (idea: string) => 
    apiFetch('/blueprint/generate', { method: 'POST', body: JSON.stringify({ idea }) }),
};

export const workspacesApi = {
  listWorkspaces: () => 
    apiFetch('/workspaces'),
  getWorkspace: (id: string) => 
    apiFetch(`/workspaces/${id}`),
  createWorkspace: (body: any) => 
    apiFetch('/workspaces', { method: 'POST', body: JSON.stringify(body) }),
  addTask: (id: string, body: any) => 
    apiFetch(`/workspaces/${id}/tasks`, { method: 'POST', body: JSON.stringify(body) }),
  updateTask: (id: string, taskId: string, body: any) => 
    apiFetch(`/workspaces/${id}/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  addComment: (id: string, body: any) => 
    apiFetch(`/workspaces/${id}/comments`, { method: 'POST', body: JSON.stringify(body) }),
  addDocument: (id: string, body: any) => 
    apiFetch(`/workspaces/${id}/documents`, { method: 'POST', body: JSON.stringify(body) }),
  addAiAsset: (id: string, body: any) => 
    apiFetch(`/workspaces/${id}/ai-assets`, { method: 'POST', body: JSON.stringify(body) }),
};

export const auth = authApi;
export const marketplace = marketplaceApi;
export const notifications = {
  list: () => Promise.resolve([]),
  markRead: (id: string) => Promise.resolve({}),
  markAllRead: () => Promise.resolve({}),
};
