const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';

export function generateRandomPassword(length = 12): string {
  let result = '';
  const charsLength = CHARS.length;
  
  for (let i = 0; i < length; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * charsLength));
  }
  
  return result;
}
