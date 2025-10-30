import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import ESP32Service from '../services/ESP32Service';

const TestConnection = () => {
  const [esp32IP, setEsp32IP] = useState('192.168.1.100');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [testResults, setTestResults] = useState([]);
  const [statusData, setStatusData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Agregar resultado de test
  const addTestResult = (test, success, message) => {
    setTestResults(prev => [...prev, {
      test,
      success,
      message,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  // Test 1: Verificar conectividad básica
  const testBasicConnection = async () => {
    addTestResult('Conexión básica', null, 'Probando...');
    try {
      const response = await fetch(`http://${esp32IP}/`, {
        method: 'GET',
        timeout: 5000
      });
      
      if (response.ok) {
        const html = await response.text();
        addTestResult('Conexión básica', true, `✅ Conectado! Status: ${response.status}`);
        return true;
      } else {
        addTestResult('Conexión básica', false, `❌ Error: Status ${response.status}`);
        return false;
      }
    } catch (error) {
      addTestResult('Conexión básica', false, `❌ Error: ${error.message}`);
      return false;
    }
  };

  // Test 2: Endpoint /status
  const testStatusEndpoint = async () => {
    addTestResult('Endpoint /status', null, 'Probando...');
    try {
      const response = await fetch(`http://${esp32IP}/status`, {
        method: 'GET',
        timeout: 5000
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatusData(data);
        addTestResult('Endpoint /status', true, `✅ OK - IP: ${data.ip}`);
        return true;
      } else {
        addTestResult('Endpoint /status', false, `❌ Error: Status ${response.status}`);
        return false;
      }
    } catch (error) {
      addTestResult('Endpoint /status', false, `❌ Error: ${error.message}`);
      return false;
    }
  };

  // Test 3: Configurar ESP32Service
  const testServiceConfiguration = () => {
    addTestResult('Configurar Servicio', null, 'Configurando...');
    try {
      ESP32Service.setESP32IP(esp32IP);
      const status = ESP32Service.getConnectionStatus();
      addTestResult('Configurar Servicio', true, `✅ IP configurada: ${status.baseUrl}`);
      return true;
    } catch (error) {
      addTestResult('Configurar Servicio', false, `❌ Error: ${error.message}`);
      return false;
    }
  };

  // Ejecutar todos los tests
  const runAllTests = async () => {
    setIsLoading(true);
    setTestResults([]);
    setConnectionStatus('testing');

    // Test 1: Conexión básica
    const test1 = await testBasicConnection();
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 2: Endpoint /status
    const test2 = await testStatusEndpoint();
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 3: Configurar servicio
    const test3 = testServiceConfiguration();

    // Resultado final
    if (test1 && test2 && test3) {
      setConnectionStatus('connected');
      Alert.alert('✅ Éxito', `Todos los tests pasaron!\n\nIP: ${esp32IP}\nPuedes usar la app normalmente.`);
    } else {
      setConnectionStatus('error');
      Alert.alert('❌ Error', 'Algunos tests fallaron. Revisa los resultados.');
    }

    setIsLoading(false);
  };

  // Limpiar tests
  const clearTests = () => {
    setTestResults([]);
    setStatusData(null);
    setConnectionStatus('disconnected');
  };

  // Conectar automáticamente al cargar
  useEffect(() => {
    // Auto-configurar IP si hay una guardada
    const savedIP = '192.168.1.100'; // Podrías guardar esto en AsyncStorage
    setEsp32IP(savedIP);
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧪 Test de Conexión ESP32</Text>
        <Text style={styles.subtitle}>NaviStick - Prueba Local</Text>
      </View>

      {/* Input de IP */}
      <View style={styles.section}>
        <Text style={styles.label}>IP del ESP32:</Text>
        <TextInput
          style={styles.input}
          value={esp32IP}
          onChangeText={setEsp32IP}
          placeholder="192.168.1.100"
          keyboardType="numeric"
          editable={!isLoading}
        />
        <Text style={styles.hint}>
          Revisa el Serial Monitor del Arduino IDE para obtener la IP
        </Text>
      </View>

      {/* Botones */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.testButton, isLoading && styles.buttonDisabled]}
          onPress={runAllTests}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? '⏳ Probando...' : '🚀 Ejecutar Tests'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearTests}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>🗑️ Limpiar</Text>
        </TouchableOpacity>
      </View>

      {/* Estado de conexión */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Estado:</Text>
        <View style={[styles.statusBadge, styles[`status_${connectionStatus}`]]}>
          <Text style={styles.statusText}>
            {connectionStatus === 'connected' ? '✅ Conectado' :
             connectionStatus === 'testing' ? '⏳ Probando' :
             connectionStatus === 'error' ? '❌ Error' :
             '⚪ Desconectado'}
          </Text>
        </View>
      </View>

      {/* Datos del status */}
      {statusData && (
        <View style={styles.dataContainer}>
          <Text style={styles.dataTitle}>📊 Datos del ESP32:</Text>
          <Text style={styles.dataText}>Estado: {statusData.status}</Text>
          <Text style={styles.dataText}>IP: {statusData.ip}</Text>
        </View>
      )}

      {/* Resultados de tests */}
      {testResults.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>📋 Resultados de Tests:</Text>
          {testResults.map((result, index) => (
            <View key={index} style={styles.resultItem}>
              <Text style={styles.resultTime}>{result.timestamp}</Text>
              <Text style={[
                styles.resultText,
                result.success === true && styles.resultSuccess,
                result.success === false && styles.resultError
              ]}>
                {result.test}: {result.message}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Instrucciones */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>📖 Instrucciones:</Text>
        <Text style={styles.instructionText}>1. Sube esp32_test.ino al ESP32</Text>
        <Text style={styles.instructionText}>2. Abre el Serial Monitor (115200 baud)</Text>
        <Text style={styles.instructionText}>3. Espera a que se conecte a WiFi</Text>
        <Text style={styles.instructionText}>4. Copia la IP que aparece</Text>
        <Text style={styles.instructionText}>5. Pégala arriba y presiona "Ejecutar Tests"</Text>
        <Text style={styles.instructionText}>6. Verifica que todos los tests pasen ✅</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    marginBottom: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: '#4CAF50',
  },
  clearButton: {
    backgroundColor: '#FF9800',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  status_disconnected: {
    backgroundColor: '#e0e0e0',
  },
  status_testing: {
    backgroundColor: '#FFF9C4',
  },
  status_connected: {
    backgroundColor: '#C8E6C9',
  },
  status_error: {
    backgroundColor: '#FFCDD2',
  },
  dataContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  dataTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1976D2',
  },
  dataText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  resultsContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  resultItem: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultTime: {
    fontSize: 11,
    color: '#999',
    marginBottom: 3,
  },
  resultText: {
    fontSize: 13,
    color: '#666',
  },
  resultSuccess: {
    color: '#4CAF50',
  },
  resultError: {
    color: '#f44336',
  },
  instructionsContainer: {
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    padding: 15,
    marginBottom: 30,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#F57C00',
  },
  instructionText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 5,
    paddingLeft: 5,
  },
});

export default TestConnection;
