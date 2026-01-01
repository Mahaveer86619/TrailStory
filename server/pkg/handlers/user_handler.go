package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Mahaveer86619/TrailStory/pkg/errz"
	"github.com/Mahaveer86619/TrailStory/pkg/middleware"
	"github.com/Mahaveer86619/TrailStory/pkg/services"
	"github.com/Mahaveer86619/TrailStory/pkg/utils"
	"github.com/Mahaveer86619/TrailStory/pkg/views"
)

type UserHandler struct {
	Service services.UserService
}

func NewUserHandler(service services.UserService) *UserHandler {
	return &UserHandler{
		Service: service,
	}
}

func (h *UserHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req views.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errz.HandleErrors(w, errz.New(errz.BadRequest, "Invalid request body", err))
		return
	}

	if err := req.Valid(); err != nil {
		errz.HandleErrors(w, errz.New(errz.BadRequest, err.Error(), nil))
		return
	}

	user, err := h.Service.RegisterUser(req)
	if err != nil {
		errz.HandleErrors(w, err)
		return
	}

	(&views.Success{StatusCode: 201, Data: user, Message: "User created successfully"}).JSON(w)
}

func (h *UserHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req views.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errz.HandleErrors(w, errz.New(errz.BadRequest, "Invalid credentials format", err))
		return
	}

	resp, err := h.Service.LoginUser(req)
	if err != nil {
		errz.HandleErrors(w, err)
		return
	}

	(&views.Success{StatusCode: 200, Data: resp}).JSON(w)
}

func (h *UserHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	var req views.RefreshRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errz.HandleErrors(w, errz.New(errz.BadRequest, "Refresh token required", err))
		return
	}

	resp, err := h.Service.RefreshToken(req)
	if err != nil {
		errz.HandleErrors(w, err)
		return
	}

	(&views.Success{StatusCode: 200, Data: resp}).JSON(w)
}

func (h *UserHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	user, err := h.Service.GetUser(userID)
	if err != nil {
		errz.HandleErrors(w, err)
		return
	}
	(&views.Success{StatusCode: 200, Data: user}).JSON(w)
}

func (h *UserHandler) UpdateMe(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	var req views.UpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errz.HandleErrors(w, errz.New(errz.BadRequest, "Invalid update data", err))
		return
	}

	user, err := h.Service.UpdateUser(userID, req)
	if err != nil {
		errz.HandleErrors(w, err)
		return
	}
	(&views.Success{StatusCode: 200, Data: user}).JSON(w)
}

func (h *UserHandler) UploadAvatar(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)

	// Limit upload size (e.g., 5MB)
	r.ParseMultipartForm(5 << 20)

	file, header, err := r.FormFile("image")
	if err != nil {
		errz.HandleErrors(w, errz.New(errz.BadRequest, "Image file is required", err))
		return
	}
	defer file.Close()

	user, err := h.Service.UploadProfilePic(userID, header.Filename, file)
	if err != nil {
		errz.HandleErrors(w, err)
		return
	}
	(&views.Success{StatusCode: 200, Data: user}).JSON(w)
}

func (h *UserHandler) ListAll(w http.ResponseWriter, r *http.Request) {
	users, err := h.Service.GetAllUsers()
	if err != nil {
		errz.HandleErrors(w, err)
		return
	}
	(&views.Success{StatusCode: 200, Data: users}).JSON(w)
}

func (h *UserHandler) Follow(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	targetID := r.PathValue("id")

	if err := h.Service.FollowUser(userID, targetID); err != nil {
		errz.HandleErrors(w, err)
		return
	}
	(&views.Success{StatusCode: 200, Message: "Followed user"}).JSON(w)
}

func (h *UserHandler) Unfollow(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	targetID := r.PathValue("id")

	if err := h.Service.UnfollowUser(userID, targetID); err != nil {
		errz.HandleErrors(w, err)
		return
	}
	(&views.Success{StatusCode: 200, Message: "Unfollowed user"}).JSON(w)
}

func (h *UserHandler) GetFollowers(w http.ResponseWriter, r *http.Request) {
	maskedID := r.PathValue("id")
	userID, _ := utils.UnmaskID(maskedID)

	followers, err := h.Service.GetFollowers(userID)
	if err != nil {
		errz.HandleErrors(w, err)
		return
	}

	if len(followers) == 0 {
		(&views.Success{StatusCode: 200, Data: []views.UserView{}, Message: "No followers found"}).JSON(w)
		return
	}
	
	(&views.Success{StatusCode: 200, Data: followers, Message: "Followers fetched"}).JSON(w)
}
