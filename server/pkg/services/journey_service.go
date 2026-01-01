package services

import (
	"time"

	"github.com/Mahaveer86619/TrailStory/pkg/db"
	"github.com/Mahaveer86619/TrailStory/pkg/errz"
	"github.com/Mahaveer86619/TrailStory/pkg/models"
	"github.com/Mahaveer86619/TrailStory/pkg/services/storage"
	"github.com/Mahaveer86619/TrailStory/pkg/utils"
	"github.com/Mahaveer86619/TrailStory/pkg/views"
	"github.com/paulmach/orb"

	"gorm.io/gorm"
)

type JourneyService struct {
	DB      *gorm.DB
	Storage storage.StorageService
}

func NewJourneyService(storage storage.StorageService) *JourneyService {
	return &JourneyService{
		DB:      db.GetTrailStoryDB().DB,
		Storage: storage,
	}
}

// --- Journey Operations ---

func (s *JourneyService) CreateJourney(userID uint, req views.CreateJourneyRequest) (*views.JourneyView, error) {
	journey := models.Journey{
		UserID:      userID,
		Title:       req.Title,
		Description: req.Description,
		IsPublic:    req.IsPublic,
		StartedAt:   time.Now(),
	}

	if err := s.DB.Create(&journey).Error; err != nil {
		return nil, errz.New(errz.InternalServerError, "Failed to create journey", err)
	}

	view := views.ToJourneyView(&journey, s.Storage)
	return &view, nil
}

func (s *JourneyService) GetJourney(journeyMaskedID string, requesterID uint) (*views.JourneyView, error) {
	journeyID, err := utils.UnmaskID(journeyMaskedID)
	if err != nil {
		return nil, errz.New(errz.BadRequest, "Invalid Journey ID", err)
	}

	var journey models.Journey

	// Preload Checkpoints and Media
	// We use ST_AsText to ensure our Scanner receives the format it expects if hex isn't default
	err = s.DB.Preload("Checkpoints", func(db *gorm.DB) *gorm.DB {
		return db.Select("*, ST_AsText(location) as location").Order("timestamp asc").Preload("Media")
	}).First(&journey, journeyID).Error

	if err != nil {
		return nil, errz.New(errz.NotFound, "Journey not found", err)
	}

	// Access Control
	if journey.UserID != requesterID && !journey.IsPublic {
		return nil, errz.New(errz.Forbidden, "This journey is private", nil)
	}

	view := views.ToJourneyView(&journey, s.Storage)
	return &view, nil
}

func (s *JourneyService) ListUserJourneys(userID uint) ([]views.JourneyView, error) {
	var journeys []models.Journey

	err := s.DB.Where("user_id = ?", userID).
		Preload("Checkpoints", func(db *gorm.DB) *gorm.DB {
			return db.Select("*, ST_AsText(location) as location").Order("timestamp asc").Preload("Media")
		}).
		Order("created_at desc").
		Find(&journeys).Error

	if err != nil {
		return nil, errz.New(errz.InternalServerError, "Failed to fetch journeys", err)
	}

	return views.ToListJourneyView(journeys, s.Storage), nil
}

func (s *JourneyService) ListPublicJourneys(page, limit int) ([]views.JourneyView, error) {
	var journeys []models.Journey
	offset := (page - 1) * limit

	// Fetch public journeys, ordered by newest first, with pagination
	err := s.DB.Where("is_public = ?", true).
		Preload("Checkpoints", func(db *gorm.DB) *gorm.DB {
			return db.Select("*, ST_AsText(location) as location").Order("timestamp asc").Preload("Media")
		}).
		Order("created_at desc").
		Limit(limit).
		Offset(offset).
		Find(&journeys).Error

	if err != nil {
		return nil, errz.New(errz.InternalServerError, "Failed to fetch public feed", err)
	}

	return views.ToListJourneyView(journeys, s.Storage), nil
}

func (s *JourneyService) DeleteJourney(userID uint, journeyMaskedID string) error {
	journeyID, err := utils.UnmaskID(journeyMaskedID)
	if err != nil {
		return errz.New(errz.BadRequest, "Invalid Journey ID", err)
	}

	result := s.DB.Where("id = ? AND user_id = ?", journeyID, userID).Delete(&models.Journey{})
	if result.Error != nil {
		return errz.New(errz.InternalServerError, "Failed to delete journey", result.Error)
	}
	if result.RowsAffected == 0 {
		return errz.New(errz.NotFound, "Journey not found or unauthorized", nil)
	}
	return nil
}

// --- Checkpoint Operations ---

func (s *JourneyService) AddCheckpoint(userID uint, journeyMaskedID string, req views.CreateCheckpointRequest) (*views.CheckpointView, error) {
	journeyID, err := utils.UnmaskID(journeyMaskedID)
	if err != nil {
		return nil, errz.New(errz.BadRequest, "Invalid Journey ID", err)
	}

	// Verify Ownership
	var journey models.Journey
	if err := s.DB.First(&journey, journeyID).Error; err != nil {
		return nil, errz.New(errz.NotFound, "Journey not found", err)
	}
	if journey.UserID != userID {
		return nil, errz.New(errz.Forbidden, "Not authorized to edit this journey", nil)
	}

	ts := time.Now()
	if req.Timestamp != "" {
		if parsed, err := time.Parse(time.RFC3339, req.Timestamp); err == nil {
			ts = parsed
		}
	}

	cp := models.Checkpoint{
		JourneyID: journeyID,
		Location:  models.GeoPoint{Point: orb.Point{req.Lng, req.Lat}},
		Note:      req.Note,
		Timestamp: ts,
	}

	if err := s.DB.Create(&cp).Error; err != nil {
		return nil, errz.New(errz.InternalServerError, "Failed to add checkpoint", err)
	}

	view := views.ToCheckpointView(&cp, s.Storage)
	return &view, nil
}

func (s *JourneyService) DeleteCheckpoint(userID uint, checkpointMaskedID string) error {
	checkpointID, err := utils.UnmaskID(checkpointMaskedID)
	if err != nil {
		return errz.New(errz.BadRequest, "Invalid Checkpoint ID", err)
	}

	// Verify ownership via Join
	var cp models.Checkpoint
	err = s.DB.Joins("JOIN journeys ON journeys.id = checkpoints.journey_id").
		Where("checkpoints.id = ? AND journeys.user_id = ?", checkpointID, userID).
		First(&cp).Error

	if err != nil {
		return errz.New(errz.NotFound, "Checkpoint not found or unauthorized", err)
	}

	if err := s.DB.Delete(&cp).Error; err != nil {
		return errz.New(errz.InternalServerError, "Failed to delete checkpoint", err)
	}
	return nil
}
