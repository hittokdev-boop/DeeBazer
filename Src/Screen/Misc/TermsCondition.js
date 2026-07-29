import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import AllColors from '../../Constants/Color';

const TermsCondition = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.paragraph}>
          Welcome to DeeBazer. By using our app, you agree to these Terms and Conditions. Please read them carefully.
        </Text>
        
        <Text style={styles.heading}>1. Use of the App</Text>
        <Text style={styles.paragraph}>
          You must be at least 18 years old to use this app. You are responsible for maintaining the confidentiality of your account and password.
        </Text>

        <Text style={styles.heading}>2. User Content</Text>
        <Text style={styles.paragraph}>
          You retain all your rights to any content you submit, post or display on or through the app.
        </Text>

        <Text style={styles.heading}>3. Prohibited Activities</Text>
        <Text style={styles.paragraph}>
          You agree not to engage in any prohibited activities including but not limited to copying, distributing, or disclosing any part of the app.
        </Text>

        <Text style={styles.heading}>4. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          DeeBazer shall not be liable for any indirect, incidental, special, consequential or punitive damages.
        </Text>

        <Text style={styles.heading}>5. Changes to Terms</Text>
        <Text style={styles.paragraph}>
          We reserve the right to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginTop: 30, // For status bar spacing
  },
  backButton: {
    padding: 5,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  content: {
    padding: 20,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: AllColors.primary,
    marginTop: 20,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 15,
    color: '#555',
    lineHeight: 24,
  }
});

export default TermsCondition;
