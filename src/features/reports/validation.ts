/**
 * Validation for the create-report form.
 *
 * A pure function rather than a form library: two fields, no async rules, no
 * cross-field dependencies. Keeping it pure means the submit button's disabled
 * state and the inline error messages read from one source, and it can be
 * unit-tested without a renderer.
 */

export const TITLE_MIN_LENGTH = 4;
export const TITLE_MAX_LENGTH = 100;
export const BODY_MIN_LENGTH = 10;
export const BODY_MAX_LENGTH = 2000;

export type ReportFormValues = {
  title: string;
  description: string;
};

/** `null` means the field is valid. */
export type ReportFormErrors = {
  [Field in keyof ReportFormValues]: string | null;
};

export type ReportFormValidation = {
  errors: ReportFormErrors;
  isValid: boolean;
};

export function validateReportForm(
  values: ReportFormValues,
): ReportFormValidation {
  const errors: ReportFormErrors = {
    title: validateField('Title', values.title, TITLE_MIN_LENGTH, TITLE_MAX_LENGTH),
    description: validateField(
      'Description',
      values.description,
      BODY_MIN_LENGTH,
      BODY_MAX_LENGTH,
    ),
  };

  return {
    errors,
    isValid: Object.values(errors).every((error) => error === null),
  };
}

function validateField(
  label: string,
  value: string,
  minLength: number,
  maxLength: number,
): string | null {
  // Trimmed throughout: a report of nothing but spaces is empty, not valid.
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return `${label} is required.`;
  }
  if (trimmed.length < minLength) {
    return `${label} must be at least ${minLength} characters.`;
  }
  if (trimmed.length > maxLength) {
    return `${label} must be ${maxLength} characters or fewer.`;
  }
  return null;
}
