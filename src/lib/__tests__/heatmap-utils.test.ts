import { aggregateByDay, LogEntry } from '../heatmap-utils';

describe('aggregateByDay', () => {
  test('should handle empty logs', () => {
    const logs: LogEntry[] = [];
    const result = aggregateByDay(logs);
    expect(result).toEqual([]);
  });

  test('should handle a single success', () => {
    const logs: LogEntry[] = [
      { service: 'service_a', status: true, timestamp: '2024-01-01T10:00:00+08:00' },
    ];
    const result = aggregateByDay(logs);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      date: '2024-01-01',
      success_count: 1,
      failure_count: 0,
      services: { service_a: 'success' },
    });
  });

  test('should handle a single failure', () => {
    const logs: LogEntry[] = [
      { service: 'service_a', status: false, timestamp: '2024-01-01T10:00:00+08:00' },
    ];
    const result = aggregateByDay(logs);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      date: '2024-01-01',
      success_count: 0,
      failure_count: 1,
      services: { service_a: 'failure' },
    });
  });

  test('Scenario: Recovered Day (Mixed Failure then Success)', () => {
    // Service A fails twice, then succeeds.
    const logs: LogEntry[] = [
      { service: 'service_a', status: false, timestamp: '2024-01-02T08:00:00+08:00' },
      { service: 'service_a', status: false, timestamp: '2024-01-02T09:00:00+08:00' },
      { service: 'service_a', status: true, timestamp: '2024-01-02T10:00:00+08:00' },
    ];
    const result = aggregateByDay(logs);

    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2024-01-02');
    // Should be counted as success
    expect(result[0].success_count).toBe(1);
    expect(result[0].failure_count).toBe(0);
    expect(result[0].services).toEqual({ service_a: 'success' });
  });

  test('Scenario: Mixed Services (One Success, One Failure)', () => {
    const logs: LogEntry[] = [
      { service: 'service_a', status: true, timestamp: '2024-01-03T10:00:00+08:00' },
      { service: 'service_b', status: false, timestamp: '2024-01-03T10:00:00+08:00' },
      { service: 'service_b', status: false, timestamp: '2024-01-03T11:00:00+08:00' }, // Service B never succeeds
    ];
    const result = aggregateByDay(logs);

    expect(result).toHaveLength(1);
    expect(result[0].success_count).toBe(1); // service_a
    expect(result[0].failure_count).toBe(1); // service_b
    expect(result[0].services).toEqual({
      service_a: 'success',
      service_b: 'failure',
    });
  });

  test('Scenario: Multiple Days', () => {
    const logs: LogEntry[] = [
      { service: 'service_a', status: true, timestamp: '2024-01-01T10:00:00+08:00' },
      { service: 'service_a', status: false, timestamp: '2024-01-02T10:00:00+08:00' },
    ];
    const result = aggregateByDay(logs);

    expect(result).toHaveLength(2);
    expect(result[0].date).toBe('2024-01-01');
    expect(result[0].success_count).toBe(1);

    expect(result[1].date).toBe('2024-01-02');
    expect(result[1].failure_count).toBe(1);
  });

  test('Scenario: Timezone Handling (UTC vs Beijing)', () => {
    // 2024-01-01 23:00 UTC is 2024-01-02 07:00 Beijing
    const logs: LogEntry[] = [
      { service: 'service_utc', status: true, timestamp: '2024-01-01T23:00:00Z' },
    ];
    const result = aggregateByDay(logs);

    expect(result).toHaveLength(1);
    // Should belong to Jan 2nd in Beijing time
    expect(result[0].date).toBe('2024-01-02');
  });
});
