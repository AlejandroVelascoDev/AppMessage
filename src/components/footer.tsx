// import { BlurView } from '@react-native-community/blur';
// import React from 'react';
// import {
//   Platform,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from 'react-native';

// type TabButtonProps = {
//   tab: { id: string; icon: string; label: string };
//   activeTab: string;
//   setActiveTab: (id: string) => void;
//   styles: any;
// };

// const TabButton = ({
//   tab,
//   activeTab,
//   setActiveTab,
//   styles,
// }: TabButtonProps) => (
//   <TouchableOpacity
//     key={tab.id}
//     style={styles.tabButton}
//     onPress={() => setActiveTab(tab.id)}
//     activeOpacity={0.7}
//   >
//     <View
//       style={[
//         styles.iconContainer,
//         activeTab === tab.id && styles.activeIconContainer,
//       ]}
//     >
//       <Text style={styles.icon}>{tab.icon}</Text>
//     </View>
//     <Text style={[styles.label, activeTab === tab.id && styles.activeLabel]}>
//       {tab.label}
//     </Text>
//   </TouchableOpacity>
// );
// const TelegramFooter = () => {
//   const [activeTab, setActiveTab] = React.useState('contacts');

//   const tabs = [
//     { id: 'contacts', icon: '👥', label: 'Contactos' },
//     { id: 'calls', icon: '📞', label: 'Llamadas' },
//     { id: 'chats', icon: '💬', label: 'Chats' },
//     { id: 'settings', icon: '⚙️', label: 'Ajustes' },
//   ];

//   return (
//     <View style={styles.container}>
//       {Platform.OS === 'ios' ? (
//         <BlurView
//           style={styles.blurContainer}
//           blurType="light"
//           blurAmount={10}
//           reducedTransparencyFallbackColor="white"
//         >
//           <View style={styles.contentContainer}>
//             {tabs.map((tab) => (
//               <TabButton
//                 key={tab.id}
//                 tab={tab}
//                 activeTab={activeTab}
//                 setActiveTab={setActiveTab}
//                 styles={styles}
//               />
//             ))}
//           </View>
//         </BlurView>
//       ) : (
//         <View style={[styles.blurContainer, styles.androidGlass]}>
//           <View style={styles.contentContainer}>
//             {tabs.map((tab) => (
//               <TabButton
//                 key={tab.id}
//                 tab={tab}
//                 activeTab={activeTab}
//                 setActiveTab={setActiveTab}
//                 styles={styles}
//               />
//             ))}
//           </View>
//         </View>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     borderTopWidth: 0.5,
//     borderTopColor: 'rgba(0, 0, 0, 0.1)',
//   },
//   blurContainer: {
//     overflow: 'hidden',
//   },
//   androidGlass: {
//     backgroundColor: 'rgba(255, 255, 255, 0.85)',
//     backdropFilter: 'blur(10px)',
//   },
//   contentContainer: {
//     flexDirection: 'row',
//     paddingTop: 8,
//     paddingBottom: Platform.OS === 'ios' ? 24 : 12,
//     paddingHorizontal: 8,
//     justifyContent: 'space-around',
//   },
//   tabButton: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 4,
//   },
//   iconContainer: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 4,
//   },
//   activeIconContainer: {
//     backgroundColor: 'rgba(0, 122, 255, 0.15)',
//   },
//   icon: {
//     fontSize: 24,
//   },
//   label: {
//     fontSize: 11,
//     color: '#8E8E93',
//     fontWeight: '500',
//   },
//   activeLabel: {
//     color: '#007AFF',
//     fontWeight: '600',
//   },
// });

// export default TelegramFooter;
