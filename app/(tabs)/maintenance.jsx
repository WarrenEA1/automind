import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AddServiceModal from '../../components/AddServiceModal';

export default function Maintenance() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [modalVisible, setModalVisible] = useState(false);

  // --- UPCOMING TASKS STATE ---
  const [upcomingTasks, setUpcomingTasks] = useState([
    {
      id: '1',
      service: 'Oil Change',
      dueKm: 55000,
      currentKm: 53200,
      dueDate: 'Dec 12, 2025',
      dateObject: new Date('2025-12-12'),
      icon: 'oil',
      color: '#FF5252'
    },
    {
      id: '2',
      service: 'Tire Replacement',
      dueKm: 60000,
      currentKm: 53200,
      dueDate: 'Dec 12, 2025',
      dateObject: new Date('2025-12-12'),
      icon: 'tire',
      color: '#4E73DF'
    }
  ]);

  // --- HISTORY STATE (Total: ₱10,200) ---
  const [historyLog, setHistoryLog] = useState([
    {
      id: '101',
      service: 'Battery Replacement',
      date: 'Oct 12, 2023',
      cost: 4500,
      shop: 'Motolite Official',
      icon: 'car-battery'
    },
    {
      id: '102',
      service: 'Aircon Cleaning', // Restored this original item
      date: 'Aug 15, 2023',
      cost: 3500,
      shop: 'CoolAire Pros',
      icon: 'air-conditioner'
    },
    {
      id: '103',
      service: 'Change Oil & Filter',
      date: 'June 05, 2023',
      cost: 2200,
      shop: 'Shell Station',
      icon: 'water-outline' 
    }
  ]);

  // --- ADD & SORT FUNCTION ---
  const handleAddService = (newService) => {
    const updatedList = [...upcomingTasks, newService];
    updatedList.sort((a, b) => new Date(a.dateObject) - new Date(b.dateObject));
    setUpcomingTasks(updatedList);
    setModalVisible(false);
  };

  const calculateProgress = (current, target) => {
    if(target === 0) return 0;
    const percentage = (current / target) * 100;
    return percentage > 100 ? 100 : percentage; 
  };

  const renderUpcomingItem = ({ item }) => (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}> 
            <MaterialCommunityIcons name={item.icon || 'wrench'} size={24} color={item.color} />
          </View>
          <View style={{marginLeft: 15}}>
            <Text style={styles.taskTitle}>{item.service}</Text>
            <Text style={styles.taskSubtitle}>Due: {item.dueDate}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.doneBtn}>
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {item.currentKm.toLocaleString()} / {item.dueKm.toLocaleString()} km
        </Text>
        <View style={styles.progressBarBg}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${calculateProgress(item.currentKm, item.dueKm)}%`, backgroundColor: item.color }
            ]} 
          />
        </View>
      </View>
    </View>
  );

  const renderHistoryItem = ({ item }) => (
    <View style={styles.historyCard}>
      <View style={styles.historyLeft}>
        <View style={styles.historyDot} />
        <View style={{marginLeft: 15}}>
          <Text style={styles.historyTitle}>{item.service}</Text>
          <Text style={styles.historySub}>{item.shop} • {item.date}</Text>
        </View>
      </View>
      <Text style={styles.historyCost}>₱{item.cost.toLocaleString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <AddServiceModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        onSave={handleAddService} 
      />

      <View style={styles.header}>
        <Text style={styles.screenTitle}>Maintenance</Text>
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleBtn, activeTab === 'upcoming' && styles.activeBtn]}
            onPress={() => setActiveTab('upcoming')}
          >
            <Text style={[styles.toggleText, activeTab === 'upcoming' && styles.activeText]}>Upcoming</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, activeTab === 'history' && styles.activeBtn]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.toggleText, activeTab === 'history' && styles.activeText]}>History</Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'upcoming' ? (
        <FlatList 
          data={upcomingTasks}
          renderItem={renderUpcomingItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{padding: 20, paddingBottom: 100}}
          ListHeaderComponent={<Text style={styles.sectionLabel}>Maintenance Schedule</Text>}
        />
      ) : (
        <FlatList 
          data={historyLog}
          renderItem={renderHistoryItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{padding: 20, paddingBottom: 100}}
          ListHeaderComponent={
            <View style={styles.costSummary}>
              <Text style={styles.costLabel}>Total Spent (YTD)</Text>
              <Text style={styles.costValue}>₱10,200.00</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { 
    backgroundColor: '#fff', padding: 20, paddingTop: 60, 
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 5
  },
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
  doneBtn: { backgroundColor: '#E3F2FD', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  doneBtnText: { color: '#4E73DF', fontWeight: 'bold', fontSize: 12 },
  progressContainer: { marginTop: 5 },
  progressText: { fontSize: 12, color: 'gray', marginBottom: 5, textAlign: 'right' },
  progressBarBg: { height: 6, backgroundColor: '#F0F2F5', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },

  historyCard: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    backgroundColor: '#fff', borderRadius: 15, padding: 18, marginBottom: 10, 
    borderLeftWidth: 5, borderLeftColor: '#4E73DF',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2
  },
  historyLeft: { flexDirection: 'row', alignItems: 'center' },
  historyDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4E73DF' },
  historyTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  historySub: { fontSize: 13, color: 'gray', marginTop: 2 },
  historyCost: { fontSize: 16, fontWeight: 'bold', color: '#2d3436' },

  costSummary: { alignItems: 'center', marginBottom: 25 },
  costLabel: { fontSize: 14, color: 'gray', textTransform: 'uppercase', letterSpacing: 1 },
  costValue: { fontSize: 32, fontWeight: 'bold', color: '#4E73DF', marginTop: 5 },

  fab: { position: 'absolute', bottom: 30, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#4E73DF', justifyContent: 'center', alignItems: 'center', shadowColor: '#4E73DF', shadowOpacity: 0.3, shadowRadius: 10, elevation: 10 }
});