import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Save, Send, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Step components
import { BasicInfoStep } from "./listing-builder/BasicInfoStep";
import { OfferingsStep } from "./listing-builder/OfferingsStep";

// Types and utilities
import { 
  ListingBuilderState, 
  ListingFormData, 
  BasicInfoData, 
  OfferingType,
  OfferingFormData,
  VerificationStatus
} from "@/types/models";
import { initializeAllOfferings, validateOfferingsForSubmission } from "@/lib/offerings";
import { usePartnerListing, useSubmitListing, useCreatePartnerListing, useUpdatePartnerListing } from "@/hooks/useAuth";
import { trackPartnerListingSubmitted } from "@/lib/analytics";

interface ListingBuilderProps {
  listingId?: string;
  isEdit?: boolean;
}

const steps = [
  { id: 'basic-info', title: 'Basic Info', description: 'Name, locality, and overview' },
  { id: 'offerings', title: 'Offerings', description: 'Workspace types and photos' },
] as const;

type StepId = typeof steps[number]['id'];

export function ListingBuilder({ listingId, isEdit = false }: ListingBuilderProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialStep = (searchParams.get('step') as StepId) || 'basic-info';
  
  // State management
  const [currentStep, setCurrentStep] = useState<StepId>(initialStep);
  const [formData, setFormData] = useState<ListingFormData>({
    basicInfo: {
      displayName: '',
      locality: '',
      city: '',
      overview: '',
      amenities: [],
      accessHours: '9 AM - 9 PM',
      weekendAccess: false,
    },
    offerings: initializeAllOfferings(),
    location: {
      locality: '',
      city: '',
    },
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // API hooks
  const { data: existingListing, isLoading: isLoadingListing } = usePartnerListing(listingId || '');
  const submitListingMutation = useSubmitListing();
  const createListingMutation = useCreatePartnerListing();
  const updateListingMutation = useUpdatePartnerListing();

  // Load existing listing data if editing
  useEffect(() => {
    if (isEdit && existingListing) {
      // Map backend boolean fields to amenities
      const baseAmenities = existingListing.amenities || [];
      const derivedAmenities = [...baseAmenities];
      
      // Add amenities based on backend boolean fields
      if (existingListing.nearMetro && !derivedAmenities.includes('Near Metro Station')) {
        derivedAmenities.push('Near Metro Station');
      }
      if (existingListing.parking === 'AVAILABLE' && !derivedAmenities.includes('Parking')) {
        derivedAmenities.push('Parking');
      }
      if (existingListing.powerBackup && !derivedAmenities.includes('Power Backup')) {
        derivedAmenities.push('Power Backup');
      }

      // Map backend listing to form data
      setFormData({
        basicInfo: {
          displayName: existingListing.displayName || '',
          locality: existingListing.locality || '',
          city: existingListing.city || 'Delhi',
          overview: existingListing.overview || '',
          amenities: derivedAmenities,
          accessHours: existingListing.accessHours || '9 AM - 9 PM',
          weekendAccess: existingListing.weekendAccess || false,
        },
        offerings: mapBackendOfferingsToForm(existingListing),
        location: {
          locality: existingListing.locality || '',
          city: existingListing.city || 'Delhi',
          approximateCoordinates: existingListing.location?.approximateCoordinates,
        },
      });
    }
  }, [isEdit, existingListing]);

  // Helper function to map backend offerings to form structure
  const mapBackendOfferingsToForm = (listing: any): Record<OfferingType, OfferingFormData> => {
    const offerings = initializeAllOfferings();
    
    // Map existing backend data to new offering structure
    // This is a placeholder - actual mapping depends on backend structure
    if (listing.offerings) {
      Object.entries(listing.offerings).forEach(([type, data]: [string, any]) => {
        if (offerings[type as OfferingType]) {
          offerings[type as OfferingType] = {
            ...offerings[type as OfferingType],
            ...data,
            uploadProgress: {},
          };
        }
      });
    }
    
    return offerings;
  };

  // Step navigation
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const goToStep = (stepId: StepId) => {
    setCurrentStep(stepId);
    const url = new URL(window.location.href);
    url.searchParams.set('step', stepId);
    window.history.replaceState({}, '', url.toString());
  };

  const goToNextStep = () => {
    if (!isLastStep) {
      const nextStep = steps[currentStepIndex + 1];
      goToStep(nextStep.id);
    }
  };

  const goToPreviousStep = () => {
    if (!isFirstStep) {
      const previousStep = steps[currentStepIndex - 1];
      goToStep(previousStep.id);
    }
  };

  // Form data updates
  const updateBasicInfo = (updates: Partial<BasicInfoData>) => {
    setFormData(prev => ({
      ...prev,
      basicInfo: { ...prev.basicInfo, ...updates },
    }));
  };

  const updateOfferings = (offerings: Record<OfferingType, OfferingFormData>) => {
    setFormData(prev => ({
      ...prev,
      offerings,
    }));
  };

  // Validation
  const validateCurrentStep = (): boolean => {
    const errors: Record<string, string> = {};

    switch (currentStep) {
      case 'basic-info':
        if (!formData.basicInfo.displayName.trim()) {
          errors.displayName = 'Display name is required';
        }
        if (!formData.basicInfo.locality.trim()) {
          errors.locality = 'Locality is required';
        }
        if (!formData.basicInfo.overview.trim() || formData.basicInfo.overview.length < 10) {
          errors.overview = 'Overview must be at least 10 characters';
        }
        if (formData.basicInfo.amenities.length === 0) {
          errors.amenities = 'Select at least one amenity';
        }
        break;

      case 'offerings':
        // Check if at least one offering is enabled
        const enabledOfferings = Object.values(formData.offerings).filter(o => o.enabled);
        if (enabledOfferings.length === 0) {
          errors.offerings = 'At least one offering must be enabled';
        }
        // Note: Photo validation is handled by OfferingsStep component which includes temp photos
        // We don't validate photos here since temp photos are stored in OfferingsStep's local state
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save listing (pending status)
  const saveListing = async () => {
    setIsSubmitting(true);
    try {
      const listingData = mapFormDataToBackend(formData);
      
      if (isEdit && listingId) {
        await updateListingMutation.mutateAsync({ listingId, data: listingData });
        toast.success('Listing saved successfully');
      } else {
        const result = await createListingMutation.mutateAsync(listingData);
        toast.success('Listing saved successfully');
        // Navigate to edit mode with the new listing ID
        navigate(`/partner/listings/${result.listingId}?edit=true&step=${currentStep}`);
      }
    } catch (error: any) {
      toast.error(`Failed to save listing: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit for approval
  const submitForApproval = async () => {
    // Validate all steps
    const allStepsValid = steps.every(step => {
      const originalStep = currentStep;
      setCurrentStep(step.id);
      const isValid = validateCurrentStep();
      setCurrentStep(originalStep);
      return isValid;
    });

    if (!allStepsValid) {
      toast.error('Please fix all validation errors before submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare submission data with photos
      const submissionData = {
        displayName: formData.basicInfo.displayName,
        overview: formData.basicInfo.overview,
        locality: formData.basicInfo.locality,
        city: formData.basicInfo.city,
        amenities: formData.basicInfo.amenities,
        accessHours: formData.basicInfo.accessHours,
        weekendAccess: formData.basicInfo.weekendAccess,
        nearMetro: formData.basicInfo.amenities.includes('Near Metro Station'),
        metroNote: formData.basicInfo.amenities.includes('Near Metro Station') ? 'Near metro station' : undefined,
        parking: formData.basicInfo.amenities.includes('Parking') ? 'AVAILABLE' : 'NONE',
        powerBackup: formData.basicInfo.amenities.includes('Power Backup'),
        heroPhotos: [], // Add hero photos if you have them in form data
        offerings: formData.offerings
      };

      if (isEdit && listingId) {
        // For editing, use the update endpoint (you may need to create this)
        await updateListingMutation.mutateAsync({ listingId, data: submissionData });
        toast.success('Listing updated and submitted for approval');
        navigate('/partner/listings');
      } else {
        // For new listings, use the submit endpoint
        const result = await submitListingMutation.mutateAsync(submissionData);
        toast.success('Listing submitted for approval');
        
        // Track listing submission
        const enabledOfferings = Object.entries(formData.offerings)
          .filter(([_, offering]) => offering.enabled)
          .map(([type, _]) => type);
        
        trackPartnerListingSubmitted(result?.listingId || 'new', enabledOfferings.join(','), {
          locality: formData.basicInfo.locality,
          offeringsCount: enabledOfferings.length,
          hasPhotos: enabledOfferings.some(type => 
            formData.offerings[type as OfferingType]?.photos?.length > 0
          )
        });
        
        navigate(`/partner/listings/${result.listingId}`);
      }
    } catch (error: any) {
      toast.error(`Failed to submit listing: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Map form data to backend format
  const mapFormDataToBackend = (data: ListingFormData) => {
    // Derive boolean fields from amenities
    const amenities = data.basicInfo.amenities || [];
    const nearMetro = amenities.includes('Near Metro Station');
    const parking = amenities.includes('Parking') ? 'AVAILABLE' : 'NONE';
    const powerBackup = amenities.includes('Power Backup');

    // This is a simplified mapping - actual implementation depends on backend structure
    return {
      displayName: data.basicInfo.displayName,
      locality: data.basicInfo.locality,
      city: data.basicInfo.city,
      overview: data.basicInfo.overview,
      amenities: data.basicInfo.amenities,
      accessHours: data.basicInfo.accessHours,
      weekendAccess: data.basicInfo.weekendAccess,
      offerings: data.offerings,
      location: data.location,
      status: 'pending',
      // Add other required backend fields
      brandHidden: false,
      workspaceTypes: ['DEDICATED_DESKS'], // Default - should be derived from offerings
      seatCapacityMin: 1,
      seatCapacityMax: 10,
      availabilityStatus: 'AVAILABLE',
      budgetBandId: '10k-20k',
      budgetDisplayText: 'Contact for pricing',
      nearMetro,
      parking,
      powerBackup,
      gstInvoiceAvailable: false,
      meetingRoomsCount: null,
      meetingRoomsAddonOnly: true,
      internetSpeedMbps: null,
      dealTags: [],
      dealDetails: null,
      dealEligibility: null,
      houseRules: null,
    };
  };

  // Get status badge for existing listing
  const getStatusBadge = () => {
    if (!isEdit || !existingListing) return null;

    const status = existingListing.verificationStatus as VerificationStatus;
    const statusConfig = {
      'PENDING_REVIEW': { label: 'Pending Review', variant: 'secondary' as const, icon: AlertCircle },
      'NEEDS_INFO': { label: 'Needs Info', variant: 'destructive' as const, icon: AlertCircle },
      'APPROVED_VERIFIED': { label: 'Approved', variant: 'default' as const, icon: CheckCircle },
      'REJECTED': { label: 'Rejected', variant: 'destructive' as const, icon: AlertCircle },
    };

    const config = statusConfig[status];
    if (!config) return null;

    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Check if fields should be locked (approved listings can't be edited)
  const isFieldsLocked = isEdit && existingListing && 
    existingListing.verificationStatus !== 'NEEDS_INFO' && 
    existingListing.status === 'approved';

  if (isLoadingListing) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading listing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/partner/listings')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-bold text-foreground">
                {isEdit ? 'Edit Listing' : 'Create New Listing'}
              </h1>
              {getStatusBadge()}
            </div>
            <p className="text-muted-foreground">
              {isEdit ? 'Update your workspace listing' : 'Add your workspace to our platform'}
            </p>
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Step {currentStepIndex + 1} of {steps.length}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(((currentStepIndex + 1) / steps.length) * 100)}% complete
              </span>
            </div>
            <Progress value={((currentStepIndex + 1) / steps.length) * 100} />
            <div className="flex justify-between">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => goToStep(step.id)}
                  className={cn(
                    "flex flex-col items-center text-center space-y-1 p-2 rounded-lg transition-colors",
                    index === currentStepIndex 
                      ? "bg-primary text-primary-foreground" 
                      : index < currentStepIndex 
                        ? "text-primary hover:bg-primary/10" 
                        : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2",
                    index === currentStepIndex 
                      ? "border-primary-foreground bg-primary-foreground text-primary" 
                      : index < currentStepIndex 
                        ? "border-primary bg-primary text-primary-foreground" 
                        : "border-muted-foreground"
                  )}>
                    {index + 1}
                  </div>
                  <div className="text-xs font-medium">{step.title}</div>
                  <div className="text-xs opacity-75 hidden sm:block">{step.description}</div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStepIndex].title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStep === 'basic-info' && (
            <BasicInfoStep
              data={formData.basicInfo}
              onChange={updateBasicInfo}
              errors={validationErrors}
              disabled={isFieldsLocked}
            />
          )}
          
          {currentStep === 'offerings' && (
            <OfferingsStep
              data={formData.offerings}
              onChange={updateOfferings}
              errors={validationErrors}
              disabled={isFieldsLocked}
              listingId={listingId}
              onSaveListing={saveListing}
            />
          )}

          {/* Navigation buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
            <div className="flex gap-2 flex-1">
              {!isFirstStep && (
                <Button variant="outline" onClick={goToPreviousStep} className="flex-1 sm:flex-none">
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Button>
              )}
              
              {!isLastStep && (
                <Button 
                  onClick={() => {
                    if (validateCurrentStep()) {
                      goToNextStep();
                    }
                  }}
                  className="flex-1 sm:flex-none"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={saveListing}
                disabled={isSubmitting || isFieldsLocked}
                className="flex-1 sm:flex-none"
              >
                <Save className="h-4 w-4" />
                Save
              </Button>

              {isLastStep && (
                <Button
                  onClick={submitForApproval}
                  disabled={isSubmitting || isFieldsLocked}
                  className="flex-1 sm:flex-none"
                >
                  <Send className="h-4 w-4" />
                  Submit for Approval
                </Button>
              )}
            </div>
          </div>

          {/* Field lock notice */}
          {isFieldsLocked && (
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 inline mr-2" />
                This listing is currently under review. Fields are locked until admin feedback is provided.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}