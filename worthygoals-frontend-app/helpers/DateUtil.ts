
import { endOfDay, differenceInMilliseconds } from 'date-fns';
import { differenceInYears } from "date-fns";

export const formatDateToDDMMYYYY = (date: Date): string => {
    const newDate = new Date(date);
    const day = newDate.getDate();
    const month = newDate.getMonth() + 1;
    const year = newDate.getFullYear();

    return `${day}-${month}-${year}`;
}

export const createTodayDateFromTime = (time: string): Date => {
    const today = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    today.setHours(hours, minutes, 0, 0);
    return today;
}

export const formatDateToTime = (oldDate: Date): string => {
    const date = new Date(oldDate);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;

    return `${hours}:${minutesStr} ${ampm}`;
}

/**
 * 
 * @returns get time left till the end of day in milliseconds;
 */
export function getTimeLeftTillEndOfDay(): number {
    const now = new Date();
    const end = endOfDay(now); // gets a Date object representing the end of today
    return differenceInMilliseconds(end, now);
}


export function calculateAge(dob: string) {
    return differenceInYears(new Date(), new Date(dob));
}