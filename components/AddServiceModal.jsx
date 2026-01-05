import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AddServiceModal({ visible, onClose, onSave }) {
  const [serviceName, setServiceName] = useState('');
  const [dueKm, setDueKm] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Simple icon selector (defaulting to 'wrench' for now)
  const [selectedIcon, setSelectedIcon] = useState('wrench');

  const handleSave = () => {
    if (!serviceName || !dueKm) {
      alert("Please fill in the service name and due mileage.");
      return;
    }

    const newService = {
      id: Date.now().toString(), // Unique ID based on timestamp
      service: serviceName,
      dueKm: parseInt(dueKm),
      currentKm: 0, // In a real app, you'd pull the car's current mileage here
      dueDate: dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }),
      dateObject: dueDate, // Hidden date object for sorting
      icon: selectedIcon,
      color: '#4E73DF' // Default blue
    };

    onSave(newService);
    resetForm();
  };

  const resetForm = () => {
    setServiceName('');
    setDueKm('');
    setDueDate(new Date());
    onClose();
  };

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setDueDate(selectedDate);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <View style={styles.modalView}>
          <View style={styles.header}>
            <Text style={styles.title}>New Maintenance Task</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Service Name</Text>
          <TextInput 
            style={styles.input} 
            placeholder="e.g. Spark Plug Replacement" 
            value={serviceName}
            onChangeText={setServiceName}
          />

          <Text style={styles.label}>Due at Mileage (km)</Text>
          <TextInput 
            style={styles.input} 
            placeholder="e.g. 60000" 
            keyboardType="numeric"
            value={dueKm}
            onChangeText={setDueKm}
          />

          <Text style={styles.label}>Target Due Date</Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateInput}>
             <Text style={styles.dateText}>{dueDate.toLocaleDateString()}</Text>
             <Ionicons name="calendar-outline" size={20} color="#555" />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={dueDate}
              mode="date"
              display="default"
              onChange={onDateChange}
            />
          )}

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Add Schedule</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalView: { backgroundColor: 'white', borderRadius: 20, padding: 25, shadowColor: '#000', elevation: 5 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#2d3436' },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 8, marginTop: 10 },
  input: { backgroundColor: '#F5F7FA', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0' },
  dateInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F5F7FA', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0' },
  dateText: { color: '#333' },
  saveBtn: { backgroundColor: '#4E73DF', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 25 },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});