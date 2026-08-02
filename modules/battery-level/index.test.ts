/**
 * Behaviour of the `getBatteryLevel` wrapper.
 *
 * The native module is mocked because Jest has no native runtime — these tests
 * cover the wrapper's contract with its callers, not the bridge itself. The
 * bridge's string contract is covered by contract.test.ts, and its real
 * behaviour by running the app on a device.
 *
 * The distinction being tested: a *reading that is unavailable* is a normal
 * outcome and returns null, while a *bridge that is broken* is a programming
 * error and must throw. Collapsing the two is what made a renamed native
 * function degrade silently to a permanent "Not available".
 */

const mockModule: { getBatteryLevel?: unknown } = {};

jest.mock('./src/BatteryLevelModule', () => ({
  __esModule: true,
  get default() {
    return mockModule;
  },
}));

// Imported after the mock is registered. A static `import` would be hoisted
// above `jest.mock`, so `require` is load-order-significant here, not a style
// slip.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getBatteryLevel } = require('./index') as typeof import('./index');

describe('getBatteryLevel', () => {
  afterEach(() => {
    delete mockModule.getBatteryLevel;
    jest.restoreAllMocks();
  });

  it('returns the percentage the native module reports', async () => {
    mockModule.getBatteryLevel = jest.fn().mockResolvedValue(37);

    await expect(getBatteryLevel()).resolves.toBe(37);
  });

  it('passes through null when the platform has no reading', async () => {
    // The iOS Simulator case: the native side ran and had nothing to report.
    mockModule.getBatteryLevel = jest.fn().mockResolvedValue(null);

    await expect(getBatteryLevel()).resolves.toBeNull();
  });

  it('returns null when the native side fails to read', async () => {
    mockModule.getBatteryLevel = jest
      .fn()
      .mockRejectedValue(new Error('battery service unavailable'));
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(getBatteryLevel()).resolves.toBeNull();
  });

  it('throws when the native module does not expose the function', async () => {
    // The drift case: renamed in Kotlin, not in TypeScript. Must not be
    // swallowed as an ordinary unavailable reading.
    await expect(getBatteryLevel()).rejects.toThrow(/getBatteryLevel/);
  });

  it('names the cause in the error so the fix is obvious', async () => {
    await expect(getBatteryLevel()).rejects.toThrow(/drifted|rebuild/i);
  });

  it('throws rather than returning null when the export is not callable', async () => {
    mockModule.getBatteryLevel = 'not a function';

    await expect(getBatteryLevel()).rejects.toThrow();
  });
});
