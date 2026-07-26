declare module "unicode-confusables" {
  export interface ConfusableCharacter {
    point: string;
    similarTo?: string;
  }

  export function isConfusing(value: string): boolean;
  export function confusables(value: string): ConfusableCharacter[];
  export function rectifyConfusion(value: string): string;
}
