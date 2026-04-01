import axios from 'axios';

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data?.message;
    if (typeof msg === 'string') return msg;
    if (typeof msg === 'object' && msg !== null && 'message' in msg) {
      return (msg as { message: string }).message;
    }
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}
