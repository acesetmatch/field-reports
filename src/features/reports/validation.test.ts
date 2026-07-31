import {
  BODY_MIN_LENGTH,
  TITLE_MAX_LENGTH,
  TITLE_MIN_LENGTH,
  validateReportForm,
} from './validation';

const valid = {
  title: 'Generator fault at site 7',
  description: 'Generator tripped at 0400 and failed to restart.',
};

describe('validateReportForm', () => {
  it('accepts a well-formed report', () => {
    const { isValid, errors } = validateReportForm(valid);

    expect(isValid).toBe(true);
    expect(errors).toEqual({ title: null, description: null });
  });

  it('rejects empty fields and names each one', () => {
    const { isValid, errors } = validateReportForm({
      title: '',
      description: '',
    });

    expect(isValid).toBe(false);
    expect(errors.title).toBe('Title is required.');
    expect(errors.description).toBe('Description is required.');
  });

  it('treats whitespace-only input as empty', () => {
    // A report of spaces passes a naive `length > 0` check but carries no
    // information, so it must be rejected the same way a blank field is.
    const { isValid, errors } = validateReportForm({
      title: '   ',
      description: '\n\t  ',
    });

    expect(isValid).toBe(false);
    expect(errors.title).toBe('Title is required.');
    expect(errors.description).toBe('Description is required.');
  });

  it('rejects input below the minimum length', () => {
    const { isValid, errors } = validateReportForm({
      title: 'a'.repeat(TITLE_MIN_LENGTH - 1),
      description: 'b'.repeat(BODY_MIN_LENGTH - 1),
    });

    expect(isValid).toBe(false);
    expect(errors.title).toContain(`at least ${TITLE_MIN_LENGTH}`);
    expect(errors.description).toContain(`at least ${BODY_MIN_LENGTH}`);
  });

  it('rejects input above the maximum length', () => {
    const { isValid, errors } = validateReportForm({
      ...valid,
      title: 'a'.repeat(TITLE_MAX_LENGTH + 1),
    });

    expect(isValid).toBe(false);
    expect(errors.title).toContain(`${TITLE_MAX_LENGTH} characters or fewer`);
  });

  it('measures length after trimming, not before', () => {
    // Padding must not be able to push a too-short title over the minimum.
    const { isValid } = validateReportForm({
      ...valid,
      title: `  ${'a'.repeat(TITLE_MIN_LENGTH - 1)}  `,
    });

    expect(isValid).toBe(false);
  });

  it('reports one field invalid without invalidating the other', () => {
    const { isValid, errors } = validateReportForm({ ...valid, title: '' });

    expect(isValid).toBe(false);
    expect(errors.title).not.toBeNull();
    expect(errors.description).toBeNull();
  });
});
