package views

import (
	"github.com/Mahaveer86619/TrailStory/pkg/models"
	"github.com/Mahaveer86619/TrailStory/pkg/services/storage"
	"github.com/Mahaveer86619/TrailStory/pkg/utils"
)

type CheckpointView struct {
	ID     string    `json:"id"`
	Title  string    `json:"title"` // Derived from Note or Order
	Time   string    `json:"time"`
	Coords []float64 `json:"coords"` // [Lat, Lng] for Leaflet
	Note   string    `json:"note"`
	Image  string    `json:"image,omitempty"`
}

type JourneyView struct {
	ID          string           `json:"id"`
	Title       string           `json:"title"`
	Description string           `json:"description"`
	StartDate   string           `json:"start_date"`
	Status      string           `json:"status"`
	Visibility  string           `json:"visibility"`
	Checkpoints []CheckpointView `json:"checkpoints"`
}

func ToCheckpointView(cp *models.Checkpoint, storage storage.StorageService) CheckpointView {
	imgUrl := ""
	if len(cp.Media) > 0 {
		imgUrl = storage.GetPublicURL(cp.Media[0].URL)
	}

	return CheckpointView{
		ID:     utils.MaskID(cp.ID),
		Title:  "Checkpoint",
		Time:   cp.Timestamp.Format("03:04 PM"),
		Coords: []float64{cp.Location.Point[1], cp.Location.Point[0]},
		Note:   cp.Note,
		Image:  imgUrl,
	}
}

func ToJourneyView(j *models.Journey, storage storage.StorageService) JourneyView {
	cps := make([]CheckpointView, 0)
	
	for _, cp := range j.Checkpoints {
		cps = append(cps, ToCheckpointView(&cp, storage))
	}

	status := "Ongoing"
	if j.EndedAt != nil {
		status = "Completed"
	}

	vis := "Private"
	if j.IsPublic {
		vis = "Public"
	}

	return JourneyView{
		ID:          utils.MaskID(j.ID),
		Title:       j.Title,
		Description: j.Description,
		StartDate:   j.StartedAt.Format("Jan 02, 2006"),
		Status:      status,
		Visibility:  vis,
		Checkpoints: cps,
	}
}

func ToListJourneyView(journeys []models.Journey, storage storage.StorageService) []JourneyView {
	var resp []JourneyView
	for _, j := range journeys {
		resp = append(resp, ToJourneyView(&j, storage))
	}
	return resp
}

// Requests

type CreateJourneyRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	IsPublic    bool   `json:"is_public"`
}

func (r CreateJourneyRequest) Valid() error {
	// Add validation logic if needed
	return nil
}

type CreateCheckpointRequest struct {
	Lat       float64 `json:"lat"`
	Lng       float64 `json:"lng"`
	Note      string  `json:"note"`
	Timestamp string  `json:"timestamp"` // Optional override
}

func (r CreateCheckpointRequest) Valid() error {
	// Add validation logic if needed
	return nil
}
