import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ESP32Service from '../services/ESP32Service';

const UltrasonicSensor = () => {
  const [sensorData, setSensorData] = useState({
    distance: 0,
    obstacle: false,
    timestamp: null,
    isActive: false
  });

  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    // Listener para datos del sensor ultrasónico
    const handleUltrasonicData = (data) => {
      setSensorData({
        ...data,
        isActive: true
      });

      // Animación de pulso cuando detecta obstáculo
      if (data.obstacle) {
        startPulseAnimation();
      }

      // Auto-desactivar después de 3 segundos sin datos
      setTimeout(() => {
        setSensorData(prev => ({ ...prev, isActive: false }));
      }, 3000);
    };

    ESP32Service.addListener('ultrasonic', handleUltrasonicData);

    return () => {
      ESP32Service.removeListener('ultrasonic', handleUltrasonicData);
    };
  }, []);

  const startPulseAnimation = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.3,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getStatusColor = () => {
    if (!sensorData.isActive) return '#95a5a6';
    if (sensorData.obstacle) return '#e74c3c';
    return '#27ae60';
  };

  const getStatusText = () => {
    if (!sensorData.isActive) return 'Inactivo';
    if (sensorData.obstacle) return 'Obstáculo Detectado';
    return 'Vía Libre';
  };

  const formatDistance = (distance) => {
    if (distance >= 100) return `${(distance / 100).toFixed(1)}m`;
    return `${distance}cm`;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[getStatusColor() + '20', getStatusColor() + '10']}
        style={styles.card}
      >
        <View style={styles.header}>
          <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
            <MaterialIcons 
              name="sensors" 
              size={24} 
              color={getStatusColor()} 
            />
          </Animated.View>
          <Text style={styles.title}>Sensor Ultrasónico</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.distanceContainer}>
            <Text style={[styles.distanceValue, { color: getStatusColor() }]}>
              {formatDistance(sensorData.distance)}
            </Text>
            <Text style={styles.distanceLabel}>Distancia</Text>
          </View>

          <View style={styles.statusContainer}>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>

          {sensorData.obstacle && (
            <View style={styles.alertContainer}>
              <MaterialIcons name="warning" size={20} color="#e74c3c" />
              <Text style={styles.alertText}>
                ¡Precaución! Obstáculo a {formatDistance(sensorData.distance)}
              </Text>
            </View>
          )}
        </View>

        {sensorData.timestamp && (
          <Text style={styles.timestamp}>
            Última actualización: {new Date(sensorData.timestamp).toLocaleTimeString()}
          </Text>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  content: {
    marginBottom: 12,
  },
  distanceContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  distanceValue: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  distanceLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    textTransform: 'uppercase',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  alertContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  alertText: {
    marginLeft: 8,
    color: '#dc2626',
    fontWeight: '500',
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: '#95a5a6',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default UltrasonicSensor;