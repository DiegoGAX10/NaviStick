import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ESP32Service from '../services/ESP32Service';

const VibratorMotor = () => {
  const [motorData, setMotorData] = useState({
    pattern: 'none',
    intensity: 0,
    active: false,
    timestamp: null
  });

  const [shakeAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));

  // Patrones de vibración disponibles
  const vibrationPatterns = [
    { id: 'none', name: 'Desactivado', icon: 'vibration', color: '#95a5a6' },
    { id: 'alert', name: 'Alerta', icon: 'priority-high', color: '#e74c3c' },
    { id: 'warning', name: 'Advertencia', icon: 'warning', color: '#f39c12' },
    { id: 'pulse', name: 'Pulso', icon: 'favorite', color: '#3498db' },
    { id: 'continuous', name: 'Continuo', icon: 'vibration', color: '#9b59b6' },
  ];

  useEffect(() => {
    // Listener para datos del motor vibrador
    const handleVibratorData = (data) => {
      setMotorData({
        ...data,
        timestamp: data.timestamp
      });

      // Animaciones cuando está activo
      if (data.active) {
        startShakeAnimation();
        startPulseAnimation();
      }
    };

    ESP32Service.addListener('vibrator', handleVibratorData);

    return () => {
      ESP32Service.removeListener('vibrator', handleVibratorData);
    };
  }, []);

  const startShakeAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      { iterations: 3 }
    ).start();
  };

  const startPulseAnimation = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePatternSelect = async (patternId) => {
    try {
      await ESP32Service.setVibratorPattern(patternId);
    } catch (error) {
      console.error('Error setting vibration pattern:', error);
    }
  };

  const handleTestVibration = async () => {
    try {
      await ESP32Service.activateVibration('test', 75);
    } catch (error) {
      console.error('Error testing vibration:', error);
    }
  };

  const getCurrentPattern = () => {
    return vibrationPatterns.find(p => p.id === motorData.pattern) || vibrationPatterns[0];
  };

  const getIntensityColor = (intensity) => {
    if (intensity < 25) return '#27ae60';
    if (intensity < 50) return '#f39c12';
    if (intensity < 75) return '#e67e22';
    return '#e74c3c';
  };

  const getStatusText = () => {
    if (!motorData.active) return 'Inactivo';
    return `Activo - ${getCurrentPattern().name}`;
  };

  const shakeTransform = shakeAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-3, 3],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[getCurrentPattern().color + '20', getCurrentPattern().color + '10']}
        style={styles.card}
      >
        <View style={styles.header}>
          <Animated.View style={[
            styles.iconContainer,
            {
              transform: [
                { translateX: motorData.active ? shakeTransform : 0 },
                { scale: pulseAnim }
              ]
            }
          ]}>
            <MaterialIcons 
              name={getCurrentPattern().icon} 
              size={24} 
              color={getCurrentPattern().color} 
            />
          </Animated.View>
          <Text style={styles.title}>Motor Vibrador</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusIndicator, { backgroundColor: getCurrentPattern().color }]} />
            <Text style={[styles.statusText, { color: getCurrentPattern().color }]}>
              {getStatusText()}
            </Text>
          </View>

          {/* Indicador de intensidad */}
          <View style={styles.intensityContainer}>
            <Text style={styles.intensityLabel}>Intensidad</Text>
            <View style={styles.intensityBar}>
              <View style={[
                styles.intensityFill,
                {
                  backgroundColor: getIntensityColor(motorData.intensity),
                  width: `${motorData.intensity}%`
                }
              ]} />
            </View>
            <Text style={[styles.intensityValue, { color: getIntensityColor(motorData.intensity) }]}>
              {motorData.intensity}%
            </Text>
          </View>

          {/* Selector de patrones */}
          <View style={styles.patternsContainer}>
            <Text style={styles.patternsTitle}>Patrones de Vibración</Text>
            <View style={styles.patternsGrid}>
              {vibrationPatterns.map(pattern => (
                <TouchableOpacity
                  key={pattern.id}
                  style={[
                    styles.patternButton,
                    {
                      backgroundColor: motorData.pattern === pattern.id ? pattern.color + '20' : '#f8f9fa',
                      borderColor: motorData.pattern === pattern.id ? pattern.color : '#dee2e6'
                    }
                  ]}
                  onPress={() => handlePatternSelect(pattern.id)}
                >
                  <MaterialIcons 
                    name={pattern.icon} 
                    size={20} 
                    color={motorData.pattern === pattern.id ? pattern.color : '#6c757d'} 
                  />
                  <Text style={[
                    styles.patternName,
                    { color: motorData.pattern === pattern.id ? pattern.color : '#6c757d' }
                  ]}>
                    {pattern.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Botón de prueba */}
          <TouchableOpacity style={styles.testButton} onPress={handleTestVibration}>
            <MaterialIcons name="play-arrow" size={20} color="white" />
            <Text style={styles.testButtonText}>Probar Vibración</Text>
          </TouchableOpacity>

          {/* Información de estado */}
          {motorData.active && (
            <View style={styles.activeInfo}>
              <MaterialIcons name="info" size={16} color="#3498db" />
              <Text style={styles.activeInfoText}>
                Patrón activo: {getCurrentPattern().name} al {motorData.intensity}% de intensidad
              </Text>
            </View>
          )}
        </View>

        {motorData.timestamp && (
          <Text style={styles.timestamp}>
            Última actualización: {new Date(motorData.timestamp).toLocaleTimeString()}
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
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
  intensityContainer: {
    marginBottom: 20,
  },
  intensityLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  intensityBar: {
    height: 10,
    backgroundColor: '#ecf0f1',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  intensityFill: {
    height: '100%',
    borderRadius: 5,
  },
  intensityValue: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  patternsContainer: {
    marginBottom: 20,
  },
  patternsTitle: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  patternsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  patternButton: {
    width: '48%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    marginBottom: 8,
  },
  patternName: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  testButton: {
    flexDirection: 'row',
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  testButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  activeInfo: {
    flexDirection: 'row',
    backgroundColor: '#e8f4fd',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  activeInfoText: {
    marginLeft: 8,
    color: '#2980b9',
    fontWeight: '500',
    flex: 1,
    fontSize: 12,
  },
  timestamp: {
    fontSize: 12,
    color: '#95a5a6',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default VibratorMotor;