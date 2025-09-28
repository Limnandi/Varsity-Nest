import { performanceMonitor } from './performance';
import { startSentryTransaction, captureMessage } from '@/lib/logging/config';

type QueryFn<T> = (...args: any[]) => Promise<T>;

export const monitorDatabaseQuery = <T>(
  queryName: string,
  queryFn: QueryFn<T>
): QueryFn<T> => {
  return async (...args: any[]): Promise<T> => {
    const transaction: any = startSentryTransaction(queryName, 'db.query');

    const endMetric = performanceMonitor.startMetric(`db_query_${queryName}`);

    try {
      const result = await queryFn(...args);
      
      transaction?.setData?.('query_success', true);
      transaction?.setData?.('args_count', args.length);
      
      return result;
    } catch (error) {
      transaction?.setData?.('query_success', false);
      if (error instanceof Error) {
        transaction?.setData?.('error_message', error.message);
      }
      throw error;
    } finally {
      endMetric();
      transaction?.finish?.();
      
      // Report slow queries in production
      const stats = performanceMonitor.getMetricStats(`db_query_${queryName}`);
      if (stats && stats.avg > 1000) { // More than 1 second
        try {
          captureMessage('Slow database query detected', { level: 'warning', queryName, performanceStats: stats })
        } catch (e) {
          // ignore
        }
      }
    }
  };
};

// Example usage:
// const monitoredQuery = monitorDatabaseQuery('getUserById', getUserById);
// const user = await monitoredQuery(userId);
