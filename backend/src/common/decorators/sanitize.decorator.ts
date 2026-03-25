import { Transform } from 'class-transformer';
import sanitizeHtml from 'sanitize-html';

export function Sanitize() {
  return Transform(({ value }) =>
    typeof value === 'string'
      ? sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} })
      : value,
  );
}
