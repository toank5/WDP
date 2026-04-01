import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import {
  Text,
  Surface,
  useTheme,
  IconButton,
  Avatar,
  Divider,
  Chip,
  Button,
  Portal,
  Dialog,
  TextInput,
  Rating,
  List,
} from 'react-native-paper'
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { getProductReviews, submitReview } from '../../services/review-api'
import type { Review, ReviewStats } from '../../types'

/**
 * ReviewListScreen - Product reviews list and rating
 *
 * Checklist:
 * - Displays average rating and total reviews
 * - Shows rating distribution (5 stars, 4 stars, etc.)
 * - Lists all reviews with user info
 * - Shows review images if available
 * - Allows filtering by star rating
 * - Allows sorting (newest, oldest, highest, lowest)
 * - "Write a review" button for authenticated users
 * - Pull to refresh
 */
interface ReviewListScreenProps {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{
    ReviewList: {
      productId: string;
      productName: string;
      productImage?: string;
    };
  }>;
}

type SortOption = "newest" | "oldest" | "highest" | "lowest";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "highest", label: "Đánh giá cao" },
  { value: "lowest", label: "Đánh giá thấp" },
];

export const ReviewListScreen: React.FC<ReviewListScreenProps> = ({
  navigation,
  route,
}) => {
  const theme = useTheme();

  const productId = route.params?.productId || "";
  const productName = route.params?.productName || "Sản phẩm";
  const productImage = route.params?.productImage;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showSortDialog, setShowSortDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  // Review form state
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      // TODO: Call the review API
      // const data = await getProductReviews(productId, sortBy, selectedRating)

      // Mock data for now
      const mockReviews: Review[] = [
        {
          _id: "1",
          userId: "user1",
          userName: "Nguyễn Văn A",
          productId,
          rating: 5,
          comment:
            "Kính rất đẹp, chất lượng tốt, giao hàng nhanh. Sẽ ủng hộ shop tiếp!",
          createdAt: new Date(
            Date.now() - 2 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
        {
          _id: "2",
          userId: "user2",
          userName: "Trần Thị B",
          productId,
          rating: 4,
          comment: "Kính đẹp nhưng hơi nặng một chút. Chất lượng tốt.",
          createdAt: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
        {
          _id: "3",
          userId: "user3",
          userName: "Lê Văn C",
          productId,
          rating: 5,
          comment: "Đóng gói kỹ, kính xịn, đúng mô tả. Shop tư vấn nhiệt tình.",
          createdAt: new Date(
            Date.now() - 14 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
      ];

      const mockStats: ReviewStats = {
        averageRating: 4.7,
        totalReviews: 128,
        ratingDistribution: {
          5: 95,
          4: 25,
          3: 5,
          2: 2,
          1: 1,
        },
      };

      setReviews(mockReviews);
      setStats(mockStats);
    } catch (error: any) {
      console.error("Fetch reviews error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReviews();
  };

  const handleRatingFilter = (rating: number | null) => {
    setSelectedRating(rating === selectedRating ? null : rating);
  };

  const handleSort = (sort: SortOption) => {
    setSortBy(sort);
    setShowSortDialog(false);
    // Re-fetch reviews with new sort
    fetchReviews();
  };

  const handleWriteReview = () => {
    setShowReviewDialog(true);
  };

  const handleSubmitReview = async () => {
    if (reviewRating === 0) {
      return;
    }

    setSubmittingReview(true);

    try {
      // TODO: Call submit review API
      // await submitReview(productId, { rating: reviewRating, comment: reviewComment })

      // Add review to list
      const newReview: Review = {
        _id: Date.now().toString(),
        userId: "current-user",
        userName: "Bạn",
        productId,
        rating: reviewRating,
        comment: reviewComment || "Người dùng không để lại bình luận",
        createdAt: new Date().toISOString(),
      };

      setReviews([newReview, ...reviews]);
      setShowReviewDialog(false);
      setReviewRating(0);
      setReviewComment("");

      // Update stats
      if (stats) {
        const newStats = { ...stats };
        newStats.totalReviews += 1;
        newStats.ratingDistribution[reviewRating] =
          (newStats.ratingDistribution[reviewRating] || 0) + 1;
        setStats(newStats);
      }
    } catch (error: any) {
      console.error("Submit review error:", error);
    } finally {
      setSubmittingReview(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hôm nay";
    if (diffDays === 1) return "Hôm qua";
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    return date.toLocaleDateString("vi-VN");
  };

  const renderRatingBar = (rating: number, count: number, total: number) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;

    return (
      <View key={rating} style={styles.ratingBarRow}>
        <Text style={styles.ratingBarLabel}>{rating} sao</Text>
        <View style={styles.ratingBarTrack}>
          <View style={[styles.ratingBarFill, { width: `${percentage}%` }]} />
        </View>
        <Text style={styles.ratingBarCount}>{count}</Text>
      </View>
    );
  };

  const renderReviewItem = ({ item }: { item: Review }) => (
    <Surface style={styles.reviewCard} elevation={1}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewAuthor}>
          <Avatar.Text
            size={40}
            label={item.userName.charAt(0).toUpperCase()}
            style={styles.avatar}
          />
          <View style={styles.reviewAuthorInfo}>
            <Text variant="titleSmall" style={styles.reviewAuthorName}>
              {item.userName}
            </Text>
            <View style={styles.reviewRatingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <MaterialCommunityIcons
                  key={star}
                  name={star <= item.rating ? 'star' : 'star-outline'}
                  size={14}
                  color={star <= item.rating ? "#ffc107" : "#e0e0e0"}
                />
              ))}
            </View>
          </View>
        </View>
        <Text variant="bodySmall" style={styles.reviewDate}>
          {formatDate(item.createdAt)}
        </Text>
      </View>

      {item.comment && (
        <Text variant="bodyMedium" style={styles.reviewComment}>
          {item.comment}
        </Text>
      )}

      {item.images && item.images.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.reviewImages}
        >
          {item.images.map((image, index) => (
            <View key={index} style={styles.reviewImageContainer}>
              {/* TODO: Add image preview */}
              <View style={styles.reviewImagePlaceholder}>
                <IconButton icon="image" size={24} />
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.reviewActions}>
        <IconButton
          icon="thumb-up-outline"
          size={20}
          style={styles.reviewActionBtn}
        />
        <Text variant="bodySmall">Hữu ích</Text>
      </View>
    </Surface>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerContent}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
          />
          <Text variant="titleLarge" style={styles.headerTitle}>
            Đánh giá
          </Text>
        </View>
      </Surface>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Rating Summary */}
        {stats && (
          <Surface style={styles.summaryCard} elevation={2}>
            <View style={styles.summaryMain}>
              <Text variant="displaySmall" style={styles.averageRating}>
                {stats.averageRating.toFixed(1)}
              </Text>
              <View style={styles.summaryStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <MaterialCommunityIcons
                    key={star}
                    name={
                      star <= Math.round(stats.averageRating)
                        ? 'star'
                        : 'star-outline'
                    }
                    size={20}
                    color={
                      star <= Math.round(stats.averageRating)
                        ? "#ffc107"
                        : "#e0e0e0"
                    }
                  />
                ))}
              </View>
              <Text variant="bodyMedium" style={styles.totalReviews}>
                {stats.totalReviews} đánh giá
              </Text>
            </View>

            <Divider style={styles.summaryDivider} />

            <View style={styles.ratingDistribution}>
              {[5, 4, 3, 2, 1].map((rating) =>
                renderRatingBar(
                  rating,
                  stats.ratingDistribution[rating] || 0,
                  stats.totalReviews,
                ),
              )}
            </View>
          </Surface>
        )}

        {/* Filters */}
        <View style={styles.filtersRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Chip
              selected={selectedRating === null}
              onPress={() => handleRatingFilter(null)}
              style={styles.filterChip}
            >
              Tất cả
            </Chip>
            {[5, 4, 3, 2, 1].map((rating) => (
              <Chip
                key={rating}
                selected={selectedRating === rating}
                onPress={() => handleRatingFilter(rating)}
                style={styles.filterChip}
                icon={() => (
                  <MaterialCommunityIcons
                    name={selectedRating === rating ? 'star' : 'star-outline'}
                    size={14}
                    color={selectedRating === rating ? "#fff" : "#ffc107"}
                  />
                )}
              >
                {rating} sao
              </Chip>
            ))}
          </ScrollView>

          <Chip
            onPress={() => setShowSortDialog(true)}
            style={styles.sortChip}
            icon="filter-outline"
          >
            {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
          </Chip>
        </View>

        {/* Reviews List */}
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <View key={review._id} style={styles.reviewItem}>
              {renderReviewItem({ item: review })}
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <IconButton icon="comment-question-outline" size={64} />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              Chưa có đánh giá
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Hãy là người đầu tiên đánh giá sản phẩm này!
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Write Review Button */}
      <View style={styles.writeReviewContainer}>
        <Button
          mode="contained"
          onPress={handleWriteReview}
          style={styles.writeReviewButton}
          icon="pencil"
        >
          Viết đánh giá
        </Button>
      </View>

      {/* Sort Dialog */}
      <Portal>
        <Dialog
          visible={showSortDialog}
          onDismiss={() => setShowSortDialog(false)}
        >
          <Dialog.Title>Sắp xếp theo</Dialog.Title>
          <Dialog.Content>
            {SORT_OPTIONS.map((option) => (
              <List.Item
                key={option.value}
                title={option.label}
                onPress={() => handleSort(option.value)}
                left={(props) => (
                  <List.Icon
                    {...props}
                    icon={sortBy === option.value ? "check" : "blank"}
                  />
                )}
              />
            ))}
          </Dialog.Content>
        </Dialog>
      </Portal>

      {/* Write Review Dialog */}
      <Portal>
        <Dialog
          visible={showReviewDialog}
          onDismiss={() => setShowReviewDialog(false)}
          style={styles.reviewDialog}
        >
          <Dialog.Title>Viết đánh giá</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.dialogProductName}>
              {productName}
            </Text>

            <View style={styles.ratingInput}>
              <Text variant="bodyMedium">Đánh giá của bạn:</Text>
              <View style={styles.starsInput}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <IconButton
                    key={star}
                    icon="star"
                    size={32}
                    iconColor={star <= reviewRating ? "#ffc107" : "#e0e0e0"}
                    onPress={() => setReviewRating(star)}
                  />
                ))}
              </View>
            </View>

            <TextInput
              label="Nhận xét của bạn (tùy chọn)"
              value={reviewComment}
              onChangeText={setReviewComment}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.reviewCommentInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowReviewDialog(false)}>Hủy</Button>
            <Button
              onPress={handleSubmitReview}
              disabled={reviewRating === 0 || submittingReview}
              loading={submittingReview}
            >
              Gửi
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    backgroundColor: "#fff",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  headerTitle: {
    fontWeight: "bold",
  },
  content: {
    flex: 1,
  },
  summaryCard: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  summaryMain: {
    alignItems: "center",
    marginBottom: 16,
  },
  averageRating: {
    fontSize: 64,
    fontWeight: "bold",
    color: "#ffc107",
  },
  summaryStars: {
    flexDirection: "row",
    marginVertical: 8,
  },
  totalReviews: {
    opacity: 0.7,
  },
  summaryDivider: {
    marginVertical: 16,
  },
  ratingDistribution: {
    gap: 8,
  },
  ratingBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ratingBarLabel: {
    width: 50,
    fontSize: 12,
  },
  ratingBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    overflow: "hidden",
  },
  ratingBarFill: {
    height: "100%",
    backgroundColor: "#ffc107",
  },
  ratingBarCount: {
    width: 30,
    fontSize: 12,
    textAlign: "right",
  },
  filtersRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: "center",
  },
  filterChip: {
    marginRight: 8,
  },
  sortChip: {
    marginLeft: "auto",
  },
  reviewItem: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  reviewCard: {
    borderRadius: 12,
    padding: 16,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  reviewAuthor: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    marginRight: 12,
  },
  reviewAuthorInfo: {},
  reviewAuthorName: {
    fontWeight: "600",
  },
  reviewRatingRow: {
    flexDirection: "row",
    marginTop: 4,
  },
  reviewDate: {
    opacity: 0.6,
  },
  reviewComment: {
    lineHeight: 22,
    marginBottom: 12,
  },
  reviewImages: {
    marginTop: 8,
  },
  reviewImageContainer: {
    marginRight: 8,
  },
  reviewImagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  reviewActions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  reviewActionBtn: {
    margin: 0,
    marginRight: 4,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 64,
  },
  emptyTitle: {
    marginTop: 16,
    fontWeight: "600",
  },
  emptyText: {
    opacity: 0.7,
    marginTop: 8,
  },
  writeReviewContainer: {
    padding: 16,
    backgroundColor: "#fff",
    elevation: 4,
  },
  writeReviewButton: {
    borderRadius: 8,
  },
  reviewDialog: {
    maxHeight: "80%",
  },
  dialogProductName: {
    marginBottom: 16,
  },
  ratingInput: {
    marginBottom: 16,
  },
  starsInput: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
  },
  reviewCommentInput: {
    marginBottom: 16,
  },
});
