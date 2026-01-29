# Hardcoded Values Audit Report

## Summary
This document lists all hardcoded values, placeholders, and incomplete implementations found in the codebase that may cause issues.

## ✅ Fixed Issues

### 1. Admin Analytics Insights (FIXED)
- **File**: `frontend/src/admin/pages/AdminAnalytics.tsx`
- **Issue**: Insights were hardcoded to empty array `[]` instead of using fetched data
- **Fix**: Changed to `insights={insights?.insights || []}`
- **Status**: ✅ Fixed

## ⚠️ Incomplete Implementations (TODOs)

### 1. Team Size Filtering
- **File**: `backend/app/routers/premium_public.py:133`
- **Issue**: Team size filtering based on offerings capacity is not implemented
- **Code**: `pass  # TODO: Implement team size filtering based on offerings`
- **Impact**: Users filtering by team size won't get accurate results
- **Priority**: Medium
- **Status**: ✅ Fixed - Now filters by offering capacity (minSeats/maxSeats)

### 2. Price-Based Sorting
- **File**: `backend/app/routers/premium_public.py:170`
- **Issue**: Budget low sorting falls back to `updatedAt` instead of actual price
- **Code**: `sort_criteria = [("updatedAt", -1)]  # TODO: Implement price-based sorting`
- **Impact**: "Budget: Low to High" sort doesn't work correctly
- **Priority**: High (affects user experience)
- **Status**: ✅ Fixed - Now uses aggregation pipeline to compute minimum price from enabled offerings and sorts correctly

## 📝 Placeholder/Mock Values

### 1. GSAP Performance Metrics
- **File**: `frontend/src/lib/gsap-utils.ts:72`
- **Issue**: FPS is hardcoded to 60 (mock value)
- **Code**: `fps: 60, // Mock FPS`
- **Impact**: Performance metrics won't be accurate
- **Priority**: Low (development/debugging only)

### 2. GSAP Animation Placeholder
- **File**: `frontend/src/lib/gsap-utils.ts:142`
- **Issue**: `createOptimizedAnimation` is just a placeholder
- **Code**: `// Minimal animation implementation - just a placeholder`
- **Impact**: Animation optimization won't work
- **Priority**: Low (if animations work without it)

### 3. ListingBuilder Mapping Comment
- **File**: `frontend/src/components/ListingBuilder.tsx:122`
- **Issue**: Comment says "placeholder" but code actually works
- **Code**: `// This is a placeholder - actual mapping depends on backend structure`
- **Impact**: None (code works, comment is outdated)
- **Priority**: Low (just needs comment update)

## 🔧 Configuration Values (Expected)

These are expected hardcoded defaults and fallbacks:
- `localhost:8000` - Default API URL (uses env var if set)
- `localhost:3000` - Default CORS origin (uses env var if set)
- Placeholder text in form inputs (UI/UX, not functional issues)

## Recommendations

1. **High Priority**: Implement price-based sorting for budget filters
2. **Medium Priority**: Implement team size filtering
3. **Low Priority**: Update outdated comments, implement real FPS tracking if needed
