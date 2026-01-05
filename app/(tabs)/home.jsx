import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; // Import router for navigation
import { useState } from 'react';
import { ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import VehicleWizardModal from '../../components/VehicleWizardModal';

export default function Home() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter(); // Hook to navigate between tabs

  const [wizardVisible, setWizardVisible] = useState(true);
  const [vehicle, setVehicle] = useState(null);
  
  // Lists for the UI
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [recentHistory, setRecentHistory] = useState([]);

  const handleLogout = async () => {
    try { await signOut(); } catch (err) { console.error("Logout failed", err); }
  };

  const handleSaveVehicle = (data) => {
    setVehicle(data);
    setWizardVisible(false);
    generateDashboardData(data);
  };

const generateDashboardData = (data) => {
    // 1. Parse the dates from the Wizard data
    const oilDate = new Date(data.nextOilChange);
    const orcrDate = new Date(data.orcrExpiry);
    
    // Mock date for Tire Rotation (e.g., 6 months from now for demo purposes)
    const tireDate = new Date();
    tireDate.setMonth(tireDate.getMonth() + 6);

    // 2. Create the raw list of tasks
    const tasks = [
      {
        id: 1,
        title: "Oil Change Due",
        subtitle: `Due on ${oilDate.toLocaleDateString()}`,
        icon: "oil",
        color: "#FF5252", // Red
        bg: "#FFEBEE",
        dateObject: oilDate // <--- Used for sorting
      },
      {
        id: 2,
        title: "Registration Renewal",
        subtitle: `Expires on ${orcrDate.toLocaleDateString()}`,
        icon: "file-document-outline",
        color: "#FF9800", // Orange
        bg: "#FFF3E0",
        dateObject: orcrDate // <--- Used for sorting
      },
      {
        id: 3,
        title: "Tire Rotation",
        subtitle: `Recommended by ${tireDate.toLocaleDateString()}`, 
        icon: "tire",
        color: "#2196F3", // Blue
        bg: "#E3F2FD",
        dateObject: tireDate // <--- Used for sorting
      }
    ];

    // 3. SORTING LOGIC: Ascending Order (Earliest date first)
    tasks.sort((a, b) => a.dateObject - b.dateObject);

    // 4. Update the state with the sorted list
    setUpcomingTasks(tasks);

    // --- (Rest of your history logic remains the same) ---
    setRecentHistory([
      {
        id: 101,
        title: "Battery Replacement",
        date: "Oct 12, 2023",
        cost: "₱4,500",
        icon: "car-battery",
        status: "Completed"
      },
      {
        id: 102,
        title: "Change Oil",
        date: "June 05, 2023",
        cost: "₱2,200",
        icon: "water-outline",
        status: "Completed"
      }
    ]);
  };
  // Helper to navigate to Maintenance Tab
  const goToMaintenance = () => {
    router.push('/(tabs)/maintenance');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
      <VehicleWizardModal visible={wizardVisible} onSave={handleSaveVehicle} />

      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>Good Morning,</Text>
          <Text style={styles.username}>{user?.firstName || "Driver"}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutIconBtn}>
          <Ionicons name="log-out-outline" size={24} color="#ff4444" />
        </TouchableOpacity>
      </View>

      {vehicle ? (
        <>
          {/* --- VEHICLE CARD --- */}
          <View style={styles.cardContainer}>
            <ImageBackground 
              source={{ uri: vehicle.vehicleImageUri }} 
              style={styles.vehicleImageCard}
              imageStyle={{ borderRadius: 20 }}
            >
              <View style={styles.vehicleCardOverlay}>
                <View>
                  <Text style={styles.vehicleCardName}>{vehicle.vehicleName}</Text>
                  <Text style={styles.vehicleCardPlate}>{vehicle.plateNumber}</Text>
                </View>
                <View style={styles.mileageContainer}>
                  <Text style={styles.mileageLabel}>Odometer</Text>
                  <Text style={styles.mileageValue}>{parseInt(vehicle.currentMileage).toLocaleString()} km</Text>
                </View>
              </View>
            </ImageBackground>
          </View>

          {/* --- UPCOMING SERVICES (SHOW TOP 2) --- */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Services</Text>
            <TouchableOpacity onPress={goToMaintenance}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {upcomingTasks.slice(0, 2).map((task) => (
            <View key={task.id} style={styles.taskCard}>
              <View style={[styles.iconBox, { backgroundColor: task.bg }]}>
                <MaterialCommunityIcons name={task.icon} size={24} color={task.color} />
              </View>
              <View style={styles.taskContent}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskSubtitle}>{task.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </View>
          ))}

          {/* --- RECENT ACTIVITY (SHOW TOP 2) --- */}
          <View style={[styles.sectionHeader, { marginTop: 25 }]}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={goToMaintenance}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentHistory.map((item) => (
            <View key={item.id} style={styles.historyCard}>
              <View style={styles.historyLeft}>
                <View style={styles.historyDot} />
                <View style={{marginLeft: 10}}>
                  <Text style={styles.historyTitle}>{item.title}</Text>
                  <Text style={styles.historyDate}>{item.date}</Text>
                </View>
              </View>
              <Text style={styles.historyCost}>{item.cost}</Text>
            </View>
          ))}

        </>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="car-sport-outline" size={60} color="#ccc" />
          <Text style={styles.emptyStateText}>No vehicle data found.</Text>
          <TouchableOpacity style={styles.setupBtn} onPress={() => setWizardVisible(true)}>
            <Text style={styles.setupBtnText}>Setup Vehicle</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', padding: 20, paddingTop: 60 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  greeting: { fontSize: 16, color: '#7f8c8d' },
  username: { fontSize: 24, fontWeight: 'bold', color: '#2d3436' },
  logoutIconBtn: { padding: 8, backgroundColor: '#ffecec', borderRadius: 12 },
  
  // Vehicle Card
  cardContainer: { 
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
    marginBottom: 30
  },
  vehicleImageCard: { width: '100%', height: 200, justifyContent: 'flex-end' },
  vehicleCardOverlay: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)', 
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
  },
  vehicleCardName: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  vehicleCardPlate: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '600', marginTop: 4, textTransform: 'uppercase' },
  mileageContainer: { alignItems: 'flex-end' },
  mileageLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  mileageValue: { color: 'white', fontSize: 18, fontWeight: 'bold', marginTop: 2 },

  // Section Headers
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2d3436' },
  viewAllText: { fontSize: 14, color: '#4E73DF', fontWeight: '600' },

  // Upcoming Task Cards
  taskCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15, borderRadius: 15,
    marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  iconBox: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  taskContent: { flex: 1 },
  taskTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  taskSubtitle: { fontSize: 13, color: 'gray' },

  // History Cards (Simpler Design)
  historyCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15, borderRadius: 15,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
    marginBottom: 10,
  },
  historyLeft: { flexDirection: 'row', alignItems: 'center' },
  historyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4E73DF' },
  historyTitle: { fontSize: 15, fontWeight: '600', color: '#333' },
  historyDate: { fontSize: 12, color: 'gray', marginTop: 2 },
  historyCost: { fontSize: 15, fontWeight: 'bold', color: '#2d3436' },

  // Empty State
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyStateText: { color: '#aaa', marginTop: 10, marginBottom: 20 },
  setupBtn: { backgroundColor: '#4E73DF', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 12 },
  setupBtnText: { color: 'white', fontWeight: 'bold' }
});