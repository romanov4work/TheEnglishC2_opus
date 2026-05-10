import * as Haptics from 'expo-haptics';

export function hapticSuccess() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export function hapticError() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

export function hapticLight() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function hapticMedium() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export function playCorrectSound() {
  // Placeholder for sound - можно добавить expo-av позже
  console.log('✓ Correct sound');
}

export function playWrongSound() {
  // Placeholder for sound - можно добавить expo-av позже
  console.log('✗ Wrong sound');
}
