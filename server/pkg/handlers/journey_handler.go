package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/Mahaveer86619/TrailStory/pkg/errz"
	"github.com/Mahaveer86619/TrailStory/pkg/middleware"
	"github.com/Mahaveer86619/TrailStory/pkg/services"
	"github.com/Mahaveer86619/TrailStory/pkg/views"
)

type JourneyHandler struct {
	Service *services.JourneyService
}

func NewJourneyHandler(service *services.JourneyService) *JourneyHandler {
	return &JourneyHandler{Service: service}
}

func (h *JourneyHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	var req views.CreateJourneyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errz.HandleErrors(w, errz.New(errz.BadRequest, "Invalid request", err))
		return
	}

	journey, err := h.Service.CreateJourney(userID, req)
	if err != nil {
		errz.HandleErrors(w, err)
		return
	}
	(&views.Success{StatusCode: 201, Data: journey, Message: "Journey created successfully"}).JSON(w)
}

func (h *JourneyHandler) ListMine(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	journeys, err := h.Service.ListUserJourneys(userID)
	if err != nil {
		errz.HandleErrors(w, err)
		return
	}
	(&views.Success{StatusCode: 200, Data: journeys, Message: "Journeys fetched successfully"}).JSON(w)
}

func (h *JourneyHandler) Get(w http.ResponseWriter, r *http.Request) {
	journeyID := r.PathValue("id")
	userID := middleware.GetUserID(r)

	journey, err := h.Service.GetJourney(journeyID, userID)
	if err != nil {
		errz.HandleErrors(w, err)
		return
	}
	(&views.Success{StatusCode: 200, Data: journey, Message: "Journey fetched successfully"}).JSON(w)
}

func (h *JourneyHandler) ListPublic(w http.ResponseWriter, r *http.Request) {
	pageStr := r.URL.Query().Get("page")
	limitStr := r.URL.Query().Get("limit")

	page, _ := strconv.Atoi(pageStr)
	if page < 1 {
		page = 1
	}

	limit, _ := strconv.Atoi(limitStr)
	if limit < 1 || limit > 50 {
		limit = 10
	}

	journeys, err := h.Service.ListPublicJourneys(page, limit)
	if err != nil {
		errz.HandleErrors(w, err)
		return
	}

	(&views.Success{
		StatusCode: 200,
		Data:       journeys,
		Message:    "Global feed fetched",
	}).JSON(w)
}

func (h *JourneyHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	journeyID := r.PathValue("id")

	if err := h.Service.DeleteJourney(userID, journeyID); err != nil {
		errz.HandleErrors(w, err)
		return
	}
	(&views.Success{StatusCode: 200, Message: "Journey deleted"}).JSON(w)
}

func (h *JourneyHandler) AddCheckpoint(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	journeyID := r.PathValue("id")

	var req views.CreateCheckpointRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errz.HandleErrors(w, errz.New(errz.BadRequest, "Invalid request", err))
		return
	}

	cp, err := h.Service.AddCheckpoint(userID, journeyID, req)
	if err != nil {
		errz.HandleErrors(w, err)
		return
	}
	(&views.Success{StatusCode: 201, Data: cp, Message: "Checkpoint added successfully"}).JSON(w)
}

func (h *JourneyHandler) DeleteCheckpoint(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	checkpointID := r.PathValue("id")

	if err := h.Service.DeleteCheckpoint(userID, checkpointID); err != nil {
		errz.HandleErrors(w, err)
		return
	}
	(&views.Success{StatusCode: 200, Message: "Checkpoint deleted"}).JSON(w)
}
