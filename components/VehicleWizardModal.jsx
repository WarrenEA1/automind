import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from 'react-native';

export default function VehicleWizardModal({ visible, onSave }) {
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  // --- FORM DATA ---
  const [formData, setFormData] = useState({
    vehicleImageUri: null,
    vehicleName: '',
    plateNumber: '',
    orcrExpiry: null, 
    engineType: '',
    currentMileage: '',
    batteryDate: null,
    lastOilChange: null,
    nextOilChange: null,
    tireDate: null,
  });

  // --- ERROR STATE ---
  const [errors, setErrors] = useState({});

  // --- UI STATES ---
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeDateField, setActiveDateField] = useState(null);
  const [showEnginePicker, setShowEnginePicker] = useState(false);
  const engineOptions = ['Gasoline', 'Diesel', 'Hybrid', 'Electric'];

  const updateData = (key, value) => {
    // If it's the plate number, force UPPERCASE immediately
    if (key === 'plateNumber') {
      value = value.toUpperCase();
    }
    
    setFormData(prev => ({ ...prev, [key]: value }));
    
    // Clear error instantly when user fixes it
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: null }));
    }
  };

  // --- IMAGE PICKER ---
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled) {
      updateData('vehicleImageUri', result.assets[0].uri);
    }
  };

  // --- DATE PICKER ---
  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) updateData(activeDateField, selectedDate);
  };

  const openDatePicker = (fieldKey) => {
    setActiveDateField(fieldKey);
    setShowDatePicker(true);
  };

  const formatDate = (date) => {
    if (!date) return "Select Date"; 
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
  };

  // --- VALIDATION LOGIC ---
  const validateStep = (currentStep) => {
    let valid = true;
    let newErrors = {};

    const { 
      vehicleImageUri, vehicleName, plateNumber, orcrExpiry, engineType, 
      currentMileage, batteryDate, lastOilChange, nextOilChange, tireDate
    } = formData;

    // STEP 1: Photo
    if (currentStep === 1) {
      if (!vehicleImageUri) {
        newErrors.vehicleImageUri = "You must upload a vehicle photo.";
        valid = false;
      }
    }

    // STEP 2: Name & Plate
    if (currentStep === 2) {
      // Vehicle Name Validation
      if (!vehicleName || !vehicleName.trim()) {
        newErrors.vehicleName = "Vehicle name cannot be empty.";
        valid = false;
      } else if (!/^[a-zA-Z0-9\s\-_]+$/.test(vehicleName)) {
        // Regex: Only letters, numbers, spaces, dashes, underscores
        newErrors.vehicleName = "Name contains invalid characters (no symbols).";
        valid = false;
      }

      // Plate Number Validation
      if (!plateNumber || !plateNumber.trim()) {
        newErrors.plateNumber = "Plate number cannot be empty.";
        valid = false;
      } else if (plateNumber.length < 6) {
        newErrors.plateNumber = "Plate number is too short.";
        valid = false;
      } else if (!/^[A-Z0-9\s]+$/.test(plateNumber)) {
        // Regex: Only Uppercase Letters, Numbers, and Spaces
        newErrors.plateNumber = "Plate must be alphanumeric (A-Z, 0-9).";
        valid = false;
      }
    }

    // STEP 3: OR/CR & Engine
    if (currentStep === 3) {
      if (!orcrExpiry) {
        newErrors.orcrExpiry = "Please select the OR/CR expiry date.";
        valid = false;
      }
      if (!engineType) {
        newErrors.engineType = "Please select an engine type.";
        valid = false;
      }
    }

    // STEP 4: Mileage & Battery
    if (currentStep === 4) {
      if (!currentMileage || !currentMileage.trim()) {
        newErrors.currentMileage = "Mileage cannot be empty.";
        valid = false;
      } else if (isNaN(currentMileage)) {
        newErrors.currentMileage = "Mileage must be a valid number.";
        valid = false;
      } else if (Number(currentMileage) < 0) {
        newErrors.currentMileage = "Mileage cannot be negative.";
        valid = false;
      }
      
      if (!batteryDate) {
        newErrors.batteryDate = "Please select battery installation date.";
        valid = false;
      }
    }

    // STEP 5: Maintenance Dates
    if (currentStep === 5) {
      if (!lastOilChange) {
        newErrors.lastOilChange = "Please select last oil change date.";
        valid = false;
      }
      if (!nextOilChange) {
        newErrors.nextOilChange = "Please select next oil change date.";
        valid = false;
      }
      if (!tireDate) {
        newErrors.tireDate = "Please select tire replacement date.";
        valid = false;
      }

      if (lastOilChange && lastOilChange > new Date()) {
        newErrors.lastOilChange = "Date cannot be in the future.";
        valid = false;
      }
      if (lastOilChange && nextOilChange && nextOilChange < lastOilChange) {
        newErrors.nextOilChange = "Next change must be after the last one.";
        valid = false;
      }
    }

    setErrors(newErrors);
    return valid;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step < totalSteps) {
        setStep(step + 1);
      } else {
        onSave(formData);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {[...Array(totalSteps)].map((_, i) => (
        <View key={i} style={[styles.progressDash, { backgroundColor: i < step ? '#fff' : '#ffffff40' }]} />
      ))}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          {step > 1 ? (
            <TouchableOpacity onPress={handleBack}><Ionicons name="arrow-back" size={24} color="white" /></TouchableOpacity>
          ) : <View style={{width: 24}} />}
          {renderProgressBar()}
          <View style={{width: 24}} /> 
        </View>

        <Text style={styles.headerTitle}>Create an Account</Text>
        <Text style={styles.mainTitle}>Tell us about your vehicle</Text>

        <ScrollView contentContainerStyle={styles.formContainer}>
          
          {/* STEP 1: Photo */}
          {step === 1 && (
            <View style={{alignItems: 'center'}}>
              <Text style={styles.label}>Upload a photo of your car</Text>
              
              <TouchableOpacity onPress={pickImage} style={[styles.imagePickerBtn, errors.vehicleImageUri && styles.inputError]}>
                {formData.vehicleImageUri ? (
                  <Image source={{ uri: formData.vehicleImageUri }} style={styles.vehicleImagePreview} />
                ) : (
                  <>
                    <Ionicons name="camera" size={50} color={errors.vehicleImageUri ? "#FF5252" : "#7f8c8d"} />
                    <Text style={[styles.imagePickerText, errors.vehicleImageUri && {color: "#FF5252"}]}>Tap to select photo</Text>
                  </>
                )}
              </TouchableOpacity>
              {errors.vehicleImageUri && <Text style={styles.errorText}>{errors.vehicleImageUri}</Text>}
              
              <Text style={styles.helperText}>A landscape photo works best.</Text>
            </View>
          )}

          {/* STEP 2: Name & Plate */}
          {step === 2 && (
            <>
              <Text style={styles.label}>Name your vehicle</Text>
              <TextInput 
                style={[styles.input, errors.vehicleName && styles.inputError]} 
                placeholder="e.g. My Toyota Vios" 
                placeholderTextColor="#7f8c8d"
                value={formData.vehicleName}
                onChangeText={(t) => updateData('vehicleName', t)}
              />
              {errors.vehicleName && <Text style={styles.errorText}>{errors.vehicleName}</Text>}

              <Text style={styles.label}>Plate number</Text>
              <TextInput 
                style={[styles.input, errors.plateNumber && styles.inputError]} 
                placeholder="ABC 1234" 
                placeholderTextColor="#7f8c8d"
                value={formData.plateNumber}
                onChangeText={(t) => updateData('plateNumber', t)}
                autoCapitalize="characters"
              />
              {errors.plateNumber && <Text style={styles.errorText}>{errors.plateNumber}</Text>}
            </>
          )}

          {/* STEP 3: Engine */}
          {step === 3 && (
            <>
              <Text style={styles.label}>OR/CR Expiry Date</Text>
              <TouchableOpacity onPress={() => openDatePicker('orcrExpiry')}>
                <View style={[styles.input, errors.orcrExpiry && styles.inputError]}>
                  <Text style={{color: formData.orcrExpiry ? 'white' : '#7f8c8d'}}>{formatDate(formData.orcrExpiry)}</Text>
                  <Ionicons name="calendar-outline" size={20} color={errors.orcrExpiry ? "#FF5252" : "#7f8c8d"} style={styles.iconRight} />
                </View>
              </TouchableOpacity>
              {errors.orcrExpiry && <Text style={styles.errorText}>{errors.orcrExpiry}</Text>}

              <Text style={styles.label}>Engine Type</Text>
              <TouchableOpacity onPress={() => setShowEnginePicker(true)}>
                <View style={[styles.input, errors.engineType && styles.inputError]}>
                  <Text style={{color: formData.engineType ? 'white' : '#7f8c8d'}}>
                    {formData.engineType || "Select Engine Type"}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={errors.engineType ? "#FF5252" : "#7f8c8d"} style={styles.iconRight} />
                </View>
              </TouchableOpacity>
              {errors.engineType && <Text style={styles.errorText}>{errors.engineType}</Text>}
            </>
          )}

          {/* STEP 4: Mileage & Battery */}
          {step === 4 && (
            <>
              <Text style={styles.label}>Current Mileage (km)</Text>
              <TextInput 
                style={[styles.input, errors.currentMileage && styles.inputError]} 
                placeholder="0" 
                keyboardType="numeric"
                placeholderTextColor="#7f8c8d"
                value={formData.currentMileage}
                onChangeText={(t) => updateData('currentMileage', t)}
              />
              {errors.currentMileage && <Text style={styles.errorText}>{errors.currentMileage}</Text>}

              <Text style={styles.label}>Battery Installation Date</Text>
              <TouchableOpacity onPress={() => openDatePicker('batteryDate')}>
                <View style={[styles.input, errors.batteryDate && styles.inputError]}>
                  <Text style={{color: formData.batteryDate ? 'white' : '#7f8c8d'}}>{formatDate(formData.batteryDate)}</Text>
                  <Ionicons name="calendar-outline" size={20} color={errors.batteryDate ? "#FF5252" : "#7f8c8d"} style={styles.iconRight} />
                </View>
              </TouchableOpacity>
              {errors.batteryDate && <Text style={styles.errorText}>{errors.batteryDate}</Text>}
            </>
          )}

          {/* STEP 5: Dates */}
          {step === 5 && (
            <>
              <Text style={styles.label}>Last Oil Change</Text>
              <TouchableOpacity onPress={() => openDatePicker('lastOilChange')}>
                <View style={[styles.input, errors.lastOilChange && styles.inputError]}>
                  <Text style={{color: formData.lastOilChange ? 'white' : '#7f8c8d'}}>{formatDate(formData.lastOilChange)}</Text>
                  <Ionicons name="calendar-outline" size={20} color={errors.lastOilChange ? "#FF5252" : "#7f8c8d"} style={styles.iconRight} />
                </View>
              </TouchableOpacity>
              {errors.lastOilChange && <Text style={styles.errorText}>{errors.lastOilChange}</Text>}

              <Text style={styles.label}>Next Expected Oil Change</Text>
              <TouchableOpacity onPress={() => openDatePicker('nextOilChange')}>
                <View style={[styles.input, errors.nextOilChange && styles.inputError]}>
                  <Text style={{color: formData.nextOilChange ? 'white' : '#7f8c8d'}}>{formatDate(formData.nextOilChange)}</Text>
                  <Ionicons name="calendar-outline" size={20} color={errors.nextOilChange ? "#FF5252" : "#7f8c8d"} style={styles.iconRight} />
                </View>
              </TouchableOpacity>
              {errors.nextOilChange && <Text style={styles.errorText}>{errors.nextOilChange}</Text>}

              <Text style={styles.label}>Tire Replacement Date</Text>
              <TouchableOpacity onPress={() => openDatePicker('tireDate')}>
                <View style={[styles.input, errors.tireDate && styles.inputError]}>
                  <Text style={{color: formData.tireDate ? 'white' : '#7f8c8d'}}>{formatDate(formData.tireDate)}</Text>
                  <Ionicons name="calendar-outline" size={20} color={errors.tireDate ? "#FF5252" : "#7f8c8d"} style={styles.iconRight} />
                </View>
              </TouchableOpacity>
              {errors.tireDate && <Text style={styles.errorText}>{errors.tireDate}</Text>}
            </>
          )}

        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>{step === totalSteps ? "Finish Setup" : "Next"}</Text>
            <Ionicons name="arrow-forward" size={20} color="white" style={{marginLeft: 10}} />
          </TouchableOpacity>
        </View>

        {/* --- MODALS --- */}
        {showDatePicker && (
          <DateTimePicker
            value={formData[activeDateField] || new Date()} 
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
          />
        )}
        {Platform.OS === 'ios' && showDatePicker && (
          <TouchableOpacity style={styles.iosDatePickerBtn} onPress={() => setShowDatePicker(false)}>
            <Text style={styles.iosBtnText}>Confirm Date</Text>
          </TouchableOpacity>
        )}

        <Modal transparent={true} visible={showEnginePicker} animationType="fade" onRequestClose={() => setShowEnginePicker(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowEnginePicker(false)}>
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerHeader}>Select Engine Type</Text>
              {engineOptions.map((option) => (
                <TouchableOpacity key={option} style={styles.pickerOption} onPress={() => { updateData('engineType', option); setShowEnginePicker(false); }}>
                  <Text style={styles.pickerOptionText}>{option}</Text>
                  {formData.engineType === option && <Ionicons name="checkmark" size={20} color="#4E73DF" />}
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.pickerCancelBtn} onPress={() => setShowEnginePicker(false)}>
                <Text style={styles.pickerCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E1438', paddingTop: 50, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  progressContainer: { flexDirection: 'row', gap: 5 },
  progressDash: { width: 30, height: 4, borderRadius: 2 },
  headerTitle: { color: '#aaa', fontSize: 14, textAlign: 'center', marginBottom: 5 },
  mainTitle: { color: 'white', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 },
  formContainer: { paddingBottom: 100 },
  
  label: { color: 'white', fontSize: 14, marginBottom: 8, marginTop: 10, fontWeight: '600' },
  input: { backgroundColor: '#1C2550', color: 'white', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#2A3668', marginBottom: 5, justifyContent: 'center' },
  
  // --- ERROR STYLES ---
  inputError: { borderColor: '#FF5252', borderWidth: 1.5 },
  errorText: { color: '#FF5252', fontSize: 12, marginBottom: 10, marginLeft: 5 },

  iconRight: { position: 'absolute', right: 15 },
  footer: { marginBottom: 40 },
  nextButton: { backgroundColor: '#4E73DF', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, borderRadius: 12 },
  nextButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  
  imagePickerBtn: { width: '100%', height: 200, backgroundColor: '#1C2550', borderRadius: 15, borderWidth: 2, borderColor: '#2A3668', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 5, overflow: 'hidden' },
  imagePickerText: { color: '#7f8c8d', marginTop: 10, fontWeight: '600' },
  vehicleImagePreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  helperText: { color: '#aaa', fontSize: 12, marginBottom: 20 },

  iosDatePickerBtn: { backgroundColor: '#fff', padding: 10, alignItems: 'center', borderRadius: 10, marginTop: 10, marginBottom: 20 },
  iosBtnText: { color: '#007AFF', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  pickerContainer: { width: '85%', backgroundColor: '#1C2550', borderRadius: 15, padding: 20, borderWidth: 1, borderColor: '#2A3668' },
  pickerHeader: { color: '#aaa', fontSize: 14, marginBottom: 15, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 },
  pickerOption: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#2A3668', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerOptionText: { color: 'white', fontSize: 18 },
  pickerCancelBtn: { marginTop: 15, paddingVertical: 10, alignItems: 'center' },
  pickerCancelText: { color: '#ff4444', fontSize: 16 }
});