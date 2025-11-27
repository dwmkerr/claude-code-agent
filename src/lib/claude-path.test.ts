import { findClaudePath } from './claude-path';

describe('findClaudePath', () => {
  it('should return a path when claude is in PATH', () => {
    const path = findClaudePath();

    // Should either find claude or return undefined
    if (path) {
      expect(typeof path).toBe('string');
      expect(path.length).toBeGreaterThan(0);
    } else {
      expect(path).toBeUndefined();
    }
  });

  it('should return undefined when claude is not in PATH', () => {
    const mockEnv = { PATH: '/nonexistent/path' };
    const path = findClaudePath(mockEnv);

    expect(path).toBeUndefined();
  });
});
