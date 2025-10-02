import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ESP32Service from '../services/ESP32Service';

const NavigationSensor = () => {
  const [gpsData, setGpsData] = useState({
    latitude: 0,
    longitude: 0,
    accuracy: 0,
    timestamp: null,
    isActive: false
  });

  const [imuData, setIMUData] = useState({
    acceleration: { x: 0, y: 0, z: 0 },
    gyroscope: { x: 0, y: 0, z: 0 },
    orientation: 0,
    timestamp: null,
    isActive: false
  });

  const [compassAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    // Listener para datos GPS
    const handleGPSData = (data) => {
      setGpsData({
        ...data,
        isActive: true
      });

      // Auto-desactivar después de 5 segundos sin datos
      setTimeout(() => {
        setGpsData(prev => ({ ...prev, isActive: false }));
      }, 5000);
    };

    // Listener para datos IMU
    const handleIMUData = (data) => {
      setIMUData({
        ...data,
        isActive: true
      });

      // Animar brújula basado en orientación
      animateCompass(data.orientation);
      startPulseAnimation();

      // Auto-desactivar después de 3 segundos sin datos
      setTimeout(() => {
        setIMUData(prev => ({ ...prev, isActive: false }));
      }, 3000);
    };

    ESP32Service.addListener('gps', handleGPSData);
    ESP32Service.addListener('imu', handleIMUData);

    return () => {
      ESP32Service.removeListener('gps', handleGPSData);
      ESP32Service.removeListener('imu', handleIMUData);
    };
  }, []);

  const animateCompass = (orientation) => {
    Animated.timing(compassAnim, {
      toValue: orientation,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const startPulseAnimation = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getGPSAccuracyColor = (accuracy) => {
    if (accuracy < 5) return '#27ae60'; // Excelente
    if (accuracy < 15) return '#f39c12'; // Buena
    return '#e74c3c'; // Pobre
  };

  const getGPSAccuracyText = (accuracy) => {
    if (accuracy < 5) return 'Excelente';
    if (accuracy < 15) return 'Buena';
    return 'Pobre';
  };

  const formatCoordinate = (coord, isLatitude = true) => {
    if (coord === 0) return isLatitude ? '0°N' : '0°E';
    const abs = Math.abs(coord);
    const direction = coord >= 0 
      ? (isLatitude ? 'N' : 'E') 
      : (isLatitude ? 'S' : 'O');
    return `${abs.toFixed(6)}°${direction}`;
  };

  const getCardinalDirection = (degrees) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  const getMovementIntensity = (acceleration) => {
    const magnitude = Math.sqrt(
      acceleration.x ** 2 + acceleration.y ** 2 + acceleration.z ** 2
    );
    return Math.min(magnitude / 20, 1); // Normalizar a 0-1
  };

  const getMovementColor = (intensity) => {
    if (intensity < 0.3) return '#27ae60'; // Quieto
    if (intensity < 0.7) return '#f39c12'; // Movimiento moderado
    return '#e74c3c'; // Movimiento rápido
  };

  const getMovementText = (intensity) => {
    if (intensity < 0.3) return 'Quieto';
    if (intensity < 0.7) return 'Movimiento Moderado';
    return 'Movimiento Rápido';
  };

  const compassRotate = compassAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const movementIntensity = getMovementIntensity(imuData.acceleration);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#3498db20', '#3498db10']}
        style={styles.card}
      >
        <View style={styles.header}>
          <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
            <MaterialIcons 
              name="navigation" 
              size={24} 
              color="#3498db" 
            />
          </Animated.View>
          <Text style={styles.title}>Navegación y Orientación</Text>
        </View>

        <View style={styles.content}>
          {/* Sección GPS */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="gps-fixed" size={20} color="#27ae60" />
              <Text style={styles.sectionTitle}>GPS</Text>
              <View style={[
                styles.statusDot, 
                { backgroundColor: gpsData.isActive ? '#27ae60' : '#95a5a6' }
              ]} />
            </View>

            <View style={styles.coordinatesContainer}>
              <View style={styles.coordinate}>
                <Text style={styles.coordinateLabel}>Latitud</Text>
                <Text style={styles.coordinateValue}>
                  {formatCoordinate(gpsData.latitude, true)}
                </Text>
              </View>
              <View style={styles.coordinate}>
                <Text style={styles.coordinateLabel}>Longitud</Text>
                <Text style={styles.coordinateValue}>
                  {formatCoordinate(gpsData.longitude, false)}
                </Text>
              </View>
            </View>

            <View style={styles.accuracyContainer}>
              <Text style={styles.accuracyLabel}>Precisión</Text>
              <View style={styles.accuracyBar}>
                <View style={[
                  styles.accuracyFill,
                  {
                    backgroundColor: getGPSAccuracyColor(gpsData.accuracy),
                    width: `${Math.max(100 - gpsData.accuracy * 2, 10)}%`
                  }
                ]} />
              </View>
              <Text style={[styles.accuracyText, { color: getGPSAccuracyColor(gpsData.accuracy) }]}>
                {getGPSAccuracyText(gpsData.accuracy)} (±{gpsData.accuracy}m)
              </Text>
            </View>
          </View>

          {/* Sección IMU */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="explore" size={20} color="#9b59b6" />
              <Text style={styles.sectionTitle}>IMU (Orientación)</Text>
              <View style={[
                styles.statusDot, 
                { backgroundColor: imuData.isActive ? '#9b59b6' : '#95a5a6' }
              ]} />
            </View>

            {/* Brújula */}
            <View style={styles.compassContainer}>
              <Text style={styles.compassTitle}>Brújula Digital</Text>
              <View style={styles.compass}>
                <Animated.View 
                  style={[
                    styles.compassNeedle,
                    { transform: [{ rotate: compassRotate }] }
                  ]}
                >
                  <MaterialIcons name="navigation" size={40} color="#e74c3c" />
                </Animated.View>
                <Text style={styles.compassDegrees}>{Math.round(imuData.orientation)}°</Text>
                <Text style={styles.compassDirection}>
                  {getCardinalDirection(imuData.orientation)}
                </Text>
              </View>
            </View>

            {/* Detector de movimiento */}
            <View style={styles.movementContainer}>
              <Text style={styles.movementTitle}>Detector de Movimiento</Text>
              <View style={styles.movementIndicator}>
                <View style={[
                  styles.movementCircle,
                  { 
                    backgroundColor: getMovementColor(movementIntensity),
                    transform: [{ scale: 0.5 + movementIntensity * 0.5 }]
                  }
                ]} />
                <Text style={[styles.movementText, { color: getMovementColor(movementIntensity) }]}>
                  {getMovementText(movementIntensity)}
                </Text>
              </View>
            </View>

            {/* Datos de aceleración */}
            <View style={styles.accelerationData}>
              <Text style={styles.dataTitle}>Aceleración (g)</Text>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>X: {imuData.acceleration.x?.toFixed(2) || '0.00'}</Text>
                <Text style={styles.dataLabel}>Y: {imuData.acceleration.y?.toFixed(2) || '0.00'}</Text>
                <Text style={styles.dataLabel}>Z: {imuData.acceleration.z?.toFixed(2) || '0.00'}</Text>
              </View>
            </View>
          </View>
        </View>

        {(gpsData.timestamp || imuData.timestamp) && (
          <Text style={styles.timestamp}>
            Última actualización: {
              new Date(gpsData.timestamp || imuData.timestamp).toLocaleTimeString()
            }
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
    marginBottom: 20,
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
  sectionContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 8,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  coordinatesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  coordinate: {
    flex: 1,
    alignItems: 'center',
  },
  coordinateLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  coordinateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  accuracyContainer: {
    alignItems: 'center',
  },
  accuracyLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  accuracyBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#ecf0f1',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  accuracyFill: {
    height: '100%',
    borderRadius: 3,
  },
  accuracyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  compassContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  compassTitle: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  compass: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ecf0f1',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#bdc3c7',
  },
  compassNeedle: {
    position: 'absolute',
    top: 20,
  },
  compassDegrees: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 25,
  },
  compassDirection: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#9b59b6',
    marginTop: 4,
  },
  movementContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  movementTitle: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  movementIndicator: {
    alignItems: 'center',
  },
  movementCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginBottom: 8,
  },
  movementText: {
    fontSize: 12,
    fontWeight: '600',
  },
  accelerationData: {
    alignItems: 'center',
  },
  dataTitle: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  dataLabel: {
    fontSize: 11,
    color: '#7f8c8d',
    fontFamily: 'monospace',
  },
  timestamp: {
    fontSize: 12,
    color: '#95a5a6',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default NavigationSensor;