import * as Location from 'expo-location';
import { getCachedData, setCachedData } from './CacheUtil';
import { LocationCoordinates } from '@/models';
import { getTimeLeftTillEndOfDay } from './DateUtil';
import { USER_LOCATION } from '@/constants';

/**
 * Best-effort read of the user's coordinates.
 *
 * Location is optional everywhere it lands: the column is nullable, the
 * backend DTO marks latitude/longitude optional, and no feature requires
 * them yet. So a refused permission returns null — it must never block,
 * loop, or close the app. It previously did all three: a permanently
 * denied permission raised a non-cancelable alert whose *both* buttons
 * called BackHandler.exitApp(), and a plain denial recursed into an
 * endless modal. The only live caller is the mandatory profile step,
 * which has no back affordance, so that was an unrecoverable exit.
 *
 * @returns coordinates, or null when unavailable for any reason.
 */
export async function getUserLocationAsync(): Promise<LocationCoordinates | null> {
    const cachedData = await getCachedData(USER_LOCATION);
    if (cachedData) return cachedData;

    const coords = await getUserLocaltionLocal();
    if (coords) setCachedData(USER_LOCATION, coords, getTimeLeftTillEndOfDay());
    return coords;
}

export async function getUserLocaltionLocal(): Promise<LocationCoordinates | null> {
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== Location.PermissionStatus.GRANTED) return null;

        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });

        return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
        };
    } catch (error: any) {
        console.warn('Could not fetch user location:', error?.message ?? error);
        return null;
    }
}

/**
 * Checks whether location permission is already granted, without prompting.
 */
export async function hasLocationPermissionAsync(): Promise<boolean> {
    try {
        const { status } = await Location.getForegroundPermissionsAsync();
        return status === 'granted';
    } catch (error: any) {
        console.error('Error checking location permission:', error);
        return false;
    }
}
