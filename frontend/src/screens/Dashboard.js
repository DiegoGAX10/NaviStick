import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  RefreshControl,
  StatusBar 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ESP32Service from '../services/ESP32Service';
import UltrasonicSensor from '../components/UltrasonicSensor';
import ToFSensor from '../components/ToFSensor';
import VibratorMotor from '../components/VibratorMotor';
import NavigationSensor from '../components/NavigationSensor';

const Dashboard = ({ navigation }) => {
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    reconnectAttempts: 0,
    baseUrl: ''
  });
  const [systemStatus, setSystemStatus] = useState({
    battery: 0,
    temperature: 0,
    uptime: 0,
    errors: []
  });
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    // Inicializar conexión al ESP32
    initializeConnection();

    // Listener para cambios en el estado de conexión
    const handleConnectionChange = (data) => {
      setConnectionStatus(prev => ({
        ...prev,
        isConnected: data.status === 'connected',
        lastStatus: data.status
      }));

      if (data.status === 'connected') {
        fetchSystemStatus();
      }

      // Actualizar timestamp de última conexión
      setLastUpdate(new Date());
    };

    ESP32Service.addListener('connection', handleConnectionChange);

    return () => {
      ESP32Service.removeListener('connection', handleConnectionChange);
    };
  }, []);

  const initializeConnection = async () => {
    try {
      // Obtener estado actual de conexión
      const status = ESP32Service.getConnectionStatus();
      setConnectionStatus(status);

      // Intentar conectar WebSocket
      ESP32Service.connectWebSocket();
      
      // Intentar obtener estado del sistema
      if (status.isConnected) {
        await fetchSystemStatus();
      }
    } catch (error) {
      console.error('Error inicializando conexión:', error);
    }
  };

  const fetchSystemStatus = async () => {
    try {
      const status = await ESP32Service.getSystemStatus();
      setSystemStatus(status);
    } catch (error) {
      console.error('Error obteniendo estado del sistema:', error);
      setSystemStatus(prev => ({
        ...prev,
        errors: [...prev.errors, 'Error obteniendo estado del sistema']
      }));
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await initializeConnection();
      await fetchSystemStatus();
    } catch (error) {
      console.error('Error en refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleReconnect = async () => {
    try {
      ESP32Service.disconnect();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
      ESP32Service.connectWebSocket();
    } catch (error) {
      console.error('Error reconectando:', error);
      Alert.alert('Error', 'No se pudo reconectar al ESP32');
    }
  };

  const handleCalibrateSystem = async () => {
    Alert.alert(
      'Calibrar Sistema',
      '¿Deseas calibrar todos los sensores del bastón?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Calibrar',
          onPress: async () => {
            try {
              await ESP32Service.calibrateSensors();
              Alert.alert('Éxito', 'Sistema calibrado correctamente');
            } catch (error) {
              Alert.alert('Error', 'No se pudo calibrar el sistema');
            }
          }
        }
      ]
    );
  };

  const getConnectionStatusColor = () => {
    if (connectionStatus.isConnected) return '#27ae60';
    if (connectionStatus.reconnectAttempts > 0) return '#f39c12';
    return '#e74c3c';
  };

  const getConnectionStatusText = () => {
    if (connectionStatus.isConnected) return 'Conectado';
    if (connectionStatus.reconnectAttempts > 0) return `Reconectando... (${connectionStatus.reconnectAttempts})`;
    return 'Desconectado';
  };

  const getBatteryColor = (level) => {
    if (level > 50) return '#27ae60';
    if (level > 20) return '#f39c12';
    return '#e74c3c';
  };

  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
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
          <Text style={styles.headerTitle}>NaviStick Monitor</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <MaterialIcons name="settings" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Estado de conexión */}
        <View style={styles.connectionStatus}>
          <View style={[styles.connectionDot, { backgroundColor: getConnectionStatusColor() }]} />
          <Text style={styles.connectionText}>{getConnectionStatusText()}</Text>
          <Text style={styles.connectionUrl}>{connectionStatus.baseUrl}</Text>
          {!connectionStatus.isConnected && (
            <TouchableOpacity style={styles.reconnectButton} onPress={handleReconnect}>
              <MaterialIcons name="refresh" size={16} color="white" />
              <Text style={styles.reconnectText}>Reconectar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Información del sistema */}
        {connectionStatus.isConnected && (
          <View style={styles.systemInfo}>
            <View style={styles.systemItem}>
              <MaterialIcons name="battery-std" size={16} color={getBatteryColor(systemStatus.battery)} />
              <Text style={styles.systemText}>{systemStatus.battery}%</Text>
            </View>
            <View style={styles.systemItem}>
              <MaterialIcons name="device-thermostat" size={16} color="#3498db" />
              <Text style={styles.systemText}>{systemStatus.temperature}°C</Text>
            </View>
            <View style={styles.systemItem}>
              <MaterialIcons name="schedule" size={16} color="#9b59b6" />
              <Text style={styles.systemText}>{formatUptime(systemStatus.uptime)}</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      {/* Contenido principal */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3498db']}
            tintColor="#3498db"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Botones de control */}
        <View style={styles.controlButtons}>
          <TouchableOpacity 
            style={[styles.controlButton, styles.calibrateButton]}
            onPress={handleCalibrateSystem}
            disabled={!connectionStatus.isConnected}
          >
            <MaterialIcons name="tune" size={20} color="white" />
            <Text style={styles.controlButtonText}>Calibrar Sistema</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.controlButton, styles.emergencyButton]}
            onPress={async () => {
              try {
                await ESP32Service.activateVibration('alert', 100);
              } catch (error) {
                Alert.alert('Error', 'No se pudo activar la alerta');
              }
            }}
            disabled={!connectionStatus.isConnected}
          >
            <MaterialIcons name="warning" size={20} color="white" />
            <Text style={styles.controlButtonText}>Alerta de Emergencia</Text>
          </TouchableOpacity>
        </View>

        {/* Componentes de sensores */}
        <UltrasonicSensor />
        <ToFSensor />
        <VibratorMotor />
        <NavigationSensor />

        {/* Errores del sistema */}
        {systemStatus.errors.length > 0 && (
          <View style={styles.errorsContainer}>
            <Text style={styles.errorsTitle}>Errores del Sistema</Text>
            {systemStatus.errors.map((error, index) => (
              <View key={index} style={styles.errorItem}>
                <MaterialIcons name="error" size={16} color="#e74c3c" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer con información */}
        <View style={styles.footer}>
          {lastUpdate && (
            <Text style={styles.footerText}>
              Última actualización: {lastUpdate.toLocaleTimeString()}
            </Text>
          )}
          <Text style={styles.footerText}>
            NaviStick v1.0 - Sistema de Asistencia para Movilidad
          </Text>
        </View>
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
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  connectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  connectionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 12,
  },
  connectionUrl: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    flex: 1,
  },
  reconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  reconnectText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 4,
  },
  systemInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  systemItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  systemText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  calibrateButton: {
    backgroundColor: '#3498db',
  },
  emergencyButton: {
    backgroundColor: '#e74c3c',
  },
  controlButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 12,
  },
  errorsContainer: {
    backgroundColor: '#fee2e2',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
    marginVertical: 16,
  },
  errorsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 12,
  },
  errorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  errorText: {
    color: '#dc2626',
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 4,
  },
});

export default Dashboard;