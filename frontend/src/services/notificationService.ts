import * as signalR from '@microsoft/signalr';
import { authService } from './authService';
import api from './api';  // <-- IMPORTANTE: agregar este import

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'request_new' | 'request_approved' | 'request_rejected' | 'low_stock' | 'calibration_due' | 'experiment_status' | 'test' | string;
  timestamp: string;
  read: boolean;
  data?: any;
}

class NotificationService {
  private connection: signalR.HubConnection | null = null;
  private listeners: ((notification: Notification) => void)[] = [];
  private notifications: Notification[] = [];
  private isConnected = false;

  constructor() {
    this.loadNotifications();
  }

  private loadNotifications() {
    const saved = localStorage.getItem('notifications');
    if (saved) {
      this.notifications = JSON.parse(saved);
    }
  }

  private saveNotifications() {
    localStorage.setItem('notifications', JSON.stringify(this.notifications));
  }

  private updateListeners() {
    // Notificar a todos los listeners que hubo un cambio
    // (útil cuando se cargan notificaciones de la BD)
  }

  // ===== EL NUEVO MÉTODO VA AQUÍ =====
  async loadUnreadNotifications() {
    try {
      const response = await api.get('/notifications/unread');
      const unread = response.data;

      if (unread && unread.length > 0) {
        console.log('📥 Cargando notificaciones no leídas:', unread.length);

        // Filtrar para no duplicar
        const existingIds = new Set(this.notifications.map(n => n.id));
        const newNotifications = unread.filter((n: any) => !existingIds.has(n.id));

        this.notifications = [...newNotifications, ...this.notifications];
        this.saveNotifications();
        this.updateListeners();
      }
    } catch (error) {
      console.error('Error loading unread notifications:', error);
    }
  }
  // ====================================

  async startConnection() {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    const user = authService.getCurrentUser();
    if (!user) return;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5000/hubs/notifications', {
        withCredentials: true
      })
      .withAutomaticReconnect()
      .build();

    this.connection.on('ReceiveNotification', (notification: Notification) => {
      console.log('🔔 NOTIFICACIÓN RECIBIDA:', notification);
      this.notifications.unshift(notification);
      this.saveNotifications();
      this.listeners.forEach(listener => listener(notification));
      this.showBrowserNotification(notification);
    });

    this.connection.on('NotificationRead', (notificationId: string) => {
      const notif = this.notifications.find(n => n.id === notificationId);
      if (notif) {
        notif.read = true;
        this.saveNotifications();
      }
    });

    try {
      await this.connection.start();
      this.isConnected = true;
      console.log('✅ SignalR Connected - ID:', this.connection.connectionId);

      (window as any).signalRConnection = this.connection;
      (window as any).notificationService = this;

      // 🔥 CARGAR NOTIFICACIONES NO LEÍDES DESPUÉS DE CONECTAR
      await this.loadUnreadNotifications();

    } catch (err) {
      console.error('❌ SignalR Connection Error:', err);
      this.isConnected = false;
    }
  }

  async stopConnection() {
    if (this.connection) {
      await this.connection.stop();
      this.isConnected = false;
      console.log('SignalR Disconnected');
    }
  }

  subscribe(callback: (notification: Notification) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  getNotifications(): Notification[] {
    return this.notifications;
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  async markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      notification.read = true;
      this.saveNotifications();

      // También marcar como leída en el backend
      try {
        await api.post(`/notifications/mark-read/${notificationId}`);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }

      if (this.isConnected && this.connection) {
        await this.connection.invoke('MarkAsRead', notificationId);
      }
    }
  }

  async markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();

    try {
      await api.post('/notifications/mark-all-read');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }

  clearNotifications() {
    this.notifications = [];
    this.saveNotifications();
  }

  private showBrowserNotification(notification: Notification) {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo192.png',
        tag: notification.id
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }

  async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      return await Notification.requestPermission();
    }
    return Notification.permission;
  }
}

export const notificationService = new NotificationService();
