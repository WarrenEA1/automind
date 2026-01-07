import { useUser } from '@clerk/clerk-expo';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// ADD onSnapshot HERE
import { arrayUnion, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from '../../firebaseConfig';

import ServiceLogModal from '../../components/ServiceLogModal';

export default function Maintenance() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [historyLog, setHistoryLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMileage, setCurrentMileage] = useState(0);

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
    
    // Listener
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCurrentMileage(parseInt(data.currentMileage || 0));
        processData(data);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error listening to data:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const processData = (data) => {
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
    setHistoryLog(sortedHistory);
  };

  const handleSaveService = async (item) => {
    try {
      const docRef = doc(db, 'vehicles', user.id);
      if (activeTab === 'history') {
        item.id = `hist_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      }
      const field = activeTab === 'upcoming' ? 'upcomingSchedules' : 'maintenanceHistory';
      
      await updateDoc(docRef, { [field]: arrayUnion(item) });
      setModalVisible(false);
      // No manual fetch needed
    } catch (error) {
      console.error("Error saving:", error);
      Alert.alert("Error", "Failed to save record.");
    }
  };

  const handleDeleteService = async (id) => {
    try {
      const docRef = doc(db, 'vehicles', user.id);
      if (activeTab === 'upcoming') {
        const newUpcoming = upcomingTasks.filter(i => i.id !== id).map(({ dateObject, ...rest }) => rest);
        await updateDoc(docRef, { upcomingSchedules: newUpcoming });
      } else {
        const newHistory = historyLog.filter(i => i.id !== id).map(({ dateObject, ...rest }) => rest);
        await updateDoc(docRef, { maintenanceHistory: newHistory });
      }
      // No manual fetch needed
    } catch (error) {
      console.error("Error deleting:", error);
      Alert.alert("Error", "Failed to delete record.");
    }
  };

  const calculateProgress = (targetKm) => {
    if(!targetKm || !currentMileage) return 0;
    const startKm = targetKm - 5000; 
    const progress = ((currentMileage - startKm) / 5000) * 100;
    return Math.min(Math.max(progress, 0), 100); 
  };

  const totalSpent = historyLog.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4E73DF"/></View>;

  return (
    <View style={styles.container}>
      <ServiceLogModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        onSave={handleSaveService} 
        onDelete={handleDeleteService}
        initialData={selectedItem}
        type={activeTab}
      />

      <View style={styles.header}>
        <Text style={styles.screenTitle}>Maintenance</Text>
        <View style={styles.toggleContainer}>
          <TouchableOpacity style={[styles.toggleBtn, activeTab === 'upcoming' && styles.activeBtn]} onPress={() => setActiveTab('upcoming')}>
            <Text style={[styles.toggleText, activeTab === 'upcoming' && styles.activeText]}>Upcoming</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleBtn, activeTab === 'history' && styles.activeBtn]} onPress={() => setActiveTab('history')}>
            <Text style={[styles.toggleText, activeTab === 'history' && styles.activeText]}>History</Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'upcoming' ? (
        <FlatList 
          data={upcomingTasks}
          keyExtractor={item => item.id}
          contentContainerStyle={{padding: 20, paddingBottom: 100}}
          ListHeaderComponent={<Text style={styles.sectionLabel}>Upcoming Schedule</Text>}
          ListEmptyComponent={<Text style={styles.emptyText}>No upcoming maintenance scheduled.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => { setSelectedItem(item); setModalVisible(true); }}>
              <View style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <View style={[styles.iconBox, { backgroundColor: (item.color || '#4E73DF') + '20' }]}> 
                      <MaterialCommunityIcons name={item.icon || 'wrench'} size={24} color={item.color || '#4E73DF'} />
                    </View>
                    <View style={{marginLeft: 15}}>
                      <Text style={styles.taskTitle}>{item.service}</Text>
                      <Text style={styles.taskSubtitle}>Due: {item.date || item.dueDate}</Text>
                    </View>
                  </View>
                  <View style={styles.badge}><Text style={styles.badgeText}>Pending</Text></View>
                </View>
                {item.dueKm && (
                  <View style={styles.progressContainer}>
                    <Text style={styles.progressText}>{currentMileage.toLocaleString()} / {item.dueKm.toLocaleString()} km</Text>
                    <View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: `${calculateProgress(item.dueKm)}%`, backgroundColor: item.color || '#4E73DF' }]} /></View>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList 
          data={historyLog}
          keyExtractor={item => item.id}
          contentContainerStyle={{padding: 20, paddingBottom: 100}}
          ListHeaderComponent={
            <View style={styles.costSummary}>
              <Text style={styles.costLabel}>Total Spent (YTD)</Text>
              <Text style={styles.costValue}>₱{totalSpent.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
            </View>
          }
          ListEmptyComponent={<Text style={styles.emptyText}>No history records found.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => { setSelectedItem(item); setModalVisible(true); }}>
              <View style={styles.historyCard}>
                <View style={styles.historyLeft}>
                  <View style={styles.historyIconContainer}><MaterialCommunityIcons name={item.icon || 'wrench'} size={22} color="#4E73DF" /></View>
                  <View>
                    <Text style={styles.historyTitle}>{item.service}</Text>
                    <Text style={styles.historySub}>{item.shop || 'Unknown Shop'} • {item.date}</Text>
                  </View>
                </View>
                <Text style={styles.historyCost}>₱{parseFloat(item.cost || 0).toLocaleString()}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => { setSelectedItem(null); setModalVisible(true); }}>
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#fff', padding: 20, paddingTop: 60, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 5 },
  screenTitle: { fontSize: 28, fontWeight: 'bold', color: '#2d3436', marginBottom: 20 },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#F0F2F5', borderRadius: 12, padding: 4 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeBtn: { backgroundColor: '#4E73DF' },
  toggleText: { fontWeight: '600', color: '#7f8c8d' },
  activeText: { color: 'white' },
  sectionLabel: { fontSize: 16, fontWeight: 'bold', color: '#555', marginBottom: 15 },
  taskCard: { backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  iconBox: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  taskTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  taskSubtitle: { fontSize: 13, color: 'gray' },
  badge: { backgroundColor: '#E3F2FD', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#4E73DF', fontSize: 10, fontWeight: 'bold' },
  progressContainer: { marginTop: 5 },
  progressText: { fontSize: 12, color: 'gray', marginBottom: 5, textAlign: 'right' },
  progressBarBg: { height: 6, backgroundColor: '#F0F2F5', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  historyCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 5, borderLeftColor: '#4E73DF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  historyLeft: { flexDirection: 'row', alignItems: 'center' },
  historyIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0F4FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  historyTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  historySub: { fontSize: 13, color: 'gray', marginTop: 2 },
  historyCost: { fontSize: 16, fontWeight: 'bold', color: '#2d3436' },
  costSummary: { alignItems: 'center', marginBottom: 25 },
  costLabel: { fontSize: 14, color: 'gray', textTransform: 'uppercase', letterSpacing: 1 },
  costValue: { fontSize: 32, fontWeight: 'bold', color: '#4E73DF', marginTop: 5 },
  emptyText: { textAlign: 'center', marginTop: 30, color: '#aaa', fontStyle: 'italic' },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#4E73DF', justifyContent: 'center', alignItems: 'center', shadowColor: '#4E73DF', shadowOpacity: 0.3, shadowRadius: 10, elevation: 10 }
});