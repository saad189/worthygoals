import * as Location from 'expo-location';
import { getCachedData, setCachedData } from './CacheUtil';
import { LocationCoordinates } from '@/models';
import { getTimeLeftTillEndOfDay } from './DateUtil';
import { USER_LOCATION } from '@/constants';
import { Alert, BackHandler, Linking } from 'react-native';

/**
 * Checks for existing location permission and requests it if not granted.
 * Then retrieves the user's current location.
 * 
 * @returns {Promise<LocationCoordinates>} An object containing `latitude` and `longitude`.
 * @throws An error if permission is denied or there's an issue fetching location.
 */
export async function getUserLocationAsync(): Promise<LocationCoordinates> {
    const cacheKey = USER_LOCATION;
    const cachedData = await getCachedData(cacheKey);

    return cachedData ? cachedData : await getUserLocaltionLocal()
        .then(data => { setCachedData(cacheKey, data, getTimeLeftTillEndOfDay()); return data });
}

export async function getUserLocaltionLocal(): Promise<LocationCoordinates> {
    try {
        // Request foreground location permission.
        const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();

        if (status !== Location.PermissionStatus.GRANTED) {
            if (!canAskAgain) {
                // User has chosen "Never ask again" (or similar), prompt them to open settings.
                Alert.alert(
                    'Location Permission Required',
                    'This app needs location access to function. Please enable it in your device settings. The app will now close.',
                    [
                        { text: 'Cancel', style: 'cancel', onPress: () => BackHandler.exitApp() },
                        { text: 'Open Settings', onPress: () => { Linking.openSettings(); BackHandler.exitApp(); } },
                    ],
                    { cancelable: false }
                );
            } else {
                // If the user simply denied the permission, prompt them again.

                return new Promise<LocationCoordinates>((resolve, reject) => {
                    Alert.alert(
                        'Location Permission Required',
                        'Location permission is required for this app to work properly. Please allow location access.',
                        [
                            {
                                text: 'OK',
                                onPress: async () => {
                                    try {
                                        const result = await getUserLocaltionLocal();
                                        resolve(result);
                                    } catch (error) {
                                        reject(error);
                                    }
                                },
                            },
                        ],
                        { cancelable: false }
                    );
                });
            }
            // Throw an error to halt further execution if permission isn't granted.
            throw new Error('Location permission not granted');
        }

        // With permission granted, fetch the current position.
        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });

        return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
        };
    } catch (error: any) {
        console.error('Error fetching user location:', error);
        throw new Error(error?.message ?? 'An error occurred while fetching location');
    }
}

/**
 * Optional: Helper function to check if location permission is already granted,
 * without prompting the user.
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
