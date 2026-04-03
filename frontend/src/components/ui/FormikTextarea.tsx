import { useField } from 'formik';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface FormikTextareaProps {
  readonly name: string;
  readonly label: string;
  readonly placeholder?: string;
  readonly rows?: number;
}

export function FormikTextarea({ name, label, placeholder, rows }: FormikTextareaProps) {
  const [field, meta] = useField(name);
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Textarea
        id={name}
        placeholder={placeholder}
        rows={rows}
        {...field}
        aria-invalid={meta.touched && !!meta.error}
        className={meta.touched && meta.error ? 'border-destructive' : ''}
      />
      {meta.touched && meta.error && (
        <p className="text-sm text-destructive">{meta.error}</p>
      )}
    </div>
  );
}
