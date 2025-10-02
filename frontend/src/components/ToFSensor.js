import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ESP32Service from '../services/ESP32Service';

const ToFSensor = () => {
  const [sensorData, setSensorData] = useState({
    distance: 0,
    stair: false,
    timestamp: null,
    isActive: false
  });

  const [pulseAnim] = useState(new Animated.Value(1));
  const [rotateAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Listener para datos del sensor ToF
    const handleToFData = (data) => {
      setSensorData({
        ...data,
        isActive: true
      });

      // Animación de pulso cuando detecta escalera o desnivel
      if (data.stair) {
        startPulseAnimation();
        startRotateAnimation();
      }

      // Auto-desactivar después de 3 segundos sin datos
      setTimeout(() => {
        setSensorData(prev => ({ ...prev, isActive: false }));
      }, 3000);
    };

    ESP32Service.addListener('tof', handleToFData);

    return () => {
      ESP32Service.removeListener('tof', handleToFData);
    };
  }, []);

  const startPulseAnimation = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.2,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const startRotateAnimation = () => {
    Animated.timing(rotateAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      rotateAnim.setValue(0);
    });
  };

  const getStatusColor = () => {
    if (!sensorData.isActive) return '#95a5a6';
    if (sensorData.stair) return '#f39c12';
    return '#3498db';
  };

  const getStatusText = () => {
    if (!sensorData.isActive) return 'Inactivo';
    if (sensorData.stair) return 'Escalera/Desnivel';
    return 'Superficie Plana';
  };

  const getIcon = () => {
    if (sensorData.stair) return 'stairs';
    return 'straighten';
  };

  const formatDistance = (distance) => {
    if (distance >= 100) return `${(distance / 100).toFixed(1)}m`;
    return `${distance}cm`;
  };

  const getSurfaceType = () => {
    const distance = sensorData.distance;
    if (distance > 80) return 'Escalera hacia abajo';
    if (distance > 50) return 'Desnivel detectado';
    if (distance > 20) return 'Superficie irregular';
    return 'Superficie plana';
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[getStatusColor() + '20', getStatusColor() + '10']}
        style={styles.card}
      >
        <View style={styles.header}>
          <Animated.View style={[
            styles.iconContainer, 
            { 
              transform: [
                { scale: pulseAnim },
                { rotate: rotateInterpolate }
              ] 
            }
          ]}>
            <MaterialIcons 
              name={getIcon()} 
              size={24} 
              color={getStatusColor()} 
            />
          </Animated.View>
          <Text style={styles.title}>Sensor ToF (Escaleras)</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.distanceContainer}>
            <Text style={[styles.distanceValue, { color: getStatusColor() }]}>
              {formatDistance(sensorData.distance)}
            </Text>
            <Text style={styles.distanceLabel}>Distancia al Suelo</Text>
          </View>

          <View style={styles.statusContainer}>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>

          <View style={styles.surfaceInfo}>
            <Text style={styles.surfaceType}>{getSurfaceType()}</Text>
          </View>

          {sensorData.stair && (
            <View style={styles.alertContainer}>
              <MaterialIcons name="warning" size={20} color="#f39c12" />
              <Text style={styles.alertText}>
                ¡Atención! {getSurfaceType()} - Procede con precaución
              </Text>
            </View>
          )}
        </View>

        <View style={styles.visualIndicator}>
          <Text style={styles.indicatorLabel}>Nivel de Riesgo</Text>
          <View style={styles.riskBar}>
            <View style={[
              styles.riskFill,
              {
                backgroundColor: getStatusColor(),
                width: `${Math.min(sensorData.distance / 100 * 100, 100)}%`
              }
            ]} />
          </View>
          <View style={styles.riskLabels}>
            <Text style={styles.riskLabel}>Bajo</Text>
            <Text style={styles.riskLabel}>Alto</Text>
          </View>
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
    marginBottom: 16,
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
  surfaceInfo: {
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  surfaceType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
  },
  alertContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3cd',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
    marginBottom: 12,
  },
  alertText: {
    marginLeft: 8,
    color: '#856404',
    fontWeight: '500',
    flex: 1,
  },
  visualIndicator: {
    marginBottom: 12,
  },
  indicatorLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  riskBar: {
    height: 8,
    backgroundColor: '#ecf0f1',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  riskFill: {
    height: '100%',
    borderRadius: 4,
  },
  riskLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  riskLabel: {
    fontSize: 10,
    color: '#95a5a6',
  },
  timestamp: {
    fontSize: 12,
    color: '#95a5a6',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ToFSensor;