import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Smartphone, Clock, Check } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';
import { formatOrderNumber } from '@/lib/utils';

const truthyValues = new Set([true, 'true', 1, '1']);
const falsyValues = new Set([false, 'false', 0, '0']);

const normalizeStatus = (value) => {
  if (!value) return '';
  return String(value).toLowerCase().trim();
};

const isOrderPaid = (order) => {
  if (!order || typeof order !== 'object') return false;

  const booleanCandidates = [
    order.isPaid,
    order.paid,
    order.hasPaid,
    order.payment?.isPaid,
    order.payment?.paid,
    order.payment?.hasPaid,
  ];

  for (const value of booleanCandidates) {
    if (truthyValues.has(value)) return true;
    if (falsyValues.has(value)) return false;
  }

  const statusCandidates = [
    order.paymentStatus,
    order.payment_status,
    order.payment?.status,
    order.payment?.paymentStatus,
  ]
    .map(normalizeStatus)
    .filter(Boolean);

  const paidStatuses = new Set([
    'paid',
    'settled',
    'complete',
    'completed',
    'success',
    'succeeded',
  ]);
  const unpaidStatuses = new Set([
    'unpaid',
    'pending',
    'due',
    'failed',
    'declined',
    'void',
    'voided',
  ]);

  for (const status of statusCandidates) {
    if (paidStatuses.has(status)) return true;
    if (unpaidStatuses.has(status)) return false;
  }

  return true;
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

const getOrderChannel = (order) => {
  const candidates = [
    order?.type,
    order?.orderType,
    order?.order_type,
    order?.channel,
  ];
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) {
      const normalized = value.trim().toLowerCase();
      if (
        ['walk-in', 'walkin', 'walk_in', 'walk in', 'counter'].includes(
          normalized
        )
      ) {
        return 'walk-in';
      }
      if (
        ['online', 'web', 'delivery', 'pickup', 'app', 'mobile'].includes(
          normalized
        )
      ) {
        return 'online';
      }
      return normalized;
    }
  }
  return 'walk-in';
};

const formatStatusLabel = (status) => {
  const normalized = normalizeStatus(status);
  if (!normalized) return 'Unknown';
  const map = {
    pending: 'Pending',
    accepted: 'Accepted',
    in_queue: 'In Queue',
    in_progress: 'In Progress',
    'in-progress': 'In Progress',
    preparing: 'Preparing',
    in_prep: 'In Preparation',
    ready: 'Ready',
    staged: 'Ready',
    handoff: 'Handoff',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  if (map[normalized]) return map[normalized];
  return normalized
    .split(/[_\s-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const OrderQueue = ({ orderQueue, updateOrderStatus }) => {
  const { can } = useAuth();
  const queueOrders = useMemo(() => {
    if (!orderQueue) return [];
    if (Array.isArray(orderQueue)) return orderQueue;
    const nested = orderQueue?.orders || orderQueue?.data?.orders;
    return Array.isArray(nested) ? nested : [];
  }, [orderQueue]);

  const visibleOrders = useMemo(() => {
    return queueOrders
      .filter((order) => isOrderPaid(order))
      .filter((order) => getOrderStatus(order) !== 'completed');
  }, [queueOrders]);

  const walkInOrders = useMemo(
    () => visibleOrders.filter((order) => getOrderChannel(order) === 'walk-in'),
    [visibleOrders]
  );

  const onlineOrders = useMemo(
    () =>
      visibleOrders.filter((order) => {
        const channel = getOrderChannel(order);
        return channel !== 'walk-in';
      }),
    [visibleOrders]
  );

  const formatTimeAgo = (input) => {
    const d = input instanceof Date ? input : new Date(input);
    const ts = d.getTime();
    if (Number.isNaN(ts)) return 'Unknown';

    const nowTs = Date.now();
    const diffInMinutes = Math.floor((nowTs - ts) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes === 1) return '1 minute ago';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;

    const hours = Math.floor(diffInMinutes / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  const getStatusColor = (status) => {
    const normalized = normalizeStatus(status);
    switch (normalized) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'preparing':
      case 'in_progress':
      case 'in-progress':
      case 'in_prep':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready':
      case 'staged':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_queue':
      case 'accepted':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
      {/* Walk-in Orders */}
      <Card>
        <CardHeader className="bg-amber-50 border-b">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Walk-in Orders
              </CardTitle>
              <CardDescription>Orders placed at counter</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-amber-100 text-amber-800 border-amber-200"
              >
                {walkInOrders.length} Orders
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {walkInOrders.length > 0 ? (
            <div className="divide-y max-h-[600px] overflow-y-auto scrollbar-hide">
              {walkInOrders.map((order) => {
                  const status = getOrderStatus(order);
                  const statusLabel = formatStatusLabel(status);
                  const isPending = [
                    'pending',
                    'accepted',
                    'in_queue',
                    'new',
                  ].includes(status);
                  const isPreparing = [
                    'preparing',
                    'in_progress',
                    'in_prep',
                  ].includes(status);
                  const isReady = ['ready', 'staged', 'handoff'].includes(
                    status
                  );

                  return (
                    <div key={order.id} className="p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">
                            #
                            {formatOrderNumber(order.orderNumber) ||
                              order.orderNumber ||
                              'N/A'}
                          </h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />{' '}
                            {formatTimeAgo(order.timeReceived)}
                          </p>
                        </div>
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            status
                          )}`}
                        >
                          {statusLabel}
                        </div>
                      </div>

                      <div className="bg-muted/50 p-3 rounded-md">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between text-sm"
                          >
                            <span>
                              {item.quantity}x {item.name}
                            </span>
                            <span>
                              PHP {(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        {isPending && can('order.status.update') && (
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() =>
                              updateOrderStatus(order.id, 'in_progress')
                            }
                          >
                            Start Preparing
                          </Button>
                        )}

                        {isPreparing && can('order.status.update') && (
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => updateOrderStatus(order.id, 'ready')}
                          >
                            Mark Ready
                          </Button>
                        )}

                        {isReady && can('order.status.update') && (
                          <Button
                            size="sm"
                            variant="default"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() =>
                              updateOrderStatus(order.id, 'completed')
                            }
                          >
                            <Check className="h-4 w-4 mr-1" /> Complete Order
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Package className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                No walk-in orders in queue
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Online Orders */}
      <Card>
        <CardHeader className="bg-blue-50 border-b">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Online Orders
              </CardTitle>
              <CardDescription>
                Orders placed through app or website
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-blue-100 text-blue-800 border-blue-200"
              >
                {onlineOrders.length} Orders
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {onlineOrders.length > 0 ? (
            <div className="divide-y max-h-[600px] overflow-y-auto scrollbar-hide">
              {onlineOrders.map((order) => {
                  const status = getOrderStatus(order);
                  const statusLabel = formatStatusLabel(status);
                  const isPending = [
                    'pending',
                    'accepted',
                    'in_queue',
                    'new',
                  ].includes(status);
                  const isPreparing = [
                    'preparing',
                    'in_progress',
                    'in_prep',
                  ].includes(status);
                  const isReady = ['ready', 'staged', 'handoff'].includes(
                    status
                  );

                  return (
                    <div key={order.id} className="p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">
                            #
                            {formatOrderNumber(order.orderNumber) ||
                              order.orderNumber ||
                              'N/A'}
                          </h3>
                          <p className="text-sm font-medium">
                            {order.customerName}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />{' '}
                            {formatTimeAgo(order.timeReceived)}
                          </p>
                        </div>
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            status
                          )}`}
                        >
                          {statusLabel}
                        </div>
                      </div>

                      <div className="bg-muted/50 p-3 rounded-md">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between text-sm"
                          >
                            <span>
                              {item.quantity}x {item.name}
                            </span>
                            <span>
                              PHP {(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        {isPending && can('order.status.update') && (
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() =>
                              updateOrderStatus(order.id, 'in_progress')
                            }
                          >
                            Start Preparing
                          </Button>
                        )}

                        {isPreparing && can('order.status.update') && (
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => updateOrderStatus(order.id, 'ready')}
                          >
                            Ready for Pickup
                          </Button>
                        )}

                        {isReady && can('order.status.update') && (
                          <Button
                            size="sm"
                            variant="default"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() =>
                              updateOrderStatus(order.id, 'completed')
                            }
                          >
                            <Check className="h-4 w-4 mr-1" /> Complete Order
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Smartphone className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No online orders in queue</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Overview */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Queue Statistics</CardTitle>
          <CardDescription>
            Overview of current order processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted/50 p-4 rounded-md">
              <p className="text-sm font-medium text-muted-foreground">
                Total Orders
              </p>
              <p className="text-3xl font-bold">{visibleOrders.length}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-md">
              <p className="text-sm font-medium text-yellow-800">Queued</p>
              <p className="text-3xl font-bold text-yellow-800">
                {
                  visibleOrders.filter((o) =>
                    ['pending', 'accepted', 'in_queue', 'new'].includes(
                      getOrderStatus(o)
                    )
                  ).length
                }
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-md">
              <p className="text-sm font-medium text-blue-800">In Progress</p>
              <p className="text-3xl font-bold text-blue-800">
                {
                  visibleOrders.filter((o) =>
                    ['preparing', 'in_progress', 'in_prep'].includes(
                      getOrderStatus(o)
                    )
                  ).length
                }
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-md">
              <p className="text-sm font-medium text-green-800">Ready</p>
              <p className="text-3xl font-bold text-green-800">
                {
                  visibleOrders.filter((o) =>
                    ['ready', 'staged', 'handoff'].includes(getOrderStatus(o))
                  ).length
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderQueue;
