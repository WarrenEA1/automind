import { useWarmUpBrowser } from '@/hooks/useWarmUpBrowser';
import { useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  useWarmUpBrowser();

  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  const onPress = React.useCallback(async () => {
    try {
      const { createdSessionId, signIn, signUp, setActive } =
        await startOAuthFlow();

      if (createdSessionId) {
        setActive({ session: createdSessionId });
      } else {
        // Handle MFA or 2-step verification
      }
    } catch (err) {
      console.error("OAuth error", err);
    }
  }, []);

  return (
    <View>  
      <View style={{ alignItems:'center', marginTop:100 }}>
        <Image
          source={require('../assets/images/login-image.png')}
          style={{ width:370, height:450 }}
        />
      </View>

      <View style={styles.subContainer}>
        <Text style={{ fontSize:30, textAlign:'center', fontWeight:'bold' }}>
          Your Ultimate 
          <Text style={{ color: '#007AFF', fontWeight:'bold' }}> Car Companion </Text>
          App
        </Text>

        <Text style={styles.subtitle}>
          Manage your vehicle's health, track maintenance, and smart reminders, all in one easy app.
        </Text>

        <TouchableOpacity style={styles.btn} onPress={onPress}>
          <Text style={styles.btnText}>Let's Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  subContainer: {
    backgroundColor: '#fff',
    padding: 10,
    marginTop: -20,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 15,
    color: '#8f8f8f'
  },
  btn: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 99,
    marginTop: 20,
  },
  btnText: {
    color:'#fff',
    fontSize:16,
    textAlign:'center',
    fontWeight:'bold'
  },
});
