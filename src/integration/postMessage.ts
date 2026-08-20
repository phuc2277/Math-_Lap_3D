import { INTEGRATION_CONFIG } from './config';
import { LabActivityEvent } from '../models/Lab';

export type PostMessageType =
  | 'OPEN_LAB'
  | 'SET_PARAMS'
  | 'SET_MODE'
  | 'PING'
  | 'LAB_READY'
  | 'LAB_STATE_CHANGED'
  | 'EXPERIMENT_COMPLETED'
  | 'LAB_CLOSED'
  | 'PONG';

export interface PostMessageData {
  type: PostMessageType;
  labId?: string;
  lessonId?: string;
  experimentId?: string;
  params?: Record<string, any>;
  event?: LabActivityEvent;
  payload?: any;
}

export class PostMessageBridge {
  private static instance: PostMessageBridge;
  private listeners: Array<(data: PostMessageData, origin: string) => void> = [];

  private constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('message', this.handleIncomingMessage.bind(this));
    }
  }

  public static getInstance(): PostMessageBridge {
    if (!PostMessageBridge.instance) {
      PostMessageBridge.instance = new PostMessageBridge();
    }
    return PostMessageBridge.instance;
  }

  private handleIncomingMessage(event: MessageEvent) {
    // Ignore messages without object payload or internal browser extension signals
    if (!event.data || typeof event.data !== 'object') return;

    // Check if origin is allowed or running locally
    const isAllowedOrigin =
      INTEGRATION_CONFIG.allowedParentOrigins.some((allowed) =>
        allowed === '*' || allowed === event.origin || event.origin.includes('google.com')
      ) ||
      event.origin === window.location.origin;

    if (!isAllowedOrigin) {
      // Only warn if the message explicitly looks like a postMessage attempt for Math Lab
      if (event.data.type) {
        console.warn('[PostMessageBridge] Untrusted origin message ignored:', event.origin);
      }
      return;
    }

    if (event.data && typeof event.data === 'object' && event.data.type) {
      console.log('[PostMessageBridge] Received message:', event.data.type, event.data);
      this.listeners.forEach((listener) => listener(event.data, event.origin));
    }
  }

  /**
   * Subscribe to incoming messages from Parent Window / Frame
   */
  public subscribe(callback: (data: PostMessageData, origin: string) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  /**
   * Send a message from Math Lab to Parent Platform window
   */
  public sendMessageToParent(data: PostMessageData, targetOrigin?: string) {
    if (typeof window === 'undefined') return;

    const origin = targetOrigin || (window.opener ? '*' : document.referrer ? new URL(document.referrer).origin : '*');

    // Send to window.parent if embedded in iframe
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(data, origin);
      console.log('[PostMessageBridge] Sent to parent iframe:', data.type);
    }

    // Send to window.opener if opened in popup
    if (window.opener) {
      window.opener.postMessage(data, origin);
      console.log('[PostMessageBridge] Sent to popup opener:', data.type);
    }
  }

  /**
   * Helper notify that Lab is loaded and ready
   */
  public notifyLabReady(labId: string, lessonId?: string) {
    this.sendMessageToParent({
      type: 'LAB_READY',
      labId,
      lessonId,
    });
  }

  /**
   * Helper log activity event
   */
  public logActivity(event: LabActivityEvent) {
    console.log('[ActivityLog]', event);
    this.sendMessageToParent({
      type: 'LAB_STATE_CHANGED',
      labId: event.labId,
      lessonId: event.lessonId,
      event,
    });
  }
}

export const postMessageBridge = PostMessageBridge.getInstance();
