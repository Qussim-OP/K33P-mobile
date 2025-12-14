// utils/notification-api.ts
import { useAuthStore } from '@/store/useAuthMethod';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://k33p-backend-i9kj.onrender.com/api';

// Types
export enum NotificationType {
  SYSTEM = 'system',
  TRANSACTION = 'transaction',
  SECURITY = 'security',
  WALLET = 'wallet',
  PROMOTION = 'promotion'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  notification_type: NotificationType;
  priority: NotificationPriority;
  is_read: boolean;
  is_seen: boolean;
  action_url?: string;
  action_label?: string;
  metadata?: Record<string, any>;
  created_at: string;
  read_at?: string;
  seen_at?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  unseen: number;
  urgent_unread: number;
  by_type: Record<NotificationType, number>;
}

export interface NotificationPreference {
  notification_type: NotificationType;
  enabled: boolean;
  push_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}

export interface CreateNotificationRequest {
  title: string;
  message: string;
  notification_type: NotificationType;
  priority?: NotificationPriority;
  action_url?: string;
  action_label?: string;
  metadata?: Record<string, any>;
}

export interface UpdateNotificationPreferenceRequest {
  enabled?: boolean;
  push_enabled?: boolean;
  email_enabled?: boolean;
  sms_enabled?: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}

export interface NotificationsResponse {
  success: boolean;
  data?: {
    notifications: Notification[];
    stats: NotificationStats;
  };
  message?: string;
  error?: string;
}

export interface NotificationResponse {
  success: boolean;
  data?: Notification;
  message?: string;
  error?: string;
}

export interface NotificationStatsResponse {
  success: boolean;
  data?: NotificationStats;
  message?: string;
  error?: string;
}

export interface NotificationPreferencesResponse {
  success: boolean;
  data?: NotificationPreference[];
  message?: string;
  error?: string;
}

export interface NotificationPreferenceResponse {
  success: boolean;
  data?: NotificationPreference;
  message?: string;
  error?: string;
}

export interface QuietHoursResponse {
  success: boolean;
  data?: {
    start: string;
    end: string;
    enabled: boolean;
  };
  message?: string;
  error?: string;
}

export interface DeleteMultipleResponse {
  success: boolean;
  data?: {
    deleted_count: number;
    total_count: number;
    errors: any[];
  };
  message?: string;
  error?: string;
}

// Generic request function
async function makeRequest(method: string, endpoint: string, data?: any, requiresAuth: boolean = true) {
  const url = `${BASE_URL}${endpoint}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add auth token if required
  if (requiresAuth) {
    const { token } = useAuthStore.getState();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else {
      throw new Error('Authentication required');
    }
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, config);
    const responseData = await response.json();
    
    return {
      status: response.status,
      body: responseData,
    };
  } catch (error: any) {
    throw new Error(`API request failed: ${error.message}`);
  }
}

/**
 * Get notifications with optional filters
 */
export async function getNotifications(filters?: {
  limit?: number;
  offset?: number;
  notification_type?: NotificationType;
  priority?: NotificationPriority;
  is_read?: boolean;
  start_date?: string;
  end_date?: string;
  order_by?: 'created_at' | 'priority';
  order_direction?: 'asc' | 'desc';
}): Promise<NotificationsResponse> {
  try {
    // Build query string from filters
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await makeRequest('GET', `/notifications${queryString}`);
    
    if (response.body.success) {
      console.log('Notifications retrieved successfully:', {
        count: response.body.data?.notifications?.length || 0,
        unread: response.body.data?.stats?.unread || 0,
        unseen: response.body.data?.stats?.unseen || 0
      });
      return response.body;
    } else {
      console.log('Get notifications failed:', response.body.message);
      return {
        success: false,
        message: response.body.message || 'Failed to fetch notifications'
      };
    }
  } catch (error: any) {
    console.log('Get notifications request failed:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to fetch notifications'
    };
  }
}

/**
 * Get specific notification by ID
 */
export async function getNotification(notificationId: string): Promise<NotificationResponse> {
  try {
    const response = await makeRequest('GET', `/notifications/${notificationId}`);
    
    if (response.body.success) {
      console.log('Notification retrieved successfully:', response.body.data?.title);
      return response.body;
    } else {
      console.log('Get notification failed:', response.body.message);
      return {
        success: false,
        message: response.body.message || 'Failed to fetch notification'
      };
    }
  } catch (error: any) {
    console.log('Get notification request failed:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to fetch notification'
    };
  }
}

/**
 * Create a new notification
 */
export async function createNotification(notificationData: CreateNotificationRequest): Promise<NotificationResponse> {
  try {
    // Validate required fields
    if (!notificationData.title || notificationData.title.trim().length === 0) {
      return {
        success: false,
        message: 'Notification title is required'
      };
    }

    if (notificationData.title.length > 255) {
      return {
        success: false,
        message: 'Notification title must be less than 255 characters'
      };
    }

    if (!notificationData.message || notificationData.message.trim().length === 0) {
      return {
        success: false,
        message: 'Notification message is required'
      };
    }

    if (notificationData.message.length > 1000) {
      return {
        success: false,
        message: 'Notification message must be less than 1000 characters'
      };
    }

    if (!notificationData.notification_type) {
      return {
        success: false,
        message: 'Notification type is required'
      };
    }

    const response = await makeRequest('POST', '/notifications', notificationData);
    
    if (response.body.success) {
      console.log('Notification created successfully:', response.body.data?.title);
      return response.body;
    } else {
      console.log('Create notification failed:', response.body.message);
      return {
        success: false,
        message: response.body.message || 'Failed to create notification'
      };
    }
  } catch (error: any) {
    console.log('Create notification request failed:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to create notification'
    };
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<NotificationResponse> {
  try {
    const response = await makeRequest('PUT', `/notifications/${notificationId}/read`);
    
    if (response.body.success) {
      console.log('Notification marked as read:', notificationId);
      return response.body;
    } else {
      console.log('Mark as read failed:', response.body.message);
      return {
        success: false,
        message: response.body.message || 'Failed to mark notification as read'
      };
    }
  } catch (error: any) {
    console.log('Mark as read request failed:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to mark notification as read'
    };
  }
}

/**
 * Mark notification as seen
 */
export async function markNotificationAsSeen(notificationId: string): Promise<NotificationResponse> {
  try {
    const response = await makeRequest('PUT', `/notifications/${notificationId}/seen`);
    
    if (response.body.success) {
      console.log('Notification marked as seen:', notificationId);
      return response.body;
    } else {
      console.log('Mark as seen failed:', response.body.message);
      return {
        success: false,
        message: response.body.message || 'Failed to mark notification as seen'
      };
    }
  } catch (error: any) {
    console.log('Mark as seen request failed:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to mark notification as seen'
    };
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<{ success: boolean; message?: string; data?: { notifications_marked: number } }> {
  try {
    const response = await makeRequest('PUT', '/notifications/read-all');
    
    if (response.body.success) {
      console.log('All notifications marked as read:', response.body.data?.notifications_marked);
      return {
        success: true,
        message: response.body.message,
        data: response.body.data
      };
    } else {
      console.log('Mark all as read failed:', response.body.message);
      return {
        success: false,
        message: response.body.message || 'Failed to mark all notifications as read'
      };
    }
  } catch (error: any) {
    console.log('Mark all as read request failed:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to mark all notifications as read'
    };
  }
}

/**
 * Mark all notifications as seen
 */
export async function markAllNotificationsAsSeen(): Promise<{ success: boolean; message?: string; data?: { notifications_marked: number } }> {
  try {
    const response = await makeRequest('PUT', '/notifications/seen-all');
    
    if (response.body.success) {
      console.log('All notifications marked as seen:', response.body.data?.notifications_marked);
      return {
        success: true,
        message: response.body.message,
        data: response.body.data
      };
    } else {
      console.log('Mark all as seen failed:', response.body.message);
      return {
        success: false,
        message: response.body.message || 'Failed to mark all notifications as seen'
      };
    }
  } catch (error: any) {
    console.log('Mark all as seen request failed:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to mark all notifications as seen'
    };
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await makeRequest('DELETE', `/notifications/${notificationId}`);
    
    if (response.body.success) {
      console.log('Notification deleted successfully:', notificationId);
      return { success: true, message: response.body.message };
    } else {
      console.log('Delete notification failed:', response.body.message);
      return {
        success: false,
        message: response.body.message || 'Failed to delete notification'
      };
    }
  } catch (error: any) {
    console.log('Delete notification request failed:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to delete notification'
    };
  }
}

/**
 * Delete multiple notifications
 */
export async function deleteMultipleNotifications(notificationIds: string[]): Promise<DeleteMultipleResponse> {
  try {
    if (!notificationIds || notificationIds.length === 0) {
      return {
        success: false,
        message: 'No notification IDs provided'
      };
    }

    const response = await makeRequest('DELETE', '/notifications', { notification_ids: notificationIds });
    
    if (response.body.success) {
      console.log('Multiple notifications deleted:', response.body.data?.deleted_count);
      return response.body;
    } else {
      console.log('Delete multiple notifications failed:', response.body.message);
      return {
        success: false,
        message: response.body.message || 'Failed to delete notifications'
      };
    }
  } catch (error: any) {
    console.log('Delete multiple notifications request failed:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to delete notifications'
    };
  }
}

/**
 * Get notification statistics
 */
export async function getNotificationStats(): Promise<NotificationStatsResponse> {
  try {
    const response = await makeRequest('GET', '/notifications/stats');
    
    if (response.body.success) {
      console.log('Notification stats retrieved successfully:', {
        total: response.body.data?.total,
        unread: response.body.data?.unread,
        unseen: response.body.data?.unseen
      });
      return response.body;
    } else {
      console.log('Get notification stats failed:', response.body.message);
      return {
        success: false,
        message: response.body.message || 'Failed to fetch notification stats'
      };
    }
  } catch (error: any) {
    console.log('Get notification stats request failed:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to fetch notification stats'
    };
  }
}

/**
 * Get notification preferences
 */
export async function getNotificationPreferences(): Promise<NotificationPreferencesResponse> {
  try {
    const response = await makeRequest('GET', '/notifications/preferences');
    
    if (response.body.success) {
      console.log('Notification preferences retrieved successfully:', {
        count: response.body.data?.length || 0
      });
      return response.body;
    } else {
      console.log('Get notification preferences failed:', response.body.message);
      return {
        success: false,
        message: response.body.message || 'Failed to fetch notification preferences'
      };
    }
  } catch (error: any) {
    console.log('Get notification preferences request failed:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to fetch notification preferences'
    };
  }
}

/**
 * Update notification preference
 */
export async function updateNotificationPreference(
  notificationType: NotificationType,
  updates: UpdateNotificationPreferenceRequest
): Promise<NotificationPreferenceResponse> {
  try {
    const response = await makeRequest('PUT', `/notifications/preferences/${notificationType}`, updates);
    
    if (response.body.success) {
      console.log('Notification preference updated successfully:', notificationType);
      return response.body;
    } else {
      console.log('Update notification preference failed:', response.body.message);
      return {
        success: false,
        message: response.body.message || 'Failed to update notification preference'
      };
    }
  } catch (error: any) {
    console.log('Update notification preference request failed:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to update notification preference'
    };
  }
}

/**
 * Get quiet hours settings
 */
export async function getQuietHours(): Promise<QuietHoursResponse> {
  try {
    const response = await makeRequest('GET', '/notifications/preferences/quiet-hours');
    
    if (response.body.success) {
      console.log('Quiet hours retrieved successfully:', {
        start: response.body.data?.start,
        end: response.body.data?.end
      });
      return response.body;
    } else {
      console.log('Get quiet hours failed:', response.body.message);
      return {
        success: false,
        message: response.body.message || 'Failed to fetch quiet hours'
      };
    }
  } catch (error: any) {
    console.log('Get quiet hours request failed:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to fetch quiet hours'
    };
  }
}

// Helper Functions

/**
 * Helper function to check if notification is unread
 */
export function isNotificationUnread(notification: Notification): boolean {
  return !notification.is_read;
}

/**
 * Helper function to check if notification is unseen
 */
export function isNotificationUnseen(notification: Notification): boolean {
  return !notification.is_seen;
}

/**
 * Helper function to get notification priority color
 */
export function getPriorityColor(priority: NotificationPriority): string {
  const colors: Record<NotificationPriority, string> = {
    [NotificationPriority.LOW]: '#6c757d',
    [NotificationPriority.NORMAL]: '#007bff',
    [NotificationPriority.HIGH]: '#ffc107',
    [NotificationPriority.URGENT]: '#dc3545'
  };
  return colors[priority] || '#6c757d';
}

/**
 * Helper function to get notification type icon
 */
export function getNotificationTypeIcon(type: NotificationType): string {
  const icons: Record<NotificationType, string> = {
    [NotificationType.SYSTEM]: 'system',
    [NotificationType.TRANSACTION]: 'transaction',
    [NotificationType.SECURITY]: 'security',
    [NotificationType.WALLET]: 'wallet',
    [NotificationType.PROMOTION]: 'promotion'
  };
  return icons[type] || 'notification';
}

/**
 * Helper function to format notification time
 */
export function formatNotificationTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

/**
 * Helper function to filter notifications by type
 */
export function filterNotificationsByType(
  notifications: Notification[],
  type: NotificationType
): Notification[] {
  return notifications.filter(notification => notification.notification_type === type);
}

/**
 * Helper function to filter unread notifications
 */
export function filterUnreadNotifications(notifications: Notification[]): Notification[] {
  return notifications.filter(notification => isNotificationUnread(notification));
}

/**
 * Helper function to filter unseen notifications
 */
export function filterUnseenNotifications(notifications: Notification[]): Notification[] {
  return notifications.filter(notification => isNotificationUnseen(notification));
}

/**
 * Helper function to sort notifications by date (newest first)
 */
export function sortNotificationsByDate(notifications: Notification[], ascending: boolean = false): Notification[] {
  return [...notifications].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
}

/**
 * Helper function to get notification count by type
 */
export function getNotificationCountByType(notifications: Notification[]): Record<NotificationType, number> {
  const counts: Record<NotificationType, number> = {
    [NotificationType.SYSTEM]: 0,
    [NotificationType.TRANSACTION]: 0,
    [NotificationType.SECURITY]: 0,
    [NotificationType.WALLET]: 0,
    [NotificationType.PROMOTION]: 0
  };

  notifications.forEach(notification => {
    counts[notification.notification_type]++;
  });

  return counts;
}

/**
 * Helper function to create notification data
 */
export function createNotificationData(
  title: string,
  message: string,
  type: NotificationType,
  priority: NotificationPriority = NotificationPriority.NORMAL
): CreateNotificationRequest {
  return {
    title: title.trim(),
    message: message.trim(),
    notification_type: type,
    priority
  };
}

/**
 * Helper function to validate quiet hours format
 */
export function validateQuietHours(start: string, end: string): { valid: boolean; message?: string } {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
  
  if (!timeRegex.test(start)) {
    return { valid: false, message: 'Invalid start time format (HH:MM:SS)' };
  }
  
  if (!timeRegex.test(end)) {
    return { valid: false, message: 'Invalid end time format (HH:MM:SS)' };
  }
  
  const [startHour] = start.split(':').map(Number);
  const [endHour] = end.split(':').map(Number);
  
  if (startHour >= endHour) {
    return { valid: false, message: 'Start time must be before end time' };
  }
  
  return { valid: true };
}