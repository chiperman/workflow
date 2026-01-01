import { withRetry } from '../utils';

describe('withRetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('成功场景', () => {
    it('第一次尝试就成功', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await withRetry(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
      expect(console.log).not.toHaveBeenCalled();
    });

    it('第二次尝试成功', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      const result = await withRetry(fn, 3, 100);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Retry succeeded on attempt 2/3')
      );
    });

    it('第三次尝试成功', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      const result = await withRetry(fn, 3, 100);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Retry succeeded on attempt 3/3')
      );
    });
  });

  describe('失败场景', () => {
    it('所有重试都失败后抛出错误', async () => {
      const error = new Error('Persistent network error');
      const fn = jest.fn().mockRejectedValue(error);

      await expect(withRetry(fn, 3, 100)).rejects.toThrow('Persistent network error');
      expect(fn).toHaveBeenCalledTimes(3);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('All 3 retry attempts failed')
      );
    });

    it('遇到非重试错误立即抛出（表不存在）', async () => {
      const error = { code: '42P01', message: 'Table does not exist' };
      const fn = jest.fn().mockRejectedValue(error);

      await expect(withRetry(fn, 3, 100)).rejects.toEqual(error);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Non-retryable error detected')
      );
    });

    it('遇到非重试错误立即抛出（环境变量缺失）', async () => {
      const error = new Error('Missing environment variable');
      const fn = jest.fn().mockRejectedValue(error);

      await expect(withRetry(fn, 3, 100)).rejects.toThrow('Missing environment variable');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('遇到非重试错误立即抛出（认证失败）', async () => {
      const error = new Error('Authentication failed');
      const fn = jest.fn().mockRejectedValue(error);

      await expect(withRetry(fn, 3, 100)).rejects.toThrow('Authentication failed');
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('重试延迟', () => {
    it('使用指数退避延迟', async () => {
      jest.useFakeTimers();
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValue('success');

      const promise = withRetry(fn, 3, 1000);

      // 第一次失败后，等待 1000ms
      await jest.advanceTimersByTimeAsync(1000);

      // 第二次失败后，等待 2000ms
      await jest.advanceTimersByTimeAsync(2000);

      const result = await promise;
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);

      jest.useRealTimers();
    });
  });

  describe('错误日志', () => {
    it('记录重试尝试信息', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValue('success');

      await withRetry(fn, 3, 100);

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Retry attempt 1/3 failed'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Error: Network timeout'));
    });
  });
});

describe('isConfigurationError (通过 withRetry 间接测试)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('识别 Supabase 表不存在错误 (42P01)', async () => {
    const error = { code: '42P01', message: 'relation "keep_alive" does not exist' };
    const fn = jest.fn().mockRejectedValue(error);

    await expect(withRetry(fn)).rejects.toEqual(error);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('识别环境变量缺失错误', async () => {
    const error = new Error('Missing env variable: SUPABASE_URL');
    const fn = jest.fn().mockRejectedValue(error);

    await expect(withRetry(fn)).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('识别认证失败错误', async () => {
    const error = new Error('Authentication failed: invalid credentials');
    const fn = jest.fn().mockRejectedValue(error);

    await expect(withRetry(fn)).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('识别权限拒绝错误', async () => {
    const error = new Error('Permission denied');
    const fn = jest.fn().mockRejectedValue(error);

    await expect(withRetry(fn)).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('识别无效配置错误', async () => {
    const error = new Error('Invalid configuration');
    const fn = jest.fn().mockRejectedValue(error);

    await expect(withRetry(fn)).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('网络错误应该重试', async () => {
    const error = new Error('Network error');
    const fn = jest.fn().mockRejectedValueOnce(error).mockResolvedValue('success');

    const result = await withRetry(fn, 3, 100);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('超时错误应该重试', async () => {
    const error = new Error('Request timeout');
    const fn = jest.fn().mockRejectedValueOnce(error).mockResolvedValue('success');

    const result = await withRetry(fn, 3, 100);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
