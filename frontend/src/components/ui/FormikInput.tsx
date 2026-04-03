import { useField } from 'formik';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FormikInputProps {
  readonly name: string;
  readonly label: string;
  readonly type?: string;
  readonly placeholder?: string;
}

export function FormikInput({ name, label, type = 'text', placeholder }: FormikInputProps) {
  const [field, meta] = useField(name);
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        type={type}
        placeholder={placeholder}
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
