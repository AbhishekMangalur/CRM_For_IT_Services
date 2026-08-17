export const PASSWORD_REQUIREMENTS_MESSAGE =
  "Password must be at least 8 characters and contain at least one uppercase letter, one number, and one special character.";

export function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^\w\s]/.test(password)
  );
}
