import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStyles } from '../../../../theme/useStyles';
import { useComponentContext } from '../../../../context/GlobalContext';
import { useDoctorDashboard } from '../../../../context/DoctorDashboardContext';
import { Icon } from '../../../../components/ui/Icon';
import { ErrorState } from '../../../../components/common/ErrorState';
import { formatIsoDate } from '../../../../utils/dateUtils';
import _ from 'lodash';
import { format, parseISO } from 'date-fns';
import { useTheme } from '../../../../theme/ThemeContext';

export function DoctorRatings({ doctorId: propsDoctorId, onBack: propsOnBack }) {
  const { sizes, colors } = useTheme();
  const styles = useStyles(themeStyles);
  const { t } = useTranslation();
  const { user, doctorController } = useComponentContext();
  const { navigateBack } = useDoctorDashboard();
  
  // If no doctorId is passed, use the logged-in user's ID
  const doctorId = propsDoctorId || user?.id;
  const onBack = propsOnBack || navigateBack;

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [data, setData] = useState({ items: [], aggregate: null });
  const [error, setError] = useState(null);
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Filters
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 5, 4, 3, 'comments'

  const fetchRatings = useCallback(async (pageNum = 1, isRefresh = false) => {
    if (!doctorId) return;
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else if (pageNum === 1) {
        setIsLoading(true);
      }
      
      const params = { page: pageNum, limit: 10 };
      if (activeFilter === 'comments') {
        params.has_comment = 'true';
      } else if (typeof activeFilter === 'number') {
        params.rating = activeFilter;
      }

      const res = await doctorController.doctorsApi.getRatings(doctorId, params);
      
      setData(prev => {
        if (pageNum === 1 || isRefresh) {
          return res;
        }
        return {
          ...res,
          items: [...prev.items, ...res.items],
        };
      });
      
      setHasMore(pageNum < res.total_pages);
      setPage(pageNum);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch ratings:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [doctorId, activeFilter, doctorController.doctorsApi]);

  useEffect(() => {
    fetchRatings(1);
  }, [fetchRatings]);

  const handleRefresh = () => {
    fetchRatings(1, true);
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading && !isRefreshing) {
      fetchRatings(page + 1);
    }
  };

  const setFilter = (filter) => {
    if (activeFilter === filter) return;
    setActiveFilter(filter);
    setPage(1);
    setHasMore(true);
    setData(prev => ({ ...prev, items: [] }));
    // fetchRatings(1) is triggered by useEffect via useCallback dependency change
  };

  const isInitialLoad = isLoading && page === 1 && !isRefreshing && !data.aggregate;

  if (isInitialLoad) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color=/* TODO: color */ "#1A9C8E" />
      </View>
    );
  }

  if (error && !data.items.length) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Icon name="arrow-back" size={sizes.scale(24)} color=/* TODO: color */ "#1A9C8E"  />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('doctor_history.my_rating', 'My Rating')}</Text>
        </View>
        <ErrorState title={t('common.error')} description={error} onRetry={() => fetchRatings(1)} />
      </View>
    );
  }

  const { aggregate, items } = data;
  
  // Group items by month
  const groupedItems = _.groupBy(items, (item) => {
    if (!item.created_at) return t('common.unknown_date');
    return format(parseISO(item.created_at), 'MMMM yyyy');
  });

  const groupKeys = Object.keys(groupedItems);

  // Compute recommend percentage (4 or 5 stars)
  const total = aggregate?.total_count || 0;
  const recommendCount = (aggregate?.distribution?.[4] || 0) + (aggregate?.distribution?.[5] || 0);
  const recommendPercent = total > 0 ? Math.round((recommendCount / total) * 100) : 0;

  const renderHeaderComponent = () => (
    <View style={styles.headerContent}>
      {/* Overview Card */}
      <View style={styles.overviewCard}>
        <View style={styles.overviewLeft}>
          <Text style={styles.bigRating}>{aggregate?.average_rating?.toFixed(1) || '0.0'}</Text>
          <Text style={styles.reviewsCount}>{t('doctor_history.reviews_count', { count: total })}</Text>
        </View>
        <View style={styles.overviewRight}>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = aggregate?.distribution?.[star] || 0;
            const flexWidth = total > 0 ? (count / total) : 0;
            return (
              <View key={star} style={styles.barRow}>
                <Text style={styles.barStar}>{star}</Text>
                <View style={styles.barContainer}>
                  <View style={[styles.barFill, { width: `${flexWidth * 100}%`, backgroundColor: getBarColor(star) }]} />
                </View>
                <Text style={styles.barCount}>{count}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{total}</Text>
          <Text style={styles.statLabel}>{t('doctor_history.total_reviews', 'Total')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{recommendPercent}%</Text>
          <Text style={styles.statLabel}>{t('doctor_history.recommend', 'Recommend')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{aggregate?.average_rating?.toFixed(1) || '0.0'}</Text>
          <Text style={styles.statLabel}>{t('doctor_history.last_month', 'Last month')}</Text>
        </View>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll} contentContainerStyle={styles.filtersContent}>
        <FilterChip label={t('doctor_history.all_reviews', 'All')} isActive={activeFilter === 'all'} onPress={() => setFilter('all')} />
        <FilterChip label="5 ☆" isActive={activeFilter === 5} onPress={() => setFilter(5)} />
        <FilterChip label="4 ☆" isActive={activeFilter === 4} onPress={() => setFilter(4)} />
        <FilterChip label="3 ☆" isActive={activeFilter === 3} onPress={() => setFilter(3)} />
        <FilterChip label={t('doctor_history.with_comments', 'With comments')} isActive={activeFilter === 'comments'} onPress={() => setFilter('comments')} />
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{top: sizes.scale(10), bottom: sizes.scale(10), left: sizes.scale(10), right: sizes.scale(10)}}>
          <Icon name="arrow-back" size={sizes.scale(24)} color=/* TODO: color */ "#1A9C8E"  />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('doctor_history.my_rating', 'My Rating')}</Text>
      </View>

      <FlatList
        data={groupKeys}
        keyExtractor={(item) => item}
        ListHeaderComponent={renderHeaderComponent}
        renderItem={({ item: month }) => (
          <View style={styles.monthGroup}>
            <Text style={styles.monthTitle}>{month}</Text>
            {groupedItems[month].map((rating) => (
              <RatingCard key={rating.id} rating={rating} />
            ))}
          </View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onRefresh={handleRefresh}
        refreshing={isRefreshing}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          hasMore && isLoading && !isRefreshing && data.items.length > 0 ? (
            <ActivityIndicator style={{ marginVertical: sizes.scale(20) }} color=/* TODO: color */ "#1A9C8E" />
          ) : null
        }
        ListEmptyComponent={
          isLoading && page === 1 && !isRefreshing ? (
             <ActivityIndicator style={{ marginVertical: sizes.scale(40) }} size="large" color=/* TODO: color */ "#1A9C8E" />
          ) : !isLoading ? (
             <Text style={styles.emptyText}>{t('doctor_history.no_reviews', 'No reviews found')}</Text>
          ) : null
        }
      />
    </View>
  );
}

function FilterChip({ label, isActive, onPress }) {
  const { sizes, colors } = useTheme();
  const styles = useStyles(themeStyles);
  return (
    <TouchableOpacity 
      style={[styles.filterChip, isActive && styles.filterChipActive]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function RatingCard({ rating }) {
  const { sizes } = useTheme();
  const styles = useStyles(themeStyles);
  const patientName = rating.patient 
    ? `${rating.patient.first_name || ''} ${rating.patient.last_name ? rating.patient.last_name.charAt(0) + '.' : ''}`.trim()
    : 'Anonymous';
    
  return (
    <View style={styles.ratingCard}>
      <View style={styles.ratingHeader}>
        <View style={styles.userInfo}>
          <Image 
            source={{ uri: rating.patient?.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(patientName) }} 
            style={styles.avatar} 
          />
          <Text style={styles.patientName}>{patientName}</Text>
        </View>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((s) => (
             <Icon 
               key={s} 
               name="star" 
               size={sizes.scale(16)} 
               color={s <= rating.rating ? /* TODO: color */ '#FFD233' : /* TODO: color */ '#E8ECEC'} 
               fill={s <= rating.rating ? /* TODO: color */ '#FFD233' : 'none'}
              />
          ))}
          <Text style={styles.ratingScore}>{rating.rating.toFixed(1)}</Text>
        </View>
      </View>
      {!!rating.comment && (
        <Text style={styles.commentText}>{rating.comment}</Text>
      )}
    </View>
  );
}

function getBarColor(star) {
  switch (star) {
    case 5: return /* TODO: color */ '#FFD233'; // Yellow
    case 4: return /* TODO: color */ '#54DACC'; // Teal
    case 3: return /* TODO: color */ '#F199BA'; // Pink
    case 2: return /* TODO: color */ '#E0F0EF'; // Light Teal
    case 1: return /* TODO: color */ '#E0F0EF'; // Light Teal
    default: return /* TODO: color */ '#E8ECEC';
  }
}

const themeStyles = (theme) => ({
  container: {
    flex: 1,
    backgroundColor: /* TODO: color */ '#FAFAFA',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.sizes.spacing.l,
    paddingTop: theme.sizes.spacing.xl,
    paddingBottom: theme.sizes.spacing.m,
  },
  backBtn: {
    marginRight: theme.sizes.spacing.m,
  },
  headerTitle: {
    ...theme.sizes.typography.h2,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
  },
  listContent: {
    paddingHorizontal: theme.sizes.spacing.l,
    paddingBottom: theme.sizes.spacing.xl * 2,
  },
  headerContent: {
    paddingBottom: theme.sizes.spacing.m,
  },
  overviewCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.l,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.m,
    shadowColor: /* TODO: color */ '#000',
    shadowOffset: { width: sizes.scale(0), height: sizes.scale(4) },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  overviewLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.sizes.spacing.xl,
  },
  bigRating: {
    fontSize: sizes.scale(56),
    fontFamily: 'Manrope_800ExtraBold',
    color: /* TODO: color */ '#0D3F3A',
    lineHeight: sizes.scale(64),
  },
  reviewsCount: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n500,
  },
  overviewRight: {
    flex: 1,
    justifyContent: 'space-between',
    gap: sizes.scale(4),
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barStar: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n400,
    width: sizes.scale(12),
  },
  barContainer: {
    flex: 1,
    height: sizes.scale(6),
    backgroundColor: /* TODO: color */ '#F3F9F9',
    borderRadius: sizes.scale(3),
    marginHorizontal: theme.sizes.spacing.s,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: sizes.scale(3),
  },
  barCount: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n300,
    width: sizes.scale(20),
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.l,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    paddingVertical: theme.sizes.spacing.m,
    alignItems: 'center',
    shadowColor: /* TODO: color */ '#000',
    shadowOffset: { width: sizes.scale(0), height: sizes.scale(4) },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  statValue: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
    fontFamily: 'Manrope_700Bold',
    marginBottom: sizes.scale(4),
  },
  statLabel: {
    ...theme.sizes.typography.caption,
    color: theme.colors.n400,
  },
  filtersScroll: {
    marginBottom: theme.sizes.spacing.l,
  },
  filtersContent: {
    gap: theme.sizes.spacing.s,
    paddingRight: theme.sizes.spacing.l,
  },
  filterChip: {
    paddingHorizontal: sizes.scale(16),
    paddingVertical: sizes.scale(8),
    borderRadius: sizes.scale(20),
    borderWidth: 1,
    borderColor: /* TODO: color */ '#54DACC',
    backgroundColor: theme.colors.white,
  },
  filterChipActive: {
    backgroundColor: /* TODO: color */ '#54DACC',
  },
  filterText: {
    ...theme.sizes.typography.bodySmall,
    color: /* TODO: color */ '#1A9C8E',
    fontFamily: 'Manrope_600SemiBold',
  },
  filterTextActive: {
    color: theme.colors.white,
  },
  monthGroup: {
    marginBottom: theme.sizes.spacing.m,
  },
  monthTitle: {
    ...theme.sizes.typography.h3,
    color: /* TODO: color */ '#0D3F3A',
    fontFamily: 'Manrope_700Bold',
    marginBottom: theme.sizes.spacing.m,
  },
  ratingCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.l,
    marginBottom: theme.sizes.spacing.m,
    shadowColor: /* TODO: color */ '#000',
    shadowOffset: { width: sizes.scale(0), height: sizes.scale(4) },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.m,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: sizes.scale(40),
    height: sizes.scale(40),
    borderRadius: sizes.scale(20),
    marginRight: theme.sizes.spacing.s,
  },
  patientName: {
    ...theme.sizes.typography.body,
    color: /* TODO: color */ '#0D3F3A',
    fontFamily: 'Manrope_700Bold',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizes.scale(2),
  },
  ratingScore: {
    ...theme.sizes.typography.body,
    color: /* TODO: color */ '#0D3F3A',
    fontFamily: 'Manrope_700Bold',
    marginLeft: sizes.scale(4),
  },
  commentText: {
    ...theme.sizes.typography.body,
    color: theme.colors.n500,
    lineHeight: sizes.scale(22),
  },
  emptyText: {
    ...theme.sizes.typography.body,
    color: theme.colors.n400,
    textAlign: 'center',
    marginTop: theme.sizes.spacing.xl,
  }
});
