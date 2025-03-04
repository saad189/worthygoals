import Storage from '@/helpers/StorageUtilAsync';

export const getCachedData = async (cacheKey: string): Promise<any | null> => {
    return Storage.getItem(cacheKey);
};


export const setCachedData = async (cacheKey: string, data: any, expiry?: number) => {
    await Storage.setItem(cacheKey, data, expiry);
};


export const removeCachedData = async (cacheKey: string) => {
    await Storage.removeItem(cacheKey);
}