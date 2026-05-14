function mapDays(days: number): string {
    if (days < 8) {
        return `${days} Days`;
    } else if (days < 30) {
        const weeks = Math.ceil(days / 7);
        return `${weeks} Weeks`;
    } else {
        const months = Math.ceil(days / 30);
        return `${months} Months`;
    }
}

export default mapDays;