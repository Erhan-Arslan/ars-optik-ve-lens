import { registerDecorator, type ValidationOptions } from 'class-validator';

/** Number must be a multiple of `step` (e.g. 0.25 D for lens powers, 0.5 mm for PD). */
export function IsStepOf(step: number, validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isStepOf',
      target: object.constructor,
      propertyName,
      constraints: [step],
      options: { message: `${propertyName} ${step} adımlarıyla girilmelidir`, ...validationOptions },
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'number') return false;
          const ratio = value / step;
          return Math.abs(ratio - Math.round(ratio)) < 1e-9;
        },
      },
    });
  };
}
