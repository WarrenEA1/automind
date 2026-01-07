import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from 'react-native';

export default function ServiceLogModal({ visible, onClose, onSave, onDelete, initialData, type }) {
  // Form State
  const [service, setService] = useState('');
  const [shop, setShop] = useState('');
  const [cost, setCost] = useState('');
  const [mileage, setMileage] = useState('');
  const [date, setDate] = useState(new Date());
  
  // UI State
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Load Initial Data when Modal Opens
  useEffect(() => {
    if (initialData) {
      setService(initialData.service || '');
      setMileage(initialData.dueKm ? initialData.dueKm.toString() : '');
      
      // If completing a task, reset Cost/Shop/Date to force fresh input
      if (type === 'completion') {
        setShop('');
        setCost('');
        setDate(new Date());
      } else {
        // Normal Edit Mode
        setShop(initialData.shop || '');
        setCost(initialData.cost ? initialData.cost.toString() : '');
        // Handle Firestore Timestamp or Date String
        if (initialData.dateObject && initialData.dateObject.seconds) {
           setDate(new Date(initialData.dateObject.seconds * 1000));
        } else if (initialData.dateObject) {
           setDate(new Date(initialData.dateObject));
        }
      }
    } else {
      resetForm();
    }
  }, [initialData, visible, type]);

  const resetForm = () => {
    setService('');
    setShop('');
    setCost('');
    setMileage('');
    setDate(new Date());
  };

  const handleSave = () => {
    if (!service.trim()) {
      Alert.alert("Missing Info", "Please enter a service name.");
      return;
    }

    const itemData = {
      // Keep ID if editing, new ID if adding
      id: initialData ? initialData.id : Date.now().toString(), 
      service,
      shop,
      cost: cost ? parseFloat(cost) : 0,
      dueKm: type === 'upcoming' ? parseFloat(mileage) : null,
      date: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      dateObject: date.toISOString(), // Standardize for DB
      icon: initialData?.icon || 'wrench',
      color: initialData?.color || '#4E73DF',
      status: type === 'completion' ? 'Completed' : 'Pending'
    };

    onSave(itemData);
    onClose();
  };

  const handleDelete = () => {
    Alert.alert("Delete Item", "Are you sure you want to remove this record?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => {
          onDelete(initialData.id);
          onClose();
        } 
      }
    ]);
  };

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  // Helper to check if we need to show Cost/Shop fields
  const showHistoryFields = type === 'history' || type === 'completion';

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <View style={styles.modalView}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {type === 'completion' ? "Complete Service" : initialData ? "Edit Record" : "Add Service"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView>
            {/* Service Name */}
            <Text style={styles.label}>Service Name</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. Oil Change" 
              value={service}
              onChangeText={setService} 
            />

            {/* UPCOMING FIELDS (Mileage) */}
            {type === 'upcoming' && (
              <>
                <Text style={styles.label}>Due at Mileage (km)</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="e.g. 55000" 
                  keyboardType="numeric"
                  value={mileage}
                  onChangeText={setMileage} 
                />
              </>
            )}

            {/* HISTORY / COMPLETION FIELDS (Cost & Shop) */}
            {showHistoryFields && (
              <>
                <Text style={styles.label}>Shop / Mechanic</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="e.g. Shell Station" 
                  value={shop}
                  onChangeText={setShop} 
                />
                <Text style={styles.label}>Total Cost (₱)</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="0.00" 
                  keyboardType="numeric"
                  value={cost}
                  onChangeText={setCost} 
                />
              </>
            )}

            {/* Date Picker */}
            <Text style={styles.label}>
              {type === 'upcoming' ? "Target Due Date" : "Date Completed"}
            </Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateInput}>
              <Text style={{color: '#333'}}>{date.toLocaleDateString()}</Text>
              <Ionicons name="calendar-outline" size={20} color="#555" />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker value={date} mode="date" display="default" onChange={onDateChange} />
            )}

            {/* Action Buttons */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>
                {type === 'completion' ? "Mark as Done" : "Save Record"}
              </Text>
            </TouchableOpacity>

            {/* Only show delete if editing an existing item (not completing) */}
            {initialData && type !== 'completion' && (
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                <Text style={styles.deleteBtnText}>Delete Record</Text>
              </TouchableOpacity>
            )}

          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalView: { backgroundColor: 'white', borderRadius: 20, padding: 25, maxHeight: '80%', shadowColor: '#000', elevation: 5 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#2d3436' },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 8, marginTop: 10 },
  input: { backgroundColor: '#F5F7FA', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0' },
  dateInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F5F7FA', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0' },
  saveBtn: { backgroundColor: '#4E73DF', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 25 },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  deleteBtn: { backgroundColor: '#FFEBEE', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  deleteBtnText: { color: '#FF5252', fontWeight: 'bold', fontSize: 16 }
});