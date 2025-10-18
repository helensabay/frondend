import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/components/AuthContext';
import orderService from '@/api/services/orderService';

/**
 * Global background service for auto-advancing orders
 * Runs independently of the current page/component
 */
const POLL_INTERVAL_MS = 2000; // Check every 2 seconds
const ADVANCE_LOCK_TIMEOUT_MS = 10000; // Clear stuck locks after 10 seconds

const normalizeStatus = (value) => {
  if (!value) return '';
  return String(value).toLowerCase().trim();
};

const STATUS_CANONICAL_MAP = {
  pending: 'new',
  accepted: 'accepted',
  in_queue: 'accepted',
  'in-queue': 'accepted',
  in_progress: 'in_prep',
  'in-progress': 'in_prep',
  in_prep: 'in_prep',
  preparing: 'in_prep',
  ready: 'staged',
  staged: 'staged',
  handoff: 'handoff',
  completed: 'completed',
  cancelled: 'cancelled',
  voided: 'voided',
  refunded: 'refunded',
};

const toCanonicalStatus = (status) => {
  const normalized = normalizeStatus(status);
  return STATUS_CANONICAL_MAP[normalized] || normalized;
};

const getOrderStatus = (order) => {
  const candidates = [
    order?.status,
    order?.canonicalStatus,
    order?.canonical_status,
    order?.rawStatus,
    order?.raw_status,
  ];
  for (const value of candidates) {
    const normalized = normalizeStatus(value);
    if (normalized) return normalized;
  }
  return '';
};

const resolveAutoAdvanceTarget = (order) => {
  if (!order) return null;
  const direct = normalizeStatus(order.autoAdvanceTarget);
  if (direct) return direct;
  const canonicalStatus = toCanonicalStatus(getOrderStatus(order));
  if (canonicalStatus === 'in_prep') {
    return 'ready';
  }
  if (canonicalStatus === 'staged') {
    return 'completed';
  }
  return null;
};

export const useOrderAutoAdvance = () => {
  const { user, can, token } = useAuth();
  const autoAdvanceLocksRef = useRef(new Map());
  const intervalRef = useRef(null);
  const isProcessingRef = useRef(false);
  const unauthorizedRef = useRef(false);

  const processOrders = useCallback(async () => {
    if (unauthorizedRef.current) {
      return;
    }
    // Skip if not authenticated or no permission
    const canAdvance = Boolean(
      user && token && can('order.status.update') && can('order.queue.handle')
    );
    if (!canAdvance) {
      return;
    }

    // Skip if already processing
    if (isProcessingRef.current) {
      return;
    }

    try {
      isProcessingRef.current = true;

      // Fetch current order queue
      const result = await orderService.getOrderQueue();
      if (!result?.success || !result?.data?.orders) {
        return;
      }

      const orders = result.data.orders;
      const nowTs = Date.now();
      const activeKeys = new Set();

      for (const order of orders) {
        const targetResolved = resolveAutoAdvanceTarget(order);
        if (!targetResolved) {
          continue;
        }

        const target = normalizeStatus(targetResolved);
        const canonicalTarget = toCanonicalStatus(target);
        const canonicalStatus = toCanonicalStatus(getOrderStatus(order));
        const key = `${order.id}:${target}`;
        activeKeys.add(key);

        // Skip if paused
        if (order.autoAdvancePaused) {
          autoAdvanceLocksRef.current.delete(key);
          continue;
        }

        // Skip if already at target status
        if (canonicalStatus === canonicalTarget) {
          autoAdvanceLocksRef.current.delete(key);
          continue;
        }

        // Check if countdown has expired
        const targetTimestamp = order.autoAdvanceAt
          ? new Date(order.autoAdvanceAt).getTime()
          : NaN;

        if (Number.isNaN(targetTimestamp)) {
          autoAdvanceLocksRef.current.delete(key);
          continue;
        }

        const diff = Math.ceil((targetTimestamp - nowTs) / 1000);
        const countdown = diff <= 0 ? 0 : diff;

        if (countdown === 0) {
          const lockEntry = autoAdvanceLocksRef.current.get(key);
          const isLocked =
            lockEntry && nowTs - lockEntry < ADVANCE_LOCK_TIMEOUT_MS;

          if (!isLocked) {
            // Set lock with current timestamp
            autoAdvanceLocksRef.current.set(key, nowTs);

            try {
              await orderService.updateOrderStatus(order.id, target);
              console.log(
                `[Auto-Advance] Advanced order ${order.orderNumber} to ${target}`
              );
            } catch (error) {
              console.error(
                `[Auto-Advance] Failed to advance order ${order.orderNumber}:`,
                error
              );
              // Clear lock on failure so it can retry
              autoAdvanceLocksRef.current.delete(key);
            }
          }
        } else {
          // Countdown not yet expired, clear any lock
          autoAdvanceLocksRef.current.delete(key);
        }
      }

      // Clean up stale locks
      for (const key of Array.from(autoAdvanceLocksRef.current.keys())) {
        if (!activeKeys.has(key)) {
          autoAdvanceLocksRef.current.delete(key);
        }
      }
    } catch (error) {
      const status = error?.status ?? error?.response?.status ?? null;
      if (status === 401 || status === 403) {
        if (!unauthorizedRef.current) {
          console.warn(
            '[Auto-Advance] Disabled due to unauthorized access. Background polling stopped.'
          );
        }
        unauthorizedRef.current = true;
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        console.error('[Auto-Advance] Error processing orders:', error);
      }
    } finally {
      isProcessingRef.current = false;
    }
  }, [user, token, can]);

  useEffect(() => {
    // Only run if user is authenticated and has permission
    const canAdvance = Boolean(
      user && token && can('order.status.update') && can('order.queue.handle')
    );
    if (!canAdvance) {
      unauthorizedRef.current = false;
      return;
    }
    // To test in console
    // console.log('[Auto-Advance] Background service started');

    // Start polling
    unauthorizedRef.current = false;
    intervalRef.current = setInterval(processOrders, POLL_INTERVAL_MS);

    // Initial run
    processOrders();

    return () => {
      console.log('[Auto-Advance] Background service stopped');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Clear all locks on unmount
      autoAdvanceLocksRef.current.clear();
      isProcessingRef.current = false;
    };
  }, [user, token, can, processOrders]);
};
