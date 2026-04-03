import { useField, useFormikContext } from 'formik';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface FormikSelectProps {
  readonly name: string;
  readonly label: string;
  readonly placeholder?: string;
  readonly options: { value: string; label: string }[];
}

export function FormikSelect({ name, label, placeholder, options }: FormikSelectProps) {
  const [field, meta] = useField(name);
  const { setFieldValue } = useFormikContext();

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Select
        value={field.value}
        onValueChange={(value) => setFieldValue(name, value)}
      >
        <SelectTrigger className={meta.touched && meta.error ? 'border-destructive' : ''}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {meta.touched && meta.error && (
        <p className="text-sm text-destructive">{meta.error}</p>
      )}
    </div>
  );
}
