import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return false;
  return true;
}

export async function scheduleMaintenanceNotification(title, dateObject) {
  const triggerDate = new Date(dateObject);
  triggerDate.setDate(triggerDate.getDate() - 1); // Remind 1 day before
  triggerDate.setHours(9, 0, 0, 0); // At 9:00 AM

  if (triggerDate < new Date()) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🚗 Maintenance Reminder",
      body: `Tomorrow: ${title} is due. Tap to check.`,
      sound: true,
    },
    trigger: triggerDate,
  });
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}