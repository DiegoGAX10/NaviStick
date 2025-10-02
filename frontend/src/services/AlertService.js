import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';

// Configurar notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class AlertService {
  constructor() {
    this.soundObjects = new Map();
    this.notificationSettings = {
      obstacleDetected: true,
      stairDetected: true,
      connectionLost: true,
      lowBattery: true,
      systemError: true
    };
    this.initializeSounds();
  }

  async initializeSounds() {
    try {
      // Pre-cargar sonidos de alerta
      const alertSound = new Audio.Sound();
      const warningSound = new Audio.Sound();
      const errorSound = new Audio.Sound();

      // Para demo usamos sonidos del sistema, en producción usarías archivos de audio
      await alertSound.loadAsync(require('../../assets/sounds/alert.mp3').catch(() => ({
        uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav'
      })));
      
      await warningSound.loadAsync(require('../../assets/sounds/warning.mp3').catch(() => ({
        uri: 'https://www.soundjay.com/misc/sounds/fail-buzzer-02.wav'
      })));

      this.soundObjects.set('alert', alertSound);
      this.soundObjects.set('warning', warningSound);
      this.soundObjects.set('error', errorSound);

    } catch (error) {
      console.error('Error loading sounds:', error);
    }
  }

  // Configurar tipos de alertas
  setNotificationSettings(settings) {
    this.notificationSettings = { ...this.notificationSettings, ...settings };
  }

  // Alerta para obstáculos detectados
  async alertObstacle(distance, sensorType = 'ultrasonic') {
    if (!this.notificationSettings.obstacleDetected) return;

    const title = '⚠️ Obstáculo Detectado';
    const body = `${sensorType === 'ultrasonic' ? 'Sensor Ultrasónico' : 'Sensor ToF'} detectó un obstáculo a ${distance}cm`;
    
    await this.showAlert(title, body, 'warning');
    await this.playSound('alert');
    await this.scheduleNotification(title, body, 'obstacle');
  }

  // Alerta para escaleras/desniveles
  async alertStairway(distance) {
    if (!this.notificationSettings.stairDetected) return;

    const title = '🚨 Escalera/Desnivel Detectado';
    const body = `Precaución: Escalera o desnivel detectado a ${distance}cm hacia abajo`;
    
    await this.showAlert(title, body, 'error');
    await this.playSound('warning');
    await this.scheduleNotification(title, body, 'stair');
  }

  // Alerta de pérdida de conexión
  async alertConnectionLost() {
    if (!this.notificationSettings.connectionLost) return;

    const title = '📡 Conexión Perdida';
    const body = 'Se perdió la conexión con el ESP32. Intentando reconectar...';
    
    await this.showAlert(title, body, 'error');
    await this.scheduleNotification(title, body, 'connection');
  }

  // Alerta de conexión reestablecida
  async alertConnectionRestored() {
    const title = '✅ Conexión Reestablecida';
    const body = 'La conexión con el ESP32 ha sido reestablecida';
    
    await this.scheduleNotification(title, body, 'connection-restored');
  }

  // Alerta de batería baja
  async alertLowBattery(batteryLevel) {
    if (!this.notificationSettings.lowBattery) return;

    const title = '🔋 Batería Baja';
    const body = `Nivel de batería del bastón: ${batteryLevel}%. Por favor, recarga el dispositivo`;
    
    await this.showAlert(title, body, 'warning');
    await this.scheduleNotification(title, body, 'battery');
  }

  // Alerta de error del sistema
  async alertSystemError(error) {
    if (!this.notificationSettings.systemError) return;

    const title = '❌ Error del Sistema';
    const body = `Error detectado: ${error}`;
    
    await this.showAlert(title, body, 'error');
    await this.playSound('error');
    await this.scheduleNotification(title, body, 'error');
  }

  // Alerta de vibración activada
  async alertVibrationActivated(pattern, intensity) {
    const title = '📳 Vibración Activada';
    const body = `Patrón: ${pattern} - Intensidad: ${intensity}%`;
    
    await this.scheduleNotification(title, body, 'vibration');
  }

  // Mostrar alerta en pantalla
  async showAlert(title, message, type = 'info') {
    const buttons = [{ text: 'OK', style: 'default' }];
    
    if (type === 'error') {
      buttons.unshift({ text: 'Detalles', onPress: () => this.showErrorDetails(message) });
    }

    Alert.alert(title, message, buttons);
  }

  // Mostrar detalles de error
  showErrorDetails(error) {
    Alert.alert(
      'Detalles del Error',
      error,
      [
        { text: 'Reportar', onPress: () => this.reportError(error) },
        { text: 'Cerrar', style: 'cancel' }
      ]
    );
  }

  // Reportar error (funcionalidad futura)
  reportError(error) {
    console.log('Reporting error:', error);
    Alert.alert('Error Reportado', 'Gracias por reportar este error. El equipo técnico lo revisará.');
  }

  // Reproducir sonido de alerta
  async playSound(type) {
    try {
      const sound = this.soundObjects.get(type);
      if (sound) {
        await sound.replayAsync();
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  // Programar notificación local
  async scheduleNotification(title, body, identifier) {
    try {
      // Verificar permisos
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('No notification permissions');
        return;
      }

      // Evitar notificaciones duplicadas
      await Notifications.cancelScheduledNotificationAsync(identifier);

      // Programar notificación
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          vibrate: [0, 250, 250, 250],
        },
        trigger: null, // Mostrar inmediatamente
        identifier,
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }

  // Cancelar todas las notificaciones
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }

  // Configurar listener para cuando la app está en primer plano
  setForegroundNotificationListener(callback) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  // Configurar listener para respuesta a notificaciones
  setNotificationResponseListener(callback) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // Limpiar recursos
  async cleanup() {
    try {
      // Descargar sonidos
      for (const sound of this.soundObjects.values()) {
        await sound.unloadAsync();
      }
      this.soundObjects.clear();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  // Crear alerta de emergencia
  async emergencyAlert() {
    const title = '🚨 ALERTA DE EMERGENCIA';
    const body = 'Alerta de emergencia activada desde NaviStick';
    
    // Mostrar alerta modal
    Alert.alert(
      title,
      body,
      [
        { 
          text: 'Cancelar Alerta', 
          style: 'cancel',
          onPress: () => this.cancelEmergencyAlert()
        },
        { 
          text: 'Llamar Ayuda', 
          onPress: () => this.callForHelp() 
        }
      ]
    );

    // Reproducir sonido de emergencia
    await this.playSound('error');
    
    // Notificación persistente
    await this.scheduleNotification(title, body, 'emergency');
    
    // Vibrar dispositivo si está disponible
    try {
      const { Haptics } = require('expo-haptics');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      console.log('Haptics not available');
    }
  }

  cancelEmergencyAlert() {
    Notifications.cancelScheduledNotificationAsync('emergency');
    console.log('Emergency alert canceled');
  }

  callForHelp() {
    Alert.alert(
      'Llamar Ayuda',
      '¿Deseas llamar a servicios de emergencia?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Sí, llamar 911', 
          onPress: () => {
            // En una app real, esto abriría el marcador telefónico
            console.log('Calling emergency services...');
            Alert.alert('Simulación', 'En una aplicación real, esto llamaría a servicios de emergencia');
          }
        }
      ]
    );
  }

  // Test de todos los tipos de alerta
  async testAllAlerts() {
    console.log('Testing all alert types...');
    
    setTimeout(() => this.alertObstacle(45, 'ultrasonic'), 1000);
    setTimeout(() => this.alertStairway(80), 3000);
    setTimeout(() => this.alertConnectionLost(), 5000);
    setTimeout(() => this.alertLowBattery(15), 7000);
    setTimeout(() => this.alertSystemError('Sensor malfunction detected'), 9000);
  }
}

export default new AlertService();