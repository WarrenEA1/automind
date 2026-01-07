import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ImageBackground, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// ADD onSnapshot HERE
import { arrayUnion, doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { db } from '../../firebaseConfig';

import ServiceLogModal from '../../components/ServiceLogModal';
import VehicleWizardModal from '../../components/VehicleWizardModal';

export default function Home() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter(); 

  const [wizardVisible, setWizardVisible] = useState(false);
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [recentHistory, setRecentHistory] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalType, setModalType] = useState('upcoming'); 
  
  const [settingsVisible, setSettingsVisible] = useState(false);

  const safeDate = (input) => {
    if (!input) return new Date();
    if (input.toDate) return input.toDate(); 
    if (input.seconds) return new Date(input.seconds * 1000); 
    return new Date(input); 
  };

  // --- REAL-TIME DATA LISTENER ---
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const docRef = doc(db, 'vehicles', user.id);

    // Using onSnapshot instead of getDoc
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setVehicle(data);
        
        // Auto-generate defaults if empty
        if (!data.upcomingSchedules || data.upcomingSchedules.length === 0) {
          const defaults = generateDefaultSchedules(data);
          // Update DB (Listener will catch this update automatically)
          updateDoc(docRef, { upcomingSchedules: defaults });
        } else {
          processDashboardData(data);
        }
      } else {
        setWizardVisible(true);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error listening to data:", error);
      setLoading(false);
    });

    // Cleanup listener when screen unmounts
    return () => unsubscribe();
  }, [user]);

  const generateDefaultSchedules = (data) => {
    const today = new Date();
    const nextOilDate = data.nextOilChange ? safeDate(data.nextOilChange) : new Date(new Date().setMonth(today.getMonth() + 6));
    const nextOilKm = data.currentMileage ? parseInt(data.currentMileage) + 5000 : 5000;
    const nextRegDate = data.orcrExpiry ? safeDate(data.orcrExpiry) : new Date(new Date().setFullYear(today.getFullYear() + 1));
    const nextTireDate = data.tireDate ? safeDate(data.tireDate) : new Date(new Date().setMonth(today.getMonth() + 6));

    return [
      { id: 'default_oil', service: "Oil Change", subtitle: "Routine Maintenance", date: nextOilDate.toLocaleDateString(), dateObject: nextOilDate.toISOString(), dueKm: nextOilKm, icon: "oil", color: "#FF5252", status: "Pending" },
      { id: 'default_reg', service: "Registration Renewal", subtitle: "LTO Requirement", date: nextRegDate.toLocaleDateString(), dateObject: nextRegDate.toISOString(), icon: "file-document-outline", color: "#FF9800", status: "Pending" },
      { id: 'default_tire', service: "Tire Rotation", subtitle: "Safety Check", date: nextTireDate.toLocaleDateString(), dateObject: nextTireDate.toISOString(), dueKm: nextOilKm + 5000, icon: "tire", color: "#2196F3", status: "Pending" }
    ];
  };

  const processDashboardData = (data) => {
    const rawUpcoming = data.upcomingSchedules || []; 
    const sortedUpcoming = rawUpcoming.map(item => ({
      ...item,
      dateObject: safeDate(item.dateObject || item.dueDate)
    })).sort((a, b) => a.dateObject - b.dateObject);
    setUpcomingTasks(sortedUpcoming);

    const rawHistory = data.maintenanceHistory || [];
    const sortedHistory = rawHistory.map(item => ({
      ...item,
      dateObject: safeDate(item.dateObject || item.date)
    })).sort((a, b) => b.dateObject - a.dateObject); 
    setRecentHistory(sortedHistory);
  };

  const handleLogout = async () => {
    try { await signOut(); } catch (err) { console.error("Logout failed", err); }
  };

  const handleSaveVehicle = async (data) => {
    try {
      await setDoc(doc(db, 'vehicles', user.id), { ...data, updatedAt: new Date().toISOString() }, { merge: true });
      setWizardVisible(false);
      // No need to manually refresh - onSnapshot handles it!
    } catch (error) { console.error(error); }
  };

  const handleMarkComplete = (item) => {
    setSelectedItem(item);
    setModalType('completion'); 
    setModalVisible(true);
  };

  const handleSaveCompletion = async (completedItem) => {
    try {
      const docRef = doc(db, 'vehicles', user.id);
      const historyItem = { ...completedItem, id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, status: 'Completed' };

      await updateDoc(docRef, { maintenanceHistory: arrayUnion(historyItem) });

      const itemToRemove = upcomingTasks.find(t => t.id === completedItem.id);
      if (itemToRemove) {
         // Create clean object for removal
         const cleanItem = upcomingTasks.find(t => t.id === completedItem.id);
         const { dateObject, ...itemForDB } = cleanItem; // Remove local dateObject
         
         const newUpcoming = upcomingTasks
            .filter(t => t.id !== completedItem.id)
            .map(({ dateObject, ...rest }) => rest);

         await updateDoc(docRef, { upcomingSchedules: newUpcoming });
      }
      setModalVisible(false);
      // No need to manually refresh!
    } catch (error) {
      console.error("Error completing task:", error);
      Alert.alert("Error", "Could not save completion details.");
    }
  };

  if (loading) {
    return (
      <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
        <ActivityIndicator size="large" color="#4E73DF"/>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
      <VehicleWizardModal visible={wizardVisible} onSave={handleSaveVehicle} />
      <ServiceLogModal visible={modalVisible} onClose={() => setModalVisible(false)} onSave={handleSaveCompletion} initialData={selectedItem} type={modalType} />

      <Modal animationType="fade" transparent={true} visible={settingsVisible} onRequestClose={() => setSettingsVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSettingsVisible(false)}>
          <View style={styles.settingsMenu}>
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsTitle}>Settings</Text>
              <TouchableOpacity onPress={() => setSettingsVisible(false)}><Ionicons name="close" size={24} color="#555" /></TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setSettingsVisible(false); setWizardVisible(true); }}>
              <Ionicons name="car-sport-outline" size={20} color="#333" />
              <Text style={styles.menuText}>Edit Vehicle Details</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#FF5252" />
              <Text style={[styles.menuText, { color: '#FF5252' }]}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>Good Morning,</Text>
          <Text style={styles.username}>{user?.firstName || "Driver"}</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setSettingsVisible(true)}>
           <Ionicons name="settings-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {vehicle ? (
        <>
          <TouchableOpacity activeOpacity={0.9} onPress={() => setWizardVisible(true)} style={styles.cardContainer}>
            <ImageBackground source={{ uri: vehicle.vehicleImageUri }} style={styles.vehicleImageCard} imageStyle={{ borderRadius: 20 }}>
              <View style={styles.vehicleCardOverlay}>
                <View>
                  <View style={{flexDirection:'row', alignItems:'center'}}>
                    <Text style={styles.vehicleCardName}>{vehicle.vehicleName}</Text>
                    <Ionicons name="pencil" size={16} color="rgba(255,255,255,0.7)" style={{marginLeft: 8}}/>
                  </View>
                  <Text style={styles.vehicleCardPlate}>{vehicle.plateNumber}</Text>
                </View>
                <View style={styles.mileageContainer}>
                  <Text style={styles.mileageLabel}>Odometer</Text>
                  <Text style={styles.mileageValue}>{parseInt(vehicle.currentMileage || 0).toLocaleString()} km</Text>
                </View>
              </View>
            </ImageBackground>
          </TouchableOpacity>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Services</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/maintenance')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {upcomingTasks.slice(0, 3).map((task) => (
            <View key={task.id} style={styles.taskCard}>
              <View style={[styles.iconBox, { backgroundColor: (task.color || '#4E73DF') + '20' }]}>
                <MaterialCommunityIcons name={task.icon || 'wrench'} size={24} color={task.color || '#4E73DF'} />
              </View>
              <View style={styles.taskContent}>
                <Text style={styles.taskTitle}>{task.service}</Text>
                <Text style={styles.taskSubtitle}>Due: {task.date || task.dueDate}</Text>
              </View>
              <TouchableOpacity style={styles.checkBtn} onPress={() => handleMarkComplete(task)}>
                <Ionicons name="checkmark" size={20} color="white" />
              </TouchableOpacity>
            </View>
          ))}

          <View style={[styles.sectionHeader, { marginTop: 25 }]}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/maintenance')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentHistory.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyText}>No recent activity.</Text>
              <Text style={styles.emptySubText}>Complete a task to add it here.</Text>
            </View>
          ) : (
            recentHistory.slice(0, 2).map((item) => (
              <View key={item.id} style={styles.historyCard}>
                <View style={styles.historyLeft}>
                  <View style={styles.historyDot} />
                  <View style={{marginLeft: 10}}>
                    <Text style={styles.historyTitle}>{item.service}</Text>
                    <Text style={styles.historyDate}>{item.shop || 'Service Record'} • {item.date}</Text>
                  </View>
                </View>
                <Text style={styles.historyCost}>₱{item.cost ? parseFloat(item.cost).toLocaleString() : '0'}</Text>
              </View>
            ))
          )}
        </>
      ) : (
        <View style={styles.emptyState}><Text>Loading...</Text></View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', padding: 20, paddingTop: 60 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  greeting: { fontSize: 16, color: '#7f8c8d' },
  username: { fontSize: 24, fontWeight: 'bold', color: '#2d3436' },
  cardContainer: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10, marginBottom: 30 },
  vehicleImageCard: { width: '100%', height: 200, justifyContent: 'flex-end' },
  vehicleCardOverlay: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', padding: 20, backgroundColor: 'rgba(0,0,0,0.5)', borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  vehicleCardName: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  vehicleCardPlate: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '600', marginTop: 4, textTransform: 'uppercase' },
  mileageContainer: { alignItems: 'flex-end' },
  mileageLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  mileageValue: { color: 'white', fontSize: 18, fontWeight: 'bold', marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2d3436' },
  viewAllText: { fontSize: 14, color: '#4E73DF', fontWeight: '600' },
  taskCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 15, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  iconBox: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  taskContent: { flex: 1 },
  taskTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  taskSubtitle: { fontSize: 13, color: 'gray' },
  checkBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#4E73DF', justifyContent: 'center', alignItems: 'center' },
  historyCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, marginBottom: 10 },
  historyLeft: { flexDirection: 'row', alignItems: 'center' },
  historyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4E73DF' },
  historyTitle: { fontSize: 15, fontWeight: '600', color: '#333' },
  historyDate: { fontSize: 12, color: 'gray', marginTop: 2 },
  historyCost: { fontSize: 15, fontWeight: 'bold', color: '#2d3436' },
  emptyHistory: { alignItems: 'center', padding: 20, backgroundColor: '#fff', borderRadius: 15 },
  emptyText: { color: '#333', fontWeight: '600', marginBottom: 5 },
  emptySubText: { color: '#aaa', fontSize: 12 },
  emptyState: { alignItems: 'center', marginTop: 50 },
  iconBtn: { padding: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  settingsMenu: { width: '80%', backgroundColor: 'white', borderRadius: 20, padding: 20, elevation: 10 },
  settingsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  settingsTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15 },
  menuText: { fontSize: 16, marginLeft: 15, fontWeight: '500', color: '#333' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 5 }
});