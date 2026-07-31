import { remoteReportListSchema, toBodyPreview } from './types';

const report = { userId: 1, id: 1, title: 'Title', body: 'Body' };

describe('remoteReportListSchema', () => {
  it('accepts a well-formed payload', () => {
    const result = remoteReportListSchema.safeParse([report]);

    expect(result.success).toBe(true);
  });

  it('rejects a payload with a missing field', () => {
    const { body: _omitted, ...withoutBody } = report;

    expect(remoteReportListSchema.safeParse([withoutBody]).success).toBe(false);
  });

  it('rejects a payload with a wrong-typed field', () => {
    // The realistic failure: an API starts returning ids as strings. Casting
    // with `as` would let this through and fail later, somewhere unrelated.
    const result = remoteReportListSchema.safeParse([{ ...report, id: '1' }]);

    expect(result.success).toBe(false);
  });

  it('rejects a response that is not a list', () => {
    expect(remoteReportListSchema.safeParse(report).success).toBe(false);
  });
});

describe('toBodyPreview', () => {
  it('returns short bodies unchanged', () => {
    expect(toBodyPreview('A short report.')).toBe('A short report.');
  });

  it('collapses the newlines the API embeds in body text', () => {
    expect(toBodyPreview('first line\nsecond line')).toBe(
      'first line second line',
    );
  });

  it('truncates on a word boundary and appends an ellipsis', () => {
    const preview = toBodyPreview('alpha bravo charlie delta', 14);

    // 14 characters would land mid-"charlie"; it should back off to the space.
    expect(preview).toBe('alpha bravo…');
  });

  it('truncates mid-word only when there is no space to back off to', () => {
    expect(toBodyPreview('supercalifragilistic', 10)).toBe('supercalif…');
  });

  it('does not truncate a body exactly at the limit', () => {
    expect(toBodyPreview('abcde', 5)).toBe('abcde');
  });
});
