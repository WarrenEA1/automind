import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
      <Tabs screenOptions={{headerShown:false}}>
        <Tabs.Screen name="home"
          options={{ 
            tabBarLabel: 'Home',
            tabBarIcon:({color})=><Entypo name="home" size={24} color={color} />
          }}
        />
        <Tabs.Screen name="maintenance"
          options={{ 
            tabBarLabel: 'Maintenance',
            tabBarIcon:({color})=><FontAwesome6 name="wrench" size={24} color={color} />
          }}
        />
        <Tabs.Screen name="speedometer"
          options={{ 
            tabBarLabel: 'Speedometer',
            tabBarIcon:({color})=><Ionicons name="speedometer" size={24} color={color} />
          }}
        />
        <Tabs.Screen name="tollFeeCalculator"
          options={{ 
            tabBarLabel: 'Trip Calculator',
            tabBarIcon:({color})=><MaterialCommunityIcons name="map-marker-distance" size={24} color={color} />
          }}
        />
        <Tabs.Screen name="notifications"
          options={{
            tabBarLabel: 'Notifications',
            tabBarIcon:({color})=><Ionicons name="notifications" size={24} color={color} />
          }}
        />
      </Tabs>
  )
}