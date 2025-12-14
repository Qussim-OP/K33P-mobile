import { BackIcon, CLOSE, SearchIcon } from '@/assets/images/svg';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// Import notification API functions
import {
  deleteNotification,
  getNotificationStats,
  getNotifications,
  markAllNotificationsAsRead,
  markAllNotificationsAsSeen,
  markNotificationAsRead,
  markNotificationAsSeen,
  type Notification,
  type NotificationStats
} from '@/utils/notification-api';

type FilterType = 'all' | 'unseen' | 'seen';

interface GroupedNotification {
  date: string;
  dateDisplay: string;
  notifications: Notification[];
}

export default function Notifications() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [groupedNotifications, setGroupedNotifications] = useState<GroupedNotification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNotificationId, setExpandedNotificationId] = useState<string | null>(null);

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();
    fetchNotificationStats();
  }, []);

  // Group notifications by date when notifications change
  useEffect(() => {
    filterAndGroupNotifications();
  }, [notifications, activeFilter, searchQuery, isSearchActive]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await getNotifications({
        order_by: 'created_at',
        order_direction: 'desc'
      });

      if (response.success && response.data?.notifications) {
        setNotifications(response.data.notifications);
      } else {
        console.error('Failed to fetch notifications:', response.message);
        Alert.alert('Error', 'Failed to load notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchNotificationStats = async () => {
    try {
      setLoadingStats(true);
      const response = await getNotificationStats();
      
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching notification stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const formatDateDisplay = (dateString: string): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const notificationDate = new Date(dateString);
    
    // Reset time to compare only dates
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const twoDaysAgoDate = new Date(twoDaysAgo.getFullYear(), twoDaysAgo.getMonth(), twoDaysAgo.getDate());
    const notifDate = new Date(notificationDate.getFullYear(), notificationDate.getMonth(), notificationDate.getDate());
    
    if (notifDate.getTime() === todayDate.getTime()) {
      return 'Today';
    } else if (notifDate.getTime() === yesterdayDate.getTime()) {
      return 'Yesterday';
    } else if (notifDate.getTime() === twoDaysAgoDate.getTime()) {
      return 'Two days ago';
    } else {
      // Format as dd/mm/yyyy
      const day = notificationDate.getDate().toString().padStart(2, '0');
      const month = (notificationDate.getMonth() + 1).toString().padStart(2, '0');
      const year = notificationDate.getFullYear();
      return `${day}/${month}/${year}`;
    }
  };

  const formatDateForDetail = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const filterAndGroupNotifications = useCallback(() => {
    let filtered: Notification[] = [];
    
    // First filter by active filter
    switch (activeFilter) {
      case 'all':
        filtered = notifications;
        break;
      case 'unseen':
        filtered = notifications.filter(n => !n.is_seen);
        break;
      case 'seen':
        filtered = notifications.filter(n => n.is_seen);
        break;
    }

    // Then filter by search query if active AND has query
    if (isSearchActive) {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(notification => 
          notification.title.toLowerCase().includes(query) ||
          notification.message.toLowerCase().includes(query)
        );
      } else {
        // If search is active but no query, show empty array
        filtered = [];
      }
    }

    setFilteredNotifications(filtered);

    // Group by date
    const groups: Record<string, Notification[]> = {};
    
    filtered.forEach(notification => {
      const date = new Date(notification.created_at);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(notification);
    });

    // Convert to array and sort by date (newest first)
    const grouped = Object.entries(groups).map(([dateKey, notifications]) => ({
      date: dateKey,
      dateDisplay: formatDateDisplay(notifications[0].created_at),
      notifications: notifications.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setGroupedNotifications(grouped);
  }, [notifications, activeFilter, searchQuery, isSearchActive]);

  const handleSearchToggle = () => {
    if (isSearchActive) {
      // If search is active, close it
      setIsSearchActive(false);
      setSearchQuery('');
      // Also collapse any expanded notification when closing search
      setExpandedNotificationId(null);
    } else {
      // If search is not active, open it
      setIsSearchActive(true);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
    fetchNotificationStats();
    // Collapse any expanded notification on refresh
    setExpandedNotificationId(null);
  }, []);

  const handleFilterPress = (filter: FilterType) => {
    setActiveFilter(filter);
    // Collapse any expanded notification when changing filter
    setExpandedNotificationId(null);
  };

  const handleNotificationPress = (notification: Notification) => {
    // Navigate to notification detail screen
    router.push({
      pathname: '/profile/notifications/detail',
      params: {
        notificationId: notification.id,
        title: notification.title,
        message: notification.message,
        date: formatDateForDetail(notification.created_at)
      }
    });
  };

  const handleNotificationInteraction = async (notification: Notification) => {
    try {
      // Mark as seen if not already seen
      if (!notification.is_seen) {
        const seenResponse = await markNotificationAsSeen(notification.id);
        if (seenResponse.success) {
          // Update local state
          setNotifications(prev => prev.map(n => 
            n.id === notification.id ? { ...n, is_seen: true } : n
          ));
          
          // Update stats
          if (stats) {
            setStats(prev => prev ? {
              ...prev,
              unseen: Math.max(0, prev.unseen - 1)
            } : prev);
          }
        }
      }

      // Mark as read if not already read
      if (!notification.is_read) {
        const readResponse = await markNotificationAsRead(notification.id);
        if (readResponse.success) {
          // Update local state
          setNotifications(prev => prev.map(n => 
            n.id === notification.id ? { ...n, is_read: true } : n
          ));
          
          // Update stats
          if (stats) {
            setStats(prev => prev ? {
              ...prev,
              unread: Math.max(0, prev.unread - 1)
            } : prev);
          }
        }
      }
    } catch (error) {
      console.error('Error handling notification interaction:', error);
    }
  };

  const handleNotificationItemPress = (notification: Notification) => {
    // Toggle expand/collapse when notification item is pressed
    handleNotificationInteraction(notification);
    
    if (expandedNotificationId === notification.id) {
      // If already expanded, collapse it
      setExpandedNotificationId(null);
    } else {
      // If not expanded, expand this one (and collapse any other)
      setExpandedNotificationId(notification.id);
    }
  };

  const handleArrowPress = (notification: Notification) => {
    // Toggle expand/collapse when arrow is pressed
    handleNotificationItemPress(notification);
  };

  const handleCardPress = (notification: Notification) => {
    // Navigate to detail page when expanded card is pressed
    handleNotificationInteraction(notification);
    handleNotificationPress(notification);
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await markAllNotificationsAsRead();
      
      if (response.success) {
        // Update all notifications as read in local state
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        
        // Update stats
        if (stats) {
          setStats(prev => prev ? {
            ...prev,
            unread: 0
          } : prev);
        }
        
        Alert.alert('Success', 'All notifications marked as read');
      } else {
        Alert.alert('Error', response.message || 'Failed to mark all as read');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };

  const handleMarkAllAsSeen = async () => {
    try {
      const response = await markAllNotificationsAsSeen();
      
      if (response.success) {
        // Update all notifications as seen in local state
        setNotifications(prev => prev.map(n => ({ ...n, is_seen: true })));
        
        // Update stats
        if (stats) {
          setStats(prev => prev ? {
            ...prev,
            unseen: 0
          } : prev);
        }
        
        Alert.alert('Success', 'All notifications marked as seen');
      } else {
        Alert.alert('Error', response.message || 'Failed to mark all as seen');
      }
    } catch (error) {
      console.error('Error marking all as seen:', error);
      Alert.alert('Error', 'Failed to mark all notifications as seen');
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      Alert.alert(
        'Delete Notification',
        'Are you sure you want to delete this notification?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              const response = await deleteNotification(notificationId);
              
              if (response.success) {
                // Remove from local state
                setNotifications(prev => prev.filter(n => n.id !== notificationId));
                
                // Update stats if we have them
                if (stats) {
                  const notification = notifications.find(n => n.id === notificationId);
                  if (notification) {
                    setStats(prev => prev ? {
                      ...prev,
                      total: Math.max(0, prev.total - 1),
                      unread: notification.is_read ? prev.unread : Math.max(0, prev.unread - 1),
                      unseen: notification.is_seen ? prev.unseen : Math.max(0, prev.unseen - 1),
                      by_type: {
                        ...prev.by_type,
                        [notification.notification_type]: Math.max(0, prev.by_type[notification.notification_type] - 1)
                      }
                    } : prev);
                  }
                }
                
                // If the deleted notification was expanded, collapse it
                if (expandedNotificationId === notificationId) {
                  setExpandedNotificationId(null);
                }
              } else {
                Alert.alert('Error', response.message || 'Failed to delete notification');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
      Alert.alert('Error', 'Failed to delete notification');
    }
  };

  const renderDateGroup = ({ item }: { item: GroupedNotification }) => (
    <View className="mb-6">
      {/* Date Header */}
      <View className=" mb-3">
        <Text className="text-neutral100 px-5 py-1 font-sora text-sm bg-[#2c2c2c]">
          {item.dateDisplay}
        </Text>
      </View>

      {/* Notifications for this date */}
      {item.notifications.map((notification) => (
        <View key={notification.id} className="mb-2">
          {/* Notification Item */}
          <TouchableOpacity
            className="px-4 py-3 flex-row items-center justify-between"
            onPress={() => handleNotificationItemPress(notification)}
            onLongPress={() => handleDeleteNotification(notification.id)}
            activeOpacity={0.7}
          >
            {/* Center: Circle indicator */}
            <View className="mx-2">
              <View 
                className={`w-3 h-3 rounded-full ${!notification.is_read ? 'bg-main' : 'bg-neutral100'}`}
              />
            </View>
            {/* Left: Title */}
            <View className="flex-1">
              <Text className="text-white font-sora-bold text-sm">
                {notification.title}
              </Text>
            </View>

            {/* Right: Arrow (down when expanded, forward when collapsed) */}
            <TouchableOpacity 
              onPress={() => handleArrowPress(notification)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons 
                name={expandedNotificationId === notification.id ? "arrow-down" : "arrow-forward"} 
                size={20} 
                color="#ffffff" 
              />
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Expanded Card (only shown when this notification is expanded) */}
          {expandedNotificationId === notification.id && (
            <TouchableOpacity
              className="mx-4 mb-3 px-4 py-3 mt-2 bg-[#2c2c2c] rounded-lg"
              onPress={() => handleCardPress(notification)}
              activeOpacity={0.7}
            >
              {/* Title */}
              <Text className="text-white font-space-mono text-xs mb-2">
                {notification.title}
              </Text>
              
              {/* Message Preview (limited to one line) */}
              <Text className="text-white font-sora-bold text-xs" numberOfLines={2}>
                {notification.message.length > 50 
                  ? `${notification.message.substring(0, 50)}...`
                  : notification.message
                }
              </Text>
              
              {/* Date in dd/mm/yyyy format */}
              <View className="mt-2 flex-row items-center justify-end">
                <Text className="text-neutral200 font-sora text-xs">
                  {formatDateForDetail(notification.created_at)}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );

  const renderEmptyState = () => {
    if (isSearchActive) {
      if (searchQuery.trim()) {
        // Search is active and has query, but no results found
        return (
          <View className="flex-1 justify-center items-center py-16 ">
            <Ionicons name="search-outline" size={64} color="#4B5563" />
            <Text className="text-neutral300 font-sora text-sm mt-4">
              No results found for "{searchQuery}"
            </Text>
            <Text className="text-neutral400 font-sora text-xs mt-2">
              Try different keywords
            </Text>
          </View>
        );
      } else {
        // Search is active but no query typed yet
        return (
          <View className="flex-1 justify-center items-center py-16">
            <Ionicons name="search-outline" size={64} color="#4B5563" />
            <Text className="text-neutral300 font-sora text-sm mt-4">
              Type to search notifications
            </Text>
            <Text className="text-neutral400 font-sora text-xs mt-2">
              Search by title or message
            </Text>
          </View>
        );
      }
    }

    // Normal empty state when not searching
    return (
      <View className="flex-1 justify-center items-center py-16 mt-36">
        <Ionicons name="notifications-outline" size={64} color="#4B5563" />
        <Text className="text-neutral300 font-sora text-sm mt-4">
          {activeFilter === 'all' 
            ? 'No notifications yet'
            : activeFilter === 'unseen'
            ? 'No unseen notifications'
            : 'No seen notifications'
          }
        </Text>
        <Text className="text-neutral400 font-sora text-xs mt-2">
          {activeFilter === 'all' 
            ? 'You\'re all caught up!'
            : 'Everything is up to date'
          }
        </Text>
      </View>
    );
  };

  return (
    <View className="flex-1">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pb-6">
        <TouchableOpacity onPress={() => router.back()}>
          <BackIcon />
        </TouchableOpacity>

        {!isSearchActive && (
          <Text className="text-white font-sora-bold text-sm">
            Notifications
          </Text>
        )}

        <TouchableOpacity onPress={handleSearchToggle}>
          {isSearchActive ? <CLOSE /> : <SearchIcon />}
        </TouchableOpacity>
      </View>

      {/* Search Bar (shown when search is active) */}
      {isSearchActive && (
        <View className="px-4 pb-4">
          <View className="bg-[#2c2c2c] rounded-xl flex-row items-center px-4 py-1">
            <Feather name="search" size={20} color="#B8B8B8" />
            <TextInput
              className="flex-1 text-white font-sora text-sm"
              placeholder="Search notifications..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Filter Tabs (hidden when search is active) */}
      {!isSearchActive && (
        <View className="flex-row px-4 mb-4 gap-1">
          <TouchableOpacity
            className={`px-3 mx-1 py-2 rounded-3xl ${activeFilter === 'all' ? 'bg-main' : 'bg-neutral400'}`}
            onPress={() => handleFilterPress('all')}
          >
            <Text className={`font-sora text-sm text-center ${activeFilter === 'all' ? 'text-mainBlack' : 'text-white'}`}>
              All {stats ? `(${stats.total})` : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`px-3 mx-1 py-2 rounded-3xl ${activeFilter === 'unseen' ? 'bg-main' : 'bg-neutral400'}`}
            onPress={() => handleFilterPress('unseen')}
          >
            <Text className={`font-sora text-sm text-center ${activeFilter === 'unseen' ? 'text-mainBlack' : 'text-white'}`}>
              Unseen {stats ? `(${stats.unseen})` : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`px-3 mx-1 py-2 rounded-3xl ${activeFilter === 'seen' ? 'bg-main' : 'bg-neutral400'}`}
            onPress={() => handleFilterPress('seen')}
          >
            <Text className={`font-sora text-sm text-center ${activeFilter === 'seen' ? 'text-mainBlack' : 'text-white'}`}>
              Seen {stats ? `(${stats.total - stats.unseen})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notifications List */}
      <View className="flex-1">
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text className="text-white font-sora text-sm mt-4">
              Loading notifications...
            </Text>
          </View>
        ) : (
          <FlatList
            data={groupedNotifications}
            renderItem={renderDateGroup}
            keyExtractor={(item) => item.date}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#FFFFFF"
                colors={['#FFFFFF']}
              />
            }
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}