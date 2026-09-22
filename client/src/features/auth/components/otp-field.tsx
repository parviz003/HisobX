import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

type OtpFieldProps = {
  value: string;
  onChange: (value: string) => void;
  /** 6 raqam to'lganda chaqiriladi (avtomatik yuborish). */
  onComplete: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  label: string;
};

/**
 * 6 katakli kod maydoni.
 * Telefonda raqamli klaviatura ochiladi, SMS/Telegram kodini avtomatik
 * to'ldirish (`one-time-code`) va paste qo'llab-quvvatlanadi.
 */
export function OtpField({
  value,
  onChange,
  onComplete,
  disabled,
  invalid,
  label,
}: OtpFieldProps) {
  return (
    <InputOTP
      maxLength={6}
      value={value}
      onChange={onChange}
      onComplete={onComplete}
      disabled={disabled}
      inputMode="numeric"
      autoComplete="one-time-code"
      aria-label={label}
      aria-invalid={invalid}
      containerClassName="justify-center"
    >
      <InputOTPGroup className="gap-2">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <InputOTPSlot
            key={index}
            index={index}
            className="tabular size-12 rounded-xl border text-lg font-semibold"
            aria-invalid={invalid}
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}
