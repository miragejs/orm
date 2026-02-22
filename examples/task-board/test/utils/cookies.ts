export function setUserCookie(userId: string): void {
  document.cookie = `userId=${userId}`;
}

export function clearUserCookie(): void {
  document.cookie = 'userId=; Max-Age=0';
}
