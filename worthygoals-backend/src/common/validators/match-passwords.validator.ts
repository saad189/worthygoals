import {
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'MatchPasswords', async: false })
export class MatchPasswords implements ValidatorConstraintInterface {
    validate(repeatedPassword: string, args: ValidationArguments) {
        const object = args.object as any;
        return repeatedPassword === object.password;
    }

    defaultMessage(args: ValidationArguments) {
        return 'Passwords do not match!';
        //  return 'Password and repeatedPassword must match!';
    }
}
