import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0a0a0a',
          borderTopWidth: 0,
          height: 70,
          paddingBottom: 16,
          paddingTop: 12,
        },
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.2)',
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabItem}>
              <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>■</Text>
              <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>English</Text>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  tabIcon: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.2)',
    fontWeight: '300',
  },
  tabIconFocused: {
    color: '#ffffff',
  },
  tabLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.2)',
    marginTop: 4,
    fontWeight: '400',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  tabLabelFocused: {
    color: '#ffffff',
  },
});