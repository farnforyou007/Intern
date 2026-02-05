export function generateInviteCode(siteName: string) {
    const prefix = siteName.substring(0, 3).toUpperCase();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${randomNum}`;
}