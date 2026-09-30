import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const API_URL = 'https://sistema-qualidade-jwim.onrender.com';

export default function HomeScreen() {
  const [status, setStatus] = useState('Conectando ao servidor...');

  useEffect(() => {
    async function testarBackend() {
      try {
        const response = await fetch(`${API_URL}/`);

        if (response.ok) {
          setStatus('Backend conectado com sucesso!');
        } else {
          setStatus(`Backend respondeu com status ${response.status}.`);
        }
      } catch (error) {
        setStatus('Não foi possível conectar ao backend.');
      }
    }

    testarBackend();
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">
        Sistema de Qualidade
      </ThemedText>

      <ThemedText style={styles.subtitle}>
        Aplicativo Mobile
      </ThemedText>

      <ActivityIndicator size="large" />

      <ThemedText style={styles.status}>
        {status}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 20,
  },
  subtitle: {
    fontSize: 18,
  },
  status: {
    textAlign: 'center',
  },
});
