import type {
  FaceShape,
  CapturedSnapshot,
  ProductVariant3D,
} from '@/types/virtual-tryon.types';

// Analytics event types for Virtual Try-On
export type TryOnAnalyticsEvent =
  | 'try_on_button_view'
  | 'try_on_button_click'
  | 'try_on_session_start'
  | 'try_on_session_end'
  | 'try_on_camera_permission_granted'
  | 'try_on_camera_permission_denied'
  | 'try_on_demo_mode_entered'
  | 'try_on_variant_switch'
  | 'try_on_face_detected'
  | 'try_on_face_shape_detected'
  | 'try_on_mirror_toggled'
  | 'try_on_capture'
  | 'try_on_snapshot_deleted'
  | 'try_on_add_to_cart'
  | 'try_on_share'
  | 'try_on_save';

export interface TryOnAnalyticsData {
  eventType: TryOnAnalyticsEvent;
  productId?: string;
  variantId?: string;
  variantColor?: string;
  timestamp: Date;
  sessionId: string;
  metadata: {
    deviceType: 'mobile' | 'tablet' | 'desktop';
    browser: string;
    os?: string;
    cameraPermission?: 'granted' | 'denied' | 'unsupported';
    sessionDuration?: number; // seconds
    faceShape?: FaceShape;
    faceConfidence?: number;
    snapshotsTaken?: number;
    variantsTried?: number;
    mirrorMode?: boolean;
    sharePlatform?: string;
  };
}

// Generate a unique session ID
let currentSessionId: string | null = null;

export function generateSessionId(): string {
  return `vto_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

export function getSessionId(): string {
  if (!currentSessionId) {
    currentSessionId = generateSessionId();
  }
  return currentSessionId;
}

export function resetSessionId(): void {
  currentSessionId = null;
}

// Device detection helpers
function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

function getBrowserInfo(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edge')) return 'Edge';
  return 'Unknown';
}

function getOS(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'MacOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Unknown';
}

// Analytics tracking class
class VirtualTryOnAnalytics {
  private events: TryOnAnalyticsData[] = [];
  private sessionStartTime: Date | null = null;
  private variantsTried: Set<string> = new Set();
  private snapshotsCount = 0;

  // Initialize session
  startSession(productId: string, variantId: string): void {
    this.sessionStartTime = new Date();
    this.variantsTried.clear();
    this.variantsTried.add(variantId);
    this.snapshotsCount = 0;

    this.track({
      eventType: 'try_on_session_start',
      productId,
      variantId,
      timestamp: new Date(),
      sessionId: getSessionId(),
      metadata: {
        deviceType: getDeviceType(),
        browser: getBrowserInfo(),
        os: getOS(),
      },
    });
  }

  // End session and calculate duration
  endSession(): void {
    if (!this.sessionStartTime) return;

    const duration = Math.floor((Date.now() - this.sessionStartTime.getTime()) / 1000);

    this.track({
      eventType: 'try_on_session_end',
      timestamp: new Date(),
      sessionId: getSessionId(),
      metadata: {
        deviceType: getDeviceType(),
        browser: getBrowserInfo(),
        os: getOS(),
        sessionDuration: duration,
        snapshotsTaken: this.snapshotsCount,
        variantsTried: this.variantsTried.size,
      },
    });

    this.sessionStartTime = null;
  }

  // Track button view (for impression tracking)
  trackButtonView(productId: string, variantId: string): void {
    this.track({
      eventType: 'try_on_button_view',
      productId,
      variantId,
      timestamp: new Date(),
      sessionId: getSessionId(),
      metadata: {
        deviceType: getDeviceType(),
        browser: getBrowserInfo(),
        os: getOS(),
      },
    });
  }

  // Track button click
  trackButtonClick(productId: string, variantId: string): void {
    this.track({
      eventType: 'try_on_button_click',
      productId,
      variantId,
      timestamp: new Date(),
      sessionId: getSessionId(),
      metadata: {
        deviceType: getDeviceType(),
        browser: getBrowserInfo(),
        os: getOS(),
      },
    });
  }

  // Track camera permission
  trackCameraPermission(granted: boolean): void {
    this.track({
      eventType: granted
        ? 'try_on_camera_permission_granted'
        : 'try_on_camera_permission_denied',
      timestamp: new Date(),
      sessionId: getSessionId(),
      metadata: {
        deviceType: getDeviceType(),
        browser: getBrowserInfo(),
        os: getOS(),
        cameraPermission: granted ? 'granted' : 'denied',
      },
    });
  }

  // Track demo mode entry
  trackDemoMode(): void {
    this.track({
      eventType: 'try_on_demo_mode_entered',
      timestamp: new Date(),
      sessionId: getSessionId(),
      metadata: {
        deviceType: getDeviceType(),
        browser: getBrowserInfo(),
        os: getOS(),
      },
    });
  }

  // Track variant switch
  trackVariantSwitch(variant: ProductVariant3D): void {
    this.variantsTried.add(variant.id);

    this.track({
      eventType: 'try_on_variant_switch',
      productId: variant.productId,
      variantId: variant.id,
      variantColor: variant.color,
      timestamp: new Date(),
      sessionId: getSessionId(),
      metadata: {
        deviceType: getDeviceType(),
        browser: getBrowserInfo(),
        os: getOS(),
        variantsTried: this.variantsTried.size,
      },
    });
  }

  // Track face detection
  trackFaceDetected(confidence: number): void {
    this.track({
      eventType: 'try_on_face_detected',
      timestamp: new Date(),
      sessionId: getSessionId(),
      metadata: {
        deviceType: getDeviceType(),
        browser: getBrowserInfo(),
        os: getOS(),
        faceConfidence: confidence,
      },
    });
  }

  // Track face shape detection
  trackFaceShapeDetected(shape: FaceShape, confidence: number): void {
    this.track({
      eventType: 'try_on_face_shape_detected',
      timestamp: new Date(),
      sessionId: getSessionId(),
      metadata: {
        deviceType: getDeviceType(),
        browser: getBrowserInfo(),
        os: getOS(),
        faceShape: shape,
        faceConfidence: confidence,
      },
    });
  }

  // Track mirror toggle
  trackMirrorToggle(enabled: boolean): void {
    this.track({
      eventType: 'try_on_mirror_toggled',
      timestamp: new Date(),
      sessionId: getSessionId(),
      metadata: {
        deviceType: getDeviceType(),
        browser: getBrowserInfo(),
        os: getOS(),
        mirrorMode: enabled,
      },
    });
  }

  // Track snapshot capture
  trackCapture(snapshot: CapturedSnapshot): void {
    this.snapshotsCount++;

    this.track({
      eventType: 'try_on_capture',
      productId: snapshot.productId,
      variantId: snapshot.variantId,
      timestamp: new Date(),
      sessionId: getSessionId(),
      metadata: {
        deviceType: getDeviceType(),
        browser: getBrowserInfo(),
        os: getOS(),
        faceShape: snapshot.faceShape,
        snapshotsTaken: this.snapshotsCount,
        mirrorMode: snapshot.metadata.captureSettings.mirrorMode,
      },
    });
  }

  // Track snapshot deletion
  trackSnapshotDelete(snapshotId: string): void {
    this.track({
      eventType: 'try_on_snapshot_deleted',
      timestamp: new Date(),
      sessionId: getSessionId(),
      metadata: {
        deviceType: getDeviceType(),
        browser: getBrowserInfo(),
        os: getOS(),
      },
    });
  }

  // Track add to cart
  trackAddToCart(
    productId: string,
    variantId: string,
    snapshotId?: string
  ): void {
    this.track({
      eventType: 'try_on_add_to_cart',
      productId,
      variantId,
      timestamp: new Date(),
      sessionId: getSessionId(),
      metadata: {
        deviceType: getDeviceType(),
        browser: getBrowserInfo(),
        os: getOS(),
        sessionDuration: this.sessionStartTime
          ? Math.floor((Date.now() - this.sessionStartTime.getTime()) / 1000)
          : undefined,
        snapshotsTaken: this.snapshotsCount,
        variantsTried: this.variantsTried.size,
      },
    });
  }

  // Track share
  trackShare(platform: string): void {
    this.track({
      eventType: 'try_on_share',
      timestamp: new Date(),
      sessionId: getSessionId(),
      metadata: {
        deviceType: getDeviceType(),
        browser: getBrowserInfo(),
        os: getOS(),
        sharePlatform: platform,
      },
    });
  }

  // Track save
  trackSave(): void {
    this.track({
      eventType: 'try_on_save',
      timestamp: new Date(),
      sessionId: getSessionId(),
      metadata: {
        deviceType: getDeviceType(),
        browser: getBrowserInfo(),
        os: getOS(),
      },
    });
  }

  // Internal track method
  private track(event: TryOnAnalyticsData): void {
    this.events.push(event);

    // Send to analytics backend
    this.sendToAnalytics(event);

    // Log in development
    if (import.meta.env.DEV) {
      console.log('[Virtual Try-On Analytics]', event);
    }
  }

  // Send event to analytics backend
  private sendToAnalytics(event: TryOnAnalyticsData): void {
    // TODO: Implement actual analytics backend call
    // This could be Google Analytics, Segment, Amplitude, or your own backend

    // Example: Send to your backend API
    // fetch('/api/analytics/try-on', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(event),
    // }).catch(err => console.error('Analytics error:', err));

    // Example: Google Analytics 4
    // if (typeof gtag !== 'undefined') {
    //   gtag('event', event.eventType, {
    //     custom_parameters: event.metadata,
    //   });
    // }
  }

  // Get all events (for debugging/export)
  getEvents(): TryOnAnalyticsData[] {
    return [...this.events];
  }

  // Clear events
  clearEvents(): void {
    this.events = [];
  }

  // Export events as JSON
  exportEvents(): string {
    return JSON.stringify(this.events, null, 2);
  }
}

// Singleton instance
const analytics = new VirtualTryOnAnalytics();

export default analytics;
