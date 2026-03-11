import { useState, useEffect, useCallback, useRef } from 'react';

type PermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';

export interface UseCameraPermissionReturn {
  permission: PermissionState;
  stream: MediaStream | null;
  error: string | null;
  isSupported: boolean;
  requestPermission: () => Promise<MediaStream | null>;
  stopStream: () => void;
}

export function useCameraPermission(): UseCameraPermissionReturn {
  const [permission, setPermission] = useState<PermissionState>('prompt');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const checkSupport = useCallback((): boolean => {
    if (typeof navigator === 'undefined') {
      setError('Navigator not available');
      setPermission('unsupported');
      return false;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Camera not supported on this device/browser');
      setPermission('unsupported');
      return false;
    }

    return true;
  }, []);

  const requestPermission = useCallback(async (): Promise<MediaStream | null> => {
    if (!checkSupport()) {
      return null;
    }

    // Stop existing stream if any
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setPermission('granted');
      setError(null);

      return mediaStream;
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setPermission('denied');
          setError('Camera access denied. Please enable camera permissions in your browser settings.');
        } else if (err.name === 'NotFoundError') {
          setPermission('unsupported');
          setError('No camera found on this device.');
        } else if (err.name === 'NotReadableError') {
          setPermission('denied');
          setError('Camera is already in use by another application.');
        } else {
          setPermission('denied');
          setError(`Camera error: ${err.message}`);
        }
      } else {
        setPermission('denied');
        setError('Unknown camera error occurred.');
      }
      return null;
    }
  }, [checkSupport]);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    setStream(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  // Check support on mount
  useEffect(() => {
    checkSupport();
  }, [checkSupport]);

  return {
    permission,
    stream,
    error,
    isSupported: permission !== 'unsupported',
    requestPermission,
    stopStream,
  };
}
