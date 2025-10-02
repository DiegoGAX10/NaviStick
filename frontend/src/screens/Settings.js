import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  StatusBar
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ESP32Service from '../services/ESP32Service';

const Settings = ({ navigation }) => {
  const [esp32IP, setESP32IP] = useState('192.168.1.100');
  const [ultrasonicThreshold, setUltrasonicThreshold] = useState('100');
  const [tofThreshold, setTOFThreshold] = useState('50');
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [soundAlertsEnabled, setSoundAlertsEnabled] = useState(true);
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [debugMode, setDebugMode] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    loadSettings();
    
    // Monitor connection status
    const checkConnection = () => {
      const status = ESP32Service.getConnectionStatus();
      setIsConnected(status.isConnected);
    };

    const interval = setInterval(checkConnection, 2000);
    
    // Listener for connection changes
    const handleConnectionChange = (data) => {
      setIsConnected(data.status === 'connected');
    };

    ESP32Service.addListener('connection', handleConnectionChange);

    return () => {
      clearInterval(interval);
      ESP32Service.removeListener('connection', handleConnectionChange);
    };
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.multiGet([
        'esp32_ip',
        'ultrasonic_threshold',
        'tof_threshold',
        'vibration_enabled',
        'sound_alerts_enabled',
        'auto_reconnect',
        'debug_mode'
      ]);

      savedSettings.forEach(([key, value]) => {
        if (value !== null) {
          switch (key) {
            case 'esp32_ip':
              setESP32IP(value);
              break;
            case 'ultrasonic_threshold':
              setUltrasonicThreshold(value);
              break;
            case 'tof_threshold':
              setTOFThreshold(value);
              break;
            case 'vibration_enabled':
              setVibrationEnabled(JSON.parse(value));
              break;
            case 'sound_alerts_enabled':
              setSoundAlertsEnabled(JSON.parse(value));
              break;
            case 'auto_reconnect':
              setAutoReconnect(JSON.parse(value));
              break;
            case 'debug_mode':
              setDebugMode(JSON.parse(value));
              break;
          }
        }
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.multiSet([
        ['esp32_ip', esp32IP],
        ['ultrasonic_threshold', ultrasonicThreshold],
        ['tof_threshold', tofThreshold],
        ['vibration_enabled', JSON.stringify(vibrationEnabled)],
        ['sound_alerts_enabled', JSON.stringify(soundAlertsEnabled)],
        ['auto_reconnect', JSON.stringify(autoReconnect)],
        ['debug_mode', JSON.stringify(debugMode)]
      ]);

      Alert.alert('Éxito', 'Configuración guardada correctamente');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'No se pudo guardar la configuración');
    }
  };

  const handleIPChange = () => {
    // Validar formato de IP
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(esp32IP)) {
      Alert.alert('Error', 'Formato de IP inválido');
      return;
    }

    ESP32Service.setESP32IP(esp32IP);
    Alert.alert('Éxito', 'IP del ESP32 actualizada. Reconectando...');
    
    // Reconectar con la nueva IP
    setTimeout(() => {
      ESP32Service.disconnect();
      setTimeout(() => {
        ESP32Service.connectWebSocket();
      }, 1000);
    }, 500);
  };

  const handleTestConnection = async () => {
    try {
      ESP32Service.setESP32IP(esp32IP);
      ESP32Service.connectWebSocket();
      Alert.alert('Prueba de Conexión', 'Intentando conectar...');
    } catch (error) {
      Alert.alert('Error', 'No se pudo probar la conexión');
    }
  };

  const handleResetToDefaults = () => {
    Alert.alert(
      'Resetear Configuración',
      '¿Estás seguro de que deseas restaurar la configuración por defecto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Resetear',
          style: 'destructive',
          onPress: () => {
            setESP32IP('192.168.1.100');
            setUltrasonicThreshold('100');
            setTOFThreshold('50');
            setVibrationEnabled(true);
            setSoundAlertsEnabled(true);
            setAutoReconnect(true);
            setDebugMode(false);
          }
        }
      ]
    );
  };

  const handleExportLogs = () => {
    Alert.alert('Exportar Logs', 'Funcionalidad de exportación en desarrollo');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2c3e50" />
      
      {/* Header */}
      <LinearGradient
        colors={['#2c3e50', '#34495e']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Configuración</Text>
          <TouchableOpacity onPress={saveSettings}>
            <MaterialIcons name="save" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Connection Status */}
        <View style={styles.connectionIndicator}>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? '#27ae60' : '#e74c3c' }]} />
          <Text style={styles.statusText}>
            {isConnected ? 'Conectado al ESP32' : 'Desconectado'}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Conexión ESP32 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conexión ESP32</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Dirección IP del ESP32</Text>
            <View style={styles.ipInputContainer}>
              <TextInput
                style={styles.ipInput}
                value={esp32IP}
                onChangeText={setESP32IP}
                placeholder="192.168.1.100"
                keyboardType="numeric"
              />
              <TouchableOpacity style={styles.ipButton} onPress={handleIPChange}>
                <MaterialIcons name="check" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.actionButton} onPress={handleTestConnection}>
            <MaterialIcons name="wifi-tethering" size={20} color="#3498db" />
            <Text style={styles.actionButtonText}>Probar Conexión</Text>
          </TouchableOpacity>
        </View>

        {/* Configuración de Sensores */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración de Sensores</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Umbral Sensor Ultrasónico (cm)</Text>
            <TextInput
              style={styles.textInput}
              value={ultrasonicThreshold}
              onChangeText={setUltrasonicThreshold}
              placeholder="100"
              keyboardType="numeric"
            />
            <Text style={styles.settingDescription}>
              Distancia mínima para detectar obstáculos
            </Text>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Umbral Sensor ToF (cm)</Text>
            <TextInput
              style={styles.textInput}
              value={tofThreshold}
              onChangeText={setTOFThreshold}
              placeholder="50"
              keyboardType="numeric"
            />
            <Text style={styles.settingDescription}>
              Distancia mínima para detectar escaleras/desniveles
            </Text>
          </View>
        </View>

        {/* Alertas y Notificaciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alertas y Notificaciones</Text>
          
          <View style={styles.switchItem}>
            <View style={styles.switchContent}>
              <MaterialIcons name="vibration" size={20} color="#9b59b6" />
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchLabel}>Vibración Habilitada</Text>
                <Text style={styles.switchDescription}>
                  Permite que el motor vibre al detectar obstáculos
                </Text>
              </View>
            </View>
            <Switch
              value={vibrationEnabled}
              onValueChange={setVibrationEnabled}
              trackColor={{ false: '#d1d5db', true: '#9b59b6' }}
              thumbColor={vibrationEnabled ? '#8b5cf6' : '#f3f4f6'}
            />
          </View>

          <View style={styles.switchItem}>
            <View style={styles.switchContent}>
              <MaterialIcons name="volume-up" size={20} color="#f39c12" />
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchLabel}>Alertas Sonoras</Text>
                <Text style={styles.switchDescription}>
                  Reproducir sonidos de alerta en la aplicación
                </Text>
              </View>
            </View>
            <Switch
              value={soundAlertsEnabled}
              onValueChange={setSoundAlertsEnabled}
              trackColor={{ false: '#d1d5db', true: '#f39c12' }}
              thumbColor={soundAlertsEnabled ? '#f59e0b' : '#f3f4f6'}
            />
          </View>
        </View>

        {/* Configuración Avanzada */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración Avanzada</Text>
          
          <View style={styles.switchItem}>
            <View style={styles.switchContent}>
              <MaterialIcons name="autorenew" size={20} color="#27ae60" />
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchLabel}>Reconexión Automática</Text>
                <Text style={styles.switchDescription}>
                  Intentar reconectar automáticamente si se pierde la conexión
                </Text>
              </View>
            </View>
            <Switch
              value={autoReconnect}
              onValueChange={setAutoReconnect}
              trackColor={{ false: '#d1d5db', true: '#27ae60' }}
              thumbColor={autoReconnect ? '#10b981' : '#f3f4f6'}
            />
          </View>

          <View style={styles.switchItem}>
            <View style={styles.switchContent}>
              <MaterialIcons name="bug-report" size={20} color="#e74c3c" />
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchLabel}>Modo Debug</Text>
                <Text style={styles.switchDescription}>
                  Mostrar información adicional para depuración
                </Text>
              </View>
            </View>
            <Switch
              value={debugMode}
              onValueChange={setDebugMode}
              trackColor={{ false: '#d1d5db', true: '#e74c3c' }}
              thumbColor={debugMode ? '#ef4444' : '#f3f4f6'}
            />
          </View>
        </View>

        {/* Acciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleExportLogs}>
            <MaterialIcons name="file-download" size={20} color="#3498db" />
            <Text style={styles.actionButtonText}>Exportar Logs</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dangerButton} onPress={handleResetToDefaults}>
            <MaterialIcons name="restore" size={20} color="#e74c3c" />
            <Text style={styles.dangerButtonText}>Restaurar por Defecto</Text>
          </TouchableOpacity>
        </View>

        {/* Información de la App */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información</Text>
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>NaviStick v1.0.0</Text>
            <Text style={styles.infoText}>Sistema de Asistencia para Movilidad</Text>
            <Text style={styles.infoText}>Desarrollado con React Native</Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  connectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: 'white',
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  settingItem: {
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  settingDescription: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  ipInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ipInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    marginRight: 8,
  },
  ipButton: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  switchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  switchDescription: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#e8f4fd',
    marginBottom: 8,
  },
  actionButtonText: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '500',
    color: '#3498db',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },
  dangerButtonText: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '500',
    color: '#e74c3c',
  },
  infoContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  infoText: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 4,
  },
  bottomSpacer: {
    height: 40,
  },
});

export default Settings;