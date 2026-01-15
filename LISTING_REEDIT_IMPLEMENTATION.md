# Listing Re-edit Implementation Summary

## Overview
This document describes the implementation of the feature that allows partners to re-edit approved listings, with automatic status reversion to PENDING until admin re-approval.

## Feature Requirements
✅ Partners can re-edit approved listings
✅ Status automatically reverts to PENDING when approved listing is edited
✅ Listing is unpublished until admin re-approves
✅ Admin sees warning dialog when approving listings
✅ Visual indicators show when listing was re-edited
✅ Partners receive clear notifications about status changes

---

## Backend Changes

### 1. Premium Listings Router (`backend/app/routers/premium_listings.py`)

#### Updated Endpoints:

**`PUT /listings/{listing_id}`** - Update listing endpoint
- Checks if listing was previously approved
- If approved, reverts status to PENDING and unpublishes
- Sets `wasReEdited` flag and `reEditedAt` timestamp
- Updates admin notes to indicate partner edit

**`PUT /listings/{listing_id}/basic-info`** - Update basic info
- Same logic as above for approved listings
- Ensures status change on any basic info updates

**`PUT /listings/{listing_id}/location`** - Update location info
- Same logic as above for approved listings
- Ensures status change on any location updates

**`PUT /listings/{listing_id}/offerings/{offering_type}`** - Update offerings
- Same logic as above for approved listings
- Ensures status change on any offering updates

**`POST /listings/{listing_id}/save`** - Save listing
- Enhanced to detect if listing was approved
- Changes status to PENDING and unpublishes if previously approved
- Returns informative message about status change

#### New Fields Added to Listings:
```python
{
  "wasReEdited": bool,  # Flag indicating listing was re-edited after approval
  "reEditedAt": datetime,  # Timestamp of when listing was re-edited
  "adminNotes": str  # Updated with re-edit information
}
```

---

## Frontend Changes

### 1. Partner Components

#### **`PartnerListingDetail.tsx`**
- Updated `canEdit` logic to include APPROVED and APPROVED_VERIFIED statuses
- Changed button text to "Re-edit Listing" for approved listings
- Added informational banner for approved listings explaining re-edit consequences
- Banner includes warning about status change and unpublishing

#### **`PartnerListings.tsx`**
- Updated listing table/cards to show edit button for approved listings
- Changed button text to "Re-edit" for approved listings in both mobile and desktop views

#### **`ListingBuilder.tsx`**
- Enhanced `saveListing` function to detect if listing was approved
- Shows different toast notification when saving approved listings
- Toast message: "Listing saved. Status changed to PENDING - Requires admin re-approval."
- Enhanced `submitForApproval` function with context-aware messages
- Shows specific message for re-submitted approved listings

### 2. Admin Components

#### **New Component: `ApprovalWarningDialog.tsx`**
```typescript
// Warning dialog shown to admins before approving any listing
// Informs admin that:
// - Listing is currently pending approval
// - Once approved, it will be publicly visible
// - If partner edits later, it will revert to pending
// - Listing will remain unlisted until re-approval
```

Features:
- Yellow warning icon and styling
- Clear bullet points explaining consequences
- Cancel and confirm buttons
- Loading state during approval

#### **`AdminListingDetail.tsx`**
- Added import for `ApprovalWarningDialog`
- Changed approve button to trigger warning dialog instead of direct approval
- Added visual "Re-edited" badge in header when `wasReEdited` flag is set
- Shows re-edit timestamp in header
- Added warning box in Admin Actions section for re-edited listings
- Warning box highlights that listing was previously approved and needs careful review

---

## User Flow Examples

### Partner Re-editing Approved Listing

1. **Partner views approved listing**
   - Sees "Listing is Live" banner
   - Banner explains editing consequences
   - "Re-edit Listing" button available

2. **Partner clicks Re-edit**
   - ListingBuilder opens in edit mode
   - Can modify any fields

3. **Partner saves changes**
   - Backend detects listing was approved
   - Status changed to PENDING
   - `isPublished` set to false
   - `wasReEdited` flag set to true
   - Toast notification: "Listing saved. Status changed to PENDING - Requires admin re-approval."

4. **Partner views listing after edit**
   - Status badge shows "PENDING"
   - Banner shows "Pending review"
   - Listing no longer visible publicly

### Admin Approving Re-edited Listing

1. **Admin views listing details**
   - Sees "Re-edited" badge in header
   - Warning box in Admin Actions explains listing was previously approved
   - Re-edit timestamp shown

2. **Admin clicks Approve button**
   - Warning dialog appears
   - Dialog explains approval consequences
   - Lists key points about re-edit behavior

3. **Admin confirms approval**
   - Listing status changed to APPROVED_VERIFIED
   - `isPublished` set to true
   - Listing becomes publicly visible
   - `wasReEdited` flag can be cleared

---

## Database Schema Additions

### Premium Listings Collection
```javascript
{
  // Existing fields...
  
  // New fields for re-edit tracking
  "wasReEdited": Boolean,  // Indicates listing was edited after approval
  "reEditedAt": ISODate,   // When the listing was re-edited
  
  // Updated fields
  "adminNotes": String,     // Updated to include re-edit information
  "verificationStatus": String,  // Automatically set to PENDING on re-edit
  "isPublished": Boolean,   // Automatically set to false on re-edit
}
```

---

## API Responses

### Save Listing Response (Re-edited)
```json
{
  "ok": true,
  "message": "Listing saved successfully. Status changed to pending for admin re-approval.",
  "wasApproved": true
}
```

### Update Listing Response (Re-edited)
The listing response includes the updated fields:
```json
{
  "listingId": "...",
  "verificationStatus": "PENDING",
  "isPublished": false,
  "wasReEdited": true,
  "reEditedAt": "2026-01-15T...",
  "adminNotes": "Listing edited by partner on 2026-01-15... - Requires re-approval"
}
```

---

## Status Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     APPROVED_VERIFIED                        │
│                  (Listing is published)                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Partner edits listing
                       │ and saves changes
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                        PENDING                               │
│           (Listing unpublished, needs re-approval)           │
│           wasReEdited = true                                 │
│           reEditedAt = current timestamp                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Admin reviews and
                       │ approves listing
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     APPROVED_VERIFIED                        │
│                  (Listing is published again)                │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Benefits

1. **Quality Control**: Ensures all listing changes are reviewed before going live
2. **Partner Freedom**: Partners can update their listings without restrictions
3. **Admin Awareness**: Clear indicators when listings have been modified
4. **User Safety**: Prevents unauthorized or unreviewed changes from going live
5. **Transparency**: Clear communication to partners about the re-approval process

---

## Testing Checklist

- [x] ✅ Partner can click edit on approved listing
- [x] ✅ Partner sees warning banner on approved listing view
- [x] ✅ Saving edited approved listing changes status to PENDING
- [x] ✅ Listing is unpublished after edit
- [x] ✅ Partner sees appropriate toast notifications
- [x] ✅ Admin sees "Re-edited" badge on listing
- [x] ✅ Admin sees warning dialog when approving
- [x] ✅ Admin sees warning box for re-edited listings
- [x] ✅ Re-approval makes listing live again
- [x] ✅ No linting errors in updated files

---

## Files Modified

### Backend
1. `backend/app/routers/premium_listings.py` - Updated listing update endpoints

### Frontend
1. `frontend/src/partner/pages/PartnerListingDetail.tsx` - Allow editing approved listings
2. `frontend/src/partner/pages/PartnerListings.tsx` - Show edit button for approved listings
3. `frontend/src/components/ListingBuilder.tsx` - Enhanced save/submit logic
4. `frontend/src/admin/pages/AdminListingDetail.tsx` - Added warning dialog and indicators
5. `frontend/src/components/ApprovalWarningDialog.tsx` - New warning dialog component

---

## Future Enhancements

Consider implementing:
1. Change tracking - show what was changed in the listing
2. Revision history - keep track of all edits
3. Quick approve for minor changes - admin can see diff and approve quickly
4. Partial re-approval - approve specific sections without re-reviewing everything
5. Notification system - email partners when their re-edited listing is approved

---

## Notes

- All backend endpoints that modify listing data now check for approved status
- Frontend provides clear feedback at every step
- Admin has full context when reviewing re-edited listings
- No breaking changes to existing functionality
- Backward compatible with existing listings

