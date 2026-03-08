import { supabase } from '../lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const getAuthHeaders = async (contentType = true) => {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {};
  if (contentType) headers['Content-Type'] = 'application/json';
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
};

export interface EmailTemplate {
  id: string | number;
  subject: string;
  body: string;
  purpose?: string | null;
  created_at?: string;
}

export interface EmailPurpose {
  id: string;
  purpose: string;
  template_id: string | null;
}

export interface EmailLog {
  id: number;
  booking_id: number;
  shift_id: number;
  event_id: number;
  recipient_email: string;
  email_purpose: string;
  status: string;
  template_id: number;
  error_message: string;
  created_at: string;
}

export const emailService = {
  async getLogs() {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/admin/email-logs`, { headers });
    if (!response.ok) throw new Error('Failed to fetch logs');
    return await response.json() as EmailLog[];
  },

  async getTemplates() {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/admin/email-templates`, { headers });
    if (!response.ok) throw new Error('Failed to fetch templates');
    return await response.json() as EmailTemplate[];
  },

  async createTemplate(template: Pick<EmailTemplate, 'subject' | 'body'>) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/admin/email-templates`, {
      method: 'POST',
      headers,
      body: JSON.stringify(template)
    });
    if (!response.ok) throw new Error('Failed to create template');
    return await response.json() as EmailTemplate;
  },

  async updateTemplate(id: string | number, template: Partial<Pick<EmailTemplate, 'subject' | 'body'>>) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/admin/email-templates/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(template)
    });
    if (!response.ok) throw new Error('Failed to update template');
    return await response.json() as EmailTemplate;
  },

  async deleteTemplate(id: string | number) {
    const headers = await getAuthHeaders(false);
    const response = await fetch(`${API_BASE_URL}/api/admin/email-templates/${id}`, {
      method: 'DELETE',
      headers
    });
    if (!response.ok) throw new Error('Failed to delete template');
  },

  async getPurposes() {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/admin/email-purposes`, { headers });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch email purposes');
    }
    return await response.json() as EmailPurpose[];
  },

  async updatePurpose(purposeId: string, templateId: string | number | null) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/admin/email-purposes`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ purpose: purposeId, templateId })
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update email purpose');
    }
    return await response.json();
  },

  async assignTemplateToPurpose(purposeId: string, templateId: string | number | null) {
    return emailService.updatePurpose(purposeId, templateId);
  }
};
