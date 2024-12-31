import { GoalCategory } from "@/models";

export function getEnumValues<T>(enumObj: T): (T[keyof T])[] {
    return Object.values(enumObj as any) as (T[keyof T])[];
}

export function capitalizeFirstLetter(str: string): string {
    if (!str) return str;
    const newStr = `${str}`
    return newStr.charAt(0).toUpperCase() + newStr.slice(1);
}

const images = [
    {
        category: 'power',
        imageUri: 'https://images.pexels.com/photos/1199590/pexels-photo-1199590.jpeg',

    },
    {
        category: 'spiritual',
        imageUri: 'https://images.pexels.com/photos/733162/pexels-photo-733162.jpeg',

    },
    {
        category: 'knowledge',
        imageUri: 'https://images.pexels.com/photos/4761792/pexels-photo-4761792.jpeg',

    },
];

export function getImageUri(category: GoalCategory): string {
    return images.find(image => image.category == category.toLowerCase())?.imageUri || '';
}